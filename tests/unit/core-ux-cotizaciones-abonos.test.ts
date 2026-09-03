import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aprobarCotizacionAction, registrarAbonoAction } from '../../src/app/actions/alquileres';
import { supabaseServer } from '../../src/infrastructure/persistence/supabase/server';

// Mock simple de Supabase
vi.mock('../../src/infrastructure/persistence/supabase/server', () => {
  const selectMock = vi.fn();
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const singleMock = vi.fn();
  
  return {
    supabaseServer: {
      from: vi.fn(() => ({
        select: selectMock.mockReturnThis(),
        update: updateMock.mockReturnThis(),
        eq: eqMock.mockReturnThis(),
        single: singleMock,
      })),
    },
  };
});

describe('Core UX: Cotizaciones y Abonos (Server Actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('aprobarCotizacionAction', () => {
    it('debería fallar si no hay stock suficiente para activar la cotización', async () => {
      // Configuramos el mock para que devuelva un alquiler con stock menor a lo solicitado
      const mockAlquiler = {
        id: 'alq-123',
        estado: 'COTIZACION',
        alquiler_detalles: [
          {
            cantidad: 5,
            equipos: { stock_disponible: 3, id: 'eq-1', nombre: 'Andamio' }
          }
        ]
      };

      const { from } = supabaseServer;
      const selectChain = from('alquileres').select();
      (selectChain.single as any).mockResolvedValueOnce({ data: mockAlquiler, error: null });

      const result = await aprobarCotizacionAction({ alquilerId: 'alq-123' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Stock insuficiente');
    });

    it('debería aprobar y descontar stock si hay disponibilidad', async () => {
      const mockAlquiler = {
        id: 'alq-123',
        estado: 'COTIZACION',
        alquiler_detalles: [
          {
            cantidad: 2,
            equipos: { stock_disponible: 5, id: 'eq-1', nombre: 'Andamio' }
          }
        ]
      };

      const { from } = supabaseServer;
      const selectChain = from('alquileres').select();
      (selectChain.single as any).mockResolvedValueOnce({ data: mockAlquiler, error: null });
      
      // Mocks para las actualizaciones exitosas
      (from('alquileres').update as any)().eq().single.mockResolvedValueOnce({ data: { id: 'alq-123' }, error: null });
      (from('equipos').update as any)().eq().single.mockResolvedValue({ error: null });

      const result = await aprobarCotizacionAction({ alquilerId: 'alq-123' });
      
      expect(result.success).toBe(true);
      expect(from('alquileres').update).toHaveBeenCalledWith({ estado: 'ACTIVO' });
      expect(from('equipos').update).toHaveBeenCalledWith({ stock_disponible: 3 }); // 5 - 2
    });
  });

  describe('registrarAbonoAction', () => {
    it('debería calcular correctamente el nuevo saldo y actualizar la BD', async () => {
      const mockAlquiler = {
        id: 'alq-123',
        total: 1000,
        deposito: 200,
        saldo_pendiente: 800
      };

      const { from } = supabaseServer;
      const selectChain = from('alquileres').select();
      (selectChain.single as any).mockResolvedValueOnce({ data: mockAlquiler, error: null });
      (from('alquileres').update as any)().eq().single.mockResolvedValueOnce({ error: null });

      const result = await registrarAbonoAction({
        alquilerId: 'alq-123',
        montoAbono: 300,
        metodoPago: 'EFECTIVO',
        referencia: 'TEST'
      });

      expect(result.success).toBe(true);
      // El total depositado pasa de 200 a 500, el saldo de 800 a 500
      expect(from('alquileres').update).toHaveBeenCalledWith(
        expect.objectContaining({
          deposito: 500,
          saldo_pendiente: 500
        })
      );
    });

    it('no debería dejar saldo_pendiente en valores negativos (exceso de pago)', async () => {
      const mockAlquiler = {
        id: 'alq-123',
        total: 1000,
        deposito: 900,
        saldo_pendiente: 100
      };

      const { from } = supabaseServer;
      const selectChain = from('alquileres').select();
      (selectChain.single as any).mockResolvedValueOnce({ data: mockAlquiler, error: null });
      (from('alquileres').update as any)().eq().single.mockResolvedValueOnce({ error: null });

      const result = await registrarAbonoAction({
        alquilerId: 'alq-123',
        montoAbono: 500, // Paga más de lo que debe
        metodoPago: 'EFECTIVO',
        referencia: 'TEST'
      });

      expect(result.success).toBe(true);
      expect(from('alquileres').update).toHaveBeenCalledWith(
        expect.objectContaining({
          deposito: 1400,
          saldo_pendiente: 0 // Debe usar Math.max(0, ...)
        })
      );
    });
  });
});
