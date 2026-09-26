'use server';

import { z } from 'zod';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';

const OnboardingSchema = z.object({
  nombreEmpresa: z.string().min(3, 'El nombre de la empresa debe tener al menos 3 caracteres').max(100),
  nit: z.string().min(3, 'El NIT o documento debe tener al menos 3 caracteres').max(30),
  telefono: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').max(25),
  ciudad: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(50),
  tamanoEmpresa: z.enum(['1-10', '11-50', '50+']).default('1-10'),
  aceptaTerminos: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los Términos de Servicio y la Política de Tratamiento de Datos Personales para continuar.',
  }),
});

export type OnboardingFormData = z.infer<typeof OnboardingSchema>;

/**
 * Server Action para completar el Onboarding de un usuario recién autenticado (ej: Google OAuth),
 * registrando los datos de su empresa, vinculándolo como ADMIN y aprovisionando datos demo de 14 días.
 */
export async function completeTenantOnboardingAction(formData: OnboardingFormData): Promise<{
  success: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Sesión no válida o expirada. Por favor inicia sesión nuevamente.' };
    }

    // 1. Validar campos con Zod
    const validation = OnboardingSchema.safeParse(formData);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.errors.map(e => e.message).join('. ') 
      };
    }

    const { nombreEmpresa, nit, telefono, ciudad, tamanoEmpresa } = validation.data;

    // 2. Verificar si el usuario ya tiene una empresa vinculada
    const { data: existingMembership } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .eq('es_empresa_activa', true)
      .maybeSingle();

    if (existingMembership) {
      return { success: true, redirectUrl: '/dashboard' };
    }

    const adminSupabase = createAdminSupabaseClient();

    // 3. Generar slug único limpio
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanName = nombreEmpresa
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${cleanName}-${randomSuffix}`;
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // 4. Crear el registro en public.empresas con 14 días de prueba gratuita
    const { data: nuevaEmpresa, error: empresaErr } = await adminSupabase
      .from('empresas')
      .insert({
        nombre: nombreEmpresa,
        nit: nit,
        slug: slug,
        telefono: telefono,
        ciudad: ciudad,
        tamano_empresa: tamanoEmpresa,
        autorizado: true,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt,
        plan_id: 'plan_monthly_flat',
      })
      .select('id')
      .single();

    if (empresaErr || !nuevaEmpresa) {
      console.error('[Onboarding Action] Error al crear empresa:', empresaErr);
      return { success: false, error: 'No se pudo crear la empresa en el sistema. Intenta de nuevo.' };
    }

    // 5. Vincular al usuario como ADMIN activo
    const { error: memberErr } = await adminSupabase
      .from('empresa_usuarios')
      .insert({
        empresa_id: nuevaEmpresa.id,
        user_id: user.id,
        rol: 'ADMIN',
        estado: 'ACTIVO',
        es_empresa_activa: true,
      });

    if (memberErr) {
      console.error('[Onboarding Action] Error al vincular usuario a empresa:', memberErr);
      return { success: false, error: 'Error al vincular el usuario a la empresa creada.' };
    }

    // 6. Aprovisionar Datos Demo (Clientes, Equipos, Alquiler y Caja)
    try {
      const { error: seedErr } = await adminSupabase.rpc('seed_dummy_tenant_data', {
        p_empresa_id: nuevaEmpresa.id,
        p_user_id: user.id,
      });

      if (seedErr) {
        console.warn('[Onboarding Action] Advertencia al generar datos demo (no bloqueante):', seedErr);
      }
    } catch (seedCatchErr) {
      console.warn('[Onboarding Action] Excepción al invocar seed_dummy_tenant_data:', seedCatchErr);
    }

    // 7. Actualizar metadata de auth para reflejar rol y empresa inmediatamente
    try {
      await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          empresa_id: nuevaEmpresa.id,
          empresa_nombre: nombreEmpresa,
          rol: 'ADMIN',
        },
      });
    } catch (metaErr) {
      console.warn('[Onboarding Action] Error actualizando user_metadata:', metaErr);
    }

    // 8. Registro de Responsabilidad Demostrada (Accountability) ante la SIC en audit_logs
    try {
      await adminSupabase.from('audit_logs').insert({
        empresa_id: nuevaEmpresa.id,
        usuario_id: user.id,
        usuario_email: user.email || null,
        usuario_nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
        usuario_rol: 'ADMIN',
        modulo: 'LEGAL',
        accion: 'CONSENTIMIENTO_TERMINOS_Y_DATOS',
        entidad_id: nuevaEmpresa.id,
        descripcion: 'Aceptación explícita de Términos de Servicio SaaS, Política de Privacidad (Ley 1581) y Certificación de Determinismo Operativo',
        detalles: {
          version_terminos: '1.0.0',
          version_privacidad: '1.0.0',
          fecha_consentimiento: new Date().toISOString(),
          politica_cero_ia_aceptada: true,
          cumplimiento_sic_colombia: true,
        },
      });
    } catch (auditErr) {
      console.warn('[Onboarding Action] Advertencia al registrar audit_log de consentimiento:', auditErr);
    }

    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/suscripcion', 'page');

    return {
      success: true,
      redirectUrl: '/dashboard',
    };
  } catch (err: any) {
    const errorId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    console.error(`[Onboarding Action Exception][${errorId}]:`, err);
    return {
      success: false,
      error: `Error al procesar el registro de la empresa. Por favor intenta nuevamente o contacta a soporte (Ref: ${errorId}).`,
    };
  }
}
