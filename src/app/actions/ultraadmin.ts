'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { AuditLogger } from '@/lib/security/audit-logger';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { redis, invalidateTenantCache } from '@/lib/redis';
import { 
  ModuloKey, 
  LicenciaEstado, 
  calcularDiasLicenciaRestantes, 
  obtenerModulosDefault,
  PermisosModuloCustom
} from '@/core/services/licencias-modulos.service';

export interface EmpresaDirectorioItem {
  id: string;
  nombre: string;
  nit: string | null;
  slug: string;
  subscription_status: string;
  plan_id: string;
  trial_ends_at: string;
  subscription_ends_at: string | null;
  dias_gracia: number;
  modulos_activos: Record<ModuloKey, boolean>;
  diasRestantes: number;
  estadoLicencia: LicenciaEstado;
  created_at: string;
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
}

export interface EmpresaSelectorItem {
  id: string;
  nombre: string;
  nit: string | null;
  slug: string;
  subscription_status: string;
  subscription_ends_at: string | null;
  dias_gracia: number;
  diasRestantes: number;
  estadoLicencia: LicenciaEstado;
  modulos_activos: Record<ModuloKey, boolean>;
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
  permisosCustom?: PermisosModuloCustom;
}

/**
 * Validador interno de autorización UltraAdmin
 */
