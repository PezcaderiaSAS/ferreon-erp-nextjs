import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aprobarCotizacionAction, registrarAbonoAction } from '../../src/app/actions/alquileres';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/infrastructure/cache/redisClient', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
}));

// Mock mutable de base de datos para los tests
let mockDb: {
  alquileres: Record<string | number, any>;
  alquiler_detalles: Record<string | number, any[]>;
  equipos: Record<string | number, any>;
  updateAlquileresFn: any;
  updateEquiposFn: any;
};

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'usr-test-1', email: 'test@ferreon.com' } } }),
    },
    from: (table: string) => ({
      select: (fields?: string) => ({
        eq: (field: string, value: any) => ({
          single: async () => {
            if (table === 'alquileres') {
              const alq = mockDb.alquileres[value];
              return alq ? { data: alq, error: null } : { data: null, error: { message: 'Not found' } };
            }
            if (table === 'equipos') {
              const eq = mockDb.equipos[value];
              return eq ? { data: eq, error: null } : { data: null, error: { message: 'Not found' } };
            }
            return { data: null, error: null };
          },
          then: (resolve: any) => {
            if (table === 'alquiler_detalles') {
              const det = mockDb.alquiler_detalles[value] || [];
              return resolve({ data: det, error: null });
            }
            return resolve({ data: [], error: null });
          },
        }),
      }),
      update: (updatePayload: any) => ({
        eq: (field: string, value: any) => {
          if (table === 'alquileres') {
            mockDb.updateAlquileresFn(updatePayload, value);
            if (mockDb.alquileres[value]) {
              Object.assign(mockDb.alquileres[value], updatePayload);
            }
          }
          if (table === 'equipos') {
            mockDb.updateEquiposFn(updatePayload, value);
            if (mockDb.equipos[value]) {
              Object.assign(mockDb.equipos[value], updatePayload);
            }
          }
          return Promise.resolve({ data: { id: value, ...updatePayload }, error: null });
        },
      }),
    }),
  }),
}));

describe('Core UX: Cotizaciones y Abonos (Server Actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      alquileres: {},
      alquiler_detalles: {},
      equipos: {},
      updateAlquileresFn: vi.fn(),
      updateEquiposFn: vi.fn(),
    };
  });

  describe('aprobarCotizacionAction', () => {
    it('debería fallar si no hay stock suficiente para activar la cotización', async () => {
      mockDb.alquileres[123] = { id: 123, estado: 'COTIZACION' };
      mockDb.alquiler_detalles[123] = [
        { equipo_id: 1, cantidad: 5 }
      ];
      mockDb.equipos[1] = { id: 1, nombre: 'Andamio', stock_disponible: 3, stock_en_obra: 0 };

      const result = await aprobarCotizacionAction({ alquilerId: 123 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
    });

    it('debería aprobar y descontar stock si hay disponibilidad', async () => {
      mockDb.alquileres[123] = { id: 123, estado: 'COTIZACION' };
      mockDb.alquiler_detalles[123] = [
        { equipo_id: 1, cantidad: 2 }
      ];
      mockDb.equipos[1] = { id: 1, nombre: 'Andamio', stock_disponible: 5, stock_en_obra: 0 };

      const result = await aprobarCotizacionAction({ alquilerId: 123 });
      
      expect(result.success).toBe(true);
      expect(mockDb.updateAlquileresFn).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'ACTIVO' }),
        123
      );
      expect(mockDb.updateEquiposFn).toHaveBeenCalledWith(
        expect.objectContaining({ stock_disponible: 3, stock_en_obra: 2 }),
        1
      );
    });
  });

  describe('registrarAbonoAction', () => {
    it('debería calcular correctamente el nuevo saldo y actualizar la BD', async () => {
      mockDb.alquileres[123] = {
        id: 123,
        total: 1000,
        deposito: 200,
        saldo_pendiente: 800
      };

      const result = await registrarAbonoAction({
        alquilerId: 123,
        montoAbono: 300,
        metodoPago: 'EFECTIVO',
        referencia: 'TEST'
      });

      expect(result.success).toBe(true);
      // El total depositado pasa de 200 a 500, el saldo de 800 a 500
      expect(mockDb.updateAlquileresFn).toHaveBeenCalledWith(
        expect.objectContaining({
          deposito: 500,
          saldo_pendiente: 500
        }),
        123
      );
    });

    it('no debería dejar saldo_pendiente en valores negativos (exceso de pago)', async () => {
      mockDb.alquileres[123] = {
        id: 123,
        total: 1000,
        deposito: 900,
        saldo_pendiente: 100
      };

      const result = await registrarAbonoAction({
        alquilerId: 123,
        montoAbono: 500, // Paga más de lo que debe
        metodoPago: 'EFECTIVO',
        referencia: 'TEST'
      });

      expect(result.success).toBe(true);
      expect(mockDb.updateAlquileresFn).toHaveBeenCalledWith(
        expect.objectContaining({
          deposito: 1400,
          saldo_pendiente: 0 // Debe usar Math.max(0, ...)
        }),
        123
      );
    });
  });
});
