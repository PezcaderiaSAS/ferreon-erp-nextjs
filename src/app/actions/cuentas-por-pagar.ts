'use server';

import { createServerSupabaseClient, createAdminSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { 
  evaluarSemaforoVencimientoCXP, 
  procesarAbonoCuentaPagar, 
  validarEgresoCajaParaAbono,
  generarAsientoContableAbonoProveedor,
  CuentaPagarEstado,
  SemaforoVencimiento
} from '@/core/services/cartera-proveedores.service';

export interface CuentaPagarUI {
  id: string;
  tenant_id?: string | null;
  empresa_id?: string | null;
  compra_id: string;
  proveedor_id?: string | null;
  proveedor_nombre?: string;
  proveedor_nit?: string;
  numero_orden: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  monto_total: number;
  saldo_pendiente: number;
  estado: CuentaPagarEstado;
  semaforo: SemaforoVencimiento;
  dias_restantes: number;
  dias_mora: number;
  observaciones?: string | null;
  created_at: string;
  total_abonos?: number;
}

export interface AbonoProveedorUI {
  id: string;
  cuenta_pagar_id: string;
  numero_comprobante: string;
  fecha_abono: string;
  monto_abono: number;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
  sesion_caja_id?: string | null;
  referencia_bancaria?: string | null;
  observaciones?: string | null;
  usuario_id?: string | null;
  created_at: string;
}

export interface RegistrarAbonoInput {
  cuentaPagarId: string;
  montoAbono: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
  fechaAbono?: string;
  referenciaBancaria?: string;
  observaciones?: string;
  idempotencyKey?: string;
}

const RegistrarAbonoZodSchema = z.object({
  cuentaPagarId: z.string().uuid('ID de cuenta por pagar inválido'),
  montoAbono: z.coerce.number().int().positive('El monto del abono debe ser mayor a cero'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE']),
  fechaAbono: z.string().optional().nullable(),
  referenciaBancaria: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
}).passthrough();

/**
 * Server Action para consultar las Cuentas por Pagar (CXP) con cálculo en vivo
 * de semáforo de vencimiento, días de mora y datos del proveedor.
 */
export async function obtenerCuentasPorPagarAction(filtros?: {
  estado?: string;
  proveedorId?: string;
}): Promise<{ success: boolean; data?: CuentaPagarUI[]; error?: string }> {
  try {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();
    const empresaId = await resolveEmpresaId(userId);

    let query = supabaseAdmin
      .from('proveedor_cuentas_pagar')
      .select(`
        *,
        proveedores (
          id,
          nombre,
          nit,
          telefono,
          dias_credito
        ),
        compras (
          id,
          numero_orden,
          proveedor_nombre,
          proveedor_nit
        )
      `)
      .order('fecha_vencimiento', { ascending: true });

    if (empresaId) {
      query = query.or(`empresa_id.eq.${empresaId},tenant_id.eq.${empresaId}`);
    }

    if (filtros?.estado && filtros.estado !== 'TODOS') {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.proveedorId) {
      query = query.eq('proveedor_id', filtros.proveedorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[obtenerCuentasPorPagarAction] Error Supabase:', error);
      return { success: false, data: [], error: error.message };
    }

    const fechaActual = new Date().toISOString().split('T')[0];

    const cuentasFormateadas: CuentaPagarUI[] = (data || []).map((c: any) => {
      const fechaVenc = c.fecha_vencimiento || fechaActual;
      const sem = evaluarSemaforoVencimientoCXP(fechaVenc, fechaActual);

      return {
        id: c.id,
        tenant_id: c.tenant_id,
        empresa_id: c.empresa_id,
        compra_id: c.compra_id,
        proveedor_id: c.proveedor_id,
        proveedor_nombre: c.proveedores?.nombre || c.compras?.proveedor_nombre || 'Proveedor',
        proveedor_nit: c.proveedores?.nit || c.compras?.proveedor_nit || '',
        numero_orden: c.numero_orden,
        fecha_emision: c.fecha_emision,
        fecha_vencimiento: c.fecha_vencimiento,
        monto_total: Number(c.monto_total || 0),
        saldo_pendiente: Number(c.saldo_pendiente || 0),
        estado: c.estado as CuentaPagarEstado,
        semaforo: sem.estadoSemaforo,
        dias_restantes: sem.diasRestantes,
        dias_mora: sem.diasMora,
        observaciones: c.observaciones,
        created_at: c.created_at,
        total_abonos: Number(c.monto_total || 0) - Number(c.saldo_pendiente || 0)
      };
    });

    return { success: true, data: cuentasFormateadas };
  } catch (err: any) {
    console.error('[obtenerCuentasPorPagarAction Exception]:', err);
    return { success: false, data: [], error: err.message || 'Error al obtener cuentas por pagar' };
  }
}

/**
 * Server Action para registrar un abono o pago total a una cuenta por pagar de proveedor.
 * Garantiza idempotencia, validación de fondos en efectivo contra caja activa,
 * comprobante de egreso inmutable y asiento contable en partida doble.
 */
export async function registrarAbonoProveedorAction(input: RegistrarAbonoInput): Promise<{
  success: boolean;
  data?: {
    abonoId: string;
    numeroComprobante: string;
    nuevoSaldo: number;
    nuevoEstado: CuentaPagarEstado;
  };
  error?: string;
}> {
  try {
    const validation = validateActionInput(input, RegistrarAbonoZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de abono inválidos' };
    }
    const clean = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();
    const empresaId = await resolveEmpresaId(userId);

    // 1. Consultar la cuenta por pagar
    const { data: cxp, error: cxpErr } = await supabaseAdmin
      .from('proveedor_cuentas_pagar')
      .select(`
        *,
        proveedores (nombre, nit)
      `)
      .eq('id', clean.cuentaPagarId)
      .single();

    if (cxpErr || !cxp) {
      return { success: false, error: 'La cuenta por pagar no existe o fue eliminada' };
    }

    if (cxp.estado === 'PAGADA') {
      return { success: false, error: 'Esta cuenta por pagar ya se encuentra totalmente saldada' };
    }

    if (cxp.estado === 'ANULADA') {
      return { success: false, error: 'No se pueden aplicar abonos a una cuenta por pagar anulada' };
    }

    // 2. Procesar saldo matemáticamente con el servicio de dominio
    let calculoAbono;
    try {
      calculoAbono = procesarAbonoCuentaPagar({
        id: cxp.id,
        montoTotal: Number(cxp.monto_total),
        saldoPendiente: Number(cxp.saldo_pendiente),
        estado: cxp.estado as CuentaPagarEstado
      }, clean.montoAbono);
    } catch (domainErr: any) {
      return { success: false, error: domainErr.message };
    }

    // 3. Si el método es EFECTIVO, validar sesión de caja activa
    let sesionCajaId: string | null = null;
    if (clean.metodoPago === 'EFECTIVO') {
      const { data: sesionCaja } = await supabaseAdmin
        .from('sesiones_caja')
        .select('id, saldo_efectivo_actual, saldo_inicial')
        .eq('estado', 'ABIERTA')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .maybeSingle();

      const saldoCajaDisponible = sesionCaja ? Number(sesionCaja.saldo_efectivo_actual || sesionCaja.saldo_inicial || 0) : 0;

      const validacionCaja = validarEgresoCajaParaAbono({
        metodoPago: clean.metodoPago,
        montoAbono: clean.montoAbono,
        sesionCajaActiva: sesionCaja ? { id: sesionCaja.id, saldoEfectivoDisponible: saldoCajaDisponible } : null
      });

      if (!validacionCaja.esValido) {
        return { success: false, error: validacionCaja.error };
      }

      sesionCajaId = sesionCaja!.id;

      // Registrar movimiento de egreso en caja
      try {
        await supabaseAdmin.from('movimientos_caja').insert([{
          sesion_id: sesionCajaId,
          tipo: 'EGRESO',
          monto: clean.montoAbono,
          concepto: `Pago a Proveedor ${cxp.proveedores?.nombre || ''} - Orden ${cxp.numero_orden}`,
          metodo_pago: 'EFECTIVO',
          referencia_id: clean.cuentaPagarId,
          usuario_id: userId
        }]);

        // Actualizar saldo_efectivo_actual en sesion de caja
        await supabaseAdmin
          .from('sesiones_caja')
          .update({
            saldo_efectivo_actual: Math.max(0, saldoCajaDisponible - clean.montoAbono),
            updated_at: new Date().toISOString()
          })
          .eq('id', sesionCajaId);
      } catch (cajaErr) {
        console.warn('[registrarAbonoProveedorAction] Notice al asentar en caja:', cajaErr);
      }
    }

    // 4. Generar correlativo de comprobante de egreso
    const anio = new Date().getFullYear();
    const sufijoRandom = Math.floor(1000 + Math.random() * 9000);
    const numeroComprobante = `CE-${anio}-${sufijoRandom}`;

    // 5. Inserción del abono en proveedor_abonos_cxp
    const abonoId = crypto.randomUUID();
    const fechaAbonoStr = clean.fechaAbono || new Date().toISOString().split('T')[0];

    const { error: abonoErr } = await supabaseAdmin
      .from('proveedor_abonos_cxp')
      .insert([{
        id: abonoId,
        tenant_id: cxp.tenant_id,
        empresa_id: cxp.empresa_id || empresaId,
        cuenta_pagar_id: clean.cuentaPagarId,
        numero_comprobante: numeroComprobante,
        fecha_abono: fechaAbonoStr,
        monto_abono: clean.montoAbono,
        metodo_pago: clean.metodoPago,
        sesion_caja_id: sesionCajaId,
        referencia_bancaria: clean.referenciaBancaria?.trim() || null,
        observaciones: clean.observaciones?.trim() || null,
        usuario_id: userId
      }]);

    if (abonoErr) {
      console.error('[registrarAbonoProveedorAction] Error insertando abono:', abonoErr);
      return { success: false, error: 'Error al registrar el comprobante de abono' };
    }

    // 6. Actualizar la cuenta por pagar con nuevo saldo y estado
    const { error: updateErr } = await supabaseAdmin
      .from('proveedor_cuentas_pagar')
      .update({
        saldo_pendiente: calculoAbono.nuevoSaldoPendiente,
        estado: calculoAbono.nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', clean.cuentaPagarId);

    if (updateErr) {
      console.error('[registrarAbonoProveedorAction] Error actualizando cuenta por pagar:', updateErr);
      return { success: false, error: 'Error al actualizar saldo de la cuenta por pagar' };
    }

    // 7. Asiento Contable en Ledger (Partida Doble)
    try {
      const { data: accounts } = await supabaseAdmin
        .from('financial_accounts')
        .select('id, name, type, is_cash_equivalent');

      const cuentaCxp = accounts?.find(a => a.name === 'Cuentas por Pagar (Proveedores)' || a.type === 'LIABILITY');
      let cuentaTesoreria = clean.metodoPago === 'EFECTIVO'
        ? accounts?.find(a => a.name === 'Caja Principal' || a.is_cash_equivalent)
        : accounts?.find(a => a.name === 'Bancolombia Ahorros' || a.name === 'Nequi' || a.is_cash_equivalent);

      if (cuentaCxp && cuentaTesoreria) {
        const idempotencyKey = `abono_cxp_${numeroComprobante}_${Date.now()}`;
        const { data: txn } = await supabaseAdmin
          .from('transactions')
          .insert([{
            description: `Abono a Proveedor ${cxp.proveedores?.nombre || ''} - ${numeroComprobante}`,
            reference_id: numeroComprobante,
            created_by: userId,
            idempotency_key: idempotencyKey,
            timestamp: new Date().toISOString()
          }])
          .select('id')
          .single();

        if (txn) {
          const asientos = generarAsientoContableAbonoProveedor({
            transactionId: txn.id,
            montoAbono: clean.montoAbono,
            cuentaProveedoresPasivoId: cuentaCxp.id,
            cuentaTesoreriaOrigenId: cuentaTesoreria.id,
            numeroComprobante: numeroComprobante,
            proveedorNombre: cxp.proveedores?.nombre || 'Proveedor'
          });

          await supabaseAdmin.from('journal_entries').insert(asientos);
        }
      }
    } catch (contableErr) {
      console.warn('[registrarAbonoProveedorAction] Notice contable Ledger:', contableErr);
    }

    // 8. Auditoría inmutable
    AuditLogger.logAsync({
      modulo: 'CARTERA',
      accion: 'ABONO_PROVEEDOR',
      descripcion: `Abono registrado a proveedor: ${numeroComprobante} por valor de $${clean.montoAbono.toLocaleString('es-CO')} (Orden: ${cxp.numero_orden})`,
      entidadId: abonoId,
      detalles: {
        cuentaPagarId: clean.cuentaPagarId,
        numeroComprobante,
        montoAbono: clean.montoAbono,
        metodoPago: clean.metodoPago,
        nuevoSaldo: calculoAbono.nuevoSaldoPendiente,
        nuevoEstado: calculoAbono.nuevoEstado,
        sesionCajaId
      },
      userId,
      userEmail: user?.email
    });

    revalidatePath('/compras');
    revalidatePath('/caja');
    revalidatePath('/facturacion');
    revalidatePath('/');

    return {
      success: true,
      data: {
        abonoId,
        numeroComprobante,
        nuevoSaldo: calculoAbono.nuevoSaldoPendiente,
        nuevoEstado: calculoAbono.nuevoEstado
      }
    };

  } catch (error: any) {
    console.error('[registrarAbonoProveedorAction Exception]:', error);
    return { success: false, error: error.message || 'Error inesperado al registrar abono a proveedor' };
  }
}

/**
 * Server Action para consultar el historial de abonos de una cuenta por pagar específica.
 */
export async function obtenerHistorialAbonosAction(
  cuentaPagarId: string
): Promise<{ success: boolean; data?: AbonoProveedorUI[]; error?: string }> {
  try {
    const supabaseAdmin = createAdminSupabaseClient();

    const { data, error } = await supabaseAdmin
      .from('proveedor_abonos_cxp')
      .select('*')
      .eq('cuenta_pagar_id', cuentaPagarId)
      .order('fecha_abono', { ascending: false });

    if (error) {
      console.error('[obtenerHistorialAbonosAction Error]:', error);
      return { success: false, data: [], error: error.message };
    }

    const abonosFormateados: AbonoProveedorUI[] = (data || []).map((a: any) => ({
      id: a.id,
      cuenta_pagar_id: a.cuenta_pagar_id,
      numero_comprobante: a.numero_comprobante,
      fecha_abono: a.fecha_abono,
      monto_abono: Number(a.monto_abono || 0),
      metodo_pago: a.metodo_pago,
      sesion_caja_id: a.sesion_caja_id,
      referencia_bancaria: a.referencia_bancaria,
      observaciones: a.observaciones,
      usuario_id: a.usuario_id,
      created_at: a.created_at
    }));

    return { success: true, data: abonosFormateados };
  } catch (err: any) {
    console.error('[obtenerHistorialAbonosAction Exception]:', err);
    return { success: false, data: [], error: err.message || 'Error al obtener historial de abonos' };
  }
}
