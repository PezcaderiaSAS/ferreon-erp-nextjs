'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AlquilerItemInput {
  itemId: string | number;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

export interface CrearAlquilerInput {
  clienteId: string | number;
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
  alquilerId: string | number;
}

export interface DevolucionItemInput {
  detalleId: string | number;
  cantidadDevuelta: number;
  costoDano?: number;
}

export interface ProcesarDevolucionInput {
  alquilerId: string | number;
  devoluciones: DevolucionItemInput[];
}

export async function crearAlquilerAction(input: CrearAlquilerInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  // 1. Calcular subtotales
  let subtotalEquipos = 0;
  const itemsPayload = input.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    const subtotalLinea = item.tarifaAplicada * item.cantidad * dias;
    subtotalEquipos += subtotalLinea;

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: item.cantidad,
      tarifa_aplicada: item.tarifaAplicada,
      dias_contratados: dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const fleteEntrega = input.fleteEntrega || 0;
  const fleteRecogida = input.fleteRecogida || 0;
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const total = subtotalGeneral;

  const payload = {
    cliente_id: typeof input.clienteId === 'string' ? parseInt(input.clienteId, 10) : input.clienteId,
    estado: 'ACTIVO',
    subtotal_equipos: subtotalEquipos,
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: input.deposito || 0,
    garantia_monto: input.garantiaMonto || 0,
    garantia_tipo: input.garantiaTipo || 'Efectivo',
    observaciones: input.observaciones || '',
    detalles_logistica: input.detallesLogistica || '',
    creado_por: userIdentifier,
    items: itemsPayload
  };

  // 2. Ejecutar Procedimiento RPC Transaccional con FOR UPDATE y Rollback Atómico
  const { data, error } = await supabase.rpc('crear_alquiler_transaccional', {
    p_payload: payload
  });

  if (error) {
    console.error('Error Supabase crear_alquiler_transaccional:', error);
    if (error.message && error.message.includes('Stock insuficiente')) {
      return { success: false, error: error.message };
    }
    return { success: false, error: `Error al crear contrato en BD: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  let subtotal = 0;
  input.items.forEach(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;
    subtotal += item.tarifaAplicada * item.cantidad * dias;
  });

  const total = subtotal + (input.fleteEntrega || 0) + (input.fleteRecogida || 0);

  const { data: cabeceraData, error: cabeceraError } = await supabase
    .from('alquileres')
    .update({
      flete_entrega: input.fleteEntrega || 0,
      flete_recogida: input.fleteRecogida || 0,
      subtotal_equipos: subtotal,
      subtotal_general: subtotal + (input.fleteEntrega || 0) + (input.fleteRecogida || 0),
      deposito: input.deposito || 0,
      garantia_monto: input.garantiaMonto || 0,
      garantia_tipo: input.garantiaTipo || 'Efectivo',
      observaciones: input.observaciones || '',
      detalles_logistica: input.detallesLogistica || '',
      total,
      updated_at: new Date().toISOString()
    })
    .eq('id', numericAlquilerId)
    .select()
    .single();

  if (cabeceraError) {
    console.error('Error Supabase editarAlquilerAction:', cabeceraError);
    return { success: false, error: `Error al actualizar el contrato en BD: ${cabeceraError.message}` };
  }

  revalidatePath('/alquileres');
  return { success: true, data: cabeceraData };
}

export async function procesarDevolucionAction(input: ProcesarDevolucionInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  const payload = {
    alquiler_id: numericAlquilerId,
    devoluciones: input.devoluciones.map(d => ({
      detalle_id: typeof d.detalleId === 'string' ? parseInt(d.detalleId, 10) : d.detalleId,
      cantidad_devuelta: d.cantidadDevuelta,
      costo_dano: d.costoDano || 0
    }))
  };

  const { data, error } = await supabase.rpc('procesar_devolucion_alquiler', {
    p_payload: payload
  });

  if (error) {
    console.error('Error Supabase procesar_devolucion_alquiler:', error);
    return { success: false, error: `Error al procesar devolución en BD: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}

