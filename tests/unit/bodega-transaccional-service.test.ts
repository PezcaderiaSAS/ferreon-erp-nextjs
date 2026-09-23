import { describe, it, expect, vi } from 'vitest';
import {
  BodegaTransaccionalService,
  EquipoCatalogo
} from '../../src/core/services/bodega-transaccional.service';

describe('Suite de Pruebas Unitarias: BodegaTransaccionalService (Alquileres System)', () => {
  describe('Cálculo de Métricas O(N)', () => {
    it('debe calcular métricas consolidadas exactas de inventario y valorización', () => {
      const equiposMock: EquipoCatalogo[] = [
        {
          id: 1,
          sku: 'AND-001',
          nombre: 'Andamio Tubular Estándar',
          categoria: 'Andamiaje',
          tarifaDiaria: 15000,
          valorReposicion: 250000,
          stockTotal: 20,
          stockDisponible: 12,
          stockEnObra: 6,
          stockMantenimiento: 2,
          estado: 'Disponible',
        },
        {
          id: 2,
          sku: 'TAL-002',
          nombre: 'Taladro Percutor Industrial',
          categoria: 'Herramientas Eléctricas',
          tarifaDiaria: 35000,
          valorReposicion: 800000,
          stockTotal: 5,
          stockDisponible: 0,
          stockEnObra: 5,
          stockMantenimiento: 0,
          estado: 'En Alquiler',
        },
        {
          id: 3,
          sku: 'COM-003',
          nombre: 'Compactadora Vibroapisonadora',
          categoria: 'Maquinaria Ligera',
          tarifaDiaria: 90000,
          valorReposicion: 3500000,
          stockTotal: 4,
          stockDisponible: 1,
          stockEnObra: 0,
          stockMantenimiento: 3,
          estado: 'Disponible',
        },
      ];

      const metricas = BodegaTransaccionalService.calcularMetricas(equiposMock);

      expect(metricas.totalModelos).toBe(3);
      expect(metricas.countDisponibles).toBe(2); // AND-001 y COM-003 tienen disp > 0
      expect(metricas.countEnObra).toBe(2); // AND-001 y TAL-002 tienen obra > 0
      expect(metricas.countMantenimiento).toBe(2); // AND-001 y COM-003 tienen mant > 0

      expect(metricas.totalStockFisico).toBe(29); // 20 + 5 + 4
      expect(metricas.totalDisponible).toBe(13); // 12 + 0 + 1
      expect(metricas.totalEnObra).toBe(11); // 6 + 5 + 0
      expect(metricas.totalMantenimiento).toBe(5); // 2 + 0 + 3

      // Valorización: (20 * 250,000) + (5 * 800,000) + (4 * 3,500,000) = 5,000,000 + 4,000,000 + 14,000,000 = 23,000,000
      expect(metricas.valorTotalInventario).toBe(23000000);
    });

    it('debe manejar catálogo vacío sin divisiones por cero ni errores de valor', () => {
      const metricas = BodegaTransaccionalService.calcularMetricas([]);
      expect(metricas.totalModelos).toBe(0);
      expect(metricas.totalStockFisico).toBe(0);
      expect(metricas.valorTotalInventario).toBe(0);
    });
  });

  describe('Registro de Equipos y Poka-Yoke de Integridad', () => {
    it('debe rechazar registro con SKU o nombre vacío', async () => {
      const mockClient = {};
      const res1 = await BodegaTransaccionalService.registrarEquipo(mockClient, {
        sku: '',
        nombre: 'Equipo Test',
        categoria: 'General',
        tarifaDiaria: 10000,
        stockInicial: 1,
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toContain('SKU');

      const res2 = await BodegaTransaccionalService.registrarEquipo(mockClient, {
        sku: 'EQ-TEST',
        nombre: '   ',
        categoria: 'General',
        tarifaDiaria: 10000,
        stockInicial: 1,
      });
      expect(res2.success).toBe(false);
      expect(res2.error).toContain('nombre');
    });

    it('debe rechazar registro con tarifas o stock inicial negativos', async () => {
      const mockClient = {};
      const resTarifa = await BodegaTransaccionalService.registrarEquipo(mockClient, {
        sku: 'EQ-01',
        nombre: 'Mezcladora',
        categoria: 'Construcción',
        tarifaDiaria: -5000,
        stockInicial: 2,
      });
      expect(resTarifa.success).toBe(false);
      expect(resTarifa.error).toContain('tarifa');

      const resStock = await BodegaTransaccionalService.registrarEquipo(mockClient, {
        sku: 'EQ-01',
        nombre: 'Mezcladora',
        categoria: 'Construcción',
        tarifaDiaria: 50000,
        stockInicial: -1,
      });
      expect(resStock.success).toBe(false);
      expect(resStock.error).toContain('stock');
    });

    it('debe registrar el equipo y asentar entrada inicial en Kardex si stock inicial > 0', async () => {
      const kardexInsertSpy = vi.fn().mockResolvedValue({ error: null });
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'equipos') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 101, codigo: 'ROT-001', stock_disponible: 5 },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'kardex_inventario') {
            return {
              insert: kardexInsertSpy,
            };
          }
          return {};
        }),
      };

      const result = await BodegaTransaccionalService.registrarEquipo(mockClient, {
        sku: 'rot-001',
        nombre: 'Rotomartillo SDS Max',
        categoria: 'Perforación',
        tarifaDiaria: 65000,
        valorReposicion: 1200000,
        stockInicial: 5,
        userId: 'usr_admin',
        empresaId: 'emp_01',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(101);
      expect(kardexInsertSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          equipo_id: 101,
          tipo_movimiento: 'ENTRADA_INICIAL',
          cantidad_delta: 5,
          stock_resultante: 5,
        }),
      ]);
    });
  });

  describe('Poka-Yoke de Liberación de Mantenimiento', () => {
    it('debe rechazar liberar si la cantidad solicitada excede las existencias en mantenimiento', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 50,
                  nombre: 'Generador Eléctrico 5kW',
                  stock_disponible: 2,
                  stock_mantenimiento: 1, // Solo 1 en mantenimiento
                  stock_total: 3,
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const res = await BodegaTransaccionalService.liberarMantenimiento(mockClient, {
        equipoId: 50,
        cantidad: 2, // Intenta liberar 2
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Poka-Yoke');
      expect(res.error).toContain('Solo hay 1 en mantenimiento');
    });

    it('debe liberar correctamente cuando la cantidad es válida y asentar Kardex', async () => {
      const kardexSpy = vi.fn().mockResolvedValue({ error: null });
      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 50, stock_disponible: 3, stock_mantenimiento: 0 },
              error: null,
            }),
          }),
        }),
      });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'equipos') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 50,
                      nombre: 'Generador Eléctrico 5kW',
                      stock_disponible: 2,
                      stock_mantenimiento: 1,
                      stock_total: 3,
                      empresa_id: 'emp_alquileres',
                    },
                    error: null,
                  }),
                }),
              }),
              update: updateSpy,
            };
          }
          if (table === 'kardex_inventario') {
            return {
              insert: kardexSpy,
            };
          }
          return {};
        }),
      };

      const res = await BodegaTransaccionalService.liberarMantenimiento(mockClient, {
        equipoId: 50,
        cantidad: 1,
        motivo: 'Mantenimiento preventivo completado con éxito',
        userId: 'mecanico_01',
      });

      expect(res.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stock_mantenimiento: 0,
          stock_disponible: 3,
        })
      );
      expect(kardexSpy).toHaveBeenCalledWith([
        expect.objectContaining({
          equipo_id: 50,
          tipo_movimiento: 'LIBERACION_MANTENIMIENTO',
          cantidad_delta: 1,
          stock_resultante: 3,
        }),
      ]);
    });
  });

  describe('Historial Inmutable de Kardex', () => {
    it('debe consultar y ordenar el historial de movimientos de un equipo', async () => {
      const movimientosMock = [
        { id: 10, tipo_movimiento: 'LIBERACION_MANTENIMIENTO', cantidad_delta: 1, stock_resultante: 5 },
        { id: 9, tipo_movimiento: 'SALIDA_ALQUILER', cantidad_delta: -2, stock_resultante: 4 },
        { id: 8, tipo_movimiento: 'ENTRADA_INICIAL', cantidad_delta: 6, stock_resultante: 6 },
      ];

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: movimientosMock,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };

      const res = await BodegaTransaccionalService.obtenerKardexEquipo(mockClient, 12, 10);
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(3);
      expect(res.data[0].tipo_movimiento).toBe('LIBERACION_MANTENIMIENTO');
    });
  });
});
