import { z } from 'zod';

/**
 * Host legacy de Vercel que no debe indexarse ni actuar como dominio canónico
 * una vez se configure un dominio canónico propio a costo $0.
 */
export const DEFAULT_LEGACY_VERCEL_HOST = 'alquileres-erp-nextjs-ruby.vercel.app';

/**
 * Rutas privadas, operativas y de API que los crawlers nunca deben indexar
 * incluso cuando ALLOW_INDEXING='true' en producción.
 */
export const PRIVATE_CRAWLER_DISALLOW_PATHS: string[] = [
  '/api/',
  '/auth/',
  '/admin/',
  '/alquileres/',
  '/bodega/',
  '/caja/',
  '/clientes/',
  '/compras/',
  '/configuracion/',
  '/cotizaciones/',
  '/dashboard/',
  '/devoluciones/',
  '/facturacion/',
  '/logistica/',
  '/onboarding/',
  '/subcontrataciones/',
  '/unauthorized',
  '/design-system',
  '/neumorphism-demo',
  '/dmca',
  '/unsubscribe',
];

const emptyToUndefined = (val: unknown): unknown =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

/**
 * Esquema de validación para variables públicas (expuestas en el navegador).
 * Regla de Oro: NUNCA agregar aquí variables de rol administrativo o secretos.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY es requerida'),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url('NEXT_PUBLIC_APP_URL debe ser una URL válida').default('http://localhost:3000')
  ),
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url('NEXT_PUBLIC_SITE_URL debe ser una URL válida').optional()
  ),
  NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: z.preprocess(emptyToUndefined, z.string().optional()),
  NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME: z.preprocess(emptyToUndefined, z.string().optional()),
});

/**
 * Esquema de validación para variables privadas del servidor (Node.js / Edge).
 * DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY y CRON_SECRET son opcionales en el esquema base
 * para no romper `npm run build` (NEXT_PHASE=phase-production-build) ni Edge Middleware;
 * usar `validateEnvironment(env, { strictRuntime: true })` cuando se exijan en runtime Node.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VERCEL_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['production', 'preview', 'development']).optional()
  ),
  VERCEL_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  CANONICAL_APP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  ALLOW_INDEXING: z.preprocess(
    emptyToUndefined,
    z.enum(['true', 'false']).default('false')
  ),
  LEGACY_VERCEL_HOSTS: z.preprocess(emptyToUndefined, z.string().optional()),
  PRODUCTION_SUPABASE_REF: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(10, 'DATABASE_URL debe tener al menos 10 caracteres').optional()
  ),
  DIRECT_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(10, 'DIRECT_URL debe tener al menos 10 caracteres').optional()
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(20, 'SUPABASE_SERVICE_ROLE_KEY debe tener al menos 20 caracteres').optional()
  ),
  CRON_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(10, 'CRON_SECRET debe tener al menos 10 caracteres').optional()
  ),
  UPSTASH_REDIS_REST_URL: z.preprocess(
    emptyToUndefined,
    z.string().url('UPSTASH_REDIS_REST_URL debe ser una URL válida').optional()
  ),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(
    emptyToUndefined,
    z.string().min(10, 'UPSTASH_REDIS_REST_TOKEN debe tener al menos 10 caracteres').optional()
  ),
  STRIPE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const strictServerEnvSchema = serverEnvSchema.extend({
  DATABASE_URL: z.string().min(10, 'DATABASE_URL es obligatoria para Prisma ORM'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY es obligatoria para operaciones administrativas'),
});

export type EnvMap = Record<string, string | undefined>;
export type DeploymentEnvironment = 'production' | 'preview' | 'development' | 'test';

export interface ValidateEnvironmentOptions {
  strictRuntime?: boolean;
}

export interface RobotsConfig {
  rules:
    | {
        userAgent?: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }
    | Array<{
        userAgent: string | string[];
        allow?: string | string[];
        disallow?: string | string[];
        crawlDelay?: number;
      }>;
  sitemap?: string | string[];
  host?: string;
}

export interface EnvironmentDiagnostics {
  environment: DeploymentEnvironment;
  ok: boolean;
  errors: string[];
  warnings: string[];
  supabaseRef: string | null;
  dbRef: string | null;
  canonicalHost: string | null;
}

export interface EnvironmentSeparationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const isServer = typeof window === 'undefined';

function isForbiddenPublicSecretKey(key: string): boolean {
  const upper = key.toUpperCase();
  return (
    upper.startsWith('NEXT_PUBLIC_') &&
    (upper.includes('SECRET') ||
      upper.includes('SERVICE_ROLE') ||
      upper.includes('PASSWORD') ||
      upper.includes('PRIVATE_KEY'))
  );
}

/**
 * Resuelve el entorno de despliegue priorizando `VERCEL_ENV` sobre `NODE_ENV`,
 * porque Vercel Preview ejecuta Next.js con `NODE_ENV=production`.
 */
