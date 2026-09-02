import { Redis } from '@upstash/redis';

/**
 * Cliente de Redis (Upstash) para operaciones de caché Zero-Latency y Aislamiento Multi-Tenant.
 * Comportamiento de degradación elegante (Graceful Degradation) si no hay variables de entorno.
 */

const getRedisClient = () => {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return null;
    }

    return new Redis({
      url,
      token,
    });
  } catch (error) {
    console.warn('[Redis Init Warning] No se pudo inicializar el cliente de Redis:', error);
    return null;
  }
};

export const redis = getRedisClient();

/**
 * Genera claves de caché aisladas por empresa (Multi-Tenant).
 * Formato: tenant:{empresaId}:{resource} o tenant:{empresaId}:{resource}:{id}
 */
export function getTenantCacheKey(
  tenantId: string | null | undefined,
  resource: 'equipos' | 'clientes' | 'alquileres' | 'facturas' | 'empresa',
  id?: string | number
): string {
  const safeTenant = tenantId || 'default';
  return id ? `tenant:${safeTenant}:${resource}:${id}` : `tenant:${safeTenant}:${resource}`;
}

/**
 * Obtiene datos en caché para un tenant específico con manejo seguro de errores.
 */
export async function getTenantCache<T>(
  tenantId: string | null | undefined,
  resource: 'equipos' | 'clientes' | 'alquileres' | 'facturas' | 'empresa',
  id?: string | number
): Promise<T | null> {
  if (!redis) return null;
  try {
    const key = getTenantCacheKey(tenantId, resource, id);
    const cached = await redis.get<T | string>(key);
    if (!cached) return null;
    
    if (typeof cached === 'string') {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return cached as unknown as T;
      }
    }
    return cached as T;
  } catch (err) {
    console.warn(`[Redis Cache Read Warning] Key: ${resource}`, err);
    return null;
  }
}

/**
 * Guarda datos en caché para un tenant específico con TTL.
 * Por defecto: 3600s (1 hora) para catálogos, 600s (10 min) para alquileres.
 */
export async function setTenantCache(
  tenantId: string | null | undefined,
  resource: 'equipos' | 'clientes' | 'alquileres' | 'facturas' | 'empresa',
  data: any,
  ttlSeconds: number = 3600,
  id?: string | number
): Promise<void> {
  if (!redis || !data) return;
  try {
    const key = getTenantCacheKey(tenantId, resource, id);
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    await redis.set(key, payload, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis Cache Write Warning] Key: ${resource}`, err);
  }
}

/**
 * Invalida de forma atómica las claves de caché de un tenant.
 */
export async function invalidateTenantCache(
  tenantId: string | null | undefined,
  resources: Array<'equipos' | 'clientes' | 'alquileres' | 'facturas' | 'empresa'>,
  id?: string | number
): Promise<void> {
  if (!redis) return;
  try {
    const keysToDelete: string[] = [];
    for (const resource of resources) {
      keysToDelete.push(getTenantCacheKey(tenantId, resource));
      if (id) {
        keysToDelete.push(getTenantCacheKey(tenantId, resource, id));
      }
    }
    
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (err) {
    console.warn('[Redis Invalidate Warning]', err);
  }
}

/**
 * Rate Limiter 100% Edge-Safe para Next.js Middleware y Serverless.
 * Utiliza fetch nativo sobre la API REST de Upstash (cero dependencias de Node.js).
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return { success: true, remaining: limit, reset: 0 };
  }

  try {
    const key = `ratelimit:${identifier}`;
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds],
      ]),
      cache: 'no-store',
    });

    if (!response.ok) {
      return { success: true, remaining: limit, reset: 0 };
    }

    const data = await response.json();
    const current = Number(data[0]?.result || 1);
    const remaining = Math.max(0, limit - current);

    return {
      success: current <= limit,
      remaining,
      reset: windowSeconds,
    };
  } catch {
    return { success: true, remaining: limit, reset: 0 };
  }
}
