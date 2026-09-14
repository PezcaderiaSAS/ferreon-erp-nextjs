import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verificarConexionSupabase } from '@/infrastructure/persistence/supabase/server';

let mockLimitResponse: any = {
  data: [{ id: 'empresa-123', razon_social: 'FerreOn S.A.S' }],
  error: null
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(async () => mockLimitResponse)
      }))
    }))
  }))
}));

describe('Validación de Conexión y Salud de Base de Datos Supabase', () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    process.env = { ...envOriginal };
    mockLimitResponse = {
      data: [{ id: 'empresa-123', razon_social: 'FerreOn S.A.S' }],
      error: null
    };
  });

  it('1. Debe reportar ok: false si faltan las variables de entorno de Supabase', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const resultado = await verificarConexionSupabase();

    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain('Credenciales de Supabase incompletas');
    expect(resultado.detalles?.servicioUrlConfigurado).toBe(false);
    expect(resultado.detalles?.serviceKeyConfigurada).toBe(false);
    expect(resultado.timestamp).toBeDefined();
    expect(typeof resultado.latenciaMs).toBe('number');
  });

  it('2. Debe medir latencia y reportar status activo cuando la conexión responde satisfactoriamente', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ejemplo-supabase.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

    const resultado = await verificarConexionSupabase();

    expect(resultado.ok).toBe(true);
    expect(resultado.latenciaMs).toBeGreaterThanOrEqual(0);
    expect(resultado.url).toBe('https://ejemplo-supabase.supabase.co');
    expect(resultado.empresaId).toBe('empresa-123');
    expect(resultado.timestamp).toBeDefined();
    expect(resultado.detalles?.servicioUrlConfigurado).toBe(true);
    expect(resultado.detalles?.serviceKeyConfigurada).toBe(true);
  });

  it('3. Debe capturar y reportar errores cuando la base de datos devuelve error de consulta', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ejemplo-supabase.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';

    mockLimitResponse = {
      data: null,
      error: { message: 'Database paused or project inaccessible' }
    };

    const resultado = await verificarConexionSupabase();

    expect(resultado.ok).toBe(false);
    expect(resultado.error).toContain('Database paused or project inaccessible');
  });
});