export function getDeploymentEnvironment(envMap: EnvMap = process.env): DeploymentEnvironment {
  const vercelEnv = envMap.VERCEL_ENV;
  if (vercelEnv === 'production' || vercelEnv === 'preview' || vercelEnv === 'development') {
    return vercelEnv;
  }
  const nodeEnv = envMap.NODE_ENV;
  if (nodeEnv === 'production' || nodeEnv === 'test' || nodeEnv === 'development') {
    return nodeEnv;
  }
  return 'development';
}

export function isProductionDeployment(envMap: EnvMap = process.env): boolean {
  return getDeploymentEnvironment(envMap) === 'production';
}

export function isIndexingAllowed(envMap: EnvMap = process.env): boolean {
  return isProductionDeployment(envMap) && envMap.ALLOW_INDEXING === 'true';
}

/**
 * Normaliza un valor de cabecera Host (`x-forwarded-host`, `host` o URL)
 * a hostname en minúsculas sin protocolo, puerto ni barra final.
 */
export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  let host = rawHost.split(',')[0]?.trim().toLowerCase() ?? '';
  if (!host) return '';
  host = host.replace(/^https?:\/\//i, '');
  host = host.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';
  if (host.startsWith('[')) {
    host = host.replace(/:\d+$/, '');
  } else if ((host.match(/:/g) || []).length === 1) {
    host = host.replace(/:\d+$/, '');
  }
  return host.replace(/\.$/, '');
}

function isLocalhostOrLoopback(host: string): boolean {
  return (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  );
}

/**
 * Retorna el hostname canónico configurado en `CANONICAL_APP_HOST`, o `null` si está vacío,
 * es inválido o apunta a loopback (`localhost`, `127.0.0.1`, `::1`).
 */
export function getCanonicalAppHost(envMap: EnvMap = process.env): string | null {
  const raw = envMap.CANONICAL_APP_HOST;
  if (!raw || !raw.trim()) return null;
  const host = normalizeHost(raw);
  if (isLocalhostOrLoopback(host)) return null;
  if (!/^[a-z0-9.-]+$/i.test(host)) return null;
  return host;
}

export function getLegacyVercelHosts(envMap: EnvMap = process.env): string[] {
  const raw = envMap.LEGACY_VERCEL_HOSTS;
  if (!raw || !raw.trim()) {
    return [DEFAULT_LEGACY_VERCEL_HOST];
  }
  const parsed = raw
    .split(',')
    .map((item) => normalizeHost(item))
    .filter((item) => item.length > 0);

  return parsed.length > 0 ? Array.from(new Set(parsed)) : [DEFAULT_LEGACY_VERCEL_HOST];
}

/**
 * Determina si la respuesta HTTP debe incluir `X-Robots-Tag: noindex, nofollow`
 * para el host y entorno actuales.
 */
export function shouldApplyNoIndex(
  requestHost: string | null | undefined,
  envMap: EnvMap = process.env
): boolean {
  if (!isIndexingAllowed(envMap)) {
    return true;
  }

  const host = normalizeHost(requestHost);
  const canonicalHost = getCanonicalAppHost(envMap);
  const legacyHosts = getLegacyVercelHosts(envMap);

  if (canonicalHost && host && host !== canonicalHost) {
    return true;
  }

  if (host && legacyHosts.includes(host) && host !== canonicalHost) {
    return true;
  }

  return false;
}

/**
 * Calcula la URL de redirección 301 hacia `CANONICAL_APP_HOST` únicamente en Producción,
 * evitando bucles y excluyendo rutas técnicas (`/_next`, `/api/webhooks`, `/robots.txt`)
 * y hosts locales (`localhost`, `127.0.0.1`, `::1`).
 */
