import { describe, it, expect } from 'vitest';
import {
  calcularDiasFacturablesEnPeriodo,
  calcularCortePeriodicoAlquiler,
  previsualizarLoteCortesPeriodicos,
  construirMensajeWhatsAppCuentaCobro,
  type PeriodoCorteFechas,
} from '@/core/services/facturacion-recurrente.service';

describe('FacturacionRecurrenteService — Dominio de Cortes Pro-Rata (Alquileres System)', () => {
  describe('1. Intersección Temporal de Días Facturables', () => {
    const periodoQuincena: PeriodoCorteFechas = {
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-15',
    };

    it('calcula 15 días completos cuando el contrato cubre toda la quincena', () => {
      const res = calcularDiasFacturablesEnPeriodo(
        '2026-09-01',
        '2026-11-30',
        periodoQuincena.fechaInicio,
        periodoQuincena.fechaFin
      );

      expect(res.estaEnRango).toBe(true);
      expect(res.diasFacturables).toBe(15);
      expect(res.fechaDesde).toBe('2026-10-01');
      expect(res.fechaHasta).toBe('2026-10-15');
    });

    it('calcula días parciales cuando el contrato inicia a mitad del corte (día 5 al 15 = 11 días)', () => {
      const res = calcularDiasFacturablesEnPeriodo(
        '2026-10-05',
        '2026-11-01',
        periodoQuincena.fechaInicio,
        periodoQuincena.fechaFin
      );

      expect(res.estaEnRango).toBe(true);
      expect(res.diasFacturables).toBe(11);
      expect(res.fechaDesde).toBe('2026-10-05');
      expect(res.fechaHasta).toBe('2026-10-15');
    });

    it('calcula días parciales cuando el contrato termina antes de que acabe el corte (día 1 al 10 = 10 días)', () => {
      const res = calcularDiasFacturablesEnPeriodo(
        '2026-09-15',
        '2026-10-10',
        periodoQuincena.fechaInicio,
        periodoQuincena.fechaFin
      );

      expect(res.estaEnRango).toBe(true);
      expect(res.diasFacturables).toBe(10);
      expect(res.fechaDesde).toBe('2026-10-01');
      expect(res.fechaHasta).toBe('2026-10-10');
    });

    it('retorna 0 días cuando el contrato venció antes del inicio del corte', () => {
      const res = calcularDiasFacturablesEnPeriodo(
        '2026-08-01',
        '2026-09-28',
        periodoQuincena.fechaInicio,
        periodoQuincena.fechaFin
      );

      expect(res.estaEnRango).toBe(false);
      expect(res.diasFacturables).toBe(0);
    });

    it('retorna 0 días si la fecha final de corte es menor a la fecha inicial', () => {
      const res = calcularDiasFacturablesEnPeriodo(
        '2026-10-01',
        '2026-10-30',
        '2026-10-20',
        '2026-10-10' // Rango invertido
      );

      expect(res.estaEnRango).toBe(false);
      expect(res.diasFacturables).toBe(0);
    });
  });

  describe('2. Liquidación Pro-Rata del Contrato e Impuestos', () => {
    const periodo: PeriodoCorteFechas = {
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-15', // 15 días
    };

    const mockAlquiler = {
      id: 101,
      numero_contrato: 'CC-00101',
      cliente_nombre: 'Constructora Bolívar',
      fecha_inicio: '2026-10-01',
      fecha_fin: '2026-10-31',
      detalles: [
        {
          equipo_id: 1,
          nombre: 'Andamio Certificado',
          cantidad: 2,
          tarifa_diaria: 20000, // 2 * 20.000 * 15 días = 600.000
        },
        {
          equipo_id: 2,
          nombre: 'Compactador de Suelo (Bailarina)',
          cantidad: 1,
          tarifa_diaria: 60000, // 1 * 60.000 * 15 días = 900.000
        },
      ],
      aplica_iva: true,
      aplica_retefuente: false,
    };

    it('liquida subtotales por equipo y suma con exactitud bancaria en COP', () => {
      const liq = calcularCortePeriodicoAlquiler(mockAlquiler, periodo, { aplicaIva: false });

      expect(liq.diasFacturablesPeriodo).toBe(15);
      expect(liq.items.length).toBe(2);
      expect(liq.items[0].subtotal).toBe(600000);
      expect(liq.items[1].subtotal).toBe(900000);
      expect(liq.subtotal).toBe(1500000); // 600.000 + 900.000
      expect(liq.totalNeto).toBe(1500000);
      expect(liq.esFacturable).toBe(true);
    });

    it('calcula IVA 19% en la liquidación periódica', () => {
      const liq = calcularCortePeriodicoAlquiler(mockAlquiler, periodo, {
        aplicaIva: true,
        aplicaRetenciones: false,
      });

      expect(liq.subtotal).toBe(1500000);
      expect(liq.valorIva).toBe(285000); // 1.500.000 * 0.19 = 285.000
      expect(liq.totalNeto).toBe(1785000); // 1.500.000 + 285.000
    });

    it('deduce retención en la fuente (2.5%) y ReteICA (0.966%) cuando está habilitado', () => {
      const liq = calcularCortePeriodicoAlquiler(mockAlquiler, periodo, {
        aplicaIva: true,
        aplicaRetenciones: true,
      });

      expect(liq.subtotal).toBe(1500000);
      expect(liq.valorIva).toBe(285000); // +285.000
      expect(liq.valorRetefuente).toBe(37500); // -37.500 (2.5%)
      expect(liq.valorReteica).toBe(14490); // -14.490 (0.966%)
      // Total = 1.500.000 + 285.000 - 37.500 - 14.490 = 1.733.010
      expect(liq.totalNeto).toBe(1733010);
    });
  });

  describe('3. Previsualización de Lote de Cortes para Múltiples Contratos', () => {
    const periodo: PeriodoCorteFechas = {
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-15',
    };

    const contratosMock = [
      {
        id: 1,
        numero_contrato: 'CC-001',
        estado: 'ACTIVO_EN_OBRA',
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        detalles: [{ nombre: 'Equipo 1', cantidad: 1, tarifa_diaria: 10000 }], // 150.000
      },
      {
        id: 2,
        numero_contrato: 'CC-002',
        estado: 'ACTIVO',
        fecha_inicio: '2026-10-05',
        fecha_fin: '2026-10-15',
        detalles: [{ nombre: 'Equipo 2', cantidad: 1, tarifa_diaria: 20000 }], // 11 días * 20.000 = 220.000
      },
      {
        id: 3,
        numero_contrato: 'CC-003',
        estado: 'CANCELADO', // Debe ser ignorado
        fecha_inicio: '2026-10-01',
        fecha_fin: '2026-10-31',
        detalles: [{ nombre: 'Equipo 3', cantidad: 1, tarifa_diaria: 50000 }],
      },
    ];

    it('consolida KPIs de lote excluyendo contratos inactivos o cancelados', () => {
      const lote = previsualizarLoteCortesPeriodicos(contratosMock, periodo, { aplicaIva: false });

      expect(lote.totalContratosFacturables).toBe(2);
      expect(lote.liquidaciones.length).toBe(2);
      // Días totales: 15 + 11 = 26
      expect(lote.totalDiasMaquinariaEnObra).toBe(26);
      // Monto total: 150.000 + 220.000 = 370.000
      expect(lote.totalMontoFacturable).toBe(370000);
    });
  });

  describe('4. Construcción de Mensaje de WhatsApp para Cuenta de Cobro', () => {
    it('construye mensaje estructurado con periodo de corte, días y total a pagar', () => {
      const res = construirMensajeWhatsAppCuentaCobro({
        telefonoDestino: '3124567890',
        clienteNombre: 'Consorcio Transmilenio',
        consecutivoDocumento: 'CC-PER-1045',
        numeroContrato: 'CC-00101',
        obraNombre: 'Troncal Carrera 68',
        fechaDesde: '2026-10-01',
        fechaHasta: '2026-10-15',
        diasFacturados: 15,
        total: 1785000,
        itemsResumen: [{ nombre: 'Andamio Tubular', cantidad: 4 }],
      });

      expect(res.url).toContain('https://wa.me/573124567890?text=');
      expect(res.texto).toContain('Consorcio Transmilenio');
      expect(res.texto).toContain('CC-PER-1045');
      expect(res.texto).toContain('Troncal Carrera 68');
      expect(res.texto).toContain('15 días devengados');
      expect(res.texto).toContain('1.785.000');
    });
  });
});
