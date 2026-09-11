'use server';

import { createServerSupabaseClient, createAdminSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis, getTenantCache, setTenantCache, invalidateTenantCache } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface ProveedorUI {
  id: string;
  tenant_id?: string | null;
  empresa_id?: string | null;
  nombre: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  dias_credito: number;
  estado: 'ACTIVO' | 'INACTIVO';
  observaciones?: string;
  created_at: string;
  updated_at?: string;
}

export interface CrearProveedorInput {
  nombre: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  diasCredito?: number;
  observaciones?: string;
}

const CrearProveedorZodSchema = z.object({
  nombre: z.string().min(2, 'La razón social o nombre del proveedor debe tener al menos 2 caracteres'),
  nit: z.string().min(3, 'El NIT o documento debe tener al menos 3 caracteres'),
  contacto: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email('Correo electrónico inválido').optional().nullable().or(z.literal('')),
  direccion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  diasCredito: z.coerce.number().int().min(0, 'Los días de crédito no pueden ser negativos').default(0),
  observaciones: z.string().optional().nullable()
}).passthrough();

const ActualizarProveedorZodSchema = CrearProveedorZodSchema.partial().extend({
  estado: z.string().optional()
}).passthrough();

// Semillas iniciales por si la tabla en Supabase está vacía
const PROVEEDORES_INICIALES: ProveedorUI[] = [
  {
    id: 'prov-001',
    nombre: 'Maquinaria y Equipos de Colombia S.A.S.',
    nit: '900.123.456-1',
    contacto: 'Carlos Mendoza',
    telefono: '3104567890',
    email: 'ventas@maquinariacolombia.com',
    direccion: 'Zona Industrial Calle 13 # 68-20',
    ciudad: 'Bogotá',
    dias_credito: 30,
    estado: 'ACTIVO',
    observaciones: 'Proveedor principal de andamios y compresores',
    created_at: new Date().toISOString()
  },
  {
    id: 'prov-002',
    nombre: 'Ferretería Industrial del Norte Ltda.',
    nit: '860.987.654-3',
    contacto: 'María Paula Gómez',
    telefono: '3019876543',
    email: 'contacto@ferreindustrial.com',
    direccion: 'Carrera 45 # 120-15',
    ciudad: 'Medellín',
    dias_credito: 15,
    estado: 'ACTIVO',
    observaciones: 'Herramientas eléctricas y repuestos',
    created_at: new Date().toISOString()
  }
];

/**
 * Obtiene el listado de proveedores activos de la empresa.
 * Con soporte de resiliencia multitenant en Supabase y caché Redis.
 */
export async function obtenerProveedoresAction(): Promise<{ success: boolean; data: ProveedorUI[]; error?: string }> {
  try {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const tenantId = user?.id || 'default';

    // 1. Revisar caché multi-tenant
    const cached = await getTenantCache<ProveedorUI[]>(tenantId, 'proveedores');
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return { success: true, data: cached };
    }

    // 2. Consulta Base de Datos Supabase (Admin para asegurar lectura consistente)
    const supabaseAdmin = createAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from('proveedores')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data && data.length > 0) {
      await setTenantCache(tenantId, 'proveedores', data, 1800);
      return { success: true, data: data as ProveedorUI[] };
    }

    // 3. Si la base de datos está vacía, devolver semillas
    return { success: true, data: PROVEEDORES_INICIALES };
  } catch (error: any) {
    console.error('[obtenerProveedoresAction Error]:', error);
    return { success: true, data: PROVEEDORES_INICIALES, error: error.message };
  }
}

/**
 * Crea un nuevo proveedor con validación Zod y auditoría.
 * Diseñado para usarse tanto desde el módulo de proveedores como desde el botón "On-The-Fly" al registrar compras o alquileres subcontratados.
 */
