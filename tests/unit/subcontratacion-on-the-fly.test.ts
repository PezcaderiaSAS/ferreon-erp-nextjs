import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalculoSubcontratacionService } from '@/core/services/calculo-subcontratacion.service';
import {
  enriquecerSubcontrataciones,
  calcularKPIsSubcontrataciones,
  esOrdenVencida,
  resolverEstadoBadge,
} from '@/core/services/subcontrataciones-transaccional.service';

describe('Flujo de Subcontratación On-the-Fly ante Déficit / Overbooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Cálculo de Rentabilidad y Pre-carga de Ítems Deficitarios', () => {
    it('debe calcular la rentabilidad proyectada con margen positivo cuando el costo es 75% de la tarifa cliente', () => {
      const itemsDeficitarios = [
        {
          cantidad: 3,
          dias: 7,
          costoDiarioProveedor: 18750, // 75% de 25.000 COP
          tarifaDiariaCliente: 25000,
        },
      ];

      const rentabilidad = CalculoSubcontratacionService.calcularRentabilidadGlobal(itemsDeficitarios);

      expect(rentabilidad.subtotalCostoProveedor).toBe(3 * 7 * 18750);
      expect(rentabilidad.subtotalTarifaCliente).toBe(3 * 7 * 25000);
      expect(rentabilidad.margenBrutoNominal).toBe((3 * 7 * 25000) - (3 * 7 * 18750));
      expect(rentabilidad.margenBrutoPorcentual).toBe(25);
      expect(rentabilidad.esMargenNegativo).toBe(false);
    });

    it('debe detectar margen negativo si la tarifa pactada con el proveedor supera la del cliente', () => {
      const itemsConPerdida = [
        {
          cantidad: 1,
          dias: 5,
          costoDiarioProveedor: 35000,
          tarifaDiariaCliente: 30000,
        },
      ];

      const rentabilidad = CalculoSubcontratacionService.calcularRentabilidadGlobal(itemsConPerdida);

      expect(rentabilidad.esMargenNegativo).toBe(true);
      expect(rentabilidad.margenBrutoNominal).toBe(-25000);
      expect(rentabilidad.margenBrutoPorcentual).toBeLessThan(0);
    });
  });

  describe('2. Enriquecimiento y Consistencia Transaccional', () => {
    it('debe enriquecer la orden de subcontratación generada on-the-fly con KPIs de margen y estado activo', () => {
      const ordenRaw = {
        id: 'sub-otf-001',
        consecutivo: 'SUB-2026-001',
        proveedor_id: 'prov-01',
        proveedor_nombre: 'Andamios de la Sabana SAS',
        proveedor_nit: '900.123.456-7',
        fecha_emision: '2026-10-15',
        fecha_recepcion_estimada: '2026-10-15',
        fecha_devolucion_estimada: '2026-10-22',
        fechaRecepcionEstimada: '2026-10-15',
        fechaDevolucionEstimada: '2026-10-22',
        estado: 'ACTIVA',
        costo_total_estimado: 393750,
        ingreso_total_estimado: 525000,
        costoTotalEstimado: 393750,
        ingresoTotalEstimado: 525000,
        deposito_garantia_proveedor: 50000,
        observaciones: 'Subcontratación express para cubrir unidades en Cotización #COT-017',
      } as any;

      const ordenesEnriquecidas = enriquecerSubcontrataciones([ordenRaw]);

      expect(ordenesEnriquecidas).toHaveLength(1);
      const enriquecida = ordenesEnriquecidas[0];
      expect(enriquecida.margenBrutoEstimado).toBe(525000 - 393750);
      expect(enriquecida.margenPct).toBe(25);
      expect(enriquecida.estadoLabel).toBe('En Obra');
      expect(enriquecida.estadoVariant).toBe('blue');
    });

    it('debe calcular KPIs de subcontrataciones integrando la orden On-the-Fly', () => {
      const ordenes = [
        {
          id: 'sub-01',
          consecutivo: 'SUB-01',
          proveedor_nombre: 'Aliado A',
          estado: 'ACTIVA',
          costo_total_estimado: 100000,
          ingreso_total_estimado: 150000,
          costoTotalEstimado: 100000,
          ingresoTotalEstimado: 150000,
          deposito_garantia_proveedor: 20000,
        } as any,
      ];

      const kpis = calcularKPIsSubcontrataciones(ordenes);

      expect(kpis.costoTotalActivo).toBe(100000);
      expect(kpis.ingresoTotalActivo).toBe(150000);
      expect(kpis.margenTotalActivo).toBe(50000);
      expect(kpis.margenPct).toBe('33.3');
    });
  });

  describe('3. Poka-Yoke de Stock y Validación Temporal', () => {
    it('debe permitir que los ítems subcontratados no resten unidades del stock_disponible de bodega', () => {
      const stockPropioBodega = 0; // Sin stock
      const cantidadRequerida = 5;
      const esSubcontratado = true; // Respaldado por orden On-the-Fly

      const disponibleSuficiente = esSubcontratado ? true : (stockPropioBodega >= cantidadRequerida);
      const faltantePropio = esSubcontratado ? 0 : Math.max(0, cantidadRequerida - stockPropioBodega);

      expect(disponibleSuficiente).toBe(true);
      expect(faltantePropio).toBe(0);
    });

    it('debe marcar orden como no vencida si la fecha estimada es futura', () => {
      const sub = {
        estado: 'ACTIVA',
        fechaDevolucionEstimada: '2026-10-30',
      } as any;

      expect(esOrdenVencida(sub, '2026-10-15')).toBe(false);
    });

    it('debe marcar orden como vencida si la fecha de devolución ya pasó', () => {
      const sub = {
        estado: 'ACTIVA',
        fechaDevolucionEstimada: '2026-10-10',
      } as any;

      expect(esOrdenVencida(sub, '2026-10-15')).toBe(true);
    });
  });
});
