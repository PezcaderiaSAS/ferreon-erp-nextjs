import { describe, it, expect, vi, beforeEach } from 'vitest';
import { procesarDevolucionAvanzadaAction } from '../../src/app/actions/devoluciones';

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  resolveEmpresaId: vi.fn().mockResolvedValue('empresa-dev-uuid'),
}));

vi.mock('@upstash/redis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => ({
      del: vi.fn().mockResolvedValue(1),
    })),
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    logAsync: vi.fn(),
  },
}));

describe('Pruebas Unitarias: Integridad y Flujo de Devolución Avanzada (SPEC-2026-DEVOLUCION-INTEGRITY-001)', () => {
  let mockRpc: any;
  let mockFrom: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockRpc = vi.fn();
    mockFrom = vi.fn();

    const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'usr-operador-123', email: 'operador@ferreon.com' } },
        }),
      },
      rpc: mockRpc,
      from: mockFrom,
    } as any);
  });

  it('debe rechazar devoluciones con payload inválido (sin items o cantidad negativa)', async () => {
    const res = await procesarDevolucionAvanzadaAction({
      alquilerId: 101,
      items: [], // Vacío
    } as any);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/inválidos|ítem devuelto/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('debe procesar exitosamente la devolución enviando los parámetros ordenados a procesar_devolucion_avanzada', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        idempotent: false,
        devolucion_id: 'dev-uuid-777',
        consecutivo: 'DEV-20261005-5555',
        alquiler_id: 101,
        total_alquiler_liquidado: 60000,
        total_danos: 15000,
        total_reposiciones: 0,
        deposito_aplicado: 100000,
        saldo_neto: 25000,
        tipo_resolucion: 'REEMBOLSO_CLIENTE',
        finalizado: true,
      },
      error: null,
    });

    const res = await procesarDevolucionAvanzadaAction({
      alquilerId: 101,
      items: [
        {
          detalleId: 501,
          cantidadDevuelta: 2,
          estadoInspeccion: 'BUENO',
          costoReparacion: 0,
        },
        {
          detalleId: 502,
          cantidadDevuelta: 1,
          estadoInspeccion: 'MANTENIMIENTO',
          costoReparacion: 15000,
          descripcionDano: 'Fisura en cruceta',
        },
      ],
      metodoPago: 'EFECTIVO',
      observaciones: 'Recepción completa con 1 ítem en mantenimiento',
      idempotencyKey: 'idemp-dev-12345',
    });

    expect(res.success).toBe(true);
    expect(res.data?.consecutivo).toBe('DEV-20261005-5555');
    expect(res.data?.tipo_resolucion).toBe('REEMBOLSO_CLIENTE');
    expect(mockRpc).toHaveBeenCalledWith('procesar_devolucion_avanzada', {
      p_payload: expect.objectContaining({
        alquiler_id: 101,
        recibido_por: 'operador@ferreon.com',
        idempotency_key: 'idemp-dev-12345',
        items: expect.arrayContaining([
          expect.objectContaining({ detalle_id: 501, cantidad_devuelta: 2, estado_inspeccion: 'BUENO' }),
          expect.objectContaining({ detalle_id: 502, cantidad_devuelta: 1, estado_inspeccion: 'MANTENIMIENTO', costo_reparacion: 15000 }),
        ]),
      }),
    });
  });

  it('debe registrar egreso de caja si hay sesión activa abierta y el saldo es a reembolsar en efectivo', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        idempotent: false,
        devolucion_id: 'dev-uuid-888',
        consecutivo: 'DEV-20261005-8888',
        alquiler_id: 202,
        saldo_neto: 50000,
        tipo_resolucion: 'REEMBOLSO_CLIENTE',
      },
      error: null,
    });

    const mockSingleSesion = vi.fn().mockResolvedValue({
      data: { id: 'a0000000-0000-0000-0000-000000000001', estado: 'ABIERTA', empresa_id: 'emp-123', usuario_id: 'usr-1' },
      error: null,
    });

    const mockInsertMov = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'mov-caja-999' } }),
      }),
    });

    const mockUpdateDev = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sesiones_caja') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingleSesion,
            }),
          }),
        };
      }
      if (table === 'movimientos_caja') {
        return { insert: mockInsertMov };
      }
      if (table === 'devoluciones') {
        return { update: mockUpdateDev };
      }
      return {};
    });

    const res = await procesarDevolucionAvanzadaAction({
      alquilerId: 202,
      sesionCajaId: 'a0000000-0000-0000-0000-000000000001',
      metodoPago: 'EFECTIVO',
      items: [{ detalleId: 601, cantidadDevuelta: 1, estadoInspeccion: 'BUENO' }],
    });

    expect(res.success).toBe(true);
    expect(mockInsertMov).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'EGRESO',
        monto: 50000,
        concepto: expect.stringMatching(/reembolso garantía/i),
      })
    );
  });

  it('no debe fallar la devolución si la sesión de caja es nula o no está abierta', async () => {
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        devolucion_id: 'dev-uuid-999',
        consecutivo: 'DEV-20261005-9999',
        saldo_neto: -30000,
        tipo_resolucion: 'COBRO_CLIENTE',
      },
      error: null,
    });

    const res = await procesarDevolucionAvanzadaAction({
      alquilerId: 303,
      sesionCajaId: null, // Sin caja abierta
      metodoPago: 'TRANSFERENCIA',
      items: [{ detalleId: 701, cantidadDevuelta: 1, estadoInspeccion: 'BUENO' }],
    });

    expect(res.success).toBe(true);
    expect(res.data?.consecutivo).toBe('DEV-20261005-9999');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('debe capturar errores de base de datos y retornar mensaje claro al frontend', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Fallo simulado de constraint o conexión' },
    });

    const res = await procesarDevolucionAvanzadaAction({
      alquilerId: 404,
      items: [{ detalleId: 801, cantidadDevuelta: 1, estadoInspeccion: 'BUENO' }],
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Fallo simulado de constraint o conexión');
  });
});
