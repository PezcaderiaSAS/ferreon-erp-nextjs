import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. FAST-PATH: Excluir de inmediato rutas internas, API, Auth y archivos estáticos sin llamadas de red
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth') ||
    pathname === '/unauthorized' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay credenciales de Supabase configuradas, permitir navegación segura
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 2. Verificación de sesión con Timeout Guard (máximo 1200ms para prevenir 504 MIDDLEWARE_INVOCATION_TIMEOUT)
  let user = null;
  try {
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 1200)
    );
    
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
    user = data.user;
  } catch (error) {
    console.warn('[Middleware] Supabase auth check warning:', error);
  }

  // 3. Redirección condicional a login
  if (!user) {
    // Verificar si existe cookie de sesión de Supabase para evitar falsos positivos por latencia
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('-auth-token'));
    if (!hasAuthCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Si tiene cookie pero hubo timeout de red, permitir que los Server Components resuelvan la sesión
    return response;
  }

  // 4. Control de acceso por roles (RBAC)
  const userRole = user.user_metadata?.rol;
  if (pathname.startsWith('/configuracion')) {
    if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      return NextResponse.rewrite(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Intercepta rutas de la aplicación excepto archivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
