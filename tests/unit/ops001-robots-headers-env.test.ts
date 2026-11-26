import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  DEFAULT_LEGACY_VERCEL_HOST,
  PRIVATE_CRAWLER_DISALLOW_PATHS,
  diagnoseEnvironmentSeparation,
  extractSupabaseRef,
  getCanonicalAppHost,
  getDeploymentEnvironment,
  getRobotsConfig,
  isIndexingAllowed,
  normalizeHost,
  resolveCanonicalRedirectUrl,
  shouldApplyNoIndex,
  validateEnvironment,
  validateEnvironmentSeparation,
} from '@/config/env';

vi.mock('@/lib/redis', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 100, reset: 0 }),
}));

import robots from '@/app/robots';
import { middleware } from '@/middleware';
import { checkRateLimit } from '@/lib/redis';

describe('OPS-001: robots.txt, X-Robots-Tag, redirección 301 y separación de entornos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as Record<string, unknown>).EdgeRuntime;
  });

  describe('1. src/app/robots.ts (robots)', () => {
    it('bloquea todo el sitio (Disallow: /) en Vercel Preview incluso si ALLOW_INDEXING=true', () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'true');

      const result = robots();
      expect(result).toEqual({
        rules: {
          userAgent: '*',
          disallow: '/',
        },
      });
    });

    it('bloquea todo el sitio en development, test y producción sin ALLOW_INDEXING=true', () => {
      vi.stubEnv('VERCEL_ENV', '');
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOW_INDEXING', 'false');
      expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });

      vi.stubEnv('NODE_ENV', 'test');
      expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });

      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'false');
      expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
    });

    it('permite solo páginas públicas y bloquea rutas privadas ERP en producción con ALLOW_INDEXING=true', () => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'true');
      vi.stubEnv('CANONICAL_APP_HOST', 'alquileres-system.dpdns.org');

      const result = robots();
      expect(result.host).toBe('https://alquileres-system.dpdns.org');
      expect(result.rules).toEqual({
        userAgent: '*',
        allow: ['/', '/privacidad', '/terminos', '/seguridad'],
        disallow: PRIVATE_CRAWLER_DISALLOW_PATHS,
      });
      expect(PRIVATE_CRAWLER_DISALLOW_PATHS).toContain('/dashboard/');
      expect(PRIVATE_CRAWLER_DISALLOW_PATHS).toContain('/alquileres/');
      expect(PRIVATE_CRAWLER_DISALLOW_PATHS).toContain('/api/');
      expect(PRIVATE_CRAWLER_DISALLOW_PATHS).toContain('/auth/');
    });

    it('omite host en getRobotsConfig si CANONICAL_APP_HOST no está definido', () => {
      const config = getRobotsConfig({
        VERCEL_ENV: 'production',
        NODE_ENV: 'production',
        ALLOW_INDEXING: 'true',
      });
      expect(config.host).toBeUndefined();
      expect((config.rules as { allow?: string[] }).allow).toContain('/');
    });
  });

  describe('2. src/middleware.ts (X-Robots-Tag y redirección 301 segura)', () => {
    it('aplica X-Robots-Tag: noindex, nofollow en /robots.txt, /api y / en Preview (sin omitir archivos con punto)', async () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'false');

      const robotsReq = new NextRequest('https://alquileres-git-feat.vercel.app/robots.txt');
      const robotsRes = await middleware(robotsReq);
      expect(robotsRes.status).toBe(200);
      expect(robotsRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
      expect(robotsRes.headers.get('X-Content-Type-Options')).toBe('nosniff');

      const apiReq = new NextRequest('https://alquileres-git-feat.vercel.app/api/alquileres');
      const apiRes = await middleware(apiReq);
      expect(apiRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      const rootReq = new NextRequest('https://alquileres-git-feat.vercel.app/');
      const rootRes = await middleware(rootReq);
      expect(rootRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('inyecta X-Robots-Tag: noindex, nofollow incluso en respuestas 429 de rate limit', async () => {
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('NODE_ENV', 'production');
      vi.mocked(checkRateLimit).mockResolvedValueOnce({
        success: false,
        remaining: 0,
        reset: 30,
      });

      const req = new NextRequest('https://alquileres-git-feat.vercel.app/api/equipos');
      const res = await middleware(req);
      expect(res.status).toBe(429);
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('ejecuta redirección 301 desde host legacy hacia CANONICAL_APP_HOST preservando ruta y query string', async () => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CANONICAL_APP_HOST', 'alquileres-system.dpdns.org');
      vi.stubEnv('ALLOW_INDEXING', 'true');

      const req = new NextRequest(
        `https://${DEFAULT_LEGACY_VERCEL_HOST}/alquileres?estado=ACTIVO&page=2`,
        {
          headers: {
            host: DEFAULT_LEGACY_VERCEL_HOST,
          },
        }
      );

      const res = await middleware(req);
      expect(res.status).toBe(301);
      expect(res.headers.get('location')).toBe(
        'https://alquileres-system.dpdns.org/alquileres?estado=ACTIVO&page=2'
      );
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('no genera bucles ni redirige en host canónico, Preview, localhost, webhooks Stripe o /robots.txt', async () => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CANONICAL_APP_HOST', 'alquileres-system.dpdns.org');
      vi.stubEnv('ALLOW_INDEXING', 'true');

      // 1. Mismo host canónico (incluso con puerto y mayúsculas en x-forwarded-host)
      const canonicalRootReq = new NextRequest('https://alquileres-system.dpdns.org/', {
        headers: { 'x-forwarded-host': 'ALQUILERES-SYSTEM.DPDNS.ORG:443' },
      });
      const canonicalRootRes = await middleware(canonicalRootReq);
      expect(canonicalRootRes.status).toBe(200);
      expect(canonicalRootRes.headers.get('location')).toBeNull();
      expect(canonicalRootRes.headers.get('X-Robots-Tag')).toBeNull();

      // 2. Ruta API en host canónico sí conserva X-Robots-Tag: noindex, nofollow
      const canonicalApiReq = new NextRequest('https://alquileres-system.dpdns.org/api/alquileres');
      const canonicalApiRes = await middleware(canonicalApiReq);
      expect(canonicalApiRes.status).toBe(200);
      expect(canonicalApiRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      // 3. Webhooks de Stripe y /robots.txt en host legacy no redirigen 301 pero sí llevan noindex
      const webhookReq = new NextRequest(
        `https://${DEFAULT_LEGACY_VERCEL_HOST}/api/webhooks/stripe`,
        { method: 'POST' }
      );
      const webhookRes = await middleware(webhookReq);
      expect(webhookRes.status).toBe(200);
      expect(webhookRes.headers.get('location')).toBeNull();
      expect(webhookRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      const legacyRobotsReq = new NextRequest(
        `https://${DEFAULT_LEGACY_VERCEL_HOST}/robots.txt`
      );
      const legacyRobotsRes = await middleware(legacyRobotsReq);
      expect(legacyRobotsRes.status).toBe(200);
      expect(legacyRobotsRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');

      // 4. Localhost y 127.0.0.1 nunca redirigen
      const localReq = new NextRequest('http://localhost:3000/');
      const localRes = await middleware(localReq);
      expect(localRes.status).toBe(200);
      expect(localRes.headers.get('location')).toBeNull();

      // 5. Preview nunca redirige aunque CANONICAL_APP_HOST esté presente
      vi.stubEnv('VERCEL_ENV', 'preview');
      const previewLegacyReq = new NextRequest(
        `https://${DEFAULT_LEGACY_VERCEL_HOST}/cotizaciones`
      );
      const previewLegacyRes = await middleware(previewLegacyReq);
      expect(previewLegacyRes.status).not.toBe(301);
      expect(previewLegacyRes.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });

    it('no redirige cuando CANONICAL_APP_HOST está vacío', async () => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CANONICAL_APP_HOST', '');

      const req = new NextRequest(`https://${DEFAULT_LEGACY_VERCEL_HOST}/`);
      const res = await middleware(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    });
  });

  describe('3. next.config.mjs (headers y redirects 301)', () => {
    it('emite X-Robots-Tag global en Preview y retorna redirects vacío', async () => {
      vi.resetModules();
      vi.stubEnv('VERCEL_ENV', 'preview');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'true');
      vi.stubEnv('CANONICAL_APP_HOST', 'alquileres-system.dpdns.org');

      const { default: nextConfig } = await import('../../next.config.mjs');
      const headers = await nextConfig.headers();
      const redirects = await nextConfig.redirects();

      expect(headers.some((rule: { source: string; has?: unknown }) => rule.source === '/:path*' && !rule.has)).toBe(true);
      expect(redirects).toEqual([]);
    });

    it('emite redirects statusCode 301 con exclusiones y headers granulares en Producción con CANONICAL_APP_HOST', async () => {
      vi.resetModules();
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ALLOW_INDEXING', 'true');
      vi.stubEnv('CANONICAL_APP_HOST', 'alquileres-system.dpdns.org');

      const { default: nextConfig } = await import('../../next.config.mjs');
      const headers = await nextConfig.headers();
      const redirects = await nextConfig.redirects();

      // Sin catch-all incondicional en /:path* cuando ALLOW_INDEXING=true
      expect(headers.some((rule: { source: string; has?: unknown }) => rule.source === '/:path*' && !rule.has)).toBe(false);
      // Sí protege siempre el host legacy y rutas ERP privadas
      expect(
        headers.some(
          (rule: any) =>
            rule.source === '/:path*' &&
            rule.has?.[0]?.value === 'alquileres-erp-nextjs-ruby\\.vercel\\.app'
        )
      ).toBe(true);
      expect(headers.some((rule: { source: string }) => rule.source === '/api/:path*')).toBe(true);
      expect(headers.some((rule: { source: string }) => rule.source === '/dashboard/:path*')).toBe(true);

      expect(redirects).toHaveLength(2);
      for (const redirectRule of redirects) {
        expect(redirectRule.statusCode).toBe(301);
        expect(redirectRule).not.toHaveProperty('permanent');
        expect(redirectRule.missing).toEqual([
          { type: 'host', value: 'alquileres-system\\.dpdns\\.org' },
        ]);
      }
      expect(redirects[0].source).toBe('/');
      expect(redirects[0].destination).toBe('https://alquileres-system.dpdns.org/');
      expect(redirects[1].source).toContain(':path');
      expect(redirects[1].destination).toBe('https://alquileres-system.dpdns.org/:path');

      // Verifica compilación real con path-to-regexp de Next.js
      const { pathToRegexp } = await import('next/dist/compiled/path-to-regexp');
      const pathRe = pathToRegexp(redirects[1].source);
      expect(pathRe.exec('/alquileres/123')).not.toBeNull();
      expect(pathRe.exec('/robots.txt')).toBeNull();
      expect(pathRe.exec('/api/webhooks/stripe')).toBeNull();
    });

    it('omite redirects si CANONICAL_APP_HOST apunta a localhost o coincide con el host legacy', async () => {
      vi.resetModules();
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CANONICAL_APP_HOST', 'localhost:3000');

      const { default: nextConfigLocal } = await import('../../next.config.mjs');
      expect(await nextConfigLocal.redirects()).toEqual([]);

      vi.resetModules();
      vi.stubEnv('CANONICAL_APP_HOST', DEFAULT_LEGACY_VERCEL_HOST);
      const { default: nextConfigSame } = await import('../../next.config.mjs');
      expect(await nextConfigSame.redirects()).toEqual([]);
    });
  });

  describe('4. src/config/env.ts (helpers, build safety y separación de entornos)', () => {
    it('normaliza hosts, detecta entorno y resuelve redirects de manera pura', () => {
      expect(normalizeHost('HTTPS://Alquileres-System.DPDNS.org:443/ruta')).toBe(
        'alquileres-system.dpdns.org'
      );
      expect(normalizeHost('a.vercel.app, proxy.internal')).toBe('a.vercel.app');
      expect(getCanonicalAppHost({ CANONICAL_APP_HOST: 'localhost:3000' })).toBeNull();
      expect(getCanonicalAppHost({ CANONICAL_APP_HOST: '127.0.0.1' })).toBeNull();
      expect(getCanonicalAppHost({ CANONICAL_APP_HOST: '::1' })).toBeNull();
      expect(getCanonicalAppHost({ CANONICAL_APP_HOST: 'alquileres.dpdns.org' })).toBe(
        'alquileres.dpdns.org'
      );

      expect(getDeploymentEnvironment({ VERCEL_ENV: 'preview', NODE_ENV: 'production' })).toBe(
        'preview'
      );
      expect(
        isIndexingAllowed({ VERCEL_ENV: 'preview', NODE_ENV: 'production', ALLOW_INDEXING: 'true' })
      ).toBe(false);
      expect(
        isIndexingAllowed({ VERCEL_ENV: 'production', NODE_ENV: 'production', ALLOW_INDEXING: 'true' })
      ).toBe(true);

      expect(
        shouldApplyNoIndex(DEFAULT_LEGACY_VERCEL_HOST, {
          VERCEL_ENV: 'production',
          ALLOW_INDEXING: 'true',
          CANONICAL_APP_HOST: 'alquileres.dpdns.org',
        })
      ).toBe(true);
      expect(
        shouldApplyNoIndex('alquileres.dpdns.org', {
          VERCEL_ENV: 'production',
          ALLOW_INDEXING: 'true',
          CANONICAL_APP_HOST: 'alquileres.dpdns.org',
        })
      ).toBe(false);

      expect(
        resolveCanonicalRedirectUrl(
          'https://alquileres-erp-nextjs-ruby.vercel.app/clientes?q=1',
          'alquileres-erp-nextjs-ruby.vercel.app',
          { VERCEL_ENV: 'production', CANONICAL_APP_HOST: 'alquileres.dpdns.org' }
        )
      ).toBe('https://alquileres.dpdns.org/clientes?q=1');
    });

    it('no lanza error en phase-production-build ni en EdgeRuntime aunque falten secretos DB', () => {
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          NEXT_PHASE: 'phase-production-build',
          NEXT_PUBLIC_SUPABASE_URL: 'https://ejemplo.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key-longitud-valida',
        })
      ).not.toThrow();

      (globalThis as Record<string, unknown>).EdgeRuntime = 'edge-runtime';
      expect(() =>
        validateEnvironment({
          NODE_ENV: 'production',
          NEXT_PUBLIC_SUPABASE_URL: 'https://ejemplo.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key-longitud-valida',
        })
      ).not.toThrow();
    });

    it('exige secretos en modo strictRuntime y bloquea fugas NEXT_PUBLIC_*', () => {
      expect(() =>
        validateEnvironment(
          {
            NODE_ENV: 'production',
            NEXT_PUBLIC_SUPABASE_URL: 'https://ejemplo.supabase.co',
            NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-anon-key-longitud-valida',
          },
          { strictRuntime: true }
        )
      ).toThrow(/CONFIG_ENV/);

      expect(() =>
        validateEnvironment({
          NODE_ENV: 'development',
          NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'no-debe-existir',
        })
      ).toThrow(/CRITICAL_SECURITY_BREACH/);

      expect(() =>
        validateEnvironment({
          NODE_ENV: 'development',
          NEXT_PUBLIC_API_PRIVATE_KEY: 'no-debe-existir',
        })
      ).toThrow(/CRITICAL_SECURITY_BREACH/);
    });

    it('extrae refs de Supabase y diagnostica desalineación o cruces Preview -> Producción', () => {
      expect(extractSupabaseRef('https://projabc123.supabase.co')).toBe('projabc123');
      expect(
        extractSupabaseRef(
          'postgresql://postgres.projabc123:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres'
        )
      ).toBe('projabc123');

      const mismatchDiag = diagnoseEnvironmentSeparation({
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://prodref111.supabase.co',
        DATABASE_URL:
          'postgresql://postgres.otherref222:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
        CANONICAL_APP_HOST: 'https://con-protocolo.dpdns.org/',
      });
      expect(mismatchDiag.ok).toBe(false);
      expect(mismatchDiag.errors.length).toBeGreaterThanOrEqual(2);

      const previewCrossDiag = diagnoseEnvironmentSeparation({
        VERCEL_ENV: 'preview',
        NODE_ENV: 'production',
        ALLOW_INDEXING: 'true',
        CANONICAL_APP_HOST: 'alquileres.dpdns.org',
        PRODUCTION_SUPABASE_REF: 'prodref111',
        NEXT_PUBLIC_APP_URL: `https://${DEFAULT_LEGACY_VERCEL_HOST}`,
        NEXT_PUBLIC_SUPABASE_URL: 'https://prodref111.supabase.co',
        DATABASE_URL:
          'postgresql://postgres.prodref111:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
      });
      expect(previewCrossDiag.ok).toBe(false);
      expect(previewCrossDiag.warnings.length).toBeGreaterThanOrEqual(1);
      expect(previewCrossDiag.errors.some((e) => e.includes('ALLOW_INDEXING'))).toBe(true);
      expect(previewCrossDiag.errors.some((e) => e.includes('NEXT_PUBLIC_APP_URL'))).toBe(true);
      expect(previewCrossDiag.errors.some((e) => e.includes('NEXT_PUBLIC_SUPABASE_URL'))).toBe(true);
      expect(previewCrossDiag.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
    });

    it('validateEnvironmentSeparation valida aislamiento estricto entre Producción y Preview', () => {
      const prodEnv = {
        VERCEL_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://alquileres.dpdns.org',
        CANONICAL_APP_HOST: 'alquileres.dpdns.org',
        ALLOW_INDEXING: 'true',
        NEXT_PUBLIC_SUPABASE_URL: 'https://prodref111.supabase.co',
        DATABASE_URL:
          'postgresql://postgres.prodref111:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
        DIRECT_URL:
          'postgresql://postgres.prodref111:pass@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
        UPSTASH_REDIS_REST_URL: 'https://prod-redis.upstash.io',
      };

      const isolatedPreviewEnv = {
        VERCEL_ENV: 'preview',
        NEXT_PUBLIC_APP_URL: 'https://alquileres-git-preview.vercel.app',
        CANONICAL_APP_HOST: '',
        ALLOW_INDEXING: 'false',
        PRODUCTION_SUPABASE_REF: 'prodref111',
        NEXT_PUBLIC_SUPABASE_URL: 'https://prevref222.supabase.co',
        DATABASE_URL:
          'postgresql://postgres.prevref222:pass@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true',
        DIRECT_URL:
          'postgresql://postgres.prevref222:pass@aws-0-us-west-2.pooler.supabase.com:5432/postgres',
        UPSTASH_REDIS_REST_URL: 'https://prev-redis.upstash.io',
      };

      expect(validateEnvironmentSeparation(prodEnv, isolatedPreviewEnv)).toEqual({
        valid: true,
        errors: [],
        warnings: [],
      });

      const collidedReport = validateEnvironmentSeparation(prodEnv, {
        ...isolatedPreviewEnv,
        CANONICAL_APP_HOST: 'alquileres.dpdns.org',
        ALLOW_INDEXING: 'true',
        NEXT_PUBLIC_SUPABASE_URL: prodEnv.NEXT_PUBLIC_SUPABASE_URL,
        DATABASE_URL: prodEnv.DATABASE_URL,
        UPSTASH_REDIS_REST_URL: prodEnv.UPSTASH_REDIS_REST_URL,
      });
      expect(collidedReport.valid).toBe(false);
      expect(collidedReport.errors.length).toBeGreaterThanOrEqual(4);
    });
  });
});
