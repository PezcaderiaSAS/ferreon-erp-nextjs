'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RegistrarPagoInput {
  alquilerId: string | number;
  clienteId?: string | number;
  monto: number;
  metodoPago: 'TRANSFERENCIA' | 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'CHEQUE' | string;
  referencia?: string;
  idempotency_key?: string;
}

export async function registrarPagoAction(input: RegistrarPagoInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  if (isNaN(numericAlquilerId)) {
    return { success: false, error: 'ID de alquiler inválido.' };
  }

  if (!input.monto || input.monto <= 0) {
    return { success: false, error: 'El monto del abono debe ser mayor a cero.' };
  }

  // Si no nos pasan clienteId, lo consultamos del contrato
  let numericClienteId: number | null = input.clienteId ? (typeof input.clienteId === 'string' ? parseInt(input.clienteId, 10) : input.clienteId) : null;
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

  const validMetodos = ['TRANSFERENCIA', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'CHEQUE'];
  const safeMetodo = validMetodos.includes(input.metodoPago.toUpperCase()) ? input.metodoPago.toUpperCase() : 'TRANSFERENCIA';

  const { data, error } = await supabase
    .from('pagos')
    .insert([{
      alquiler_id: numericAlquilerId,
      cliente_id: numericClienteId,
      monto: input.monto,
      metodo_pago: safeMetodo,
      referencia: input.referencia?.trim() || null,
      registrado_por: userIdentifier,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Error Supabase registrarPagoAction:', error);
    return { success: false, error: `Error al registrar abono en BD: ${error.message}` };
  }

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
