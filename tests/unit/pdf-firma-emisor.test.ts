import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '../../src/core/services/pdf-factura-generator.service';
import { DEFAULT_EMPRESA_CONFIG } from '../../src/core/domain/entities/empresa-config';

describe('TASK-011: Firma Electrónica / Digital del Emisor en Cuentas de Cobro y Contratos', () => {
  const FIRMA_BASE64_VALIDA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  const basePayload: DocumentoPDFPayload = {
    tipo: "CUENTA_COBRO",
    consecutivo: "CC-2026-001",
    fechaEmision: "2026-10-22T08:00:00.000Z",
    clienteNombre: "CONSTRUCTORA CAPITAL SAS",
    clienteNit: "900.123.456-1",
    clienteTelefono: "3001234567",
    items: [
      {
        cantidad: 1,
        nombre: "MEZCLADORA DE CONCRETO 2 BULTOS",
        fechaInicio: "2026-10-01",
        fechaFin: "2026-10-15",
        dias: 14,
        tarifaDiaria: 50000,
        subtotal: 700000,
      }
    ],
    subtotalEquipos: 700000,
    fleteEntrega: 30000,
    fleteRecogida: 30000,
    subtotalGeneral: 760000,
    depositoAplicado: 100000,
    totalPagar: 660000,
    empresa: {
      ...DEFAULT_EMPRESA_CONFIG,
      razonSocial: "ALQUILERES SYSTEM SAS",
      firmaDigitalBase64: FIRMA_BASE64_VALIDA,
    }
  };

  it('debe estampar la firma digital en la Cuenta de Cobro por defecto (incluirFirmaEmisor no especificado)', () => {
    const html = EnterprisePDFService.generarHTMLDocumento(basePayload);
    
    expect(html).toContain('alt="Firma del emisor"');
    expect(html).toContain(`src="${FIRMA_BASE64_VALIDA}"`);
    expect(html).toContain('Firma Autorizada y Sello');
  });

  it('debe estampar la firma digital explícitamente cuando incluirFirmaEmisor === true', () => {
    const payloadConFirma: DocumentoPDFPayload = {
      ...basePayload,
      incluirFirmaEmisor: true,
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadConFirma);

    expect(html).toContain('alt="Firma del emisor"');
    expect(html).toContain(`src="${FIRMA_BASE64_VALIDA}"`);
  });

  it('NO debe estampar la firma si el usuario desmarca el switch (incluirFirmaEmisor === false)', () => {
    const payloadSinFirma: DocumentoPDFPayload = {
      ...basePayload,
      incluirFirmaEmisor: false,
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadSinFirma);

    expect(html).not.toContain('alt="Firma del emisor"');
    expect(html).not.toContain(FIRMA_BASE64_VALIDA);
    expect(html).toContain('Firma Autorizada y Sello');
  });

  it('debe estampar la firma en CONTRATO cuando incluirFirmaEmisor === true', () => {
    const payloadContrato: DocumentoPDFPayload = {
      ...basePayload,
      tipo: "CONTRATO",
      consecutivo: "CTR-2026-050",
      incluirFirmaEmisor: true,
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadContrato);

    expect(html).toContain('CONTRATO DE ALQUILER');
    expect(html).toContain('alt="Firma del emisor"');
    expect(html).toContain(`src="${FIRMA_BASE64_VALIDA}"`);
  });

  it('debe degradar grácilmente si la empresa no tiene firmaDigitalBase64 registrada', () => {
    const payloadSinConfigFirma: DocumentoPDFPayload = {
      ...basePayload,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        firmaDigitalBase64: "",
      },
      incluirFirmaEmisor: true,
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadSinConfigFirma);

    expect(html).not.toContain('alt="Firma del emisor"');
    expect(html).toContain('Firma Autorizada y Sello');
  });
});
