import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearEquipoAction } from '@/app/actions/equipos';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
  redis: { del: vi.fn().mockResolvedValue(1) },
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    logAsync: vi.fn(),
  },
}));

let mockKardexInserts: any[] = [];
let mockEquipoInsertado: any = null;

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  resolveEmpresaId: async () => 'empresa-test-uuid',
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: 'user-test-uuid', email: 'almacen@ferreon.com' } },
        error: null,
      }),
    },
    from: (table: string) => ({
      insert: (payload: any[]) => ({
        select: () => ({
          single: async () => {
            if (table === 'equipos') {
              mockEquipoInsertado = {
                id: 999,
                ...payload[0],
              };
              return { data: mockEquipoInsertado, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
    }),
  }),
  createAdminSupabaseClient: () => ({
    from: (table: string) => ({
      insert: (payload: any[]) => {
        if (table === 'kardex_inventario') {
          mockKardexInserts.push(...payload);
        }
        return Promise.resolve({ data: payload, error: null });
      },
    }),
  }),
}));

describe('Blindaje KARDEX-002: Asentamiento Automático de Saldo Inicial en Kardex', () => {
  beforeEach(() => {
    mockKardexInserts = [];
    mockEquipoInsertado = null;
    vi.clearAllMocks();
  });

  it('debe registrar el movimiento ENTRADA_INICIAL en kardex_inventario cuando stockInicial > 0', async () => {
    const input = {
      sku: 'TAL-001',
      nombre: 'Taladro Percutor 1/2 Industrial',
      categoria: 'Herramientas Eléctricas',
      tarifaDiaria: 25000,
      valorReposicion: 350000,
      stockInicial: 5,
    };

    const res = await crearEquipoAction(input);

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe(999);

    // Verificación crítica de Kardex: se debió asentar la entrada inicial
    expect(mockKardexInserts.length).toBe(1);
    const kardexEntry = mockKardexInserts[0];
    expect(kardexEntry.equipo_id).toBe(999);
    expect(kardexEntry.tipo_movimiento).toBe('ENTRADA_INICIAL');
    expect(kardexEntry.cantidad_delta).toBe(5);
    expect(kardexEntry.stock_resultante).toBe(5);
    expect(kardexEntry.costo_unitario).toBe(350000);
    expect(kardexEntry.costo_total).toBe(350000 * 5);
  });

  it('no debe insertar movimiento en kardex si el equipo se da de alta con stockInicial = 0', async () => {
    const input = {
      sku: 'GEN-002',
      nombre: 'Generador Diésel 10kVA',
      categoria: 'Generación',
      tarifaDiaria: 120000,
      valorReposicion: 5000000,
      stockInicial: 0,
    };

    const res = await crearEquipoAction(input);

    expect(res.success).toBe(true);
    expect(mockKardexInserts.length).toBe(0);
  });
});
