/**
 * Content-Security-Policy (CSP) & Security Headers Generator
 * Cumple con OWASP Top 10 y Next.js 14 App Router Security Guidelines.
 */

export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return Buffer.from(crypto.randomUUID()).toString('base64');
  }
  // Fallback aleatorio seguro
  const randomValues = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < 16; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  return Buffer.from(randomValues).toString('base64');
}

export function buildCspHeader(nonce: string, isDev: boolean = false): string {
  // En desarrollo permitimos 'unsafe-eval' exclusivamente para el Hot Module Replacement (HMR) de Next.js
  const scriptSrcDirectives = isDev
    ? `'self' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`;

  const directives: Record<string, string> = {
    'default-src': "'self'",
    'script-src': scriptSrcDirectives,
    // Permite estilos en línea necesarios para Tailwind, animaciones GPU y tooltips dinámicos
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src': "'self' https://fonts.gstatic.com data:",
    'img-src': "'self' data: blob: https://*.supabase.co https://images.unsplash.com",
    // Dominios autorizados para APIs, WebSockets de Supabase, Stripe y pasarelas de pago
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://api.stripe.com',
      'https://*.upstash.io',
      'https://*.wompi.co',
      'https://*.bold.co',
      isDev ? 'ws://localhost:* http://localhost:*' : '',
    ]
      .filter(Boolean)
      .join(' '),
    'frame-src': "'self' https://js.stripe.com https://hooks.stripe.com",
    'frame-ancestors': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'object-src': "'none'",
    'upgrade-insecure-requests': isDev ? '' : 'upgrade-insecure-requests',
  };

  return Object.entries(directives)
    .filter(([_, value]) => value && value.trim().length > 0)
    .map(([key, value]) => `${key} ${value.trim()};`)
    .join(' ');
}

/**
 * Inyecta el conjunto completo de cabeceras de seguridad perimetral HTTP en una respuesta.
 */
export function applyBaseSecurityHeaders(headers: Headers): void {
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('X-XSS-Protection', '1; mode=block');
}