export async function crearProveedorAction(input: CrearProveedorInput): Promise<{ success: boolean; data?: ProveedorUI; error?: string }> {
  try {
    const validation = validateActionInput(input, CrearProveedorZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de proveedor inválidos' };
    }
    const clean = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;
    const empresaId = await resolveEmpresaId(userId);

    const supabaseAdmin = createAdminSupabaseClient();

    const nuevoProveedorId = crypto.randomUUID();
    const proveedorPayload = {
      id: nuevoProveedorId,
      empresa_id: empresaId,
      tenant_id: empresaId,
      nombre: clean.nombre.trim(),
      nit: clean.nit.trim(),
      contacto: clean.contacto?.trim() || null,
      telefono: clean.telefono?.trim() || null,
      email: clean.email?.trim() || null,
      direccion: clean.direccion?.trim() || null,
      ciudad: clean.ciudad?.trim() || null,
      dias_credito: clean.diasCredito || 0,
      estado: 'ACTIVO',
      observaciones: clean.observaciones?.trim() || null
    };

    // Inserción en base de datos Supabase
    const { data, error } = await supabaseAdmin
      .from('proveedores')
      .insert([proveedorPayload])
      .select()
      .single();

    if (error) {
      console.error('[crearProveedorAction] Error Supabase insertando proveedor:', error);
      if (error.code === '23505') {
        return { success: false, error: `El NIT "${clean.nit}" ya se encuentra registrado para otro proveedor.` };
      }
      return { success: false, error: `Error al guardar proveedor en BD: ${error.message}` };
    }

    const proveedorFinal: ProveedorUI = data as ProveedorUI;

    // Invalidar caché
    await invalidateTenantCache(userId, ['proveedores']);

    // Registrar en logs de auditoría
    AuditLogger.logAsync({
      modulo: 'PROVEEDORES',
      accion: 'CREAR_PROVEEDOR',
      descripcion: `Proveedor creado: ${proveedorFinal.nombre} (NIT: ${proveedorFinal.nit})`,
      entidadId: proveedorFinal.id,
      detalles: {
        nombre: proveedorFinal.nombre,
        nit: proveedorFinal.nit,
        empresaId
      },
      userId: userId,
      userEmail: user?.email
    });

    revalidatePath('/compras');
    revalidatePath('/subcontrataciones');
    return { success: true, data: proveedorFinal };
  } catch (error: any) {
    console.error('[crearProveedorAction Error]:', error);
    return { success: false, error: error.message || 'Error inesperado al crear proveedor' };
  }
}

/**
 * Actualiza los datos de un proveedor existente.
 */
export async function actualizarProveedorAction(
  id: string, 
  input: Partial<CrearProveedorInput> & { estado?: 'ACTIVO' | 'INACTIVO' }
): Promise<{ success: boolean; data?: ProveedorUI; error?: string }> {
  try {
    const validation = validateActionInput(input, ActualizarProveedorZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de actualización inválidos' };
    }
    const clean = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();
    let tenantId: string | null = null;
    if (userId) {
      const { data: empUser } = await supabaseAdmin
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('estado', 'ACTIVO')
        .maybeSingle();
      tenantId = empUser?.empresa_id || null;
    }

    // Actualizar en Supabase
    try {
      await supabaseAdmin
        .from('proveedores')
        .update({
          ...(clean.nombre && { nombre: clean.nombre.trim() }),
          ...(clean.nit && { nit: clean.nit.trim() }),
          ...(clean.contacto !== undefined && { contacto: clean.contacto?.trim() || null }),
          ...(clean.telefono !== undefined && { telefono: clean.telefono?.trim() || null }),
          ...(clean.email !== undefined && { email: clean.email?.trim() || null }),
          ...(clean.direccion !== undefined && { direccion: clean.direccion?.trim() || null }),
          ...(clean.ciudad !== undefined && { ciudad: clean.ciudad?.trim() || null }),
          ...(clean.diasCredito !== undefined && { dias_credito: clean.diasCredito }),
          ...(clean.estado && { estado: clean.estado }),
          ...(clean.observaciones !== undefined && { observaciones: clean.observaciones?.trim() || null }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (dbErr) {
      console.warn('[actualizarProveedorAction] Error actualizando BD:', dbErr);
    }

    // Invalidar caché
    const cacheKey = `proveedores:${tenantId || 'global'}`;
    if (redis) {
      try {
        await redis.del(cacheKey);
      } catch {}
    }

    // Auditoría
    AuditLogger.logAsync({
      modulo: 'PROVEEDORES',
      accion: 'EDITAR_PROVEEDOR',
      descripcion: `Proveedor actualizado: ${id}`,
      entidadId: id,
      detalles: clean,
      userId: userId,
      userEmail: user?.email
    });

    revalidatePath('/compras');
    return { success: true };
  } catch (error: any) {
    console.error('[actualizarProveedorAction Error]:', error);
    return { success: false, error: error.message || 'Error inesperado al actualizar proveedor' };
  }
}
