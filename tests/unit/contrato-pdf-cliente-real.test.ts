import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '../../src/core/services/pdf-factura-generator.service';
import { DEFAULT_EMPRESA_CONFIG } from '../../src/core/domain/entities/empresa-config';

describe('Verificación de Carga y Confirmación de Datos Reales de Clientes en PDF de Contratos', () => {
  it('debe cargar y renderizar con fidelidad total los datos reales del cliente en el PDF del contrato', () => {
    const clienteReal = {
      id: 42,
      nombre: 'CONSTRUCTORA BOLÍVAR S.A.',
      nit_cedula: '900.555.444-3',
      telefono: '3209876543',
      direccion: 'Calle 100 # 15-20 Oficina 502, Bogotá',
      email: 'compras@constructorabolivar.com'
    };

    const payloadContrato: DocumentoPDFPayload = {
      tipo: 'CONTRATO',
      consecutivo: '1052',
      fechaEmision: '2026-09-10T10:00:00.000Z',
      clienteNombre: clienteReal.nombre,
      clienteNit: clienteReal.nit_cedula,
      clienteTelefono: clienteReal.telefono,
      clienteDireccion: clienteReal.direccion,
      clienteEmail: clienteReal.email,
      detallesLogistica: 'Obra Reserva del Parque - Torre 3',
      garantiaTipo: 'Pagaré',
      garantiaMonto: 500000,
      items: [
        {
          cantidad: 3,
          nombre: 'ROTOMARTILLO BOSCH 1500W',
          codigo: 'ROT-001',
          fechaInicio: '2026-09-10',
          fechaFin: '2026-09-20',
          dias: 10,
          tarifaDiaria: 25000,
          subtotal: 750000
        }
      ],
      subtotalEquipos: 750000,
      fleteEntrega: 40000,
      fleteRecogida: 40000,
      subtotalGeneral: 830000,
      depositoAplicado: 100000,
      totalPagar: 730000,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        razonSocial: 'FERREON EQUIPOS SAS',
        nit: '901.888.777-1'
      }
    };

    const htmlGenerado = EnterprisePDFService.generarHTMLDocumento(payloadContrato);

    // 1. Confirmación de Razón Social / Nombre Real
    expect(htmlGenerado).toContain('CONSTRUCTORA BOLÍVAR S.A.');
    
    // 2. Confirmación de NIT / Documento Real
    expect(htmlGenerado).toContain('900.555.444-3');

    // 3. Confirmación de Teléfono de Contacto Real
    expect(htmlGenerado).toContain('3209876543');

    // 4. Confirmación de Dirección Física Real
    expect(htmlGenerado).toContain('Calle 100 # 15-20 Oficina 502, Bogotá');

    // 5. Confirmación de Email Corporativo Real
    expect(htmlGenerado).toContain('compras@constructorabolivar.com');

    // 6. Confirmación de que no hay valores mock o placeholders de cliente
    expect(htmlGenerado).not.toContain('Consumidor Final');
    expect(htmlGenerado).not.toContain('222222222');
    expect(htmlGenerado).not.toContain('Cliente Mostrador');
    expect(htmlGenerado).not.toContain('Sin Registrar');
  });

  it('debe manejar resiliencia cuando el cliente no tiene dirección o correo sin romper el maquetado del PDF', () => {
    const payloadMinimo: DocumentoPDFPayload = {
      tipo: 'CONTRATO',
      consecutivo: '1053',
      fechaEmision: '2026-09-10T10:00:00.000Z',
      clienteNombre: 'PEDRO PÉREZ GÓMEZ',
      clienteNit: '79.123.456',
      clienteTelefono: '3001112233',
      items: [],
      subtotalEquipos: 0,
      fleteEntrega: 0,
      fleteRecogida: 0,
      subtotalGeneral: 0,
      depositoAplicado: 0,
      totalPagar: 0,
      empresa: DEFAULT_EMPRESA_CONFIG
    };

    const htmlGenerado = EnterprisePDFService.generarHTMLDocumento(payloadMinimo);

    expect(htmlGenerado).toContain('PEDRO PÉREZ GÓMEZ');
    expect(htmlGenerado).toContain('79.123.456');
    expect(htmlGenerado).toContain('3001112233');
    // Si no hay email ni dirección, no debe renderizar 'Email: undefined' ni romper tags
    expect(htmlGenerado).not.toContain('undefined');
    expect(htmlGenerado).not.toContain('null');
  });
});