export function resolveCanonicalRedirectUrl(
  requestUrl: URL | string,
  requestHost: string | null | undefined,
  envMap: EnvMap = process.env
): string | null {
  if (!isProductionDeployment(envMap)) {
    return null;
  }

  const canonicalHost = getCanonicalAppHost(envMap);
  if (!canonicalHost) {
    return null;
  }

  const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
  const { pathname, search } = url;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname === '/robots.txt'
  ) {
    return null;
  }

  const host = normalizeHost(requestHost);
  if (isLocalhostOrLoopback(host)) {
    return null;
  }

  if (host === canonicalHost) {
    return null;
  }

  const legacyHosts = getLegacyVercelHosts(envMap);
  if (legacyHosts.includes(host) || host.endsWith('.vercel.app')) {
    return `https://${canonicalHost}${pathname}${search}`;
  }

  return null;
}

/**
 * Construye la política dinámica de `robots.txt` según el entorno e `ALLOW_INDEXING`.
 */
export function getRobotsConfig(envMap: EnvMap = process.env): RobotsConfig {
  if (!isIndexingAllowed(envMap)) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  const canonicalHost = getCanonicalAppHost(envMap);
  const config: RobotsConfig = {
    rules: {
      userAgent: '*',
      allow: ['/', '/privacidad', '/terminos', '/seguridad'],
      disallow: PRIVATE_CRAWLER_DISALLOW_PATHS,
    },
  };

  if (canonicalHost) {
    config.host = `https://${canonicalHost}`;
  }

  return config;
}

/**
 * Extrae el project-ref público de una URL de Supabase o de un DSN PostgreSQL.
 */
export function extractSupabaseRef(urlOrDsn: string | null | undefined): string | null {
  if (!urlOrDsn || !urlOrDsn.trim()) return null;

  const httpsMatch = urlOrDsn.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co(?:\/|$)/i);
  if (httpsMatch?.[1]) {
    return httpsMatch[1].toLowerCase();
  }

  const poolerUserMatch = urlOrDsn.match(/postgres\.([a-z0-9-]+)(?::|@)/i);
  if (poolerUserMatch?.[1]) {
    return poolerUserMatch[1].toLowerCase();
  }

  const directHostMatch = urlOrDsn.match(/@db\.([a-z0-9-]+)\.supabase\.co/i);
  if (directHostMatch?.[1]) {
    return directHostMatch[1].toLowerCase();
  }

  return null;
}

/**
 * Diagnostica la configuración de un entorno en busca de cruces Preview -> Producción,
 * inconsistencias entre Supabase REST y PostgreSQL/Prisma, o formatos inválidos.
 */
export function diagnoseEnvironmentSeparation(rawEnv: EnvMap = process.env): EnvironmentDiagnostics {
  const environment = getDeploymentEnvironment(rawEnv);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of Object.keys(rawEnv)) {
    if (rawEnv[key] !== undefined && isForbiddenPublicSecretKey(key)) {
      errors.push(
        `Variable pública '${key}' contiene un patrón de secreto prohibido con prefijo NEXT_PUBLIC_.`
      );
    }
  }

  const rawCanonical = rawEnv.CANONICAL_APP_HOST?.trim();
  if (rawCanonical && (/:\/\//.test(rawCanonical) || rawCanonical.includes('/') || /\s/.test(rawCanonical))) {
    errors.push(
      `CANONICAL_APP_HOST ('${rawCanonical}') debe contener solo el hostname sin protocolo ni barra final.`
    );
  }

  const supabaseRef = extractSupabaseRef(rawEnv.NEXT_PUBLIC_SUPABASE_URL);
  const dbRef = extractSupabaseRef(rawEnv.DATABASE_URL);
  const canonicalHost = getCanonicalAppHost(rawEnv);

  if (supabaseRef && dbRef && supabaseRef !== dbRef) {
    errors.push(
      `Desalineación de proyecto Supabase: NEXT_PUBLIC_SUPABASE_URL (${supabaseRef}) difiere de DATABASE_URL (${dbRef}).`
    );
  }

  if (environment === 'preview') {
    if (rawEnv.ALLOW_INDEXING === 'true') {
      errors.push('ALLOW_INDEXING=true está prohibido en entornos Preview.');
    }

    if (rawCanonical) {
      warnings.push(
        'CANONICAL_APP_HOST está definido en Preview; déjalo vacío para evitar redirecciones hacia Producción.'
      );
    }

    const appUrlHost = normalizeHost(rawEnv.NEXT_PUBLIC_APP_URL);
    const legacyHosts = getLegacyVercelHosts(rawEnv);
    if (
      appUrlHost &&
      ((canonicalHost && appUrlHost === canonicalHost) ||
        appUrlHost === DEFAULT_LEGACY_VERCEL_HOST ||
        legacyHosts.includes(appUrlHost))
    ) {
      errors.push(
        `Preview apunta NEXT_PUBLIC_APP_URL al host de producción ('${appUrlHost}').`
      );
    }

    const prodRef = rawEnv.PRODUCTION_SUPABASE_REF?.trim().toLowerCase() || 'eqruvswlpsttuyuglwts';
    if (supabaseRef && supabaseRef === prodRef) {
      errors.push(
        `Preview apunta NEXT_PUBLIC_SUPABASE_URL al proyecto de producción ('${prodRef}').`
      );
    }
    if (dbRef && dbRef === prodRef) {
      errors.push(
        `Preview apunta DATABASE_URL al proyecto de producción ('${prodRef}').`
      );
    }
  }

  return {
    environment,
    ok: errors.length === 0,
    errors,
    warnings,
    supabaseRef,
    dbRef,
    canonicalHost,
  };
}

