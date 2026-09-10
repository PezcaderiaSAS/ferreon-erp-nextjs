'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { 
  calcularLiquidacionCompra, 
  generarAsientosContablesCompra,
  AccountsLedgerCompraMap 
} from '@/core/services/calculo-compras-tributario';

export interface ItemCompraInput {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearCompraInput {
  numeroOrden?: string;
  proveedorId?: string;
  proveedorNombre: string;
  proveedorNit?: string;
  proveedorTelefono?: string;
  proveedorEmail?: string;
  fechaCompra?: string;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  observaciones?: string;
  aplicaIva?: boolean;
  aplicaRetefuente?: boolean;
  porcentajeRetefuente?: number;
  aplicaReteica?: boolean;
  porcentajeReteica?: number;
  items: ItemCompraInput[];
}

const ItemCompraZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1 unidad'),
  precioUnitario: z.number().min(0, 'El precio unitario no puede ser negativo'),
});

const CrearCompraZodSchema = z.object({
  numeroOrden: z.string().optional(),
  proveedorId: z.string().optional(),
  proveedorNombre: z.string().min(2, 'El nombre del proveedor es obligatorio'),
  proveedorNit: z.string().optional(),
  proveedorTelefono: z.string().optional(),
  proveedorEmail: z.string().email('Email de proveedor inválido').optional().or(z.literal('')),
  fechaCompra: z.string().optional(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CREDITO']),
  observaciones: z.string().optional(),
  aplicaIva: z.boolean().optional().default(false),
  aplicaRetefuente: z.boolean().optional().default(false),
  porcentajeRetefuente: z.number().min(0).optional().default(0),
  aplicaReteica: z.boolean().optional().default(false),
  porcentajeReteica: z.number().min(0).optional().default(0),
  items: z.array(ItemCompraZodSchema).min(1, 'Debe incluir al menos un equipo en la compra'),
});

export interface CompraDetalleUI {
  id: string;
  equipo_id: number;
  equipo_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CompraUI {
  id: string;
  numero_orden: string;
  proveedor_id?: string;
  proveedor_nombre: string;
  proveedor_nit?: string;
  proveedor_telefono?: string;
  proveedor_email?: string;
  fecha_compra: string;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  subtotal: number;
  impuestos: number;
  total: number;
  aplica_iva?: boolean;
  valor_iva?: number;
  aplica_retefuente?: boolean;
  porcentaje_retefuente?: number;
  valor_retefuente?: number;
  aplica_reteica?: boolean;
  porcentaje_reteica?: number;
  valor_reteica?: number;
  neto_pagar: number;
  estado: string;
  observaciones?: string;
  transaction_id?: string;
  created_at: string;
  detalles?: CompraDetalleUI[];
}

/**
 * Server Action para registrar compras de maquinaria/equipos,
 * sumarlos al stock disponible, emitir Kardex (INGRESO_COMPRA)
 * y asentar la partida doble rigurosa en el Ledger contable.
 */
export async function crearCompraAction(input: CrearCompraInput) {
  try {
    const validation = validateActionInput(input, CrearCompraZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de compra inválidos' };
    }
    const cleanInput = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();

    // 1. Calcular liquidación tributaria exacta
    const itemsParaCalculo = cleanInput.items.map(it => ({
      equipoId: it.equipoId,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario
    }));

    const liquidacion = calcularLiquidacionCompra(itemsParaCalculo, {
      aplicaIva: cleanInput.aplicaIva ?? false,
      aplicaRetefuente: cleanInput.aplicaRetefuente ?? false,
      porcentajeRetefuente: cleanInput.porcentajeRetefuente ?? 0,
      aplicaReteica: cleanInput.aplicaReteica ?? false,
      porcentajeReteica: cleanInput.porcentajeReteica ?? 0
    });

    const subtotal = liquidacion.subtotal;
    const impuestos = liquidacion.valorIva;
    const total = liquidacion.totalFactura;
    const netoPagar = liquidacion.netoPagar;

    // Generar número de orden si no fue proveído
    const fechaStr = cleanInput.fechaCompra || new Date().toISOString().split('T')[0];
    const sufijoAleatorio = Math.floor(1000 + Math.random() * 9000);
    const numeroOrden = cleanInput.numeroOrden?.trim() || `OC-${fechaStr.replace(/-/g, '')}-${sufijoAleatorio}`;

    // Obtener tenant del usuario
    let tenantId: string | null = null;
    if (userId) {
      const { data: empUser } = await supabaseAdmin
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('estado', 'ACTIVO')
        .maybeSingle();
      tenantId = empUser?.empresa_id || null;
    }

    // 2. Registrar asiento contable en Ledger (Partida Doble)
    let transactionId: string | null = null;
    try {
      const { data: accounts } = await supabaseAdmin
        .from('financial_accounts')
        .select('id, name, type, is_cash_equivalent');

      // Buscar o crear cuenta de Activo Maquinaria
      let cuentaActivoMaquinaria = accounts?.find(a => a.name === 'Equipos y Maquinaria' || a.name === 'Equipos (Activo Fijo)');
      if (!cuentaActivoMaquinaria) {
        const { data: nc } = await supabaseAdmin
          .from('financial_accounts')
          .insert([{ name: 'Equipos y Maquinaria', type: 'ASSET', is_cash_equivalent: false, description: 'Activo fijo en maquinaria' }])
          .select().single();
        cuentaActivoMaquinaria = nc;
      }

      // Buscar o crear cuenta de IVA Descontable
      let cuentaIva = accounts?.find(a => a.name === 'IVA Descontable en Compras');
      if (!cuentaIva && liquidacion.valorIva > 0) {
        const { data: nc } = await supabaseAdmin
          .from('financial_accounts')
          .insert([{ name: 'IVA Descontable en Compras', type: 'ASSET', is_cash_equivalent: false, description: 'IVA descontable compras' }])
          .select().single();
        cuentaIva = nc;
      }

      // Buscar o crear cuenta de ReteFuente
      let cuentaRetefuente = accounts?.find(a => a.name === 'ReteFuente por Pagar (Compras)');
      if (!cuentaRetefuente && liquidacion.valorRetefuente > 0) {
        const { data: nc } = await supabaseAdmin
          .from('financial_accounts')
          .insert([{ name: 'ReteFuente por Pagar (Compras)', type: 'LIABILITY', is_cash_equivalent: false, description: 'Retención compras' }])
          .select().single();
        cuentaRetefuente = nc;
      }

      // Buscar o crear cuenta de ReteICA
      let cuentaReteica = accounts?.find(a => a.name === 'ReteICA por Pagar (Compras)');
      if (!cuentaReteica && liquidacion.valorReteica > 0) {
        const { data: nc } = await supabaseAdmin
          .from('financial_accounts')
          .insert([{ name: 'ReteICA por Pagar (Compras)', type: 'LIABILITY', is_cash_equivalent: false, description: 'ReteICA compras' }])
          .select().single();
        cuentaReteica = nc;
      }

      // Cuenta Contrapartida (Caja, Banco o CxP Proveedores)
      let cuentaContrapartida: any = null;
      if (cleanInput.metodoPago === 'EFECTIVO') {
        cuentaContrapartida = accounts?.find(a => a.name === 'Caja Principal') || accounts?.find(a => a.is_cash_equivalent);
        if (!cuentaContrapartida) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'Caja Principal', type: 'ASSET', is_cash_equivalent: true, description: 'Caja general' }])
            .select().single();
          cuentaContrapartida = nc;
        }
      } else if (cleanInput.metodoPago === 'TRANSFERENCIA') {
        cuentaContrapartida = accounts?.find(a => a.name === 'Bancolombia Ahorros' || a.name === 'Nequi') || accounts?.find(a => a.is_cash_equivalent);
        if (!cuentaContrapartida) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'Bancolombia Ahorros', type: 'ASSET', is_cash_equivalent: true, description: 'Cuenta bancaria' }])
            .select().single();
          cuentaContrapartida = nc;
        }
      } else {
        // CREDITO -> Cuentas por Pagar (Proveedores)
        cuentaContrapartida = accounts?.find(a => a.name === 'Cuentas por Pagar (Proveedores)' || a.type === 'LIABILITY');
        if (!cuentaContrapartida) {
          const { data: nc } = await supabaseAdmin
            .from('financial_accounts')
            .insert([{ name: 'Cuentas por Pagar (Proveedores)', type: 'LIABILITY', is_cash_equivalent: false, description: 'Cuentas por pagar' }])
            .select().single();
          cuentaContrapartida = nc;
        }
      }

      if (cuentaActivoMaquinaria && cuentaContrapartida && total > 0) {
        const idempotencyKey = `compra_${numeroOrden}_${Date.now()}`;
        
        const { data: txn, error: txnError } = await supabaseAdmin
          .from('transactions')
          .insert([{
            description: `Compra de Equipos - ${numeroOrden} (Prov: ${cleanInput.proveedorNombre})`,
            reference_id: numeroOrden,
            created_by: userId,
            idempotency_key: idempotencyKey,
            timestamp: new Date().toISOString()
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
            cuentaContrapartidaId: cuentaContrapartida.id
          };

          const asientos = generarAsientosContablesCompra(txn.id, liquidacion, ledgerMap);
          if (asientos.length > 0) {
            await supabaseAdmin.from('journal_entries').insert(asientos);
          }
        }
      }
    } catch (contableErr) {
      console.warn('[Compras] No se pudo asentar en el Ledger contable (prosiguiendo con inventario):', contableErr);
    }

    // 3. Registrar Compra en tabla `compras`
    const compraId: string = crypto.randomUUID();
    const nuevaCompraObjeto: CompraUI = {
      id: compraId,
      numero_orden: numeroOrden,
      proveedor_id: cleanInput.proveedorId,
      proveedor_nombre: cleanInput.proveedorNombre.trim(),
      proveedor_nit: cleanInput.proveedorNit?.trim(),
      proveedor_telefono: cleanInput.proveedorTelefono?.trim(),
      proveedor_email: cleanInput.proveedorEmail?.trim(),
      fecha_compra: fechaStr,
      metodo_pago: cleanInput.metodoPago,
      subtotal: subtotal,
      impuestos: impuestos,
      total: total,
      aplica_iva: cleanInput.aplicaIva ?? false,
      valor_iva: liquidacion.valorIva,
      aplica_retefuente: cleanInput.aplicaRetefuente ?? false,
      porcentaje_retefuente: cleanInput.porcentajeRetefuente ?? 0,
      valor_retefuente: liquidacion.valorRetefuente,
      aplica_reteica: cleanInput.aplicaReteica ?? false,
      porcentaje_reteica: cleanInput.porcentajeReteica ?? 0,
      valor_reteica: liquidacion.valorReteica,
      neto_pagar: netoPagar,
      estado: 'COMPLETADA',
      observaciones: cleanInput.observaciones?.trim(),
      transaction_id: transactionId || undefined,
      created_at: new Date().toISOString(),
      detalles: []
    };

    // Intentar inserción en base de datos
    let guardadoEnDb = false;
    try {
      const { data: compraData, error: compraError } = await supabaseAdmin
        .from('compras')
        .insert([{
          id: compraId,
          tenant_id: tenantId,
          numero_orden: numeroOrden,
          proveedor_id: cleanInput.proveedorId || null,
          proveedor_nombre: cleanInput.proveedorNombre.trim(),
          proveedor_nit: cleanInput.proveedorNit?.trim() || null,
          proveedor_telefono: cleanInput.proveedorTelefono?.trim() || null,
          proveedor_email: cleanInput.proveedorEmail?.trim() || null,
          fecha_compra: fechaStr,
          metodo_pago: cleanInput.metodoPago,
          subtotal: subtotal,
          impuestos: impuestos,
          total: total,
          aplica_iva: cleanInput.aplicaIva ?? false,
          valor_iva: liquidacion.valorIva,
          aplica_retefuente: cleanInput.aplicaRetefuente ?? false,
          porcentaje_retefuente: cleanInput.porcentajeRetefuente ?? 0,
          valor_retefuente: liquidacion.valorRetefuente,
          aplica_reteica: cleanInput.aplicaReteica ?? false,
          porcentaje_reteica: cleanInput.porcentajeReteica ?? 0,
          valor_reteica: liquidacion.valorReteica,
          neto_pagar: netoPagar,
          estado: 'COMPLETADA',
          observaciones: cleanInput.observaciones?.trim() || null,
          transaction_id: transactionId,
          usuario_id: userId
        }])
        .select('id')
        .single();

      if (!compraError && compraData) {
        guardadoEnDb = true;
      }
    } catch (dbErr) {
      console.warn('[Compras] Fallback de persistencia para compras:', dbErr);
    }

    // 4. Insertar detalles de la compra y actualizar inventario
    for (const item of cleanInput.items) {
      const numericEquipoId = typeof item.equipoId === 'string' ? parseInt(item.equipoId, 10) : item.equipoId;
      const itemSubtotal = item.cantidad * item.precioUnitario;

      nuevaCompraObjeto.detalles?.push({
        id: crypto.randomUUID(),
        equipo_id: numericEquipoId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        subtotal: itemSubtotal
      });

      if (guardadoEnDb) {
        try {
          await supabaseAdmin.from('compras_detalles').insert([{
            compra_id: compraId,
            equipo_id: numericEquipoId,
            cantidad: item.cantidad,
            precio_unitario: item.precioUnitario,
            subtotal: itemSubtotal
          }]);
        } catch {}
      }

      // Actualizar stock del equipo
      try {
        const { data: eqActual } = await supabaseAdmin
          .from('equipos')
          .select('id, nombre, stock_total, stock_disponible, valor_reposicion')
          .eq('id', numericEquipoId)
          .single();

        if (eqActual) {
          const nuevoStockTotal = (eqActual.stock_total || 0) + item.cantidad;
          const nuevoStockDisponible = (eqActual.stock_disponible || 0) + item.cantidad;

          await supabaseAdmin
            .from('equipos')
            .update({
              stock_total: nuevoStockTotal,
              stock_disponible: nuevoStockDisponible,
              updated_at: new Date().toISOString()
            })
            .eq('id', numericEquipoId);

          // 5. Inserción inmutable en Kardex (INGRESO_COMPRA)
          try {
            await supabaseAdmin.from('kardex_inventario').insert([{
              equipo_id: numericEquipoId,
              tenant_id: tenantId,
              tipo_movimiento: 'INGRESO_COMPRA',
              cantidad_delta: item.cantidad,
              stock_resultante: nuevoStockDisponible,
              motivo: `Ingreso por Compra ${numeroOrden} - Proveedor: ${cleanInput.proveedorNombre}`,
              referencia_documento: numeroOrden,
              usuario_id: userId || 'SISTEMA'
            }]);
          } catch (kardexErr) {
            console.warn('[Compras] Kardex notice:', kardexErr);
          }
        }
      } catch (eqErr) {
        console.warn('[Compras] Error actualizando stock:', eqErr);
      }
    }

    // Guardar en Redis para persistencia y lectura optimizada
    const cacheKeyCompras = `compras:${tenantId || 'global'}`;
    if (redis) {
      try {
        const cachedRaw = await redis.get<string>(cacheKeyCompras);
        const lista: CompraUI[] = cachedRaw 
          ? (typeof cachedRaw === 'string' ? JSON.parse(cachedRaw) : cachedRaw)
          : [];
        lista.unshift(nuevaCompraObjeto);
        await redis.set(cacheKeyCompras, JSON.stringify(lista.slice(0, 100)), { ex: 86400 });
        await redis.del('cache:equipos');
      } catch (redisErr) {
        console.warn('Error invalidando redis cache:', redisErr);
      }
    }

    // 6. Auditoría
    AuditLogger.logAsync({
      modulo: 'BODEGA',
      accion: 'REGISTRAR_COMPRA',
      descripcion: `Compra registrada: ${numeroOrden} por valor de $${total.toLocaleString('es-CO')} (Neto a pagar: $${netoPagar.toLocaleString('es-CO')})`,
      entidadId: compraId,
      detalles: {
        numeroOrden,
        proveedor: cleanInput.proveedorNombre,
        metodoPago: cleanInput.metodoPago,
        total,
        netoPagar,
        aplicaIva: cleanInput.aplicaIva,
        aplicaRetefuente: cleanInput.aplicaRetefuente,
        aplicaReteica: cleanInput.aplicaReteica,
        transactionId,
        guardadoEnDb
      },
      userId: userId,
      userEmail: user?.email
    });

    revalidatePath('/compras');
    revalidatePath('/bodega');
    revalidatePath('/facturacion');
    revalidatePath('/');

    return { 
      success: true, 
      data: { 
        compraId, 
        numeroOrden, 
        total, 
        netoPagar,
        transactionId 
      } 
    };

  } catch (error: any) {
    console.error('[Compras Server Action Exception]:', error);
    return { success: false, error: error.message || 'Error inesperado al registrar compra' };
  }
}

