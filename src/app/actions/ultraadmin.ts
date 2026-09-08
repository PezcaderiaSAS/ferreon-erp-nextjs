'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';

export interface EmpresaDirectorioItem {
  id: string;
  nombre: string;
  nit: string | null;
  slug: string;
  subscription_status: string;
  plan_id: string;
  trial_ends_at: string;
  created_at: string;
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}

export interface UsuarioTenantItem {
  id: string;
  membershipId: number;
  email: string;
  nombre: string;
  rol: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  avatarUrl: string;
  ultimoAcceso: string | null;
  creadoEn: string;
}

/**
 * Validador interno de autorización UltraAdmin
 */
async function verificarPermisoUltraAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { autorizado: false, user: null, error: 'No autenticado.' };
  }

  const userRol = user.user_metadata?.rol;
  if (userRol === 'ULTRAADMIN' || userRol === 'SUPERADMIN') {
    return { autorizado: true, user, error: null };
  }

  // Verificación secundaria en base de datos
  const { data: memberships } = await supabase
    .from('empresa_usuarios')
    .select('rol')
    .eq('user_id', user.id)
    .in('rol', ['ULTRAADMIN', 'SUPERADMIN'])
    .eq('estado', 'ACTIVO')
    .is('deleted_at', null)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return { autorizado: true, user, error: null };
  }

  return {
    autorizado: false,
    user,
    error: 'Acceso denegado: Se requieren privilegios de Ultra Administrador de Plataforma.',
  };
}

/**
 * 1. Obtiene el listado completo de empresas/tenants con estadísticas de usuarios activos/inactivos
 */
export async function obtenerDirectorioEmpresasAction(): Promise<{
  success: boolean;
  empresas?: EmpresaDirectorioItem[];
  error?: string;
}> {
  try {
    const authCheck = await verificarPermisoUltraAdmin();
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error || 'No autorizado' };
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // Consultar todas las empresas registradas
    const { data: empresas, error: empError } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, nit, slug, subscription_status, plan_id, trial_ends_at, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (empError) {
      console.error('[UltraAdmin] Error consultando empresas:', empError);
      return { success: false, error: 'Error al consultar empresas en la plataforma.' };
    }

    // Consultar todas las membresías para calcular métricas por empresa
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('empresa_usuarios')
      .select('empresa_id, estado')
      .is('deleted_at', null);

    if (memError) {
      console.error('[UltraAdmin] Error consultando membresías:', memError);
    }

    const statsMap = new Map<string, { total: number; activos: number; inactivos: number }>();
    (memberships || []).forEach((m) => {
      const current = statsMap.get(m.empresa_id) || { total: 0, activos: 0, inactivos: 0 };
      current.total += 1;
      if (m.estado === 'ACTIVO') {
        current.activos += 1;
      } else {
        current.inactivos += 1;
      }
      statsMap.set(m.empresa_id, current);
    });

    const directorio: EmpresaDirectorioItem[] = (empresas || []).map((e) => {
      const stats = statsMap.get(e.id) || { total: 0, activos: 0, inactivos: 0 };
      return {
        id: e.id,
        nombre: e.nombre,
        nit: e.nit,
        slug: e.slug,
        subscription_status: e.subscription_status,
        plan_id: e.plan_id,
        trial_ends_at: e.trial_ends_at,
        created_at: e.created_at,
        totalUsuarios: stats.total,
        usuariosActivos: stats.activos,
        usuariosInactivos: stats.inactivos,
      };
    });

    return { success: true, empresas: directorio };
  } catch (err: any) {
    console.error('[UltraAdmin obtenerDirectorioEmpresasAction Error]', err);
    return { success: false, error: err.message || 'Error inesperado del servidor.' };
  }
}

/**
 * 2. Obtiene todos los usuarios asociados a una empresa específica con sus estados
 */
