import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '../../../../infrastructure/persistence/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      
      try {
        // Auto-Onboarding: Verificar si el usuario ya pertenece a una empresa/tenant
        const { data: membership } = await supabase
          .from('empresa_usuarios')
          .select('empresa_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          // Usuario nuevo: Aprovisionar Tenant automáticamente con 14 días de prueba
          const adminSupabase = createAdminSupabaseClient();
          const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
          const empresaNombre = fullName ? `Empresa de ${fullName}` : (user.email ? `Empresa ${user.email.split('@')[0]}` : 'Mi Empresa ERP');
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const slug = `empresa-${randomSuffix}`;
          const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

          const { data: nuevaEmpresa, error: empresaErr } = await adminSupabase
            .from('empresas')
            .insert({
              nombre: empresaNombre,
              slug: slug,
              subscription_status: 'trialing',
              trial_ends_at: trialEndsAt,
              plan_id: 'plan_monthly_flat',
              email_contacto: user.email || null,
            })
            .select('id')
            .single();

          if (!empresaErr && nuevaEmpresa) {
            await adminSupabase
              .from('empresa_usuarios')
              .insert({
                empresa_id: nuevaEmpresa.id,
                user_id: user.id,
                rol: 'ADMIN',
              });

            console.log(`🚀 [Auto-Onboarding] Nuevo Tenant '${empresaNombre}' creado con 14 días de prueba para ${user.email}`);
          } else {
            console.error('[Auto-Onboarding Error]', empresaErr);
          }
        }
      } catch (onboardingErr) {
        console.error('[Auto-Onboarding Catch Error]', onboardingErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Error exchanging code for session:', error?.message);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Ocurrió un error de autenticación con el proveedor`);
}
