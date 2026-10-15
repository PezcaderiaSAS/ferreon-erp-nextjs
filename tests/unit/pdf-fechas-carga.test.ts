import { describe, it, expect } from 'vitest';
import { alquilerEntityToAlquilerUI } from '@/lib/mappers';
import { sanitizarYOrdenarLineas } from '@/components/pdf/ContratoAlquilerPDF';
import { EnterprisePDFService, DocumentoPDFPayload } from '@/core/services/pdf-factura-generator.service';
import { construirPayloadFacturaPDF, mapearAlquileresAFacturas } from '@/core/services/facturacion-transaccional.service';
import { resolverFechaYHoraDocumento, formatearFechaLocal, formatearFechaISO, calcularDiasEntreFechas } from '@/core/utils/fechas';

describe('Auditoría Integral de Fechas y Carga de Datos para PDFs (Speckit Workflow)', () => {
  describe('1. Mapeador DB -> Dominio (alquilerEntityToAlquilerUI)', () => {
    it('preserva exactamente la fechaInicio y fechaFin sin desfasajes de zona horaria UTC-5', () => {
      const dbEntity = {
        id: 'alq-test-1',
        consecutivo: 101,
        cliente_id: 'cli-1',
        estado: 'ACTIVO',
        created_at: '2026-10-15T00:00:00.000Z',
        alquiler_detalles: [
          {
            id: 'det-1',
            equipo_id: 'eq-1',
            cantidad: 2,
            tarifa_aplicada: 50000,
            dias_contratados: 5,
            fecha_inicio: '2026-10-15',
            fecha_fin: '2026-10-20',
            equipos: { nombre: 'Andamio Tubular', codigo: 'AND-01' },
          },
        ],
      };

      const mapped = alquilerEntityToAlquilerUI(dbEntity);
      expect(mapped.items).toHaveLength(1);
      const item = mapped.items[0];

      // Verificación estricta: NO debe retroceder a 2026-10-14
      expect(item.fechaInicio).toBe('2026-10-15');
      expect(item.fechaFin).toBe('2026-10-20');
      expect(item.fechaFinEstimada).toBe('2026-10-20');
    });

    it('maneja fechas retroactivas en el pasado sin alterarlas ni truncarlas', () => {
      const dbEntity = {
        id: 'alq-test-past',
        consecutivo: 102,
        cliente_id: 'cli-2',
        created_at: '2025-01-10T12:00:00.000Z',
        detalles: [
          {
            id: 'det-past',
            equipo_id: 'eq-2',
            cantidad: 1,
            tarifa_diaria: 35000,
            fecha_inicio: '2025-01-10',
            fecha_fin: '2025-01-15',
            equipos: { nombre: 'Bailarina Compactadora' },
          },
        ],
      };

      const mapped = alquilerEntityToAlquilerUI(dbEntity);
      expect(mapped.items[0].fechaInicio).toBe('2025-01-10');
      expect(mapped.items[0].fechaFin).toBe('2025-01-15');
    });
  });

  describe('2. Sanitizador y Ordenador de Líneas para PDF (@react-pdf)', () => {
    it('ordena cronológicamente por fecha_inicio ASC y formatea a DD/MM/YYYY', () => {
      const rawDetalles = [
        {
          id: 'linea-tardia',
          fecha_inicio: '2026-10-25',
          fecha_fin: '2026-10-30',
          cantidad: 1,
          tarifa_aplicada: 40000,
          equipos: { nombre: 'Mezcladora 1 Bulto' },
        },
        {
          id: 'linea-temprana',
          fecha_inicio: '2026-10-15',
          fecha_fin: '2026-10-20',
          cantidad: 2,
          tarifa_aplicada: 25000,
          equipos: { nombre: 'Taladro Percutor' },
        },
      ];

      const procesadas = sanitizarYOrdenarLineas(rawDetalles, '2026-10-15');
      expect(procesadas).toHaveLength(2);
      expect(procesadas[0].idOriginal).toBe('linea-temprana');
      expect(procesadas[0].fechaInicio).toBe('15/10/2026');
      expect(procesadas[0].fechaFin).toBe('20/10/2026');
      expect(procesadas[0].dias).toBe(5);

      expect(procesadas[1].idOriginal).toBe('linea-tardia');
      expect(procesadas[1].fechaInicio).toBe('25/10/2026');
      expect(procesadas[1].fechaFin).toBe('30/10/2026');
      expect(procesadas[1].dias).toBe(5);
    });

    it('asigna guardia de mínimo 1 día cuando la fecha de inicio y fin son el mismo día', () => {
      const rawDetalles = [
        {
          id: 'linea-mismo-dia',
          fecha_inicio: '2026-10-15',
          fecha_fin: '2026-10-15',
          cantidad: 1,
          tarifa_aplicada: 60000,
          equipos: { nombre: 'Generador 5kW' },
        },
      ];

      const procesadas = sanitizarYOrdenarLineas(rawDetalles);
      expect(procesadas[0].dias).toBe(1);
      expect(procesadas[0].subtotal).toBe(60000);
    });
  });

  describe('3. Generador HTML de Documentos (EnterprisePDFService)', () => {
    it('inyecta las fechas sin desfase en el HTML para visualización e impresión', () => {
      const payload: DocumentoPDFPayload = {
        tipo: 'COTIZACION',
        consecutivo: 'COT-00105',
        fechaEmision: '2026-10-15',
        clienteNombre: 'Constructora Bolívar S.A.S.',
        clienteNit: '900.123.456-7',
        items: [
          {
            cantidad: 3,
            nombre: 'Andamio Certificado',
            fechaInicio: '2026-10-15',
            fechaFin: '2026-10-25',
            dias: 10,
            tarifaDiaria: 15000,
            subtotal: 450000,
          },
        ],
        subtotalEquipos: 450000,
        fleteEntrega: 30000,
        fleteRecogida: 30000,
        subtotalGeneral: 510000,
        depositoAplicado: 100000,
        totalPagar: 510000,
      };

      const html = EnterprisePDFService.generarHTMLDocumento(payload);

      // Verificamos que la fecha formateada en pantalla sea 15/10/2026 y no 14/10/2026
      expect(html).toContain('15/10/2026');
      expect(html).toContain('25/10/2026');
      expect(html).toContain('Constructora Bolívar S.A.S.');
      expect(html).toContain('COTIZACIÓN COMERCIAL DE OBRA');
    });
  });

  describe('4. Servicio de Facturación Transaccional (construirPayloadFacturaPDF)', () => {
    it('construye los renglones de factura con fechas ISO exactas y cálculo de días consistente', () => {
      const facturaMock = {
        id: 'FAC-0050',
        cliente: 'Ingeniería Civil Andina',
        fechaEmision: '15/10/2026',
        vencimiento: '30/10/2026',
        total: 800000,
        totalPagado: 400000,
        saldoPendiente: 400000,
        estado: 'Pendiente' as const,
        alquilerOriginal: {
          id: '50',
          consecutivo: 50,
          cliente_id: 'cli-50',
          created_at: '2026-10-15T10:30:00.000Z',
          fecha_vencimiento: '2026-10-30',
          detalles: [
            {
              id: 'det-fac-1',
              equipo_id: 'eq-1',
              cantidad: 2,
              tarifa_aplicada: 40000,
              fecha_inicio: '2026-10-15',
              fecha_fin: '2026-10-25',
              equipos: { nombre: 'Vibrador de Concreto', codigo: 'VIB-01' },
            },
          ],
        } as any,
      };

      const payload = construirPayloadFacturaPDF(facturaMock, null);
      expect(payload.items).toHaveLength(1);
      const item = payload.items[0];

      expect(item.fechaInicio).toBe('2026-10-15');
      expect(item.fechaFin).toBe('2026-10-25');
      expect(item.dias).toBe(10);
    });

    it('formatea fechaEmision y vencimiento sin desfase en mapearAlquileresAFacturas', () => {
      const alquileres = [
        {
          id: 77,
          consecutivo: 77,
          created_at: '2026-10-15T00:00:00.000Z',
          fecha_vencimiento: '2026-10-31',
          clienteNombre: 'Constructora Capital',
          total: 500000,
        },
      ];

      const facturas = mapearAlquileresAFacturas(alquileres);
      expect(facturas).toHaveLength(1);
      expect(facturas[0].fechaEmision).toBe('15/10/2026');
      expect(facturas[0].vencimiento).toBe('31/10/2026');
    });
  });

  describe('5. Resolutor de Fecha y Hora Canónica (resolverFechaYHoraDocumento)', () => {
    it('resuelve correctamente fechas tipo string puro YYYY-MM-DD sin retroceder en Colombia', () => {
      const { fecha, hora } = resolverFechaYHoraDocumento({
        fechaEmision: '2026-10-15',
      });

      expect(fecha).toBe('15/10/2026');
      expect(hora).toBeTruthy();
    });

    it('resuelve correctamente fechas tipo ISO con timestamp', () => {
      const { fecha, hora } = resolverFechaYHoraDocumento({
        created_at: '2026-10-15T14:30:00Z',
      });

      expect(fecha).toBe('15/10/2026');
      expect(hora).toBeTruthy();
    });
  });
});
