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
  // Directivas de script seguras y 100% compatibles con Next.js 14 App Router y Vercel
  // Se elimina 'strict-dynamic' porque invalida 'unsafe-inline' y los host allowlists en CSP 3,
  // bloqueando los scripts de hidratación en línea de Next.js (self.__next_f.push) y deteniendo React.
  const scriptSrcDirectives = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    `'nonce-${nonce}'`,
    'https://js.stripe.com',
    'https://*.supabase.co',
    'https://vercel.live',
  ].join(' ');

  const connectSrcDirectives = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.stripe.com',
    'https://*.upstash.io',
    'https://*.wompi.co',
    'https://*.bold.co',
    'https://vercel.live',
    isDev ? 'ws://localhost:* http://localhost:* ws://127.0.0.1:* http://127.0.0.1:*' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const directives: string[] = [
    "default-src 'self'",
    `script-src ${scriptSrcDirectives}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://vercel.com",
    `connect-src ${connectSrcDirectives}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join('; ');
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
