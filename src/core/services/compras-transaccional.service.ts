/**
 * Servicio de Dominio: Transacciones de Compras, Ledger Contable y Sincronización WMS
 * 
 * Orquesta la liquidación tributaria (IVA, ReteFuente, ReteICA), asientos contables de partida doble,
 * persistencia de órdenes de compra e invocación de procedimientos transaccionales en PostgreSQL
 * para actualización de stock en bodega, Kardex y Precio Medio Ponderado (PMP).
 */

import {
  calcularLiquidacionCompra,
  generarAsientosContablesCompra,
  AccountsLedgerCompraMap,
  ItemCompraCalculo,
  ConfiguracionTributariaCompra,
} from './calculo-compras-tributario';

export interface ItemCompraParam {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
}

export interface RegistrarCompraParams {
  numeroOrden?: string | null;
  proveedorId?: string | null;
  proveedorNombre: string;
  proveedorNit?: string | null;
  proveedorTelefono?: string | null;
  proveedorEmail?: string | null;
  fechaCompra?: string | null;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  modoIngreso?: 'INMEDIATO' | 'ORDEN_RECEPCION';
  remisionProveedor?: string | null;
  observaciones?: string | null;
  aplicaIva?: boolean;
  aplicaRetefuente?: boolean;
  porcentajeRetefuente?: number;
  aplicaReteica?: boolean;
  porcentajeReteica?: number;
  items: ItemCompraParam[];
  tenantId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
}

export interface RecepcionMercanciaParams {
  compraId: string;
  remisionFactura?: string | null;
  observacionesBodega?: string | null;
  userId?: string | null;
}

export interface ResultadoRegistroCompra {
  compraId: string;
  numeroOrden: string;
  total: number;
  netoPagar: number;
  estado: string;
  transactionId?: string | null;
  nuevaCompraObjeto: any;
  guardadoEnDb: boolean;
}