export async function obtenerUsuariosPorEmpresaAction(empresaId: string): Promise<{
  success: boolean;
  usuarios?: UsuarioTenantItem[];
  error?: string;
}> {
  try {
    const authCheck = await verificarPermisoUltraAdmin();
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error || 'No autorizado' };
    }

    if (!empresaId) {
      return { success: false, error: 'ID de empresa requerido' };
    }

    const supabaseAdmin = createAdminSupabaseClient();

    // 1. Obtener membresías de la empresa
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('empresa_usuarios')
      .select('id, user_id, rol, estado, created_at')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (memError) {
      return { success: false, error: memError.message };
    }

    // 2. Obtener usuarios desde auth.users
    const { data: listData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) {
      return { success: false, error: usersError.message };
    }

    const userMap = new Map<string, any>();
    (listData?.users || []).forEach((u: any) => userMap.set(u.id, u));

    const usuarios: UsuarioTenantItem[] = (memberships || []).map((m) => {
      const authUser = userMap.get(m.user_id);
      const metadata = authUser?.user_metadata || {};

      return {
        id: m.user_id,
        membershipId: m.id,
        email: authUser?.email || 'Sin correo',
        nombre: metadata.nombre || metadata.full_name || authUser?.email?.split('@')[0] || 'Usuario',
        rol: m.rol,
        estado: (m.estado || 'ACTIVO') as any,
        avatarUrl: metadata.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?.email}`,
        ultimoAcceso: authUser?.last_sign_in_at || null,
        creadoEn: m.created_at,
      };
    });

    return { success: true, usuarios };
  } catch (err: any) {
    console.error('[UltraAdmin obtenerUsuariosPorEmpresaAction Error]', err);
    return { success: false, error: err.message || 'Error al obtener usuarios' };
  }
}

const CambiarEstadoUsuarioSchema = z.object({
  membershipId: z.number().int().positive(),
  empresaId: z.string().min(1),
  nuevoEstado: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']),
});

/**
 * 3. Cambia el estado de un usuario dentro de un tenant (Activar, Suspender, Bloquear)
 */
export async function cambiarEstadoUsuarioAction(input: {
  membershipId: number;
  empresaId: string;
  nuevoEstado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
}) {
  const validation = validateActionInput(input, CambiarEstadoUsuarioSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de cambio de estado inválidos' };
  }
  const cleanInput = validation.data;

  const authCheck = await verificarPermisoUltraAdmin();
  if (!authCheck.autorizado) {
    return { success: false, error: authCheck.error || 'No autorizado' };
  }

  const supabaseAdmin = createAdminSupabaseClient();

  const { error } = await supabaseAdmin
    .from('empresa_usuarios')
    .update({
      estado: cleanInput.nuevoEstado,
    })
    .eq('id', cleanInput.membershipId);

  if (error) {
    return { success: false, error: `Error al actualizar estado: ${error.message}` };
  }

  AuditLogger.logAsync({
    modulo: 'TENANTS',
    accion: 'CAMBIO_ESTADO_USUARIO',
    descripcion: `UltraAdmin actualizó el estado de la membresía ${cleanInput.membershipId} a '${cleanInput.nuevoEstado}' en la empresa ${cleanInput.empresaId}`,
    entidadId: cleanInput.membershipId,
    detalles: {
      membershipId: cleanInput.membershipId,
      empresaId: cleanInput.empresaId,
      nuevoEstado: cleanInput.nuevoEstado,
    },
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/admin/empresas');
  return { success: true };
}

const CambiarEstadoSuscripcionSchema = z.object({
  empresaId: z.string().min(1),
  nuevoStatus: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid']),
});

/**
 * 4. Actualiza el estado de la suscripción de una empresa desde el panel UltraAdmin
 */
export async function cambiarEstadoSuscripcionEmpresaAction(input: {
  empresaId: string;
  nuevoStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
}) {
  const validation = validateActionInput(input, CambiarEstadoSuscripcionSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de suscripción inválidos' };
  }
  const cleanInput = validation.data;

  const authCheck = await verificarPermisoUltraAdmin();
  if (!authCheck.autorizado) {
    return { success: false, error: authCheck.error || 'No autorizado' };
  }

  const supabaseAdmin = createAdminSupabaseClient();

  const { error } = await supabaseAdmin
    .from('empresas')
    .update({
      subscription_status: cleanInput.nuevoStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanInput.empresaId);

  if (error) {
    return { success: false, error: `Error al actualizar suscripción: ${error.message}` };
  }

  AuditLogger.logAsync({
    modulo: 'TENANTS',
    accion: 'EDITAR_EMPRESA',
    descripcion: `UltraAdmin modificó el estado de suscripción de la empresa ID ${cleanInput.empresaId} a '${cleanInput.nuevoStatus}'`,
    entidadId: cleanInput.empresaId,
    detalles: cleanInput,
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/admin/empresas');
  return { success: true };
}
