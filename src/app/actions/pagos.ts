'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

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
  clienteId: z.union([z.string(), z.number()]).optional(),
  monto: z.number().positive('El monto del abono debe ser mayor a cero'),
  metodoPago: z.string().min(1, 'El método de pago es obligatorio'),
  referencia: z.string().optional(),
  efectivo_recibido: z.number().min(0).optional(),
  cambio_entregado: z.number().min(0).optional(),
  idempotency_key: z.string().optional(),
});

export async function registrarPagoAction(input: RegistrarPagoInput) {
  const validation = validateActionInput(input, RegistrarPagoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Error de validación en los datos del pago.' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' ? parseInt(cleanInput.alquilerId, 10) : cleanInput.alquilerId;

  if (isNaN(numericAlquilerId)) {
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
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Revalidar rutas para refrescar saldos en UI
  revalidatePath('/alquileres');
  revalidatePath('/clientes');
  return { success: true, data };
}

export async function obtenerPagosPorAlquilerAction(alquilerId: string | number) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof alquilerId === 'string' ? parseInt(alquilerId, 10) : alquilerId;

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
