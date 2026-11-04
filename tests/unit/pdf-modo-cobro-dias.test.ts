import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '../../src/core/services/pdf-factura-generator.service';

describe('EnterprisePDFService - Modalidad de Cobro por Días Hábiles y Festivos (SPEC-014)', () => {
  const basePayload: DocumentoPDFPayload = {
    tipo: 'CONTRATO',
    consecutivo: 101,
    fechaEmision: '2026-11-03',
    clienteNombre: 'Constructora Santander S.A.S.',
    clienteNit: '900.123.456-7',
    clienteTelefono: '3157894512',
    items: [
      {
        nombre: 'Andamio Tubular Estándar 1.5m',
        cantidad: 4,
        fechaInicio: '2026-11-03',
        fechaFin: '2026-11-10',
        dias: 5,
        tarifaDiaria: 10000,
        subtotal: 200000,
      },
    ],
    subtotalEquipos: 200000,
    fleteEntrega: 0,
    fleteRecogida: 0,
    subtotalGeneral: 200000,
    depositoAplicado: 50000,
    totalPagar: 200000,
  };

  it('debe incluir la modalidad Hábiles L-V con días cobrables en el bloque de Logística y Respaldo', () => {
    const payload: DocumentoPDFPayload = {
      ...basePayload,
      modoCobroDias: 'HABILES_LUNES_VIERNES',
      diasCobrables: 5,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).toContain('Modalidad Cobro:');
    expect(html).toContain('Días Hábiles L-V (Excluye festivos colombianos) • 5 días facturables');
  });

  it('debe incluir la modalidad Hábiles L-S con estándar de obras civiles', () => {
    const payload: DocumentoPDFPayload = {
      ...basePayload,
      modoCobroDias: 'HABILES_LUNES_SABADO',
      diasCobrables: 6,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).toContain('Modalidad Cobro:');
    expect(html).toContain('Días Hábiles L-S (Estándar Obras) • 6 días facturables');
  });

  it('debe incluir la modalidad Calendario cuando se indica explícitamente', () => {
    const payload: DocumentoPDFPayload = {
      ...basePayload,
      modoCobroDias: 'CALENDARIO',
      diasCobrables: 8,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).toContain('Modalidad Cobro:');
    expect(html).toContain('Días Calendario Corridos • 8 días facturables');
  });

  it('no debe renderizar la etiqueta si no se especifica ninguna modalidad', () => {
    const payload: DocumentoPDFPayload = {
      ...basePayload,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).not.toContain('Modalidad Cobro:');
  });
});

