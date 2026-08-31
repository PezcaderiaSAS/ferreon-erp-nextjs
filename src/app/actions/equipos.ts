'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';

export interface CrearEquipoInput {
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  stockInicial: number;
  idempotency_key?: string;
}

export async function crearEquipoAction(input: CrearEquipoInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      codigo: input.sku.trim().toUpperCase(),
      nombre: input.nombre.trim(),
      categoria: input.categoria.trim(),
      tarifa_diaria: input.tarifaDiaria,
      stock_total: input.stockInicial,
      stock_disponible: input.stockInicial,
      stock_en_obra: 0,
      stock_mantenimiento: 0,
      estado: 'Activo'
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Error de restricción única: El código/SKU "${input.sku}" ya fue registrado (Código: ${error.code})` };
    }
    console.error('Error Supabase crearEquipoAction:', error);
    return { success: false, error: `Error al guardar equipo en BD: ${error.message}` };
  }

  if (redis) {
    try {
      await redis.del('cache:equipos');
    } catch (e) {
      console.warn('Error invalidando caché de equipos en Redis:', e);
    }
  }

  revalidatePath('/bodega');
  return { success: true, data };
}

export interface EditarEquipoInput {
  id: string | number;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  estado: 'Disponible' | 'En Alquiler' | 'Mantenimiento' | 'Activo' | 'Inactivo';
  idempotency_key?: string;
}

export async function editarEquipoAction(input: EditarEquipoInput) {
  const supabase = await createServerSupabaseClient();
  const numericId = typeof input.id === 'string' ? parseInt(input.id, 10) : input.id;

  const dbEstado = input.estado === 'Inactivo' ? 'Inactivo' : 'Activo';

  const { data, error } = await supabase
    .from('equipos')
    .update({
      nombre: input.nombre.trim(),
      categoria: input.categoria.trim(),
      tarifa_diaria: input.tarifaDiaria,
      estado: dbEstado,
      updated_at: new Date().toISOString()
    })
    .eq('id', numericId)
    .select()
    .single();

  if (error) {
    console.error('Error Supabase editarEquipoAction:', error);
    return { success: false, error: `Error al editar equipo en BD: ${error.message || JSON.stringify(error)}` };
  }

  if (redis) {
    try {
      await redis.del('cache:equipos');
    } catch (e) {
      console.warn('Error invalidando caché de equipos en Redis:', e);
    }
  }

  revalidatePath('/bodega');
  return { success: true, data };
}

export async function ajustarStockEquipoAction(equipoId: string | number, delta: number, idempotencyKey?: string) {
  const supabaseAdmin = createAdminSupabaseClient();
  const numericEquipoId = typeof equipoId === 'string' ? parseInt(equipoId, 10) : equipoId;

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

  // 2. Ejecutar el RPC Atómico en Supabase
  const { data, error } = await supabaseAdmin.rpc('ajustar_stock_equipo', {
    p_equipo_id: numericEquipoId,
    p_delta: delta
  });

  if (error) {
    console.error('Error Supabase ajustarStock RPC:', error);
    if (error.message && error.message.includes('Stock insuficiente')) {
      return { success: false, error: 'Stock insuficiente para realizar este ajuste.' };
    }
    return { success: false, error: `Error al ajustar stock en BD: ${error.message || JSON.stringify(error)}` };
  }

  if (redis) {
    try {
      await redis.del('cache:equipos');
    } catch (e) {
      console.warn('Error invalidando caché de equipos en Redis:', e);
    }
  }

  revalidatePath('/bodega');
  return { success: true, data };
}


