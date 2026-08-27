'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CrearEquipoInput {
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  stockInicial: number;
  idempotency_key: string;
}

export async function crearEquipoAction(input: CrearEquipoInput) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      sku: input.sku,
      codigo: input.sku, // Para compatibilidad
      nombre: input.nombre,
      categoria: input.categoria,
      tarifa_diaria: input.tarifaDiaria,
      stock_total: input.stockInicial,
      stock_disponible: input.stockInicial,
      stock_en_obra: 0,
      estado: 'Activo'
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Error de restricción única: Este SKU o llave ya fue registrada (Código: ${error.code})` };
    }
    console.error('Error Supabase crearEquipoAction:', error);
    return { success: false, error: `Error al guardar equipo en BD: ${error.message}` };
  }

  revalidatePath('/bodega');
  return { success: true, data };
}

export interface EditarEquipoInput {
  id: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  estado: 'Disponible' | 'En Alquiler' | 'Mantenimiento';
  idempotency_key: string;
}

export async function editarEquipoAction(input: EditarEquipoInput) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('equipos')
    .update({
      nombre: input.nombre,
      categoria: input.categoria,
      tarifa_diaria: input.tarifaDiaria,
      estado: input.estado === 'Mantenimiento' || input.estado === 'En Alquiler' ? 'Activo' : 'Activo', // El check constraint solo admite 'Activo' o 'Inactivo'
    })
    .eq('id', input.id)
    .select()
    .single();

  if (error) {
    console.error('Error Supabase editarEquipoAction:', error);
    return { success: false, error: `Error al editar equipo en BD: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/bodega');
  return { success: true, data };
}

export async function ajustarStockEquipoAction(equipoId: string, delta: number) {
  // OJO: Esto requiere tener el stock_disponible y stock_en_obra actuales
  // Lo más seguro es usar un RPC, pero como no sabemos si hay un RPC "increment_stock",
  // lo leeremos, y luego lo actualizaremos en la misma transacción (o pseudo-transacción).
  const supabase = createServerSupabaseClient();

  // Obtenemos estado actual
  const { data: equipo, error: errFetch } = await supabase
    .from('equipos')
    .select('stock_disponible, stock_en_obra, stock_mantenimiento, estado')
    .eq('id', equipoId)
    .single();

  if (errFetch || !equipo) {
    console.error('Error Supabase ajustarStock (leer):', errFetch);
    return { success: false, error: `Error al leer equipo para ajustar stock: ${errFetch?.message}` };
  }

  const nuevoDisponible = Math.max(0, (equipo.stock_disponible || 0) + delta);
  const total = nuevoDisponible + (equipo.stock_en_obra || 0) + (equipo.stock_mantenimiento || 0);
  
  // No tocamos el estado aquí porque la base de datos solo admite Activo/Inactivo.
  // El store mapea el estado visual según los balances de stock.

  const { data, error } = await supabase
    .from('equipos')
    .update({
      stock_disponible: nuevoDisponible,
      stock_total: total,
    })
    .eq('id', equipoId)
    .select()
    .single();

  if (error) {
    console.error('Error Supabase ajustarStock (update):', error);
    return { success: false, error: `Error al ajustar stock en BD: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/bodega');
  return { success: true, data };
}
