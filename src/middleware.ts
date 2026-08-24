import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is updated, update the request and response cookies
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - this will also refresh the cookie
  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();
  
  // Exclude static paths and auth routes from strict checking
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname === '/unauthorized' ||
    url.pathname.includes('.')
  ) {
    return response;
  }

  // If no user, redirect to login
  if (!user) {
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Zero-Latency RBAC verification via JWT metadata
  const userRole = user.user_metadata?.rol;

  // Route: /configuracion requires SUPERADMIN or ADMIN
  if (url.pathname.startsWith('/configuracion')) {
    if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
      // Rewrite to unauthorized preserving the original URL
      return NextResponse.rewrite(new URL('/unauthorized', request.url));
    }
  }

  // Other routes can be mapped here later
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