export async function verificarPermisoUltraAdmin() {
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
 * 1. Obtiene el listado completo de empresas/tenants con estadísticas de usuarios y licencias
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

    // Consultar todas las empresas registradas incluyendo licencias y módulos
    const { data: empresas, error: empError } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, nit, slug, subscription_status, plan_id, trial_ends_at, subscription_ends_at, dias_gracia, modulos_activos, created_at')
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

    const ahora = new Date();
    const directorio: EmpresaDirectorioItem[] = (empresas || []).map((e) => {
      const stats = statsMap.get(e.id) || { total: 0, activos: 0, inactivos: 0 };
      const calculoLicencia = calcularDiasLicenciaRestantes(
        e.subscription_ends_at || e.trial_ends_at,
        ahora,
        e.dias_gracia ?? 5
      );

      return {
        id: e.id,
        nombre: e.nombre,
        nit: e.nit,
        slug: e.slug,
        subscription_status: e.subscription_status,
        plan_id: e.plan_id,
        trial_ends_at: e.trial_ends_at,
        subscription_ends_at: e.subscription_ends_at,
        dias_gracia: e.dias_gracia ?? 5,
        modulos_activos: e.modulos_activos || obtenerModulosDefault(),
        diasRestantes: calculoLicencia.diasRestantes,
        estadoLicencia: calculoLicencia.estado,
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
 * 2. Obtiene las empresas en formato ligero para el Selector Universal de UltraAdmin
 */
export async function obtenerEmpresasParaSelectorAction(): Promise<{
  success: boolean;
  empresas?: EmpresaSelectorItem[];
  error?: string;
}> {
  try {
    const authCheck = await verificarPermisoUltraAdmin();
    if (!authCheck.autorizado) {
      return { success: false, error: authCheck.error || 'No autorizado' };
    }

    const supabaseAdmin = createAdminSupabaseClient();
    const { data: empresas, error } = await supabaseAdmin
      .from('empresas')
      .select('id, nombre, nit, slug, subscription_status, subscription_ends_at, trial_ends_at, dias_gracia, modulos_activos')
      .is('deleted_at', null)
      .order('nombre', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    const ahora = new Date();
    const formatted: EmpresaSelectorItem[] = (empresas || []).map((e) => {
      const calculo = calcularDiasLicenciaRestantes(
        e.subscription_ends_at || e.trial_ends_at,
        ahora,
        e.dias_gracia ?? 5
      );

      return {
        id: e.id,
        nombre: e.nombre,
        nit: e.nit,
        slug: e.slug,
        subscription_status: e.subscription_status,
        subscription_ends_at: e.subscription_ends_at,
        dias_gracia: e.dias_gracia ?? 5,
        diasRestantes: calculo.diasRestantes,
        estadoLicencia: calculo.estado,
        modulos_activos: e.modulos_activos || obtenerModulosDefault(),
      };
    });

    return { success: true, empresas: formatted };
  } catch (err: any) {
    console.error('[UltraAdmin obtenerEmpresasParaSelectorAction Error]', err);
    return { success: false, error: err.message || 'Error al obtener selector de empresas' };
  }
}

/**
 * 3. Obtiene todos los usuarios asociados a una empresa específica con sus estados y permisos
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
      .select('id, user_id, rol, estado, permisos_custom, created_at')
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
        permisosCustom: m.permisos_custom,
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
 * 4. Cambia el estado de un usuario dentro de un tenant con invalidación inmediata de sesiones en Redis
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

  // Obtener user_id asociado antes de actualizar para invalidar sesión
  const { data: memberData } = await supabaseAdmin
    .from('empresa_usuarios')
    .select('user_id')
    .eq('id', cleanInput.membershipId)
    .single();

  const { error } = await supabaseAdmin
    .from('empresa_usuarios')
    .update({
      estado: cleanInput.nuevoEstado,
      ultimo_cambio_estado_por: authCheck.user?.id,
      fecha_ultimo_cambio_estado: new Date().toISOString(),
    })
    .eq('id', cleanInput.membershipId);

  if (error) {
    return { success: false, error: `Error al actualizar estado: ${error.message}` };
  }

  // Invalidación inmediata en Upstash Redis para que el bloqueo/suspensión sea instantáneo (<1s)
  if (redis && memberData?.user_id) {
    try {
      await redis.del(
        `session:user:${memberData.user_id}`,
        `user:${memberData.user_id}:permissions`
      );
    } catch (redisErr) {
      console.warn('[Redis Session Invalidate Warning]', redisErr);
    }
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
      targetUserId: memberData?.user_id,
    },
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/admin/empresas');
  revalidatePath('/configuracion');
  return { success: true };
}

const ModuloERPEnum = z.enum([
  'ALQUILERES',
  'COTIZACIONES',
  'BODEGA',
  'COMPRAS',
  'CXP',
  'CAJA',
  'DEVOLUCIONES',
  'SUBCONTRATACIONES',
  'FACTURACION',
]);

const ToggleModuloSchema = z.object({
  empresaId: z.string().min(1),
  modulo: ModuloERPEnum,
  activo: z.boolean(),
});

/**
 * 5. Activa o desactiva un módulo específico del ERP para un tenant
 */
export async function toggleModuloEmpresaAction(input: {
  empresaId: string;
  modulo: ModuloKey;
  activo: boolean;
}): Promise<{
  success: boolean;
  modulos_activos?: Record<ModuloKey, boolean>;
  error?: string;
}> {
  const validation = validateActionInput(input, ToggleModuloSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Parámetros de módulo inválidos' };
  }
  const cleanInput = validation.data;

  const authCheck = await verificarPermisoUltraAdmin();
  if (!authCheck.autorizado) {
    return { success: false, error: authCheck.error || 'No autorizado' };
  }

  const supabaseAdmin = createAdminSupabaseClient();

  // Obtener módulos actuales
  const { data: empresa, error: empError } = await supabaseAdmin
    .from('empresas')
    .select('modulos_activos')
    .eq('id', cleanInput.empresaId)
    .single();

  if (empError) {
    return { success: false, error: `Error al consultar empresa: ${empError.message}` };
  }

  const actuales = empresa?.modulos_activos || obtenerModulosDefault();
  const nuevosModulos: Record<ModuloKey, boolean> = {
    ...actuales,
    [cleanInput.modulo]: cleanInput.activo,
  };

  const { error: updateError } = await supabaseAdmin
    .from('empresas')
    .update({
      modulos_activos: nuevosModulos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cleanInput.empresaId);

  if (updateError) {
    return { success: false, error: `Error al actualizar módulos: ${updateError.message}` };
  }

  // Invalidación atómica en Upstash Redis
  await invalidateTenantCache(cleanInput.empresaId, ['empresa']);
  if (redis) {
    try {
      await redis.del(`cache:empresa:${cleanInput.empresaId}:modulos`);
    } catch (redisErr) {
      console.warn('[Redis Invalidate Error]', redisErr);
    }
  }

  AuditLogger.logAsync({
    modulo: 'TENANTS',
    accion: 'EDITAR_EMPRESA',
    descripcion: `UltraAdmin configuró módulo '${cleanInput.modulo}' en ${cleanInput.activo ? 'HABILITADO' : 'DESHABILITADO'} para empresa ${cleanInput.empresaId}`,
    entidadId: cleanInput.empresaId,
    detalles: {
      empresaId: cleanInput.empresaId,
      modulo: cleanInput.modulo,
      activo: cleanInput.activo,
    },
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/admin/empresas');
  revalidatePath('/');
  return { success: true, modulos_activos: nuevosModulos };
}

const ExtenderLicenciaSchema = z.object({
  empresaId: z.string().min(1),
  diasExtender: z.number().int().positive().optional(),
  nuevaFecha: z.string().optional(),
  motivo: z.string().optional(),
});

/**
 * 6. Extiende la vigencia de la licencia de un tenant (Días de cortesía o Fecha contractual)
 */
export async function extenderLicenciaEmpresaAction(input: {
  empresaId: string;
  diasExtender?: number;
  nuevaFecha?: string;
  motivo?: string;
}): Promise<{
  success: boolean;
  nuevaFechaExpiracion?: string;
  error?: string;
}> {
  const validation = validateActionInput(input, ExtenderLicenciaSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Parámetros de licencia inválidos' };
  }
  const cleanInput = validation.data;

  if (!cleanInput.diasExtender && !cleanInput.nuevaFecha) {
    return { success: false, error: 'Debe especificar días a extender o una fecha de expiración fija.' };
  }

  const authCheck = await verificarPermisoUltraAdmin();
  if (!authCheck.autorizado) {
    return { success: false, error: authCheck.error || 'No autorizado' };
  }

  const supabaseAdmin = createAdminSupabaseClient();

  // Obtener fecha de expiración actual
  const { data: empresa, error: empError } = await supabaseAdmin
    .from('empresas')
    .select('subscription_ends_at, trial_ends_at')
    .eq('id', cleanInput.empresaId)
    .single();

  if (empError) {
    return { success: false, error: `Error al consultar empresa: ${empError.message}` };
  }

  let finalDate: Date;
  const ahora = new Date();

  if (cleanInput.nuevaFecha) {
    finalDate = new Date(cleanInput.nuevaFecha);
  } else if (cleanInput.diasExtender) {
    const expActualStr = empresa?.subscription_ends_at || empresa?.trial_ends_at;
    const expActual = expActualStr ? new Date(expActualStr) : ahora;
    // Si la fecha actual ya expiró, extender a partir de hoy; si sigue vigente, sumar al vencimiento
    const baseDate = expActual.getTime() > ahora.getTime() ? expActual : ahora;
    finalDate = new Date(baseDate.getTime() + cleanInput.diasExtender * 86_400_000);
  } else {
    finalDate = new Date(ahora.getTime() + 30 * 86_400_000);
  }

  const isoFecha = finalDate.toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('empresas')
    .update({
      subscription_ends_at: isoFecha,
      subscription_status: 'active',
      updated_at: ahora.toISOString(),
    })
    .eq('id', cleanInput.empresaId);

  if (updateError) {
    return { success: false, error: `Error al actualizar licencia: ${updateError.message}` };
  }

  // Invalidación en Redis
  await invalidateTenantCache(cleanInput.empresaId, ['empresa']);

  AuditLogger.logAsync({
    modulo: 'TENANTS',
    accion: 'EDITAR_EMPRESA',
    descripcion: `UltraAdmin extendió la licencia de la empresa ${cleanInput.empresaId} hasta ${isoFecha}. Motivo: ${cleanInput.motivo || 'Extensión manual'}`,
    entidadId: cleanInput.empresaId,
    detalles: {
      empresaId: cleanInput.empresaId,
      nuevaFechaExpiracion: isoFecha,
      diasExtender: cleanInput.diasExtender,
      motivo: cleanInput.motivo,
    },
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/admin/empresas');
  return { success: true, nuevaFechaExpiracion: isoFecha };
}

const ActualizarPermisosUsuarioSchema = z.object({
  membershipId: z.number().int().positive(),
  empresaId: z.string().min(1),
  rol: z.string().optional(),
  permisosCustom: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
  userId: z.string().optional(),
});

/**
 * 7. Actualiza rol y/o permisos custom con invalidación reactiva de sesión
 */
export async function actualizarPermisosUsuarioAction(input: {
  membershipId: number;
  empresaId: string;
  rol?: string;
  permisosCustom?: PermisosModuloCustom;
  userId?: string;
}) {
  const validation = validateActionInput(input, ActualizarPermisosUsuarioSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Parámetros de permisos inválidos' };
  }
  const cleanInput = validation.data;

  const authCheck = await verificarPermisoUltraAdmin();
  if (!authCheck.autorizado) {
    return { success: false, error: authCheck.error || 'No autorizado' };
  }

  const supabaseAdmin = createAdminSupabaseClient();
  const updatePayload: Record<string, any> = {};

  if (cleanInput.rol) {
    updatePayload.rol = cleanInput.rol;
  }
  if (cleanInput.permisosCustom !== undefined) {
    updatePayload.permisos_custom = cleanInput.permisosCustom;
  }

  const { error } = await supabaseAdmin
    .from('empresa_usuarios')
    .update(updatePayload)
    .eq('id', cleanInput.membershipId);

  if (error) {
    return { success: false, error: `Error al actualizar permisos: ${error.message}` };
  }

  // Invalidación reactiva de permisos en Redis
  if (redis && cleanInput.userId) {
    try {
      await redis.del(
        `session:user:${cleanInput.userId}`,
        `user:${cleanInput.userId}:permissions`
      );
    } catch (redisErr) {
      console.warn('[Redis Invalidate User Permissions Warning]', redisErr);
    }
  }

  AuditLogger.logAsync({
    modulo: 'CONFIGURACION',
    accion: 'EDITAR_CONFIGURACION',
    descripcion: `UltraAdmin actualizó permisos/rol para membresía ${cleanInput.membershipId} en empresa ${cleanInput.empresaId}`,
    entidadId: cleanInput.membershipId,
    detalles: cleanInput,
    userId: authCheck.user?.id,
    userEmail: authCheck.user?.email,
  });

  revalidatePath('/configuracion');
  revalidatePath('/admin/empresas');
  return { success: true };
}

const CambiarEstadoSuscripcionSchema = z.object({
  empresaId: z.string().min(1),
  nuevoStatus: z.enum(['active', 'trialing', 'past_due', 'canceled', 'unpaid']),
});

/**
 * 8. Actualiza el estado de la suscripción de una empresa desde el panel UltraAdmin
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
