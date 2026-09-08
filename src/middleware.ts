import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from './lib/redis';
import { generateNonce, buildCspHeader, applyBaseSecurityHeaders } from './lib/security/csp';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';

  // 1. Rate Limiting Perimetral (Sliding Window en Upstash Redis)
  if (pathname.startsWith('/auth') || pathname.startsWith('/api')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const isAuthRoute = pathname.startsWith('/auth');
    const limit = isAuthRoute ? 15 : 120;
    const windowSecs = isAuthRoute ? 10 : 60;

    const rateLimit = await checkRateLimit(`${ip}:${isAuthRoute ? 'auth' : 'api'}`, limit, windowSecs);
    if (!rateLimit.success) {
      const rateLimitResponse = new NextResponse(
        JSON.stringify({
          error: 'Demasiadas solicitudes. Por favor espera unos segundos antes de reintentar.',
          retryAfter: rateLimit.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.reset),
          },
        }
      );
      applyBaseSecurityHeaders(rateLimitResponse.headers);
      return rateLimitResponse;
    }
  }

  // 2. Generación de Nonce Criptográfico para Content-Security-Policy (CSP)
  const nonce = generateNonce();
  const cspHeader = buildCspHeader(nonce, isDev);

  // Inyectar el nonce en los request headers para que los Server Components y RootLayout lo consuman
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 3. FAST-PATH: Excluir recursos internos de Next.js y archivos estáticos
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // 4. FAST-PATH PARA APIs: Respuesta con cabeceras de transporte seguro sin llamada a Supabase Auth en middleware
  if (pathname.startsWith('/api')) {
    const apiResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    applyBaseSecurityHeaders(apiResponse.headers);
    return apiResponse;
  }

  // 5. FAST-PATH PARA RUTAS PÚBLICAS / AUTH: Inyectar cabeceras perimetrales completas y CSP
  if (pathname.startsWith('/auth') || pathname === '/unauthorized' || pathname === '/suscripcion') {
    const publicResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    applyBaseSecurityHeaders(publicResponse.headers);
    publicResponse.headers.set('Content-Security-Policy', cspHeader);
    return publicResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay credenciales de Supabase configuradas, permitir navegación segura con headers
  if (!supabaseUrl || !supabaseAnonKey) {
    const fallbackResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    applyBaseSecurityHeaders(fallbackResponse.headers);
    fallbackResponse.headers.set('Content-Security-Policy', cspHeader);
    return fallbackResponse;
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
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
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // 6. Verificación de sesión con Timeout Guard (1200ms para prevenir 504 MIDDLEWARE_INVOCATION_TIMEOUT)
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

  // 7. Redirección condicional a login
  if (!user) {
    const hasAuthCookie = request.cookies.getAll().some(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    if (!hasAuthCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('redirectTo', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      applyBaseSecurityHeaders(redirectResponse.headers);
      return redirectResponse;
    }
    // Si tiene cookie pero hubo timeout de red, permitir que los Server Components resuelvan la sesión
    applyBaseSecurityHeaders(response.headers);
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  }

  // 8. Control de acceso por roles (RBAC & UltraAdmin)
  const userRole = user.user_metadata?.rol;

  // Protección del módulo global UltraAdmin
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ULTRAADMIN' && userRole !== 'SUPERADMIN') {
      const unauthorizedResponse = NextResponse.rewrite(new URL('/unauthorized', request.url));
      applyBaseSecurityHeaders(unauthorizedResponse.headers);
      return unauthorizedResponse;
    }
  }

  // Protección de Configuración
  if (pathname.startsWith('/configuracion')) {
    if (userRole !== 'ULTRAADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      const unauthorizedResponse = NextResponse.rewrite(new URL('/unauthorized', request.url));
      applyBaseSecurityHeaders(unauthorizedResponse.headers);
      return unauthorizedResponse;
    }
  }

  // 9. Inyección Definitiva de Cabeceras Perimetrales y Content-Security-Policy
  applyBaseSecurityHeaders(response.headers);
  response.headers.set('Content-Security-Policy', cspHeader);

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
