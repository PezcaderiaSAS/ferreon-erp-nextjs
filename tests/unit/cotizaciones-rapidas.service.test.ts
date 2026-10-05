import { describe, it, expect } from 'vitest';
import {
  calcularTotalesCotizacion,
  calcularKPIsPipelineCotizaciones,
  construirEnlaceWhatsAppCotizacion,
  filtrarCotizacionesComerciales,
  type CotizacionItemCalculo,
  type ImpuestosCotizacionConfig,
  type RawCotizacionComercial,
} from '@/core/services/cotizacion-rapida.service';

describe('CotizacionRapidaService — Dominio Comercial y Cálculos Exactos (Alquileres System)', () => {
  describe('1. Cálculo de Totales con Integer Math y Desglose Tributario', () => {
    it('calcula subtotal exacto para múltiples equipos con distintas cantidades y días', () => {
      const items: CotizacionItemCalculo[] = [
        { nombre: 'Andamio Tubular', cantidad: 4, dias: 15, tarifaDiaria: 10000 }, // 4 * 15 * 10000 = 600.000
        { nombre: 'Rotomartillo SDS Max', cantidad: 1, dias: 5, tarifaDiaria: 80000 }, // 1 * 5 * 80000 = 400.000
      ];

      const impuestos: ImpuestosCotizacionConfig = {
        aplicaIva: false,
        tasaIva: 19.0,
        aplicaRetefuente: false,
        tasaRetefuente: 2.5,
        aplicaReteica: false,
        tasaReteica: 0.966,
      };

      const resultado = calcularTotalesCotizacion(items, impuestos, 50000, 200000);

      expect(resultado.subtotal).toBe(1000000);
      expect(resultado.valorIva).toBe(0);
      expect(resultado.valorRetefuente).toBe(0);
      expect(resultado.valorReteica).toBe(0);
      expect(resultado.valorTransporte).toBe(50000);
      expect(resultado.depositoGarantia).toBe(200000);
      expect(resultado.total).toBe(1050000); // 1.000.000 + 50.000
    });

    it('aplica IVA 19% con redondeo bancario a enteros', () => {
      const items: CotizacionItemCalculo[] = [
        { nombre: 'Generador 5kW', cantidad: 1, dias: 7, tarifaDiaria: 125000 }, // 875.000
      ];

      const impuestos: ImpuestosCotizacionConfig = {
        aplicaIva: true,
        tasaIva: 19.0,
        aplicaRetefuente: false,
        tasaRetefuente: 2.5,
        aplicaReteica: false,
        tasaReteica: 0.966,
      };

      const resultado = calcularTotalesCotizacion(items, impuestos, 0, 0);

      expect(resultado.subtotal).toBe(875000);
      expect(resultado.valorIva).toBe(166250); // 875.000 * 0.19 = 166.250
      expect(resultado.total).toBe(1041250); // 875.000 + 166.250
    });

    it('aplica retención en la fuente (2.5%) y ReteICA (0.966%) deduciéndolas del total neto', () => {
      const items: CotizacionItemCalculo[] = [
        { nombre: 'Minicargador Bobcat', cantidad: 1, dias: 10, tarifaDiaria: 350000 }, // 3.500.000
      ];

      const impuestos: ImpuestosCotizacionConfig = {
        aplicaIva: true,
        tasaIva: 19.0,
        aplicaRetefuente: true,
        tasaRetefuente: 2.5,
        aplicaReteica: true,
        tasaReteica: 0.966,
      };

      const resultado = calcularTotalesCotizacion(items, impuestos, 150000, 500000);

      expect(resultado.subtotal).toBe(3500000);
      expect(resultado.valorIva).toBe(665000); // 3.500.000 * 0.19 = 665.000
      expect(resultado.valorRetefuente).toBe(87500); // 3.500.000 * 0.025 = 87.500
      expect(resultado.valorReteica).toBe(33810); // 3.500.000 * 0.00966 = 33.810
      expect(resultado.valorTransporte).toBe(150000);
      // Total = 3.500.000 + 150.000 + 665.000 - 87.500 - 33.810 = 4.193.690
      expect(resultado.total).toBe(4193690);
    });

    it('maneja listas vacías o valores cero sin arrojar NaN o errores', () => {
      const impuestos: ImpuestosCotizacionConfig = {
        aplicaIva: true,
        tasaIva: 19.0,
        aplicaRetefuente: false,
        tasaRetefuente: 0,
        aplicaReteica: false,
        tasaReteica: 0,
      };

      const resultado = calcularTotalesCotizacion([], impuestos, 0, 0);

      expect(resultado.subtotal).toBe(0);
      expect(resultado.valorIva).toBe(0);
      expect(resultado.total).toBe(0);
    });
  });

  describe('2. KPIs del Pipeline Comercial de Cotizaciones', () => {
    const mockCotizaciones: RawCotizacionComercial[] = [
      {
        id: 'cot-1',
        consecutivo: 'COT-0001',
        cliente_nombre: 'Constructora Bolívar',
        fecha_emision: '2026-10-01',
        fecha_vencimiento: '2026-10-15',
        subtotal: 2000000,
        total: 2380000,
        estado: 'CONVERTIDA', // Convertida a contrato
        alquiler_id: 101,
      },
      {
        id: 'cot-2',
        consecutivo: 'COT-0002',
        cliente_nombre: 'Ing. Pedro Pablo',
        fecha_emision: '2026-10-02',
        fecha_vencimiento: '2026-10-20',
        subtotal: 1000000,
        total: 1190000,
        estado: 'APROBADA', // Aprobada por cliente
      },
      {
        id: 'cot-3',
        consecutivo: 'COT-0003',
        cliente_nombre: 'Consorcio Autopista',
        fecha_emision: '2026-10-02',
        fecha_vencimiento: '2026-10-10',
        subtotal: 5000000,
        total: 5950000,
        estado: 'ENVIADA', // Pendiente vigente
      },
      {
        id: 'cot-4',
        consecutivo: 'COT-0004',
        cliente_nombre: 'Ferretería Central',
        fecha_emision: '2026-09-01',
        fecha_vencimiento: '2026-09-15', // Vencida
        subtotal: 800000,
        total: 800000,
        estado: 'BORRADOR',
      },
    ];

    it('calcula métricas de volumen, conversión y vigencia con precisión', () => {
      const kpis = calcularKPIsPipelineCotizaciones(mockCotizaciones, '2026-10-03');

      expect(kpis.totalCotizaciones).toBe(4);
      expect(kpis.totalMontoCotizado).toBe(10320000); // 2.380.000 + 1.190.000 + 5.950.000 + 800.000
      expect(kpis.cotizacionesConvertidas).toBe(1);
      expect(kpis.cotizacionesAprobadas).toBe(1);
      // Vigentes: cot-2 (aprobada), cot-3 (enviada, vence 10-10 >= 10-03). cot-4 venció 09-15.
      expect(kpis.cotizacionesVigentes).toBe(2);
      // Tasa de conversión: 1 / 4 = 25%
      expect(kpis.tasaConversionPorcentaje).toBe(25);
    });
  });

  describe('3. Integración y Construcción de Enlace para WhatsApp', () => {
    it('construye texto y URL wa.me con prefijo internacional 57 para Colombia', () => {
      const res = construirEnlaceWhatsAppCotizacion({
        telefonoDestino: '3105551234',
        clienteNombre: 'Mario Casas',
        consecutivo: 'COT-1045',
        items: [
          { nombre: 'Vibrador de Concreto', cantidad: 2, dias: 7 },
        ],
        total: 350000,
        fechaVencimiento: '2026-10-15',
        empresaNombre: 'Alquileres System',
      });

      expect(res.url).toContain('https://wa.me/573105551234?text=');
      expect(res.texto).toContain('Mario Casas');
      expect(res.texto).toContain('#COT-1045');
      expect(res.texto).toContain('Vibrador de Concreto');
      expect(res.texto).toContain('350.000');
    });

    it('tolera teléfonos que ya traen prefijo internacional 57 o espacios', () => {
      const res = construirEnlaceWhatsAppCotizacion({
        telefonoDestino: '+57 (311) 987-6543',
        clienteNombre: 'Constructora Alfa',
        consecutivo: 'COT-1046',
        items: [],
        total: 1200000,
      });

      expect(res.url).toContain('https://wa.me/573119876543?text=');
    });
  });

  describe('4. Filtrado Multicriterio de Cotizaciones', () => {
    const listado: RawCotizacionComercial[] = [
      {
        id: '1',
        consecutivo: 'COT-010',
        cliente_nombre: 'Ingeniería Andina',
        cliente_documento: '900123456',
        fecha_emision: '2026-10-01',
        fecha_vencimiento: '2026-10-20',
        subtotal: 500000,
        total: 595000,
        estado: 'PENDIENTE',
      },
      {
        id: '2',
        consecutivo: 'COT-011',
        cliente_nombre: 'Obras Civiles S.A.S',
        obra_nombre: 'Puente Peatonal Chía',
        fecha_emision: '2026-10-01',
        fecha_vencimiento: '2026-10-20',
        subtotal: 1500000,
        total: 1785000,
        estado: 'CONVERTIDA',
      },
    ];

    it('filtra por término de búsqueda en cliente u obra', () => {
      const res1 = filtrarCotizacionesComerciales(listado, 'TODOS', 'Andina');
      expect(res1.length).toBe(1);
      expect(res1[0].consecutivo).toBe('COT-010');

      const res2 = filtrarCotizacionesComerciales(listado, 'TODOS', 'Chía');
      expect(res2.length).toBe(1);
      expect(res2[0].consecutivo).toBe('COT-011');
    });

    it('filtra por estado PENDIENTES o CONVERTIDAS', () => {
      const resPend = filtrarCotizacionesComerciales(listado, 'PENDIENTES', '');
      expect(resPend.length).toBe(1);
      expect(resPend[0].consecutivo).toBe('COT-010');

      const resConv = filtrarCotizacionesComerciales(listado, 'CONVERTIDAS', '');
      expect(resConv.length).toBe(1);
      expect(resConv[0].consecutivo).toBe('COT-011');
    });
  });
});
