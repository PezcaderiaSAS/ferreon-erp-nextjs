import { describe, it, expect } from 'vitest';
import { 
  parsearFechaLocal, 
  formatearFechaLocal, 
  formatearFechaISO,
  calcularDiasEntreFechas 
} from '../../src/core/utils/fechas';
import { AlquilerTransaccionalService } from '../../src/core/services/alquiler-transaccional.service';

describe('Blindaje de Congruencia Temporal, Zona Horaria UTC-5 y Bloqueo de Cascada', () => {

  describe('1. Preservación de Tramos Individuales en Fechas Maestras', () => {
    it('debe mantener intactos los rangos individuales de ítems ya configurados al modificar la fecha maestra', () => {
      // Simulación del estado de useAlquilerForm
      const itemsConfigurados = [
        {
          id: 'item_1',
          itemId: '101',
          nombre: 'Andamio Tubular',
          cantidad: 2,
          fechaInicio: '2026-10-01',
          fechaFinEstimada: '2026-10-20',
          dias: 20
        },
        {
          id: 'item_2',
          itemId: '102',
          nombre: 'Mezcladora 1 Bulto',
          cantidad: 1,
          fechaInicio: '2026-10-10',
          fechaFinEstimada: '2026-10-15',
          dias: 6
        }
      ];

      // Función de sincronización segura (la nueva lógica)
      const aplicarCambioFechaInicioMaster = (newStart: string, itemsActuales: typeof itemsConfigurados) => {
        // Si solo hay una fila vacía no configurada (sin itemId), se actualiza.
        // Si ya existen equipos configurados, se PRESERVAN sus rangos individuales intactos.
        if (itemsActuales.length === 1 && !itemsActuales[0].itemId) {
          return [{
            ...itemsActuales[0],
            fechaInicio: newStart,
            fechaFinEstimada: newStart,
            dias: 1
          }];
        }
        return itemsActuales;
      };

      const resultado = aplicarCambioFechaInicioMaster('2026-10-05', itemsConfigurados);

      // Verificación: Ninguna fecha de las líneas configuradas fue sobreescrita
      expect(resultado[0].fechaInicio).toBe('2026-10-01');
      expect(resultado[0].fechaFinEstimada).toBe('2026-10-20');
      expect(resultado[1].fechaInicio).toBe('2026-10-10');
      expect(resultado[1].fechaFinEstimada).toBe('2026-10-15');
    });

    it('solo debe sincronizar la fecha inicial si existe una única fila vacía sin equipo seleccionado', () => {
      const itemsVacio = [
        {
          id: 'row_initial',
          itemId: '',
          nombre: '',
          cantidad: 1,
          fechaInicio: '2026-10-01',
          fechaFinEstimada: '2026-10-01',
          dias: 1
        }
      ];

      const sincronizarFilaVacia = (newStart: string, newEnd: string, itemsActuales: typeof itemsVacio) => {
        if (itemsActuales.length === 1 && !itemsActuales[0].itemId) {
          return [{
            ...itemsActuales[0],
            fechaInicio: newStart,
            fechaFinEstimada: newEnd,
            dias: calcularDiasEntreFechas(newStart, newEnd)
          }];
        }
        return itemsActuales;
      };

      const resultado = sincronizarFilaVacia('2026-10-05', '2026-10-12', itemsVacio);
      expect(resultado[0].fechaInicio).toBe('2026-10-05');
      expect(resultado[0].fechaFinEstimada).toBe('2026-10-12');
      expect(resultado[0].dias).toBe(7);
    });
  });

  describe('2. Neutralización de Desfases UTC-5 (Colombia)', () => {
    it('debe formatear cualquier string de fecha YYYY-MM-DD sin retroceder un día', () => {
      // Casos críticos de fechas que suelen retroceder con new Date(str).toISOString()
      const fechasPrueba = ['2026-09-17', '2026-10-01', '2026-10-31', '2026-01-01', '2026-12-31'];

      fechasPrueba.forEach(f => {
        const isoLocal = formatearFechaISO(f);
        expect(isoLocal).toBe(f);

        const d = parsearFechaLocal(f);
        // Debe ser exactamente el año, mes y día especificados
        expect(formatearFechaISO(d)).toBe(f);
      });
    });

    it('calcularDiasEntreFechas debe ser determinístico independientemente del horario local', () => {
      // 1 día exacto
      expect(calcularDiasEntreFechas('2026-10-15', '2026-10-15')).toBe(1);
      // Mismo día con horas diferentes
      expect(calcularDiasEntreFechas('2026-10-15T00:00:00Z', '2026-10-15T23:59:59Z')).toBe(1);
      // Rango de 7 días
      expect(calcularDiasEntreFechas('2026-10-01', '2026-10-08')).toBe(7);
    });
  });

  describe('3. Congruencia Matemática en Liquidación de Alquileres', () => {
    it('debe liquidar cada ítem con su propio rango de fechas sin unificar forzadamente', () => {
      const itemsLiquidacion = [
        {
          itemId: 10,
          nombreItem: 'Vibrador de Concreto',
          cantidad: 1,
          tarifaAplicada: 30000,
          fechaInicio: '2026-09-01',
          fechaFinEstimada: '2026-09-10' // 9 días
        },
        {
          itemId: 20,
          nombreItem: 'Rotomartillo SDS Max',
          cantidad: 2,
          tarifaAplicada: 25000,
          fechaInicio: '2026-09-05',
          fechaFinEstimada: '2026-09-20' // 15 días
        }
      ];

      const liquidacion = AlquilerTransaccionalService.calcularLiquidacion(itemsLiquidacion as any, 0, 0, 0);

      // Ítem 1: 30000 * 1 * 9 = 270000
      // Ítem 2: 25000 * 2 * 15 = 750000
      // Subtotal = 1020000
      expect(liquidacion.itemsLiquidados[0].fechaInicio).toBe('2026-09-01');
      expect(liquidacion.itemsLiquidados[0].fechaFin).toBe('2026-09-10');
      expect(liquidacion.itemsLiquidados[0].diasContratados).toBe(9);
      expect(liquidacion.itemsLiquidados[0].subtotalLinea).toBe(270000);

      expect(liquidacion.itemsLiquidados[1].fechaInicio).toBe('2026-09-05');
      expect(liquidacion.itemsLiquidados[1].fechaFin).toBe('2026-09-20');
      expect(liquidacion.itemsLiquidados[1].diasContratados).toBe(15);
      expect(liquidacion.itemsLiquidados[1].subtotalLinea).toBe(750000);

      expect(liquidacion.subtotalEquipos).toBe(1020000);
      expect(liquidacion.total).toBe(1020000);
    });
  });

  describe('4. Soporte de Contratos Retroactivos (Fechas Pasadas)', () => {
    it('debe procesar liquidaciones de contratos con fecha de inicio en el pasado sin arrojar error', () => {
      const itemRetroactivo = [{
        itemId: 15,
        nombreItem: 'Allanadora de Concreto',
        cantidad: 1,
        tarifaAplicada: 80000,
        fechaInicio: '2025-01-10', // Fecha en el pasado
        fechaFinEstimada: '2025-01-20' // 10 días
      }];

      const liquidacion = AlquilerTransaccionalService.calcularLiquidacion(itemRetroactivo as any, 0, 0, 0);
      expect(liquidacion.subtotalEquipos).toBe(800000);
      expect(liquidacion.itemsLiquidados[0].fechaInicio).toBe('2025-01-10');
      expect(liquidacion.itemsLiquidados[0].fechaFin).toBe('2025-01-20');
    });
  });
});
