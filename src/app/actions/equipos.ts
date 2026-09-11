'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface CrearEquipoInput {
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  valorReposicion: number;
  stockInicial: number;
  idempotency_key?: string;
}

const CrearEquipoZodSchema = z.object({
  sku: z.string().min(1, 'El código/SKU es obligatorio'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  tarifaDiaria: z.coerce.number().min(0, 'La tarifa diaria debe ser mayor o igual a cero'),
  valorReposicion: z.coerce.number().min(0, 'El valor de reposición debe ser mayor o igual a cero').default(0),
  stockInicial: z.coerce.number().int().min(0, 'El stock inicial debe ser mayor o igual a cero'),
  idempotency_key: z.string().optional().nullable(),
}).passthrough();

const EditarEquipoZodSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  tarifaDiaria: z.coerce.number().min(0, 'La tarifa diaria debe ser mayor o igual a cero'),
  valorReposicion: z.coerce.number().min(0, 'El valor de reposición debe ser mayor o igual a cero').optional().default(0),
  estado: z.string().optional().default('Activo'),
  idempotency_key: z.string().optional().nullable(),
}).passthrough();

export async function crearEquipoAction(input: CrearEquipoInput) {
  const validation = validateActionInput(input, CrearEquipoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de equipo inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  const { data, error } = await supabase
    .from('equipos')
    .insert([{
      codigo: cleanInput.sku.trim().toUpperCase(),
      nombre: cleanInput.nombre.trim(),
      categoria: cleanInput.categoria.trim(),
      tarifa_diaria: cleanInput.tarifaDiaria,
      valor_reposicion: cleanInput.valorReposicion,
      stock_total: cleanInput.stockInicial,
      stock_disponible: cleanInput.stockInicial,
      stock_en_obra: 0,
      stock_mantenimiento: 0,
      estado: 'Activo'
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: `Error de restricción única: El código/SKU "${cleanInput.sku}" ya fue registrado (Código: ${error.code})` };
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

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'BODEGA',
    accion: 'CREAR_EQUIPO',
    descripcion: `Nuevo equipo registrado: ${cleanInput.nombre} (SKU: ${cleanInput.sku}, Stock inicial: ${cleanInput.stockInicial})`,
    entidadId: data?.id || cleanInput.sku,
    detalles: {
      sku: cleanInput.sku,
      nombre: cleanInput.nombre,
      categoria: cleanInput.categoria,
      tarifaDiaria: cleanInput.tarifaDiaria,
      stockInicial: cleanInput.stockInicial,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  revalidatePath('/bodega');
  return { success: true, data };
}

export interface EditarEquipoInput {
  id: string | number;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  valorReposicion: number;
  estado: 'Disponible' | 'En Alquiler' | 'Mantenimiento' | 'Activo' | 'Inactivo';
  idempotency_key?: string;
}

export async function editarEquipoAction(input: EditarEquipoInput) {
  const validation = validateActionInput(input, EditarEquipoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de equipo inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const numericId = typeof cleanInput.id === 'string' ? parseInt(cleanInput.id, 10) : cleanInput.id;

  const dbEstado = cleanInput.estado === 'Inactivo' ? 'Inactivo' : 'Activo';

  const { data, error } = await supabase
    .from('equipos')
    .update({
      nombre: cleanInput.nombre.trim(),
      categoria: cleanInput.categoria.trim(),
      tarifa_diaria: cleanInput.tarifaDiaria,
      valor_reposicion: cleanInput.valorReposicion,
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

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'BODEGA',
    accion: 'EDITAR_EQUIPO',
    descripcion: `Equipo modificado: ${cleanInput.nombre} (ID: ${numericId}, Estado: ${dbEstado})`,
    entidadId: numericId,
    detalles: {
      nombre: cleanInput.nombre,
      categoria: cleanInput.categoria,
      tarifaDiaria: cleanInput.tarifaDiaria,
      estado: dbEstado,
    },
  });

  revalidatePath('/bodega');
  return { success: true, data };
}

export async function ajustarStockEquipoAction(equipoId: string | number, delta: number, motivo: string = 'Ajuste Manual', tipoMovimiento: string = 'AJUSTE_AUDITORIA', idempotencyKey?: string) {
  if (delta === 0) {
    return { success: false, error: 'El ajuste de stock (delta) no puede ser cero.' };
  }
  if (!motivo || !motivo.trim()) {
    return { success: false, error: 'El motivo del ajuste es obligatorio para auditoría y trazabilidad en Kardex.' };
  }

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

  // 3. POKA-YOKE: Grabar en el Kardex (Trazabilidad Inmutable)
  try {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    // Tipo de movimiento ya viene explícito desde el frontend
    let tipo_mov = tipoMovimiento;

    // Para saber el stock resultante real que quedó (la RPC lo devolvió en `data` o consultamos)
    const { data: eqAct } = await supabaseAdmin.from('equipos').select('stock_disponible, tenant_id').eq('id', numericEquipoId).single();

    await supabaseAdmin.from('kardex_inventario').insert([{
      equipo_id: numericEquipoId,
      tenant_id: eqAct?.tenant_id,
      tipo_movimiento: tipo_mov,
      cantidad_delta: delta,
      stock_resultante: eqAct?.stock_disponible || 0,
      motivo: motivo,
      usuario_id: user?.id || 'SISTEMA'
    }]);
  } catch (kardexErr) {
    console.error('Error insertando en Kardex (pero el stock fue ajustado):', kardexErr);
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


