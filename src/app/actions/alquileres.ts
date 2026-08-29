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
  fechaRegistro?: string;
  fleteEntrega: number;
  fleteRecogida: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: AlquilerItemInput[];
  idempotency_key?: string;
}

export interface EditarAlquilerInput extends Omit<CrearAlquilerInput, 'idempotency_key' | 'clienteId'> {
  alquilerId: string;
}

export async function crearAlquilerAction(input: CrearAlquilerInput) {
  const supabase = await createServerSupabaseClient();

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

  const { data: cabeceraData, error: cabeceraError } = await supabase
    .from('alquileres')
    .insert([{
      cliente_id: input.clienteId,
      estado: 'ACTIVO',
      flete_entrega: input.fleteEntrega,
      flete_recogida: input.fleteRecogida,
      subtotal_equipos: subtotal,
      subtotal_general: subtotal,
      deposito: input.deposito,
      garantia_monto: input.garantiaMonto,
      garantia_tipo: input.garantiaTipo,
      observaciones: input.observaciones,
      detalles_logistica: input.detallesLogistica,
      total
    }])
    .select()
    .single();

  if (cabeceraError) {
    if (cabeceraError.code === '23505') {
      return { success: false, error: `Error de restricción única: Este contrato ya fue registrado (Código: ${cabeceraError.code})` };
    }
    return { success: false, error: `Error al guardar el contrato en BD: ${cabeceraError.message}` };
  }

  // Insertar detalles
  const detallesPayload = input.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    return {
      alquiler_id: cabeceraData.id,
      equipo_id: parseInt(item.itemId, 10), // Convirtiendo UUID o string a id relacional, asumiendo id numérico.
      cantidad: item.cantidad,
      tarifa_aplicada: item.tarifaAplicada,
      dias_contratados: dias,
      subtotal_linea: item.tarifaAplicada * item.cantidad * dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const { error: detallesError } = await supabase
    .from('alquiler_detalles')
    .insert(detallesPayload);

  if (detallesError) {
    // Si falla el detalle deberíamos hacer rollback de cabecera idealmente, pero Next.js Server Actions 
    // no soportan transacciones RPC de Supabase nativamente sin escribir un SQL function.
    return { success: false, error: `Contrato creado, pero falló al guardar los detalles: ${detallesError.message}` };
  }

  revalidatePath('/alquileres');
  return { success: true, data: cabeceraData };
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const supabase = await createServerSupabaseClient();

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

  const { data: cabeceraData, error: cabeceraError } = await supabase
    .from('alquileres')
    .update({
      flete_entrega: input.fleteEntrega,
      flete_recogida: input.fleteRecogida,
      subtotal_equipos: subtotal,
      subtotal_general: subtotal,
      deposito: input.deposito,
      garantia_monto: input.garantiaMonto,
      garantia_tipo: input.garantiaTipo,
      observaciones: input.observaciones,
      detalles_logistica: input.detallesLogistica,
      total
    })
    .eq('id', input.alquilerId)
    .select()
    .single();

  if (cabeceraError) {
    return { success: false, error: `Error al actualizar el contrato en BD: ${cabeceraError.message}` };
  }

  // Para actualizar detalles es complejo sin un ID de línea, lo más sano es borrar y recrear 
  // O en su defecto saltarse la actualización de líneas para MVP.
  await supabase.from('alquiler_detalles').delete().eq('alquiler_id', input.alquilerId);
  
  const detallesPayload = input.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    return {
      alquiler_id: cabeceraData.id,
      equipo_id: parseInt(item.itemId, 10),
      cantidad: item.cantidad,
      tarifa_aplicada: item.tarifaAplicada,
      dias_contratados: dias,
      subtotal_linea: item.tarifaAplicada * item.cantidad * dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });
  
  await supabase.from('alquiler_detalles').insert(detallesPayload);

  revalidatePath('/alquileres');
  return { success: true, data: cabeceraData };
}
