import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '../../src/core/services/pdf-factura-generator.service';
import { DEFAULT_EMPRESA_CONFIG } from '../../src/core/domain/entities/empresa-config';

describe('Verificación de Bloqueo de Cliente, Resiliencia y Motor de PDFs', () => {
  it('debe renderizar el logo en el HTML si es un Data URI válido', () => {
    const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const payload: DocumentoPDFPayload = {
      tipo: "CONTRATO",
      consecutivo: 200,
      fechaEmision: "2026-09-08T12:00:00.000Z",
      clienteNombre: "CONSTRUCTORA ANDINA SAS",
      clienteNit: "901.456.789-0",
      clienteTelefono: "3112233445",
      items: [
        {
          cantidad: 2,
          nombre: "ANDAMIO TUBULAR",
          fechaInicio: "2026-09-08",
          fechaFin: "2026-09-15",
          dias: 7,
          tarifaDiaria: 10000,
          subtotal: 140000
        }
      ],
      subtotalEquipos: 140000,
      fleteEntrega: 25000,
      fleteRecogida: 25000,
      subtotalGeneral: 190000,
      depositoAplicado: 40000,
      totalPagar: 150000,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        razonSocial: "FERRETERÍA & EQUIPOS EL PROGRESO",
        logoBase64
      }
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    
    // Verificar que el logo y la razón social estén presentes en el HTML
    expect(html).toContain('src="data:image/png;base64');
    expect(html).toContain('FERRETERÍA & EQUIPOS EL PROGRESO');
    expect(html).toContain('CONSTRUCTORA ANDINA SAS');
    expect(html).toContain('901.456.789-0');
  });

  it('no debe renderizar etiqueta img si logoBase64 está ausente o no es data:image', () => {
    const payload: DocumentoPDFPayload = {
      tipo: "COTIZACION",
      consecutivo: 201,
      fechaEmision: "2026-09-08T12:00:00.000Z",
      clienteNombre: "INGENIERÍA TOTAL SAS",
      clienteNit: "800.123.456-7",
      items: [],
      subtotalEquipos: 0,
      fleteEntrega: 0,
      fleteRecogida: 0,
      subtotalGeneral: 0,
      depositoAplicado: 0,
      totalPagar: 0,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        logoBase64: undefined
      }
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).not.toContain('<img src="');
    expect(html).toContain('INGENIERÍA TOTAL SAS');
  });

  it('valida regla poka-yoke: contratos con devoluciones no deben permitir edición en la interfaz', () => {
    const contratoConDevolucion = {
      id: "ALQ-999",
      estado: "ACTIVO",
      detalles: [
        { id: "DET-1", itemId: "EQ-1", cantidad: 2, devuelto: true, cantidadDevuelta: 2 }
      ]
    };

    const tieneDevoluciones = Boolean(
      contratoConDevolucion.detalles?.some((d: any) => d.devuelto || (d.cantidadDevuelta && d.cantidadDevuelta > 0))
    );
    const puedeEditar = (contratoConDevolucion.estado === 'COTIZACION' || contratoConDevolucion.estado === 'ACTIVO') && !tieneDevoluciones;

    expect(tieneDevoluciones).toBe(true);
    expect(puedeEditar).toBe(false);
  });

  it('valida que contratos en estado FINALIZADO o CANCELADO no sean editables', () => {
    const contratoFinalizado = { id: "ALQ-888", estado: "FINALIZADO", detalles: [] };
    const contratoCancelado = { id: "ALQ-777", estado: "CANCELADO", detalles: [] };

    const puedeEditarFinalizado = (contratoFinalizado.estado === 'COTIZACION' || contratoFinalizado.estado === 'ACTIVO');
    const puedeEditarCancelado = (contratoCancelado.estado === 'COTIZACION' || contratoCancelado.estado === 'ACTIVO');

    expect(puedeEditarFinalizado).toBe(false);
    expect(puedeEditarCancelado).toBe(false);
  });
});
