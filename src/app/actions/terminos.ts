'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';

export const CURRENT_TERMS_VERSION = '1.0.0';

const AceptarTerminosSchema = z.object({
  empresaId: z.string().uuid('ID de empresa inválido'),
  version: z.string().min(1).default(CURRENT_TERMS_VERSION),
});

export type AceptarTerminosInput = z.infer<typeof AceptarTerminosSchema>;

/**
 * Server Action para registrar la re-aceptación de Términos y Condiciones
 * por parte de usuarios existentes de forma inmutable en audit_logs.
 */
export async function registrarAceptacionTerminosAction(rawInput: { empresaId: string }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { 
        success: false, 
        error: 'Sesión no válida o expirada. Por favor recarga e inicia sesión nuevamente.' 
      };
    }

    const validation = AceptarTerminosSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map(e => e.message).join('. ')
      };
    }

    const { empresaId, version } = validation.data;
    const adminSupabase = createAdminSupabaseClient();
    const requestHeaders = await headers();
    const ipOrigen = requestHeaders.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = requestHeaders.get('user-agent') || 'N/A';

    // 1. Registro inmutable en audit_logs para Accountability ante la SIC
    const { error: auditError } = await adminSupabase.from('audit_logs').insert({
      empresa_id: empresaId,
      usuario_id: user.id,
      usuario_email: user.email || null,
      usuario_nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
      usuario_rol: user.user_metadata?.rol || 'USER',
      modulo: 'LEGAL',
      accion: 'CONSENTIMIENTO_TERMINOS_ACTUALIZADOS',
      entidad_id: empresaId,
      descripcion: `Aceptación formal de Términos de Servicio y Privacidad versión ${version} (Blindaje David Cossio Shield)`,
      detalles: {
        version_terminos: version,
        version_privacidad: version,
        fecha_utc: new Date().toISOString(),
        ip_origen: ipOrigen,
        user_agent: userAgent,
        metodo: 'MODAL_INTERSTICIAL_DASHBOARD',
        supervision_humana_aceptada: true,
        limite_responsabilidad_aceptado: true,
      },
    });

    if (auditError) {
      console.warn('[registrarAceptacionTerminosAction] Advertencia guardando audit_log:', auditError);
    }

    // 2. Actualizar user_metadata para recordar la versión aceptada en sesión
    try {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          terminos_aceptados: true,
          terminos_version: version,
          terminos_fecha_aceptacion: new Date().toISOString(),
        },
      });
    } catch (metaErr) {
      console.warn('[registrarAceptacionTerminosAction] Advertencia actualizando user_metadata:', metaErr);
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('[registrarAceptacionTerminosAction] Error en servidor:', error);
    return { 
      success: false, 
      error: 'Error interno al registrar la aceptación de términos. Intenta nuevamente.' 
    };
  }
}
