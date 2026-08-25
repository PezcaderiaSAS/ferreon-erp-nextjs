import { Redis } from '@upstash/redis';

/**
 * Cliente de Redis (Upstash) para operaciones de caché Zero-Latency.
 * Sólo inicializa el cliente si las credenciales están disponibles,
 * de lo contrario, se comporta de forma segura (graceful degradation)
 * si no hay variables de entorno en desarrollo local.
 */

const getRedisClient = () => {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('⚠️ UPSTASH_REDIS_REST_URL o TOKEN no están definidos. Redis no funcionará.');
      // Retornar un mock que no hace nada si no hay env vars, para no romper build
      return null;
    }

    return new Redis({
      url,
      token,
    });
  } catch (error) {
    console.error('Error inicializando Redis client:', error);
    return null;
  }
};

export const redis = getRedisClient();
