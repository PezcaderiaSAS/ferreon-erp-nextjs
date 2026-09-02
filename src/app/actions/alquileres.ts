'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '../../lib/redis';

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

export interface EditarAlquilerInput {
  alquilerId: string | number;
  clienteId?: string | number;
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
    const diffMs = end.getTime() - start.getTime();
    let dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const tarifa = Number(item.tarifaAplicada || 0);
    const cant = Number(item.cantidad || 1);
    const subtotalLinea = tarifa * cant * dias;
    subtotalEquipos += subtotalLinea;

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const fleteEntrega = Number(input.fleteEntrega || 0);
  const fleteRecogida = Number(input.fleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const deposito = Number(input.deposito || 0);
  const total = subtotalGeneral;

  const payload = {
    cliente_id: typeof input.clienteId === 'string' ? parseInt(input.clienteId, 10) : input.clienteId,
    estado: 'ACTIVO',
    subtotal_equipos: subtotalEquipos,
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: deposito,
    garantia_monto: Number(input.garantiaMonto || 0),
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

  // 3. Invalidar Caché Multi-Tenant
  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[crearAlquilerAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  // 1. Calcular subtotales
  let subtotalEquipos = 0;
  const itemsProcesados = input.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    const diffMs = end.getTime() - start.getTime();
    let dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const tarifa = Number(item.tarifaAplicada || 0);
    const cant = Number(item.cantidad || 1);
    const subtotalLinea = tarifa * cant * dias;
    subtotalEquipos += subtotalLinea;

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      subtotal_linea: subtotalLinea,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const fleteEntrega = Number(input.fleteEntrega || 0);
  const fleteRecogida = Number(input.fleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const deposito = Number(input.deposito || 0);
  const total = subtotalGeneral;
  const saldoPendiente = Math.max(0, total - deposito);

  // 2. Actualizar Cabecera de Alquiler
  const updatePayload: any = {
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_equipos: subtotalEquipos,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: deposito,
    saldo_pendiente: saldoPendiente,
    garantia_monto: Number(input.garantiaMonto || 0),
    garantia_tipo: input.garantiaTipo || 'Efectivo',
    observaciones: input.observaciones || '',
    detalles_logistica: input.detallesLogistica || '',
    updated_at: new Date().toISOString()
  };

  if (input.clienteId) {
    updatePayload.cliente_id = typeof input.clienteId === 'string' ? parseInt(input.clienteId, 10) : input.clienteId;
  }

  const { data: cabeceraData, error: cabeceraError } = await supabase
    .from('alquileres')
    .update(updatePayload)
    .eq('id', numericAlquilerId)
    .select()
    .single();

  if (cabeceraError) {
    console.error('Error Supabase editarAlquilerAction cabecera:', cabeceraError);
    return { success: false, error: `Error al actualizar contrato en BD: ${cabeceraError.message}` };
  }

  // 3. Sincronizar Líneas Relacionales en alquiler_detalles y Stock
  try {
    const { data: detallesPrevios } = await supabase
      .from('alquiler_detalles')
      .select('id, equipo_id, cantidad')
      .eq('alquiler_id', numericAlquilerId);

    // 3.1 Revertir stock anterior de equipos
    if (detallesPrevios && detallesPrevios.length > 0) {
      for (const dp of detallesPrevios) {
        const { data: eq } = await supabase
          .from('equipos')
          .select('stock_disponible, stock_en_obra')
          .eq('id', dp.equipo_id)
          .single();

        if (eq) {
          await supabase
            .from('equipos')
            .update({
              stock_disponible: eq.stock_disponible + dp.cantidad,
              stock_en_obra: Math.max(0, eq.stock_en_obra - dp.cantidad),
              updated_at: new Date().toISOString()
            })
            .eq('id', dp.equipo_id);
        }
      }

      await supabase
        .from('alquiler_detalles')
        .delete()
        .eq('alquiler_id', numericAlquilerId);
    }

    // 3.2 Insertar nuevos detalles y descontar nuevo inventario
    for (const it of itemsProcesados) {
      const { data: eq } = await supabase
        .from('equipos')
        .select('stock_disponible, stock_en_obra')
        .eq('id', it.equipo_id)
        .single();

      if (eq) {
        await supabase
          .from('equipos')
          .update({
            stock_disponible: Math.max(0, eq.stock_disponible - it.cantidad),
            stock_en_obra: eq.stock_en_obra + it.cantidad,
            updated_at: new Date().toISOString()
          })
          .eq('id', it.equipo_id);
      }

      await supabase
        .from('alquiler_detalles')
        .insert([{
          alquiler_id: numericAlquilerId,
          equipo_id: it.equipo_id,
          cantidad: it.cantidad,
          tarifa_aplicada: it.tarifa_aplicada,
          dias_contratados: it.dias_contratados,
          subtotal_linea: it.subtotal_linea,
          fecha_inicio: it.fecha_inicio ? new Date(it.fecha_inicio).toISOString() : new Date().toISOString(),
          fecha_fin: it.fecha_fin ? new Date(it.fecha_fin).toISOString() : new Date().toISOString(),
          devuelto: false,
          cantidad_devuelta: 0,
          costo_dano: 0
        }]);
    }
  } catch (detError: any) {
    console.error('Error al sincronizar detalles en editarAlquilerAction:', detError);
  }

  // 4. Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[editarAlquilerAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
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

  // Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[procesarDevolucionAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}
