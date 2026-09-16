'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { 
  validarLiquidacionPagoMixto, 
  generarAsientoContablePagoMixto, 
  MetodoPagoItemInput 
} from '../../core/services/pago-mixto.service';

export interface RegistrarPagoInput {
  alquilerId: string | number;
  clienteId?: string | number;
  monto: number;
  metodoPago: 'TRANSFERENCIA' | 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'CHEQUE' | string;
  referencia?: string;
  efectivo_recibido?: number;
  cambio_entregado?: number;
  idempotency_key?: string;
}

const RegistrarPagoZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  clienteId: z.union([z.string(), z.number()]).optional().nullable(),
  monto: z.coerce.number().positive('El monto del abono debe ser mayor a cero'),
  metodoPago: z.string().min(1, 'El método de pago es obligatorio'),
  referencia: z.string().optional().nullable(),
  efectivo_recibido: z.coerce.number().min(0).optional().nullable(),
  cambio_entregado: z.coerce.number().min(0).optional().nullable(),
  idempotency_key: z.string().optional().nullable(),
}).passthrough();

export async function registrarPagoAction(input: RegistrarPagoInput) {
  const validation = validateActionInput(input, RegistrarPagoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Error de validación en los datos del pago.' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' 
    ? (parseInt(cleanInput.alquilerId.replace(/\D/g, ''), 10) || parseInt(cleanInput.alquilerId, 10))
    : cleanInput.alquilerId;

  if (!numericAlquilerId || isNaN(Number(numericAlquilerId))) {
    return { success: false, error: 'ID de alquiler inválido.' };
  }

  if (!cleanInput.monto || cleanInput.monto <= 0) {
    return { success: false, error: 'El monto del abono debe ser mayor a cero.' };
  }

  // Si no nos pasan clienteId, lo consultamos del contrato
  let numericClienteId: number | null = cleanInput.clienteId ? (typeof cleanInput.clienteId === 'string' ? parseInt(cleanInput.clienteId, 10) : cleanInput.clienteId) : null;
  if (!numericClienteId) {
    const { data: alq, error: alqErr } = await supabase
      .from('alquileres')
      .select('cliente_id')
      .eq('id', numericAlquilerId)
      .single();

    if (alqErr || !alq) {
      return { success: false, error: 'No se encontró el contrato de alquiler asociado para registrar el pago.' };
    }
    numericClienteId = alq.cliente_id;
  }

  // POKA-YOKE: Si el método es efectivo, verificar que exista una caja abierta
  const validMetodos = ['TRANSFERENCIA', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'CHEQUE'];
  const safeMetodo = validMetodos.includes(cleanInput.metodoPago.toUpperCase()) ? cleanInput.metodoPago.toUpperCase() : 'TRANSFERENCIA';

  let sesionCajaId: string | null = null;
  
  if (safeMetodo === 'EFECTIVO') {
    const { data: sesionCaja, error: errCaja } = await supabase
      .from('sesiones_caja')
      .select('id, estado')
      .eq('estado', 'ABIERTA')
      .eq('usuario_id', user?.id || '')
      .maybeSingle();

    if (errCaja || !sesionCaja) {
      return { success: false, error: 'Poka-Yoke: No puedes registrar un pago en EFECTIVO porque no tienes una Caja Abierta en este momento.' };
    }
    sesionCajaId = sesionCaja.id;
  }

  const supabaseAdmin = createAdminSupabaseClient();

  // Consultar datos actuales del alquiler para calcular saldos y consecutivos
  let alqActual: any = null;
  try {
    const { data: alq } = await supabaseAdmin
      .from('alquileres')
      .select('id, consecutivo, total, total_pagado, saldo_pendiente, cliente_id, clientes (nombre, documento, telefono)')
      .eq('id', numericAlquilerId)
      .single();
    alqActual = alq;
  } catch (e) {
    console.warn('[Pagos] Error al consultar datos del alquiler:', e);
  }

  const saldoAnterior = alqActual?.saldo_pendiente ?? (alqActual ? (alqActual.total - (alqActual.total_pagado || 0)) : cleanInput.monto);
  const nuevoTotalPagado = (alqActual?.total_pagado || 0) + cleanInput.monto;
  const nuevoSaldoPendiente = Math.max(0, (alqActual?.total || cleanInput.monto) - nuevoTotalPagado);

  const { data, error } = await supabase
    .from('pagos')
    .insert([{
      alquiler_id: numericAlquilerId,
      cliente_id: numericClienteId,
      monto: cleanInput.monto,
      metodo_pago: safeMetodo,
      referencia: cleanInput.referencia?.trim() || null,
      efectivo_recibido: cleanInput.efectivo_recibido || null,
      cambio_entregado: cleanInput.cambio_entregado || null,
      sesion_caja_id: sesionCajaId,
      registrado_por: userIdentifier,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error Supabase registrarPagoAction:', error);
    return { success: false, error: `Error al registrar abono en BD: ${error.message}` };
  }

  // Actualizar saldos en el contrato de alquiler
  try {
    await supabaseAdmin
      .from('alquileres')
      .update({
        total_pagado: nuevoTotalPagado,
        saldo_pendiente: nuevoSaldoPendiente,
        updated_at: new Date().toISOString()
      })
      .eq('id', numericAlquilerId);
  } catch (alqUpdErr) {
    console.warn('[Pagos] Error actualizando saldo en alquileres:', alqUpdErr);
  }

  // Registrar Asiento Contable en el Ledger (Partida Doble)
  let transactionId: string | null = null;
  try {
    const { data: accounts } = await supabaseAdmin
      .from('financial_accounts')
      .select('id, name, type, is_cash_equivalent');

    let cuentaCajaOBanco = safeMetodo === 'EFECTIVO'
      ? accounts?.find(a => a.name === 'Caja Principal' || a.is_cash_equivalent)
      : accounts?.find(a => a.name === 'Bancolombia Ahorros' || a.name === 'Nequi' || a.is_cash_equivalent);

    let cuentaCartera = accounts?.find(a => a.name === 'Cuentas por Cobrar (Cartera)' || a.name === 'Ingresos por Alquileres' || a.type === 'ASSET');

    if (cuentaCajaOBanco && cuentaCartera && cleanInput.monto > 0) {
      const consecutivoRecibo = `RC-${String(data?.id || Date.now()).slice(0, 8).toUpperCase()}`;
      const { data: txn } = await supabaseAdmin
        .from('transactions')
        .insert([{
          description: `Recaudo Abono Alquiler ALQ-${alqActual?.consecutivo || numericAlquilerId} (${safeMetodo})`,
          reference_id: consecutivoRecibo,
          created_by: user?.id,
          idempotency_key: `recaudo_${data.id}_${Date.now()}`,
          timestamp: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (txn) {
        transactionId = txn.id;
        // Asiento:
        // 1. Débito (+monto): Caja Principal / Bancos (Entrada de dinero)
        // 2. Crédito (-monto): Cuentas por Cobrar Cartera (Disminución de activo exigible)
        await supabaseAdmin.from('journal_entries').insert([
          {
            transaction_id: txn.id,
            account_id: cuentaCajaOBanco.id,
            amount: cleanInput.monto
          },
          {
            transaction_id: txn.id,
            account_id: cuentaCartera.id,
            amount: -cleanInput.monto
          }
        ]);
      }
    }
  } catch (ledgerErr) {
    console.warn('[Pagos] Error al registrar asiento en Ledger:', ledgerErr);
  }

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'CARTERA',
    accion: 'REGISTRAR_PAGO',
    descripcion: `Abono de $${cleanInput.monto.toLocaleString('es-CO')} registrado al contrato ID ${numericAlquilerId} vía ${safeMetodo}`,
    entidadId: data?.id || String(numericAlquilerId),
    detalles: {
      alquilerId: numericAlquilerId,
      clienteId: numericClienteId,
      monto: cleanInput.monto,
      metodoPago: safeMetodo,
      referencia: cleanInput.referencia,
      sesionCajaId,
      transactionId,
      saldoAnterior,
      nuevoSaldoPendiente
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Revalidar rutas para refrescar saldos en UI
  revalidatePath('/facturacion');
  revalidatePath('/alquileres');
  revalidatePath('/clientes');

  const reciboInfo = {
    pagoId: data.id,
    consecutivoRecibo: `RC-${String(data.id).slice(0, 8).toUpperCase()}`,
    consecutivoAlquiler: alqActual?.consecutivo || String(numericAlquilerId),
    clienteNombre: alqActual?.clientes?.nombre || 'Cliente General',
    clienteDocumento: alqActual?.clientes?.documento || '',
    clienteTelefono: alqActual?.clientes?.telefono || '',
    monto: cleanInput.monto,
    metodoPago: safeMetodo,
    saldoAnterior,
    nuevoSaldoPendiente,
    efectivoRecibido: cleanInput.efectivo_recibido,
    cambioEntregado: cleanInput.cambio_entregado,
    fecha: data.fecha || new Date().toISOString(),
    registradoPor: userIdentifier,
    transactionId
  };

  return { success: true, data, recibo: reciboInfo };
}

export async function obtenerPagosPorAlquilerAction(alquilerId: string | number) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof alquilerId === 'string' 
    ? (parseInt(alquilerId.replace(/\D/g, ''), 10) || parseInt(alquilerId, 10))
    : alquilerId;

  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('alquiler_id', numericAlquilerId)
    .is('deleted_at', null)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error Supabase obtenerPagosPorAlquilerAction:', error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}

export interface MetodoPagoDetallePayload {
  metodo: string;
  monto: number;
  referencia?: string;
  efectivoRecibido?: number;
}

export interface RegistrarPagoMixtoInput {
  alquilerId: string | number;
  clienteId?: string | number;
  totalAbonar: number;
  metodos: MetodoPagoDetallePayload[];
  idempotencyKey?: string;
}

const MetodoPagoDetalleZodSchema = z.object({
  metodo: z.string().min(1, 'El método es obligatorio'),
  monto: z.coerce.number().positive('El monto debe ser positivo'),
  referencia: z.string().optional().nullable(),
  efectivoRecibido: z.coerce.number().optional().nullable(),
});

const RegistrarPagoMixtoZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  clienteId: z.union([z.string(), z.number()]).optional().nullable(),
  totalAbonar: z.coerce.number().positive('El total a abonar debe ser mayor a cero'),
  metodos: z.array(MetodoPagoDetalleZodSchema).min(1, 'Debe indicar al menos un método de pago'),
  idempotencyKey: z.string().optional().nullable(),
});

/**
 * Server Action: REGISTRO DE PAGOS MIXTOS MULTILÍNEA & PARTIDA DOBLE EN LEDGER
 * Soporta cobro combinado (Efectivo + Transferencia Bancolombia/Nequi + Saldo a Favor del Cliente),
 * descuenta automáticamente el crédito en custodia y genera el asiento contable balanceado en el Ledger.
 */
export async function registrarPagoMixtoAction(input: RegistrarPagoMixtoInput) {
  const validation = validateActionInput(input, RegistrarPagoMixtoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Error de validación en los datos del pago mixto.' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createAdminSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const numericAlquilerId = typeof cleanInput.alquilerId === 'string'
    ? (parseInt(cleanInput.alquilerId.replace(/\D/g, ''), 10) || parseInt(cleanInput.alquilerId, 10))
    : cleanInput.alquilerId;

  if (!numericAlquilerId || isNaN(Number(numericAlquilerId))) {
    return { success: false, error: 'ID de contrato de alquiler inválido.' };
  }

  // 1. Consultar Contrato y Cliente Asociado
  let alqActual: any = null;
  try {
    const { data: alq, error: alqErr } = await supabaseAdmin
      .from('alquileres')
      .select('id, consecutivo, total, total_pagado, saldo_pendiente, cliente_id, clientes (id, nombre, documento, telefono, saldo_a_favor)')
      .eq('id', numericAlquilerId)
      .single();

    if (alqErr || !alq) {
      return { success: false, error: 'No se encontró el contrato de alquiler para imputar el abono.' };
    }
    alqActual = alq;
  } catch (e) {
    return { success: false, error: 'Error al consultar el contrato de alquiler.' };
  }

  const numericClienteId = cleanInput.clienteId 
    ? (typeof cleanInput.clienteId === 'string' ? parseInt(cleanInput.clienteId, 10) : cleanInput.clienteId)
    : alqActual.cliente_id;

  const saldoFavorDisponible = Number(alqActual?.clientes?.saldo_a_favor || 0);

  // 2. Verificar Sesión de Caja Abierta si algún método es Efectivo
  const tieneEfectivo = cleanInput.metodos.some(m => m.metodo.toUpperCase() === 'EFECTIVO');
  let sesionCajaId: string | null = null;

  if (tieneEfectivo) {
    const { data: sesionCaja, error: errCaja } = await supabase
      .from('sesiones_caja')
      .select('id, estado')
      .eq('estado', 'ABIERTA')
      .eq('usuario_id', user?.id || '')
      .maybeSingle();

    if (errCaja || !sesionCaja) {
      return { 
        success: false, 
        error: 'Poka-Yoke: Uno de los métodos seleccionados es EFECTIVO pero no tienes una Caja Abierta en este turno.' 
      };
    }
    sesionCajaId = sesionCaja.id;
  }

  // 3. Validación de Dominio Puro (Aritmética, suficiencia de saldo a favor, cuadre)
  const validacionLiquidacion = validarLiquidacionPagoMixto({
    totalAbonar: cleanInput.totalAbonar,
    metodos: cleanInput.metodos as MetodoPagoItemInput[],
    sesionCajaActivaId: sesionCajaId,
    saldoFavorCliente: saldoFavorDisponible
  });

  if (!validacionLiquidacion.valido) {
    return { success: false, error: validacionLiquidacion.error || 'Liquidación monetaria inválida.' };
  }

  // 4. Comprobación de Idempotencia
  const idempotencyKey = cleanInput.idempotencyKey || `pago_mix_${numericAlquilerId}_${Date.now()}`;
  if (cleanInput.idempotencyKey) {
    const { data: pagoExistente } = await supabaseAdmin
      .from('pagos')
      .select('id, monto, fecha')
      .eq('idempotency_key', cleanInput.idempotencyKey)
      .maybeSingle();

    if (pagoExistente) {
      return {
        success: true,
        data: pagoExistente,
        idempotent: true,
        mensaje: 'Pago registrado previamente (idempotente)'
      };
    }
  }

  // 5. Inserción de Cabecera en `pagos`
  const metodoPrincipal = cleanInput.metodos.length > 1 ? 'MIXTO' : cleanInput.metodos[0].metodo.toUpperCase();
  const saldoAnterior = alqActual?.saldo_pendiente ?? Math.max(0, (alqActual.total - (alqActual.total_pagado || 0)));
  const nuevoTotalPagado = (alqActual?.total_pagado || 0) + cleanInput.totalAbonar;
  const nuevoSaldoPendiente = Math.max(0, alqActual.total - nuevoTotalPagado);

  const { data: pagoCreado, error: errPago } = await supabaseAdmin
    .from('pagos')
    .insert([{
      alquiler_id: numericAlquilerId,
      cliente_id: numericClienteId,
      monto: cleanInput.totalAbonar,
      metodo_pago: metodoPrincipal,
      referencia: cleanInput.metodos.map(m => m.referencia).filter(Boolean).join(' | ') || null,
      efectivo_recibido: validacionLiquidacion.montoEfectivo > 0 ? cleanInput.metodos.find(m => m.metodo.toUpperCase() === 'EFECTIVO')?.efectivoRecibido : null,
      cambio_entregado: validacionLiquidacion.cambioTotal > 0 ? validacionLiquidacion.cambioTotal : null,
      sesion_caja_id: sesionCajaId,
      registrado_por: userIdentifier,
      idempotency_key: idempotencyKey,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (errPago || !pagoCreado) {
    console.error('Error insertando pago mixto en BD:', errPago);
    return { success: false, error: `Error al registrar cabecera de pago: ${errPago?.message || ''}` };
  }

  // 6. Inserción de Desglose en `pago_metodos_detalle`
  const detallesMetodosPayload = cleanInput.metodos.map(m => ({
    pago_id: pagoCreado.id,
    metodo: m.metodo.toUpperCase(),
    monto: Math.round(m.monto),
    referencia: m.referencia?.trim() || null,
    sesion_caja_id: m.metodo.toUpperCase() === 'EFECTIVO' ? sesionCajaId : null
  }));

  const { error: errDetMetodos } = await supabaseAdmin
    .from('pago_metodos_detalle')
    .insert(detallesMetodosPayload);

  if (errDetMetodos) {
    console.warn('Advertencia insertando pago_metodos_detalle:', errDetMetodos);
  }

  // 7. Si se utilizó Saldo a Favor, debitar de `clientes` y asentar en `cliente_movimientos_saldo`
  if (validacionLiquidacion.montoSaldoFavor > 0) {
    const nuevoSaldoFavor = Math.max(0, saldoFavorDisponible - validacionLiquidacion.montoSaldoFavor);
    
    await supabaseAdmin
      .from('clientes')
      .update({ saldo_a_favor: nuevoSaldoFavor, updated_at: new Date().toISOString() })
      .eq('id', numericClienteId);

    await supabaseAdmin
      .from('cliente_movimientos_saldo')
      .insert([{
        cliente_id: numericClienteId,
        tipo: 'USO_PAGO_ALQUILER',
        monto: validacionLiquidacion.montoSaldoFavor,
        saldo_resultante: nuevoSaldoFavor,
        referencia_origen: `ALQ-${alqActual?.consecutivo || numericAlquilerId}`,
        motivo: `Abono de cartera formalizado mediante cruce de saldo a favor del cliente`,
        creado_por: user?.id
      }]);
  }

  // 8. Actualizar saldos en el contrato de alquiler
  await supabaseAdmin
    .from('alquileres')
    .update({
      total_pagado: nuevoTotalPagado,
      saldo_pendiente: nuevoSaldoPendiente,
      updated_at: new Date().toISOString()
    })
    .eq('id', numericAlquilerId);

  // 9. Registrar Asiento Contable Balanceado en el Ledger (Partida Doble)
  let transactionId: string | null = null;
  try {
    const { data: accounts } = await supabaseAdmin
      .from('financial_accounts')
      .select('id, name, type, is_cash_equivalent');

    const asientoCalculado = generarAsientoContablePagoMixto({
      pagoId: pagoCreado.id,
      alquilerId: numericAlquilerId,
      consecutivoAlquiler: alqActual?.consecutivo ? `ALQ-${alqActual.consecutivo}` : undefined,
      totalAbono: cleanInput.totalAbonar,
      metodos: cleanInput.metodos as MetodoPagoItemInput[],
      cuentas: accounts || []
    });

    const { data: txn } = await supabaseAdmin
      .from('transactions')
      .insert([{
        description: asientoCalculado.description,
        reference_id: asientoCalculado.referenceId,
        created_by: user?.id,
        idempotency_key: `recaudo_mix_${pagoCreado.id}_${Date.now()}`,
        timestamp: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (txn) {
      transactionId = txn.id;
      const journalEntriesPayload = asientoCalculado.entries.map(e => ({
        transaction_id: txn.id,
        account_id: e.accountId,
        amount: e.amount
      }));

      await supabaseAdmin.from('journal_entries').insert(journalEntriesPayload);
    }
  } catch (ledgerErr) {
    console.warn('[registrarPagoMixtoAction] Error Ledger:', ledgerErr);
  }

  // 10. Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'CARTERA',
    accion: 'REGISTRAR_PAGO',
    descripcion: `Abono Mixto de $${cleanInput.totalAbonar.toLocaleString('es-CO')} registrado al contrato ALQ-${alqActual?.consecutivo || numericAlquilerId} con ${cleanInput.metodos.length} métodos`,
    entidadId: String(pagoCreado.id),
    detalles: {
      pagoId: pagoCreado.id,
      alquilerId: numericAlquilerId,
      clienteId: numericClienteId,
      totalAbonar: cleanInput.totalAbonar,
      metodos: cleanInput.metodos,
      saldoAnterior,
      nuevoSaldoPendiente,
      saldoFavorUtilizado: validacionLiquidacion.montoSaldoFavor,
      transactionId
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // 11. Revalidación Reactiva de Rutas
  revalidatePath('/facturacion');
  revalidatePath('/alquileres');
  revalidatePath('/clientes');
  revalidatePath('/caja');

  const reciboInfo = {
    pagoId: pagoCreado.id,
    consecutivoRecibo: `RC-${String(pagoCreado.id).slice(-8).toUpperCase()}`,
    consecutivoAlquiler: alqActual?.consecutivo ? `ALQ-${alqActual.consecutivo}` : String(numericAlquilerId),
    clienteNombre: alqActual?.clientes?.nombre || 'Cliente General',
    clienteDocumento: alqActual?.clientes?.documento || '',
    clienteTelefono: alqActual?.clientes?.telefono || '',
    monto: cleanInput.totalAbonar,
    metodoPago: metodoPrincipal,
    metodosDesglose: cleanInput.metodos,
    saldoAnterior,
    nuevoSaldoPendiente,
    efectivoRecibido: cleanInput.metodos.find(m => m.metodo.toUpperCase() === 'EFECTIVO')?.efectivoRecibido,
    cambioEntregado: validacionLiquidacion.cambioTotal,
    fecha: pagoCreado.fecha || new Date().toISOString(),
    registradoPor: userIdentifier,
    transactionId
  };

  return { success: true, data: pagoCreado, recibo: reciboInfo };
}

