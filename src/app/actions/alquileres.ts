'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AlquilerItemInput {
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

export interface CrearAlquilerInput {
  clienteId: string;
  clienteNombre?: string;
  fechaRegistro: string;
  fleteEntrega: number;
  fleteRecogida: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: AlquilerItemInput[];
  idempotency_key: string;
}

export interface EditarAlquilerInput extends Omit<CrearAlquilerInput, 'idempotency_key' | 'clienteId'> {
  alquilerId: string;
  idempotency_key?: string; // Optional for edit
}

export async function crearAlquilerAction(input: CrearAlquilerInput) {
  const supabase = createServerSupabaseClient();

  // Basic calculation for total and saldo
  let subtotal = 0;
  input.items.forEach(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    subtotal += item.tarifaAplicada * item.cantidad * dias;
  });

  const total = subtotal + input.fleteEntrega + input.fleteRecogida;
  const saldoPendiente = Math.max(0, total - input.deposito);
  const consecutivo = Math.floor(1000 + Math.random() * 9000); // Temporary sequence

  const { data, error } = await supabase
    .from('alquileres')
    .insert([{
      cliente_id: input.clienteId,
      consecutivo,
      fecha_registro: input.fechaRegistro,
      estado: 'ACTIVO',
      flete_entrega: input.fleteEntrega,
      flete_recogida: input.fleteRecogida,
      deposito: input.deposito,
      garantia_monto: input.garantiaMonto,
      garantia_tipo: input.garantiaTipo,
      observaciones: input.observaciones,
      detalles_logistica: input.detallesLogistica,
      detalles: input.items, // Stored as JSONB in Supabase
      total,
      saldo_pendiente: saldoPendiente,
      idempotency_key: input.idempotency_key
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Error de restricción única: Este contrato ya fue registrado (Código: ${error.code})`);
    }
    throw new Error(`Error al guardar el contrato en BD: ${error.message}`);
  }

  revalidatePath('/alquileres');
  return data;
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const supabase = createServerSupabaseClient();

  let subtotal = 0;
  input.items.forEach(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    subtotal += item.tarifaAplicada * item.cantidad * dias;
  });

  const total = subtotal + input.fleteEntrega + input.fleteRecogida;
  const saldoPendiente = Math.max(0, total - input.deposito);

  const { data, error } = await supabase
    .from('alquileres')
    .update({
      fecha_registro: input.fechaRegistro,
      flete_entrega: input.fleteEntrega,
      flete_recogida: input.fleteRecogida,
      deposito: input.deposito,
      garantia_monto: input.garantiaMonto,
      garantia_tipo: input.garantiaTipo,
      observaciones: input.observaciones,
      detalles_logistica: input.detallesLogistica,
      detalles: input.items,
      total,
      saldo_pendiente: saldoPendiente,
    })
    .eq('id', input.alquilerId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al actualizar el contrato en BD: ${error.message}`);
  }

  revalidatePath('/alquileres');
  return data;
}
