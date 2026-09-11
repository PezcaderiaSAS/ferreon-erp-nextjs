import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '@/core/services/pdf-factura-generator.service';

describe('EnterprisePDFService - Garantía de Fletes, Transportes y Depósitos', () => {
  it('debe renderizar siempre las filas de fletes de entrega y retorno y el depósito recibido cuando tienen montos', () => {
    const payload: DocumentoPDFPayload = {
      tipo: 'CONTRATO',
      consecutivo: 1050,
      fechaEmision: '2026-09-11T12:00:00.000Z',
      clienteNombre: 'CONSTRUCTORA LOS ANDES S.A.S',
      clienteNit: '900.123.456-7',
      clienteTelefono: '3101234567',
      clienteDireccion: 'Calle 100 # 15-20, Bogotá',
      items: [
        {
          cantidad: 2,
          nombre: 'Andamio Tubular Metálico',
          codigo: 'AND-001',
          dias: 5,
          tarifaDiaria: 10000,
          subtotal: 100000,
          fechaInicio: '2026-09-11',
          fechaFin: '2026-09-16'
        }
      ],
      subtotalEquipos: 100000,
      fleteEntrega: 40000,
      fleteRecogida: 35000,
      subtotalGeneral: 175000,
      depositoAplicado: 50000,
      garantiaMonto: 200000,
      garantiaTipo: 'Efectivo',
      totalPagar: 175000,
      saldoPendiente: 125000,
      observaciones: 'Entrega prioritaria',
      detallesLogistica: 'Obra Portal Norte',
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);

    // Debe contener el bloque de Logística y Respaldo con Depósito y Garantía
    expect(html).toContain('Depósito / Anticipo:');
    expect(html).toContain('$50.000');
    expect(html).toContain('Garantía (Efectivo):');
    expect(html).toContain('$200.000');

    // Debe contener las filas de totales con fletes de entrega y retorno
    expect(html).toContain('Transporte / Flete Entrega en Obra:');
    expect(html).toContain('$40.000');
    expect(html).toContain('Transporte / Flete Retorno (Recogida):');
    expect(html).toContain('$35.000');

    // Debe contener el descuento del anticipo/depósito en rojo
    expect(html).toContain('(-) Anticipo / Depósito Recibido:');
    expect(html).toContain('- $50.000');
  });

  it('debe tolerar fletes en snake_case (flete_entrega, flete_recogida, valor_transporte) y depósito en cero', () => {
    const payload: any = {
      tipo: 'CONTRATO',
      consecutivo: 1051,
      fechaEmision: '2026-09-11T12:00:00.000Z',
      clienteNombre: 'CLIENTE MOSTRADOR',
      clienteNit: 'Sin Registrar',
      items: [
        {
          cantidad: 1,
          nombre: 'Taladro Percutor Industrial',
          codigo: 'TAL-002',
          dias: 2,
          tarifaDiaria: 25000,
          subtotal: 50000,
          fechaInicio: '2026-09-11',
          fechaFin: '2026-09-13'
        }
      ],
      subtotal_equipos: 50000,
      flete_entrega: 0,
      flete_recogida: 0,
      deposito: 0,
      total: 50000,
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);

    // Debe mostrar claramente que el flete fue contemplado como retiro en bodega ($0)
    expect(html).toContain('Transporte Entrega:');
    expect(html).toContain('$ 0 (Retiro en bodega)');
    expect(html).toContain('Transporte Retorno:');
    expect(html).toContain('$ 0 (Devolución en bodega)');

    // Debe mostrar el depósito recibido como $ 0
    expect(html).toContain('(-) Anticipo / Depósito Recibido:');
    expect(html).toContain('$ 0');
  });
});