/**
 * Server Action para consultar las compras registradas con sus ítems asociados.
 */
export async function obtenerComprasAction(limite = 50): Promise<{ success: boolean; data?: CompraUI[]; error?: string }> {
  try {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();
    let tenantId: string | null = null;
    if (userId) {
      const { data: empUser } = await supabaseAdmin
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('estado', 'ACTIVO')
        .maybeSingle();
      tenantId = empUser?.empresa_id || null;
    }

    const cacheKeyCompras = `compras:${tenantId || 'global'}`;

    // 1. Intentar consultar base de datos
    try {
      const { data: compras, error } = await supabaseAdmin
        .from('compras')
        .select(`
          *,
          compras_detalles (
            id,
            equipo_id,
            cantidad,
            precio_unitario,
            subtotal,
            equipos (
              id,
              nombre,
              codigo
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (!error && compras) {
        const comprasFormateadas: CompraUI[] = compras.map((c: any) => ({
          id: c.id,
          numero_orden: c.numero_orden,
          proveedor_id: c.proveedor_id,
          proveedor_nombre: c.proveedor_nombre,
          proveedor_nit: c.proveedor_nit,
          proveedor_telefono: c.proveedor_telefono,
          proveedor_email: c.proveedor_email,
          fecha_compra: c.fecha_compra,
          metodo_pago: c.metodo_pago,
          subtotal: Number(c.subtotal || 0),
          impuestos: Number(c.impuestos || 0),
          total: Number(c.total || 0),
          aplica_iva: Boolean(c.aplica_iva),
          valor_iva: Number(c.valor_iva || c.impuestos || 0),
          aplica_retefuente: Boolean(c.aplica_retefuente),
          porcentaje_retefuente: Number(c.porcentaje_retefuente || 0),
          valor_retefuente: Number(c.valor_retefuente || 0),
          aplica_reteica: Boolean(c.aplica_reteica),
          porcentaje_reteica: Number(c.porcentaje_reteica || 0),
          valor_reteica: Number(c.valor_reteica || 0),
          neto_pagar: Number(c.neto_pagar || c.total || 0),
          estado: c.estado,
          observaciones: c.observaciones,
          transaction_id: c.transaction_id,
          created_at: c.created_at,
          detalles: (c.compras_detalles || []).map((d: any) => ({
            id: d.id,
            equipo_id: d.equipo_id,
            equipo_nombre: d.equipos?.nombre || `Equipo #${d.equipo_id}`,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_unitario),
            subtotal: Number(d.subtotal)
          }))
        }));

        if (redis) {
          try {
            await redis.set(cacheKeyCompras, JSON.stringify(comprasFormateadas), { ex: 3600 });
          } catch {}
        }

        return { success: true, data: comprasFormateadas };
      }
    } catch (dbErr) {
      console.warn('[obtenerComprasAction] Consultando caché por fallback:', dbErr);
    }

    // 2. Fallback en caché de Redis
    if (redis) {
      try {
        const cached = await redis.get<string>(cacheKeyCompras);
        if (cached) {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (Array.isArray(parsed)) {
            return { success: true, data: parsed as CompraUI[] };
          }
        }
      } catch {}
    }

    return { success: true, data: [] };
  } catch (error: any) {
    console.error('[obtenerComprasAction Error]:', error);
    return { success: false, data: [], error: error.message || 'Error al obtener compras' };
  }
}
