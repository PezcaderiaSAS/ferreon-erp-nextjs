import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertirCotizacionAContratoAction } from '../../src/app/actions/cotizaciones';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../src/lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    logAsync: vi.fn(),
  },
}));

let rpcMock: any;

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'usr-admin-1', email: 'admin@ferreon.com' } },
        error: null,
      }),
    },
    rpc: (...args: any[]) => rpcMock(...args),
  }),
}));

describe('Formalización Polimórfica de Cotización a Contrato 1-Clic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe detectar un ID numérico (e.g. "17") e invocar formalizar_alquiler_cotizacion_transaccional', async () => {
    rpcMock = vi.fn().mockImplementation(async (proc: string, params: any) => {
      expect(proc).toBe('formalizar_alquiler_cotizacion_transaccional');
      expect(params.p_payload.alquiler_id).toBe(17);
      return {
        data: {
          success: true,
          alquiler_id: 17,
          consecutivo: 105,
          estado: 'ACTIVO',
          total: 850000,
          idempotent: false,
        },
        error: null,
      };
    });

    const result = await convertirCotizacionAContratoAction({
      cotizacionId: '17',
      detallesLogistica: 'Entregar en Obra Calle 100',
    });

    expect(result.success).toBe(true);
    expect(result.data?.alquilerId).toBe(17);
    expect(result.data?.consecutivo).toBe(105);
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('debe detectar un ID UUID e invocar convertir_cotizacion_a_alquiler_transaccional', async () => {
    const testUuid = 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';

    rpcMock = vi.fn().mockImplementation(async (proc: string, params: any) => {
      expect(proc).toBe('convertir_cotizacion_a_alquiler_transaccional');
      expect(params.p_payload.cotizacion_id).toBe(testUuid);
      return {
        data: {
          success: true,
          alquiler_id: 99,
          consecutivo: 106,
          cotizacion_consecutivo: 'COT-2026-008',
          idempotent: false,
        },
        error: null,
      };
    });

    const result = await convertirCotizacionAContratoAction({
      cotizacionId: testUuid,
    });

    expect(result.success).toBe(true);
    expect(result.data?.alquilerId).toBe(99);
    expect(result.data?.cotizacionConsecutivo).toBe('COT-2026-008');
  });

  it('debe capturar ERR_OVERBOOKING_CONCURRENTE y retornar esErrorStock: true', async () => {
    rpcMock = vi.fn().mockImplementation(async () => {
      return {
        data: null,
        error: {
          message: 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo "Andamio Certificado" en la fecha pico 2026-09-28. Déficit: 2 unidades.',
        },
      };
    });

    const result = await convertirCotizacionAContratoAction({
      cotizacionId: '17',
    });

    expect(result.success).toBe(false);
    expect(result.esErrorStock).toBe(true);
    expect(result.codigoError).toBe('ERR_OVERBOOKING_CONCURRENTE');
    expect(result.error).toContain('Andamio Certificado');
  });

  it('debe capturar ERR_FECHA_INICIO_PASADA y propagar esErrorFechaPasada: true', async () => {
    rpcMock = vi.fn().mockImplementation(async () => {
      return {
        data: null,
        error: {
          message: 'ERR_FECHA_INICIO_PASADA: La fecha de inicio (2026-09-10) de este alquiler está en el pasado. Ratifique la nueva fecha real de despacho.',
        },
      };
    });

    const result = await convertirCotizacionAContratoAction({
      cotizacionId: '17',
    });

    expect(result.success).toBe(false);
    expect(result.esErrorFechaPasada).toBe(true);
    expect(result.codigoError).toBe('ERR_FECHA_INICIO_PASADA');
  });

  it('debe enviar nuevaFechaInicio si se ratifica una fecha vencida', async () => {
    rpcMock = vi.fn().mockImplementation(async (proc: string, params: any) => {
      expect(params.p_payload.nueva_fecha_inicio).toBe('2026-09-25');
      return {
        data: {
          success: true,
          alquiler_id: 17,
          consecutivo: 105,
          estado: 'ACTIVO',
        },
        error: null,
      };
    });

    const result = await convertirCotizacionAContratoAction({
      cotizacionId: '17',
      nuevaFechaInicio: '2026-09-25',
    });

    expect(result.success).toBe(true);
  });
});
