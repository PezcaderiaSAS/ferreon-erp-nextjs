import { describe, it, expect } from 'vitest';
import { 
  getTenantCacheKey, 
  getTenantCache, 
  setTenantCache, 
  invalidateTenantCache, 
  checkRateLimit 
} from '../../src/lib/redis';

describe('Infraestructura de Caché Distribuido Multi-Tenant & Rate Limiting (Upstash Redis)', () => {
  it('debe construir claves de caché estrictamente segmentadas por Tenant', () => {
    const keyEquiposA = getTenantCacheKey('tenant_alpha_123', 'equipos');
    const keyEquiposB = getTenantCacheKey('tenant_beta_456', 'equipos');

    expect(keyEquiposA).toBe('tenant:tenant_alpha_123:equipos');
    expect(keyEquiposB).toBe('tenant:tenant_beta_456:equipos');
    expect(keyEquiposA).not.toBe(keyEquiposB);
  });

  it('debe soportar identificadores individuales con sufijo ID', () => {
    const keyDetalle = getTenantCacheKey('tenant_alpha_123', 'alquileres', 'ALQ-789');
    expect(keyDetalle).toBe('tenant:tenant_alpha_123:alquileres:ALQ-789');
  });

  it('debe manejar fallback a "default" si el tenantId es nulo o indefinido', () => {
    const keyFallback = getTenantCacheKey(null, 'clientes');
    expect(keyFallback).toBe('tenant:default:clientes');
  });

  it('debe ejecutar degradación elegante (Graceful Degradation) sin arrojar excepciones si Redis no está conectado', async () => {
    // Si no hay variables de entorno en el test runner, las funciones no deben explotar
    const result = await getTenantCache('tenant_test', 'equipos');
    expect(result).toBeNull();

    await expect(setTenantCache('tenant_test', 'equipos', [{ id: 1 }])).resolves.not.toThrow();
    await expect(invalidateTenantCache('tenant_test', ['equipos', 'alquileres'])).resolves.not.toThrow();
  });

  it('debe permitir tráfico en checkRateLimit si Redis no está activo (Fail-Open)', async () => {
    const rateLimit = await checkRateLimit('127.0.0.1:auth', 10, 60);
    expect(rateLimit.success).toBe(true);
    expect(rateLimit.remaining).toBe(10);
  });
});
