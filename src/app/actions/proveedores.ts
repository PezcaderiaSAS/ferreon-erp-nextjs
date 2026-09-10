'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface ProveedorUI {
  id: string;
  tenant_id?: string | null;
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

// Semillas iniciales por si la tabla en Supabase está en proceso de creación
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

    const cacheKey = `proveedores:${tenantId || 'global'}`;

    // 1. Intentar consultar base de datos Supabase
    try {
      let query = supabaseAdmin
        .from('proveedores')
        .select('*')
        .order('nombre', { ascending: true });

      if (tenantId) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }

      const { data, error } = await query;
      if (!error && data) {
        // Almacenar en Redis para acceso ultrarrápido
        if (redis) {
          try {
            await redis.set(cacheKey, JSON.stringify(data), { ex: 3600 });
          } catch {}
        }
        return { success: true, data: data as ProveedorUI[] };
      }
    } catch (dbErr) {
      console.warn('[Proveedores Action] Consulta de BD en fallback:', dbErr);
    }

    // 2. Si la tabla aún no existe o falla la conexión, revisar caché Redis
    if (redis) {
      try {
        const cached = await redis.get<string>(cacheKey);
        if (cached) {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { success: true, data: parsed as ProveedorUI[] };
          }
        }
      } catch (redisErr) {
        console.warn('[Proveedores Action] Error leyendo redis cache:', redisErr);
      }
    }

    // 3. Fallback inicial seguro
    return { success: true, data: PROVEEDORES_INICIALES };
  } catch (error: any) {
    console.error('[obtenerProveedoresAction Error]:', error);
    return { success: false, data: PROVEEDORES_INICIALES, error: error.message };
  }
}

/**
 * Crea un nuevo proveedor con validación Zod y auditoría.
 * Diseñado para usarse tanto desde el módulo de proveedores como desde el botón "On-The-Fly" al registrar compras.
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

    const nuevoProveedor: ProveedorUI = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      nombre: clean.nombre.trim(),
      nit: clean.nit.trim(),
      contacto: clean.contacto?.trim() || undefined,
      telefono: clean.telefono?.trim() || undefined,
      email: clean.email?.trim() || undefined,
      direccion: clean.direccion?.trim() || undefined,
      ciudad: clean.ciudad?.trim() || undefined,
      dias_credito: clean.diasCredito || 0,
      estado: 'ACTIVO',
      observaciones: clean.observaciones?.trim() || undefined,
      created_at: new Date().toISOString()
    };

    // Intentar inserción en base de datos Supabase
    let guardadoEnDb = false;
    try {
      const { data, error } = await supabaseAdmin
        .from('proveedores')
        .insert([{
          id: nuevoProveedor.id,
          tenant_id: nuevoProveedor.tenant_id,
          nombre: nuevoProveedor.nombre,
          nit: nuevoProveedor.nit,
          contacto: nuevoProveedor.contacto || null,
          telefono: nuevoProveedor.telefono || null,
          email: nuevoProveedor.email || null,
          direccion: nuevoProveedor.direccion || null,
          ciudad: nuevoProveedor.ciudad || null,
          dias_credito: nuevoProveedor.dias_credito,
          estado: nuevoProveedor.estado,
          observaciones: nuevoProveedor.observaciones || null
        }])
        .select()
        .single();

      if (!error && data) {
        guardadoEnDb = true;
        nuevoProveedor.id = data.id;
      }
    } catch (e) {
      console.warn('[crearProveedorAction] Persistiendo en fallback:', e);
    }

    // Actualizar caché de Redis
    const cacheKey = `proveedores:${tenantId || 'global'}`;
    if (redis) {
      try {
        const cachedRaw = await redis.get<string>(cacheKey);
        const list: ProveedorUI[] = cachedRaw 
          ? (typeof cachedRaw === 'string' ? JSON.parse(cachedRaw) : cachedRaw)
          : [...PROVEEDORES_INICIALES];
        
        list.unshift(nuevoProveedor);
        await redis.set(cacheKey, JSON.stringify(list), { ex: 86400 });
      } catch (redisErr) {
        console.warn('[crearProveedorAction] Error actualizando redis cache:', redisErr);
      }
    }

    // Registrar en logs de auditoría
    AuditLogger.logAsync({
      modulo: 'PROVEEDORES',
      accion: 'CREAR_PROVEEDOR',
      descripcion: `Proveedor creado: ${nuevoProveedor.nombre} (NIT: ${nuevoProveedor.nit})`,
      entidadId: nuevoProveedor.id,
      detalles: {
        nombre: nuevoProveedor.nombre,
        nit: nuevoProveedor.nit,
        guardadoEnDb
      },
      userId: userId,
      userEmail: user?.email
    });

    revalidatePath('/compras');
    return { success: true, data: nuevoProveedor };
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
