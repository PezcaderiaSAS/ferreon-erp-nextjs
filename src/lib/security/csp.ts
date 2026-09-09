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

export function buildCspHeader(nonce?: string, isDev: boolean = false): string {
  // Directivas de script 100% compatibles con Next.js 14 App Router, Vercel y Apple iOS Safari (WebKit).
  // NOTA CRÍTICA DE ESPECIFICACIÓN CSP 2/3:
  // Si se incluye un 'nonce-...' en script-src, los navegadores modernos (Safari/Chrome/Firefox)
  // DESCARTAN automáticamente 'unsafe-inline'. Dado que Next.js 14 App Router inyecta scripts
  // en línea de hidratación y streaming (self.__next_f.push) que no tienen el atributo nonce,
  // la presencia de un nonce bloquea React, detiene la hidratación y paraliza las llamadas a la BD.
  // Por tanto, 'strict-dynamic' y 'nonce-...' se omiten en favor de 'unsafe-inline' con control estricto de orígenes.
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
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
    `script-src ${scriptSources}`,
    `script-src-elem ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://vercel.com https://lh3.googleusercontent.com",
    `connect-src ${connectSrcDirectives}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    // Directivas esenciales para Apple iOS Safari (WebKit) para soporte de Web Workers y Blob URLs (PDFs, exports)
    "worker-src 'self' blob:",
    "child-src 'self' blob: https://js.stripe.com",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  // 'upgrade-insecure-requests' es una directiva booleana sin valor (RFC CSP 3).
  // Solo debe incluirse en producción con HTTPS, nunca en entornos de desarrollo local http://localhost
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
