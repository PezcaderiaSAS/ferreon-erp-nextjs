import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit } from './lib/redis';
import { generateNonce, buildCspHeader, applyBaseSecurityHeaders } from './lib/security/csp';
import {
  normalizeHost,
  shouldApplyNoIndex,
  resolveCanonicalRedirectUrl,
} from './config/env';

const PRIVATE_NOINDEX_PREFIXES = [
  '/api',
  '/auth',
  '/admin',
  '/alquileres',
  '/bodega',
  '/caja',
  '/clientes',
  '/compras',
  '/configuracion',
  '/cotizaciones',
  '/dashboard',
  '/devoluciones',
  '/facturacion',
  '/logistica',
  '/onboarding',
  '/subcontrataciones',
  '/unauthorized',
  '/design-system',
  '/neumorphism-demo',
  '/dmca',
  '/unsubscribe',
];

function isPrivateNoIndexPath(pathname: string): boolean {
  return PRIVATE_NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function finalizeResponse(
  res: NextResponse,
  requestHost: string,
  pathname: string
): NextResponse {
  applyBaseSecurityHeaders(res.headers);
  if (shouldApplyNoIndex(requestHost, process.env) || isPrivateNoIndexPath(pathname)) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV === 'development';
  const requestHost = normalizeHost(
    request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.hostname
  );

  // 0. Redirección 301 condicional hacia el dominio canónico (solo Producción y sin bucles)
  const canonicalRedirectUrl = resolveCanonicalRedirectUrl(
    request.nextUrl,
    requestHost,
    process.env
  );
  if (canonicalRedirectUrl) {
    const redirectResponse = NextResponse.redirect(canonicalRedirectUrl, { status: 301 });
    applyBaseSecurityHeaders(redirectResponse.headers);
    redirectResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return redirectResponse;
  }

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
      return finalizeResponse(rateLimitResponse, requestHost, pathname);
    }
  }

  // 2. Generación de Nonce Criptográfico para Content-Security-Policy (CSP)
  const nonce = generateNonce();
  const cspHeader = buildCspHeader(nonce, isDev);

  // Inyectar el nonce en los request headers para que los Server Components y RootLayout lo consuman
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 3. FAST-PATH: Excluir recursos internos de Next.js y archivos estáticos (preservando headers en /robots.txt y archivos públicos)
  if (pathname.startsWith('/_next')) {
    const nextInternalResponse = NextResponse.next();
    if (shouldApplyNoIndex(requestHost, process.env)) {
      nextInternalResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return nextInternalResponse;
  }

  if (pathname.includes('.')) {
    const fileResponse = NextResponse.next();
    return finalizeResponse(fileResponse, requestHost, pathname);
  }

  // 4. FAST-PATH PARA APIs: Respuesta con cabeceras de transporte seguro sin llamada a Supabase Auth en middleware
  if (pathname.startsWith('/api')) {
    const apiResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return finalizeResponse(apiResponse, requestHost, pathname);
  }

  // 5. FAST-PATH PARA RUTAS PÚBLICAS / AUTH / LANDING / LEGAL: Inyectar cabeceras perimetrales completas y CSP
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname === '/unauthorized' ||
    pathname === '/suscripcion' ||
    pathname === '/privacidad' ||
    pathname === '/terminos' ||
    pathname === '/seguridad'
  ) {
    const publicResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    publicResponse.headers.set('Content-Security-Policy', cspHeader);
    return finalizeResponse(publicResponse, requestHost, pathname);
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
    fallbackResponse.headers.set('Content-Security-Policy', cspHeader);
    return finalizeResponse(fallbackResponse, requestHost, pathname);
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

  // 6. Verificación de sesión con Timeout Guard (2500ms para prevenir 504 MIDDLEWARE_INVOCATION_TIMEOUT con margen de latencia)
  let user = null;
  try {
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2500)
    );

    const { data } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
    user = data.user;
  } catch (error) {
    console.warn('[Middleware] Supabase auth check warning:', error);
  }

  // 7. Redirección condicional a login (Protección estricta perimetral)
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirectTo', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    return finalizeResponse(redirectResponse, requestHost, pathname);
  }

  // 8. Control de acceso por roles, Onboarding y Tenants
  const userRole = user.user_metadata?.rol;
  const isSuperOrUltra = userRole === 'ULTRAADMIN' || userRole === 'SUPERADMIN';
  const hasEmpresa = Boolean(user.user_metadata?.empresa_id);

  // Si está autenticado pero no tiene empresa vinculada y no es UltraAdmin:
  // Redirigir obligatoriamente a /onboarding para capturar datos oficiales de su negocio
  if (!isSuperOrUltra && !hasEmpresa) {
    if (pathname !== '/onboarding' && !pathname.startsWith('/auth') && pathname !== '/suscripcion') {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = '/onboarding';
      const redirectResponse = NextResponse.redirect(onboardingUrl);
      return finalizeResponse(redirectResponse, requestHost, pathname);
    }
  } else {
    // Si ya cuenta con empresa activa y visita /onboarding, redirigir al dashboard
    if (pathname === '/onboarding') {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/dashboard';
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      return finalizeResponse(redirectResponse, requestHost, pathname);
    }
  }

  // Protección del módulo global UltraAdmin
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ULTRAADMIN' && userRole !== 'SUPERADMIN') {
      const unauthorizedResponse = NextResponse.rewrite(new URL('/unauthorized', request.url));
      return finalizeResponse(unauthorizedResponse, requestHost, pathname);
    }
  }

  // Protección de Configuración
  if (pathname.startsWith('/configuracion')) {
    if (userRole !== 'ULTRAADMIN' && userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      const unauthorizedResponse = NextResponse.rewrite(new URL('/unauthorized', request.url));
      return finalizeResponse(unauthorizedResponse, requestHost, pathname);
    }
  }

  // 9. Verificación Perimetral de Módulos Activos por Tenant (Feature Flags)
  // Nota: ULTRAADMIN y SUPERADMIN conservan bypass para auditoría de plataforma
  if (userRole !== 'ULTRAADMIN' && userRole !== 'SUPERADMIN') {
    const modulosCookie = request.cookies.get('ferreon_modulos_activos')?.value;
    if (modulosCookie) {
      try {
        const modulosActivos = JSON.parse(modulosCookie);
        const rutaModuloMap: Record<string, string> = {
          '/alquileres': 'ALQUILERES',
          '/cotizaciones': 'COTIZACIONES',
          '/bodega': 'BODEGA',
          '/compras': 'COMPRAS',
          '/subcontrataciones': 'SUBCONTRATACIONES',
          '/devoluciones': 'DEVOLUCIONES',
          '/facturacion': 'FACTURACION',
          '/caja': 'CAJA',
        };

        for (const [ruta, moduloKey] of Object.entries(rutaModuloMap)) {
          if (pathname.startsWith(ruta)) {
            if (modulosActivos[moduloKey] === false) {
              const disabledResponse = NextResponse.rewrite(
                new URL('/unauthorized?motivo=modulo_deshabilitado', request.url)
              );
              return finalizeResponse(disabledResponse, requestHost, pathname);
            }
            break;
          }
        }
      } catch {
        // En caso de parse error o cookie ausente, permitir que el componente resuelva
      }
    }
  }

  // 10. Inyección Definitiva de Cabeceras Perimetrales y Content-Security-Policy
  response.headers.set('Content-Security-Policy', cspHeader);
  return finalizeResponse(response, requestHost, pathname);
}

export const config = {
  matcher: [
    /*
     * Intercepta rutas de la aplicación excepto archivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
