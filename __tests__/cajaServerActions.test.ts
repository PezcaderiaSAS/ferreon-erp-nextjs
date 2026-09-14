import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  abrirSesionCajaAction, 
  registrarMovimientoCajaAction, 
  cerrarSesionCajaAction,
  obtenerSesionActivaAction
} from '../src/app/actions/caja';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    logAsync: vi.fn(),
  },
}));

let mockSesionAbiertaEnBD: any = null;
let mockMovimientosEnBD: any[] = [];
let mockPagosEnBD: any[] = [];

vi.mock('../src/infrastructure/persistence/supabase/server', () => ({
  DEFAULT_EMPRESA_ID: 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  resolveEmpresaId: async () => 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'cajero-uuid-1', email: 'cajero@ferreon.com' } },
        error: null
      })
    }
  }),
  createAdminSupabaseClient: () => ({
    from: (table: string) => ({
      select: (_cols?: string) => ({
        eq: (col: string, val: any) => ({
          eq: (_col2: string, _val2: any) => ({
            maybeSingle: async () => {
              if (table === 'sesiones_caja') {
                return { data: mockSesionAbiertaEnBD, error: null };
              }
              return { data: null, error: null };
            },
            single: async () => {
              if (table === 'sesiones_caja') {
                return { data: mockSesionAbiertaEnBD, error: null };
              }
              return { data: null, error: null };
            }
          }),
          maybeSingle: async () => {
            if (table === 'sesiones_caja') {
              return { data: mockSesionAbiertaEnBD, error: null };
            }
            return { data: null, error: null };
          },
          single: async () => {
            if (table === 'sesiones_caja') {
              return { data: mockSesionAbiertaEnBD, error: null };
            }
            return { data: null, error: null };
          },
          order: () => Promise.resolve({ data: mockMovimientosEnBD, error: null }),
          then: (resolve: any) => {
            if (table === 'pagos') return resolve({ data: mockPagosEnBD, error: null });
            if (table === 'movimientos_caja') return resolve({ data: mockMovimientosEnBD, error: null });
            return resolve({ data: [], error: null });
          }
        }),
        order: () => Promise.resolve({ data: mockSesionAbiertaEnBD ? [mockSesionAbiertaEnBD] : [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      insert: (rows: any[]) => ({
        select: () => ({
          single: async () => {
            const inserted = { id: 'uuid-generado-1', ...rows[0] };
            if (table === 'sesiones_caja') {
              mockSesionAbiertaEnBD = inserted;
            } else if (table === 'movimientos_caja') {
              mockMovimientosEnBD.push(inserted);
            }
            return { data: inserted, error: null };
          }
        })
      }),
      update: (fields: any) => ({
        eq: (_col: string, _val: any) => ({
          select: () => ({
            single: async () => {
              mockSesionAbiertaEnBD = { ...mockSesionAbiertaEnBD, ...fields };
              return { data: mockSesionAbiertaEnBD, error: null };
            }
          })
        })
      })
    })
  })
}));

describe('Server Actions: Módulo de Caja y Punto de Venta (POS)', () => {
  beforeEach(() => {
    mockSesionAbiertaEnBD = null;
    mockMovimientosEnBD = [];
    mockPagosEnBD = [];
    vi.clearAllMocks();
  });

  it('debe rechazar la apertura de caja si el monto inicial es negativo', async () => {
    const res = await abrirSesionCajaAction({
      montoApertura: -50000
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/negativo/i);
  });

  it('debe permitir la apertura de caja y retornar la sesión creada', async () => {
    const res = await abrirSesionCajaAction({
      montoApertura: 100000,
      observaciones: 'Base para turno mañana'
    });

    expect(res.success).toBe(true);
    expect(res.sesion).toBeDefined();
    expect(res.sesion.monto_apertura).toBe(100000);
    expect(res.sesion.estado).toBe('ABIERTA');
  });

  it('Poka-Yoke: debe bloquear la apertura si el usuario ya tiene una sesión abierta', async () => {
    // Simulamos que ya existe una caja abierta
    mockSesionAbiertaEnBD = {
      id: 'caja-previa-1',
      estado: 'ABIERTA',
      monto_apertura: 200000,
      usuario_id: 'cajero-uuid-1'
    };

    const res = await abrirSesionCajaAction({
      montoApertura: 50000
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Poka-Yoke/i);
  });

  it('debe registrar un egreso de caja menor validando los datos requeridos', async () => {
    mockSesionAbiertaEnBD = {
      id: 'caja-activa-uuid-1',
      estado: 'ABIERTA',
      monto_apertura: 300000,
      usuario_id: 'cajero-uuid-1'
    };

    const res = await registrarMovimientoCajaAction({
      sesionCajaId: '11111111-1111-4111-8111-111111111111',
      tipo: 'EGRESO',
      monto: 45000,
      concepto: 'Compra de combustible para motobomba',
      beneficiario: 'Estación Terpel',
      comprobante: 'FAC-9921'
    });

    expect(res.success).toBe(true);
    expect(res.movimiento).toBeDefined();
    expect(res.movimiento.monto).toBe(45000);
    expect(res.movimiento.tipo).toBe('EGRESO');
  });

  it('debe exigir justificación de descuadre si hay sobrante o faltante al cerrar', async () => {
    mockSesionAbiertaEnBD = {
      id: 'caja-activa-uuid-1',
      estado: 'ABIERTA',
      monto_apertura: 100000,
      usuario_id: 'cajero-uuid-1'
    };

    // Saldo esperado: 100,000. Físico ingresado: 80,000 (Faltante 20,000)
    // Sin justificación:
    const resSinJustificacion = await cerrarSesionCajaAction({
      sesionCajaId: '11111111-1111-4111-8111-111111111111',
      montoCierreFisico: 80000,
      motivoDescuadre: '' // Vacío
    });

    expect(resSinJustificacion.success).toBe(false);
    expect(resSinJustificacion.error).toMatch(/descuadre/i);

    // Con justificación:
    const resConJustificacion = await cerrarSesionCajaAction({
      sesionCajaId: '11111111-1111-4111-8111-111111111111',
      montoCierreFisico: 80000,
      motivoDescuadre: 'Error de cambio entregado en alquiler #102'
    });

    expect(resConJustificacion.success).toBe(true);
    expect(resConJustificacion.sesion.estado).toBe('CERRADA');
    expect(resConJustificacion.balance.diferencia).toBe(-20000);
  });
});
