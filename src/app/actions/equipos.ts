'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
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
  const supabase = await createServerSupabaseClient();

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
  const supabase = await createServerSupabaseClient();

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

export async function ajustarStockEquipoAction(equipoId: string, delta: number, idempotencyKey?: string) {
  // Usar cliente admin (service_role) para operaciones privilegiadas de inventario
  // que necesitan saltarse RLS y ejecutar RPCs atómicas
  const supabaseAdmin = createAdminSupabaseClient();

  // 1. Validar Idempotencia Fuerte si existe la llave
  if (idempotencyKey) {
    const { error: idempError } = await supabaseAdmin
      .from('idempotency_logs')
      .insert([{
        idempotency_key: idempotencyKey,
        action_type: 'ajuste_stock'
      }]);
    
    // Si la llave ya existe (violación única), abortar silenciosamente
    if (idempError && idempError.code === '23505') {
      console.log(`[Idempotency] Duplicado interceptado para llave: ${idempotencyKey}`);
      return { success: false, error: 'La acción de ajuste ya fue procesada anteriormente.' };
    }
  }

  // 2. Ejecutar el RPC Atómico en Supabase (service_role omite RLS)
  const { data, error } = await supabaseAdmin.rpc('ajustar_stock_equipo', {
    p_equipo_id: parseInt(equipoId, 10),
    p_delta: delta
  });

  if (error) {
    console.error('Error Supabase ajustarStock RPC:', error);
    if (error.message && error.message.includes('Stock insuficiente')) {
      return { success: false, error: 'Stock insuficiente para realizar este ajuste.' };
    }
    return { success: false, error: `Error al ajustar stock en BD: ${error.message || JSON.stringify(error)}` };
  }

  revalidatePath('/bodega');
  return { success: true, data };
}

