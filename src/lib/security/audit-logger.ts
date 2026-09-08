import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';
import { AuditActionType, AuditModuloType } from '@/core/domain/entities/audit-log';
import { RoleType } from '@/core/domain/entities/usuario';

export interface AuditLogParams {
  modulo: AuditModuloType;
  accion: AuditActionType;
  descripcion: string;
  entidadId?: string | number;
  detalles?: Record<string, any>;
  empresaId?: string;
  userId?: string;
  userEmail?: string;
  userNombre?: string;
  userRol?: RoleType | string;
  ipAddress?: string;
}

export class AuditLogger {
  /**
   * Registra un evento de auditoría de manera persistente en PostgreSQL (Supabase).
   * Patrón de diseño: Resiliente y no bloqueante para evitar que fallos de red
   * interrumpan operaciones de negocio transaccionales.
   */
  static async log(params: AuditLogParams): Promise<void> {
    try {
      let resolvedUserId = params.userId;
      let resolvedEmail = params.userEmail;
      let resolvedNombre = params.userNombre;
      let resolvedRol = params.userRol;
      let resolvedEmpresaId = params.empresaId;

      // 1. Si faltan datos del usuario o tenant, resolverlos desde la sesión activa
      if (!resolvedUserId || !resolvedEmpresaId) {
        try {
          const supabase = await createServerSupabaseClient();
          const { data: { user } } = await supabase.auth.getUser();

          if (user) {
            resolvedUserId = resolvedUserId || user.id;
            resolvedEmail = resolvedEmail || user.email || 'sin-correo@ferreon.com';
            resolvedNombre =
              resolvedNombre ||
              user.user_metadata?.nombre ||
              user.user_metadata?.full_name ||
              user.email?.split('@')[0] ||
              'Usuario';
            resolvedRol = resolvedRol || user.user_metadata?.rol || 'OPERADOR_BODEGA';

            if (!resolvedEmpresaId) {
              const { data: membership } = await supabase
                .from('empresa_usuarios')
                .select('empresa_id')
                .eq('user_id', user.id)
                .eq('es_empresa_activa', true)
                .maybeSingle();

              if (membership?.empresa_id) {
                resolvedEmpresaId = membership.empresa_id;
              }
            }
          }
        } catch (authResolveErr) {
          console.warn('[AuditLogger] Advertencia al resolver sesión activa:', authResolveErr);
        }
      }

      // 2. Inserción con cliente administrativo para garantizar escritura sin bloqueos RLS accidentales
      const supabaseAdmin = createAdminSupabaseClient();
      const insertPayload = {
        empresa_id: resolvedEmpresaId || null,
        usuario_id: resolvedUserId || null,
        usuario_nombre: resolvedNombre || 'Sistema',
        usuario_email: resolvedEmail || 'sistema@ferreon.com',
        usuario_rol: String(resolvedRol || 'SISTEMA'),
        modulo: params.modulo,
        accion: params.accion,
        entidad_id: params.entidadId ? String(params.entidadId) : null,
        descripcion: params.descripcion,
        detalles: params.detalles || {},
        ip_address: params.ipAddress || '127.0.0.1',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin.from('audit_logs').insert([insertPayload]);
      if (error) {
        console.error('❌ [AuditLogger] Error al insertar en audit_logs:', error);
      }
    } catch (unexpectedError) {
      console.error('⚠️ [AuditLogger] Excepción inesperada durante el registro de auditoría:', unexpectedError);
    }
  }

  /**
   * Ejecuta el registro en segundo plano sin esperar el ciclo de respuesta HTTP (Zero-Latency).
   */
  static logAsync(params: AuditLogParams): void {
    Promise.resolve().then(() => {
      AuditLogger.log(params).catch((err) => {
        console.error('[AuditLogger logAsync Error]', err);
      });
    });
  }
}