export class ComprasTransaccionalService {
  /**
   * Ejecuta el registro completo de una compra:
   * 1. Liquidación tributaria estricta (COP entero).
   * 2. Partida doble en el Ledger (transactions y journal_entries).
   * 3. Inserción de cabecera y detalles en base de datos.
   * 4. RPC de recepción inmediata en bodega si aplica.
   */
  public static async registrarCompra(
    supabaseAdmin: any,
    params: RegistrarCompraParams
  ): Promise<{ success: boolean; data?: ResultadoRegistroCompra; error?: string }> {
    try {
      // 1. Liquidación tributaria
      const itemsParaCalculo: ItemCompraCalculo[] = params.items.map((it) => ({
        equipoId: it.equipoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
      }));

      const configTrib: ConfiguracionTributariaCompra = {
        aplicaIva: params.aplicaIva ?? false,
        aplicaRetefuente: params.aplicaRetefuente ?? false,
        porcentajeRetefuente: params.porcentajeRetefuente ?? 0,
        aplicaReteica: params.aplicaReteica ?? false,
        porcentajeReteica: params.porcentajeReteica ?? 0,
      };

      const liquidacion = calcularLiquidacionCompra(itemsParaCalculo, configTrib);
      const subtotal = liquidacion.subtotal;
      const impuestos = liquidacion.valorIva;
      const total = liquidacion.totalFactura;
      const netoPagar = liquidacion.netoPagar;

      // Generación de número de orden
      const fechaStr = params.fechaCompra || new Date().toISOString().split('T')[0];
      const sufijoAleatorio = Math.floor(1000 + Math.random() * 9000);
      const numeroOrden = params.numeroOrden?.trim() || `OC-${fechaStr.replace(/-/g, '')}-${sufijoAleatorio}`;

      // 2. Asentar en Ledger Contable (Partida Doble)
      let transactionId: string | null = null;
      try {
        const { data: accounts } = await supabaseAdmin
          .from('financial_accounts')
          .select('id, name, type, is_cash_equivalent');

        let cuentaActivoMaquinaria = accounts?.find(
          (a: any) => a.name === 'Equipos y Maquinaria' || a.name === 'Equipos (Activo Fijo)'
        );
        if (!cuentaActivoMaquinaria) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'Equipos y Maquinaria', type: 'ASSET', is_cash_equivalent: false, description: 'Activo fijo en maquinaria' }])
            .select()
            .single();
          cuentaActivoMaquinaria = nc;
        }

        let cuentaIva = accounts?.find((a: any) => a.name === 'IVA Descontable en Compras');
        if (!cuentaIva && liquidacion.valorIva > 0) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'IVA Descontable en Compras', type: 'ASSET', is_cash_equivalent: false, description: 'IVA descontable compras' }])
            .select()
            .single();
          cuentaIva = nc;
        }

        let cuentaRetefuente = accounts?.find((a: any) => a.name === 'ReteFuente por Pagar (Compras)');
        if (!cuentaRetefuente && liquidacion.valorRetefuente > 0) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'ReteFuente por Pagar (Compras)', type: 'LIABILITY', is_cash_equivalent: false, description: 'Retención compras' }])
            .select()
            .single();
          cuentaRetefuente = nc;
        }

        let cuentaReteica = accounts?.find((a: any) => a.name === 'ReteICA por Pagar (Compras)');
        if (!cuentaReteica && liquidacion.valorReteica > 0) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'ReteICA por Pagar (Compras)', type: 'LIABILITY', is_cash_equivalent: false, description: 'ReteICA compras' }])
            .select()
            .single();
          cuentaReteica = nc;
        }

        let cuentaContrapartida: any = null;
        if (params.metodoPago === 'EFECTIVO') {
          cuentaContrapartida = accounts?.find((a: any) => a.name === 'Caja Principal') || accounts?.find((a: any) => a.is_cash_equivalent);
          if (!cuentaContrapartida) {
            const { data: nc } = await supabaseAdmin
              .from('financial_accounts')
              .insert([{ name: 'Caja Principal', type: 'ASSET', is_cash_equivalent: true, description: 'Caja general' }])
              .select()
              .single();
            cuentaContrapartida = nc;
          }
        } else if (params.metodoPago === 'TRANSFERENCIA') {
          cuentaContrapartida = accounts?.find((a: any) => a.name === 'Bancolombia Ahorros' || a.name === 'Nequi') || accounts?.find((a: any) => a.is_cash_equivalent);
          if (!cuentaContrapartida) {
            const { data: nc } = await supabaseAdmin
              .from('financial_accounts')
              .insert([{ name: 'Bancolombia Ahorros', type: 'ASSET', is_cash_equivalent: true, description: 'Cuenta bancaria' }])
              .select()
              .single();
            cuentaContrapartida = nc;
          }
        } else {
          cuentaContrapartida = accounts?.find((a: any) => a.name === 'Cuentas por Pagar (Proveedores)' || a.type === 'LIABILITY');
          if (!cuentaContrapartida) {
            const { data: nc } = await supabaseAdmin
              .from('financial_accounts')
              .insert([{ name: 'Cuentas por Pagar (Proveedores)', type: 'LIABILITY', is_cash_equivalent: false, description: 'Cuentas por pagar' }])
              .select()
              .single();
            cuentaContrapartida = nc;
          }
        }

        if (cuentaActivoMaquinaria && cuentaContrapartida && total > 0) {
          const idempotencyKey = `compra_${numeroOrden}_${Date.now()}`;
          const { data: txn, error: txnError } = await supabaseAdmin
            .from('transactions')
            .insert([{
              description: `Compra de Equipos - ${numeroOrden} (Prov: ${params.proveedorNombre})`,
              reference_id: numeroOrden,
              created_by: params.userId,
              idempotency_key: idempotencyKey,
              timestamp: new Date().toISOString(),
            }])
            .select('id')
            .single();

          if (txn && !txnError) {
            transactionId = txn.id;
            const ledgerMap: AccountsLedgerCompraMap = {
              cuentaActivoMaquinariaId: cuentaActivoMaquinaria.id,
              cuentaIvaDescontableId: cuentaIva?.id,
              cuentaRetefuentePasivoId: cuentaRetefuente?.id,
              cuentaReteicaPasivoId: cuentaReteica?.id,
              cuentaContrapartidaId: cuentaContrapartida.id,
            };

            const asientos = generarAsientosContablesCompra(txn.id, liquidacion, ledgerMap);
            if (asientos.length > 0) {
              await supabaseAdmin.from('journal_entries').insert(asientos);
            }
          }
        }
      } catch (contableErr) {
        console.warn('[ComprasTransaccionalService] Advertencia en Ledger contable (prosiguiendo):', contableErr);
      }

      const modoIngreso = params.modoIngreso || 'INMEDIATO';
      const estadoInicial = modoIngreso === 'ORDEN_RECEPCION' ? 'PENDIENTE_RECEPCION' : 'COMPLETADA';
      const compraId: string = crypto.randomUUID();

      const nuevaCompraObjeto: any = {
        id: compraId,
        numero_orden: numeroOrden,
        proveedor_id: params.proveedorId || null,
        proveedor_nombre: params.proveedorNombre.trim(),
        proveedor_nit: params.proveedorNit?.trim() || null,
        proveedor_telefono: params.proveedorTelefono?.trim() || null,
        proveedor_email: params.proveedorEmail?.trim() || null,
        fecha_compra: fechaStr,
        metodo_pago: params.metodoPago,
        subtotal,
        impuestos,
        total,
        aplica_iva: params.aplicaIva ?? false,
        valor_iva: liquidacion.valorIva,
        aplica_retefuente: params.aplicaRetefuente ?? false,
        porcentaje_retefuente: params.porcentajeRetefuente ?? 0,
        valor_retefuente: liquidacion.valorRetefuente,
        aplica_reteica: params.aplicaReteica ?? false,
        porcentaje_reteica: params.porcentajeReteica ?? 0,
        valor_reteica: liquidacion.valorReteica,
        neto_pagar: netoPagar,
        estado: estadoInicial,
        observaciones: params.observaciones?.trim() || null,
        remision_factura_proveedor: params.remisionProveedor?.trim() || null,
        transaction_id: transactionId || null,
        created_at: new Date().toISOString(),
        detalles: [],
      };

      // 3. Inserción de cabecera en BD
      let guardadoEnDb = false;
      try {
        const { data: compraData, error: compraError } = await supabaseAdmin
          .from('compras')
          .insert([{
            id: compraId,
            tenant_id: params.tenantId || null,
            numero_orden: numeroOrden,
            proveedor_id: params.proveedorId || null,
            proveedor_nombre: params.proveedorNombre.trim(),
            proveedor_nit: params.proveedorNit?.trim() || null,
            proveedor_telefono: params.proveedorTelefono?.trim() || null,
            proveedor_email: params.proveedorEmail?.trim() || null,
            fecha_compra: fechaStr,
            metodo_pago: params.metodoPago,
            subtotal,
            impuestos,
            total,
            aplica_iva: params.aplicaIva ?? false,
            valor_iva: liquidacion.valorIva,
            aplica_retefuente: params.aplicaRetefuente ?? false,
            porcentaje_retefuente: params.porcentajeRetefuente ?? 0,
            valor_retefuente: liquidacion.valorRetefuente,
            aplica_reteica: params.aplicaReteica ?? false,
            porcentaje_reteica: params.porcentajeReteica ?? 0,
            valor_reteica: liquidacion.valorReteica,
            neto_pagar: netoPagar,
            estado: 'PENDIENTE_RECEPCION',
            observaciones: params.observaciones?.trim() || null,
            remision_factura_proveedor: params.remisionProveedor?.trim() || null,
            transaction_id: transactionId,
            usuario_id: params.userId,
          }])
          .select('id')
          .single();

        if (!compraError && compraData) {
          guardadoEnDb = true;
        }
      } catch (dbErr) {
        console.warn('[ComprasTransaccionalService] Fallback de persistencia para compras:', dbErr);
      }

      // 4. Inserción de detalles
      for (const item of params.items) {
        const numericEquipoId = typeof item.equipoId === 'string' ? parseInt(item.equipoId, 10) : item.equipoId;
        const itemSubtotal = item.cantidad * item.precioUnitario;

        nuevaCompraObjeto.detalles.push({
          id: crypto.randomUUID(),
          equipo_id: numericEquipoId,
          cantidad: item.cantidad,
          precio_unitario: item.precioUnitario,
          subtotal: itemSubtotal,
        });

        if (guardadoEnDb) {
          try {
            await supabaseAdmin.from('compras_detalles').insert([{
              compra_id: compraId,
              equipo_id: numericEquipoId,
              cantidad: item.cantidad,
              precio_unitario: item.precioUnitario,
              subtotal: itemSubtotal,
            }]);
          } catch {}
        }
      }

      // 5. Si el modo es INMEDIATO, invocar el RPC transaccional para actualizar stock, Kardex y PMP
      if (modoIngreso === 'INMEDIATO' && guardadoEnDb) {
        try {
          const { error: rpcErr } = await supabaseAdmin.rpc(
            'recibir_compra_y_actualizar_pmp_transaccional',
            {
              p_compra_id: compraId,
              p_usuario_id: params.userId,
              p_remision_factura: params.remisionProveedor || null,
              p_observaciones_bodega: params.observaciones || 'Entrada Inmediata de Mostrador',
            }
          );

          if (rpcErr) {
            console.warn('[ComprasTransaccionalService] RPC transaccional aviso:', rpcErr);
          } else {
            nuevaCompraObjeto.estado = 'COMPLETADA';
          }
        } catch (rpcEx) {
          console.warn('[ComprasTransaccionalService] Excepción ejecutando RPC de recepción:', rpcEx);
        }
      }

      return {
        success: true,
        data: {
          compraId,
          numeroOrden,
          total,
          netoPagar,
          estado: nuevaCompraObjeto.estado,
          transactionId,
          nuevaCompraObjeto,
          guardadoEnDb,
        },
      };
    } catch (err: any) {
      console.error('[ComprasTransaccionalService] Error registrando compra:', err);
      return { success: false, error: err?.message || 'Error inesperado al registrar compra' };
    }
  }

  /**
   * Ejecuta la recepción física de mercancía en bodega delegando al RPC pesimista.
   */
  public static async recibirMercancia(
    supabaseAdmin: any,
    params: RecepcionMercanciaParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
        'recibir_compra_y_actualizar_pmp_transaccional',
        {
          p_compra_id: params.compraId,
          p_usuario_id: params.userId,
          p_remision_factura: params.remisionFactura?.trim() || null,
          p_observaciones_bodega: params.observacionesBodega?.trim() || null,
        }
      );

      if (rpcErr || !rpcRes?.success) {
        const errorMsg = rpcErr?.message || rpcRes?.error || 'Error al procesar recepción en bodega';
        return { success: false, error: errorMsg };
      }

      return { success: true, data: rpcRes };
    } catch (err: any) {
      console.error('[ComprasTransaccionalService] Excepción al recibir mercancía:', err);
      return { success: false, error: err?.message || 'Error inesperado al recibir mercancía' };
    }
  }
}
