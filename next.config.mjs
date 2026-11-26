const DEFAULT_LEGACY_VERCEL_HOST = 'alquileres-erp-nextjs-ruby.vercel.app';

const PRIVATE_NOINDEX_HEADER_PATHS = [
  '/api/:path*',
  '/auth/:path*',
  '/admin/:path*',
  '/alquileres/:path*',
  '/bodega/:path*',
  '/caja/:path*',
  '/clientes/:path*',
  '/compras/:path*',
  '/configuracion/:path*',
  '/cotizaciones/:path*',
  '/dashboard/:path*',
  '/devoluciones/:path*',
  '/facturacion/:path*',
  '/logistica/:path*',
  '/onboarding/:path*',
  '/subcontrataciones/:path*',
  '/unauthorized',
  '/design-system',
  '/neumorphism-demo',
  '/dmca',
  '/unsubscribe',
];

function escapeHostRegex(host) {
  return host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeHost(rawHost) {
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

function isProductionEnv() {
  const vercelEnv = process.env.VERCEL_ENV;
  return vercelEnv ? vercelEnv === 'production' : process.env.NODE_ENV === 'production';
}

function resolveCanonicalHost() {
  const host = normalizeHost(process.env.CANONICAL_APP_HOST);
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    !/^[a-z0-9.-]+$/i.test(host)
  ) {
    return null;
  }
  return host;
}

function resolveLegacyHosts() {
  const raw = process.env.LEGACY_VERCEL_HOSTS;
  if (!raw || !raw.trim()) {
    return [DEFAULT_LEGACY_VERCEL_HOST];
  }
  const hosts = raw
    .split(',')
    .map((h) => normalizeHost(h))
    .filter(Boolean);
  return hosts.length > 0 ? Array.from(new Set(hosts)) : [DEFAULT_LEGACY_VERCEL_HOST];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  async headers() {
    const isProd = isProductionEnv();
    const allowIndexing = isProd && process.env.ALLOW_INDEXING === 'true';
    const noIndexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    const rules = [];

    if (!allowIndexing) {
      rules.push({
        source: '/:path*',
        headers: noIndexHeaders,
      });
    }

    rules.push({
      source: '/:path*',
      has: [{ type: 'host', value: 'alquileres-erp-nextjs-ruby\\.vercel\\.app' }],
      headers: noIndexHeaders,
    });

    for (const source of PRIVATE_NOINDEX_HEADER_PATHS) {
      rules.push({
        source,
        headers: noIndexHeaders,
      });
    }

    return rules;
  },

  async redirects() {
    if (!isProductionEnv()) {
      return [];
    }

    const canonicalHost = resolveCanonicalHost();
    if (!canonicalHost) {
      return [];
    }

    const legacyHosts = resolveLegacyHosts().filter((host) => host !== canonicalHost);
    if (legacyHosts.length === 0) {
      return [];
    }

    const canonicalRegex = escapeHostRegex(canonicalHost);
    const rules = [];

    for (const legacyHost of legacyHosts) {
      const legacyRegex = escapeHostRegex(legacyHost);
      rules.push(
        {
          source: '/',
          has: [{ type: 'host', value: legacyRegex }],
          missing: [{ type: 'host', value: canonicalRegex }],
          destination: `https://${canonicalHost}/`,
          statusCode: 301,
        },
        {
          source: '/:path((?!api/webhooks|robots\\.txt).+)',
          has: [{ type: 'host', value: legacyRegex }],
          missing: [{ type: 'host', value: canonicalRegex }],
          destination: `https://${canonicalHost}/:path`,
          statusCode: 301,
        }
      );
    }

    return rules;
  },
};

export default nextConfig;
