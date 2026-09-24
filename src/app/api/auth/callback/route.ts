import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '../../../../infrastructure/persistence/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;
      
        // Verificar si el usuario ya pertenece a una empresa/tenant
        const { data: membership } = await supabase
          .from('empresa_usuarios')
          .select('empresa_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!membership) {
          // Usuario nuevo sin empresa: redirigir al formulario de onboarding para capturar datos oficiales
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      } catch (onboardingErr) {
        console.error('[Auth Callback Check Error]', onboardingErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Error exchanging code for session:', error?.message);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=Ocurrió un error de autenticación con el proveedor`);
}