function normalizeOriginOrHost(raw: string | undefined): string {
  if (!raw || !raw.trim()) return '';
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return normalizeHost(raw);
  }
}

function extractDsnAuthority(dsn: string | undefined): string {
  if (!dsn || !dsn.trim()) return '';
  const cleaned = dsn.trim().replace(/^["']|["']$/g, '');
  const match = cleaned.match(/^postgres(?:ql)?:\/\/([^@]+)@([^/?#]+)/i);
  if (!match) return cleaned.toLowerCase();
  const user = match[1].split(':')[0]?.toLowerCase() ?? '';
  const hostPort = match[2].toLowerCase();
  return `${user}@${hostPort}`;
}

/**
 * Compara explícitamente un diccionario de Producción contra uno de Preview
 * verificando aislamiento estricto de URLs, Supabase, PostgreSQL, Redis y crawler guards.
 */
export function validateEnvironmentSeparation(
  prodEnv: EnvMap,
  previewEnv: EnvMap
): EnvironmentSeparationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const previewDiag = diagnoseEnvironmentSeparation({
    ...previewEnv,
    VERCEL_ENV: previewEnv.VERCEL_ENV || 'preview',
  });
  errors.push(...previewDiag.errors);
  warnings.push(...previewDiag.warnings);

  if (previewEnv.CANONICAL_APP_HOST?.trim()) {
    errors.push('Preview debe mantener CANONICAL_APP_HOST vacío.');
  }

  if (previewEnv.ALLOW_INDEXING === 'true') {
    errors.push('Preview no puede habilitar ALLOW_INDEXING=true.');
  }

  const prodSupabaseHost = normalizeOriginOrHost(prodEnv.NEXT_PUBLIC_SUPABASE_URL);
  const previewSupabaseHost = normalizeOriginOrHost(previewEnv.NEXT_PUBLIC_SUPABASE_URL);
  if (prodSupabaseHost && previewSupabaseHost && prodSupabaseHost === previewSupabaseHost) {
    errors.push(`Colisión de Supabase URL entre Producción y Preview ('${prodSupabaseHost}').`);
  }

  const prodRef = extractSupabaseRef(prodEnv.NEXT_PUBLIC_SUPABASE_URL);
  const prevRef = extractSupabaseRef(previewEnv.NEXT_PUBLIC_SUPABASE_URL);
  if (prodRef && prevRef && prodRef === prevRef) {
    errors.push(`Colisión de Supabase project-ref entre Producción y Preview ('${prodRef}').`);
  }

  const prodDbAuthority = extractDsnAuthority(prodEnv.DATABASE_URL);
  const previewDbAuthority = extractDsnAuthority(previewEnv.DATABASE_URL);
  if (prodDbAuthority && previewDbAuthority && prodDbAuthority === previewDbAuthority) {
    errors.push('Colisión de DATABASE_URL entre Producción y Preview.');
  }

  const prodDirectAuthority = extractDsnAuthority(prodEnv.DIRECT_URL);
  const previewDirectAuthority = extractDsnAuthority(previewEnv.DIRECT_URL);
  if (prodDirectAuthority && previewDirectAuthority && prodDirectAuthority === previewDirectAuthority) {
    errors.push('Colisión de DIRECT_URL entre Producción y Preview.');
  }

  const prodRedisHost = normalizeOriginOrHost(prodEnv.UPSTASH_REDIS_REST_URL);
  const previewRedisHost = normalizeOriginOrHost(previewEnv.UPSTASH_REDIS_REST_URL);
  if (prodRedisHost && previewRedisHost && prodRedisHost === previewRedisHost) {
    errors.push(`Colisión de UPSTASH_REDIS_REST_URL entre Producción y Preview ('${prodRedisHost}').`);
  }

  const prodAppHost = normalizeOriginOrHost(prodEnv.NEXT_PUBLIC_APP_URL);
  const previewAppHost = normalizeOriginOrHost(previewEnv.NEXT_PUBLIC_APP_URL);
  if (prodAppHost && previewAppHost && prodAppHost === previewAppHost) {
    errors.push(`Colisión de NEXT_PUBLIC_APP_URL entre Producción y Preview ('${prodAppHost}').`);
  }

  return {
    valid: errors.length === 0,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

/**
 * Valida variables de entorno de forma segura en build, Edge Runtime, Vitest y Node runtime.
 */
export function validateEnvironment(
  rawEnv: EnvMap = process.env,
  options: ValidateEnvironmentOptions = {}
): Record<string, any> {
  // 1. Detección preventiva de fugas: Ningún secreto de backend debe tener prefijo NEXT_PUBLIC_
  if (isServer) {
    for (const key of Object.keys(rawEnv)) {
      if (rawEnv[key] !== undefined && isForbiddenPublicSecretKey(key)) {
        throw new Error(
          `[CRITICAL_SECURITY_BREACH] La variable sensible '${key}' contiene el prefijo NEXT_PUBLIC_. Esto expondría credenciales al navegador. Corrija su archivo .env.local inmediatamente.`
        );
      }
    }
  }

  const isTest = rawEnv.NODE_ENV === 'test' || Boolean(rawEnv.VITEST);
  const isBuildPhase = rawEnv.NEXT_PHASE === 'phase-production-build';
  const isEdgeRuntime =
    typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined';

  // 2. En entorno de test unitario (Vitest) sin modo strictRuntime, proveer fallbacks seguros
  if (isTest && !options.strictRuntime) {
    return {
      NODE_ENV: 'test',
      VERCEL_ENV: rawEnv.VERCEL_ENV,
      CANONICAL_APP_HOST: rawEnv.CANONICAL_APP_HOST,
      ALLOW_INDEXING: rawEnv.ALLOW_INDEXING || 'false',
      LEGACY_VERCEL_HOSTS: rawEnv.LEGACY_VERCEL_HOSTS,
      NEXT_PUBLIC_SUPABASE_URL:
        rawEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-test-environment',
      NEXT_PUBLIC_APP_URL: rawEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      DATABASE_URL:
        rawEnv.DATABASE_URL || 'postgresql://postgres:test@localhost:5432/postgres',
      SUPABASE_SERVICE_ROLE_KEY:
        rawEnv.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key-test',
      CRON_SECRET: rawEnv.CRON_SECRET || 'test-cron-secret-123456',
    };
  }

  if (isServer) {
    const schema = options.strictRuntime ? strictServerEnvSchema : serverEnvSchema;
    const parsed = schema.safeParse(rawEnv);

    if (!parsed.success) {
      if (options.strictRuntime) {
        throw new Error(
          `[CONFIG_ENV] Variables de entorno requeridas incompletas en runtime: ${JSON.stringify(
            parsed.error.flatten().fieldErrors
          )}`
        );
      }

      if (!isBuildPhase && !isEdgeRuntime) {
        console.error('❌ [CONFIG_ENV] Error de validación en variables de entorno del servidor:');
        console.error(parsed.error.flatten().fieldErrors);
      }
    }

    return parsed.success ? parsed.data : { ...rawEnv };
  }

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: rawEnv.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY: rawEnv.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
    NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME: rawEnv.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME,
  });

  if (!parsed.success) {
    console.warn(
      '⚠️ [CONFIG_ENV] Variables públicas de Supabase faltantes en el cliente:',
      parsed.error.flatten().fieldErrors
    );
  }

  return parsed.success ? parsed.data : { ...rawEnv };
}

export const env = validateEnvironment(process.env);
