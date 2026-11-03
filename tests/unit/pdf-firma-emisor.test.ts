import { describe, it, expect } from 'vitest';
import { EnterprisePDFService, DocumentoPDFPayload } from '../../src/core/services/pdf-factura-generator.service';
import { DEFAULT_EMPRESA_CONFIG } from '../../src/core/domain/entities/empresa-config';
import { ContratoAlquilerPDF } from '../../src/components/pdf/ContratoAlquilerPDF';

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

  it('debe estructurar jerárquicamente la firma corporativa: rúbrica sobre la línea divisoria y datos fiscales debajo', () => {
    const html = EnterprisePDFService.generarHTMLDocumento(basePayload);

    // 1. Verificar la existencia de las 3 zonas arquitectónicas
    expect(html).toContain('class="sig-column"');
    expect(html).toContain('class="sig-image-box"');
    expect(html).toContain('class="sig-line-rule"');
    expect(html).toContain('class="sig-meta"');

    // 2. Comprobar orden cronológico y visual en el HTML:
    // La imagen debe aparecer ANTES que la línea de firma, y la línea ANTES que los metadatos
    const posImg = html.indexOf('alt="Firma del emisor"');
    const posLine = html.lastIndexOf('class="sig-line-rule"'); // Segunda columna (Emisor)
    const posMeta = html.indexOf('Firma Autorizada y Sello');

    expect(posImg).toBeGreaterThan(0);
    expect(posLine).toBeGreaterThan(posImg);
    expect(posMeta).toBeGreaterThan(posLine);

    // 3. Verificar metadatos fiscales debajo de la línea
    expect(html).toContain('ALQUILERES SYSTEM SAS');
    expect(html).toContain(`NIT: ${DEFAULT_EMPRESA_CONFIG.nit}`);
  });

  it('debe estructurar simétricamente la columna del cliente con aceptación y NIT', () => {
    const payloadConFirmaCliente: DocumentoPDFPayload = {
      ...basePayload,
      firmaClienteBase64: FIRMA_BASE64_VALIDA,
      firmaClienteFecha: "2026-10-22 14:30:00",
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadConFirmaCliente);

    // 1. Imagen de firma del cliente arriba de su línea
    const posImgCliente = html.indexOf('alt="Firma del cliente"');
    const posLineCliente = html.indexOf('class="sig-line-rule"'); // Primera columna (Cliente)
    const posMetaCliente = html.indexOf('Acepto y Recibí a Satisfacción');

    expect(posImgCliente).toBeGreaterThan(0);
    expect(posLineCliente).toBeGreaterThan(posImgCliente);
    expect(posMetaCliente).toBeGreaterThan(posLineCliente);

    // 2. Metadatos del cliente
    expect(html).toContain('Acepto y Recibí a Satisfacción');
    expect(html).toContain('Cliente / Deudor: CONSTRUCTORA CAPITAL SAS');
    expect(html).toContain('C.C. / NIT: 900.123.456-1');
    expect(html).toContain('Firmado digitalmente: 2026-10-22 14:30:00');
  });

  it('debe preservar el contenedor de firma vacío (degradación grácil) cuando no hay firma digital sin colapsar el layout', () => {
    const payloadSinFirmas: DocumentoPDFPayload = {
      ...basePayload,
      incluirFirmaEmisor: false,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        firmaDigitalBase64: "",
      },
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadSinFirmas);

    // Contenedores presentes pero sin etiquetas <img>
    expect(html).toContain('class="sig-image-box"');
    expect(html).toContain('class="sig-line-rule"');
    expect(html).not.toContain('alt="Firma del emisor"');
    expect(html).not.toContain('alt="Firma del cliente"');
    expect(html).toContain('Firma Autorizada y Sello');
    expect(html).toContain('Acepto y Recibí a Satisfacción');
  });

  it('debe reemplazar Sin NIT o Sin Registrar con el subrayado de llenado manual en EnterprisePDFService', () => {
    const payloadSinNit: DocumentoPDFPayload = {
      ...basePayload,
      clienteNit: 'Sin NIT',
    };
    const html = EnterprisePDFService.generarHTMLDocumento(payloadSinNit);

    expect(html).toContain('C.C. / NIT: ____________________');
    expect(html).not.toContain('C.C. / NIT: Sin NIT');
  });

  describe('ContratoAlquilerPDF (@react-pdf/renderer): Estructura simétrica y flags', () => {
    const extractSignaturesView = (doc: any) => {
      const page = doc.props.children;
      const childrenArray = (Array.isArray(page.props.children) ? page.props.children : [page.props.children]).filter(Boolean);
      return childrenArray.find((c: any) => {
        const ch = c?.props?.children;
        return Array.isArray(ch) && ch.length === 2 &&
          ch[0]?.props?.children?.[2]?.props?.children?.[0]?.props?.children === 'Acepto y Recibí a Satisfacción';
      });
    };

    it('debe estructurar simétricamente las firmas en 2 columnas y respetar incluirFirmaEmisor === false', () => {
      const dataConFirmaDesactivada = {
        ...basePayload,
        incluirFirmaEmisor: false,
        detalles: basePayload.items,
      };

      const doc = ContratoAlquilerPDF({
        data: dataConFirmaDesactivada,
        pageSize: 'LETTER',
        empresaConfig: {
          ...DEFAULT_EMPRESA_CONFIG,
          razonSocial: 'ALQUILERES SYSTEM SAS',
          firmaDigitalBase64: FIRMA_BASE64_VALIDA,
        },
      });

      expect(doc).toBeDefined();
      const signaturesView = extractSignaturesView(doc);
      expect(signaturesView).toBeDefined();

      const [colCliente, colEmisor] = signaturesView.props.children;
      expect(colCliente).toBeDefined();
      expect(colEmisor).toBeDefined();

      // En columna Emisor: la zona de imagen no debe contener ninguna imagen porque incluirFirmaEmisor === false
      const [emisorImageBox, emisorLineRule, emisorMetaBox] = colEmisor.props.children;
      expect(emisorImageBox.props.children).toBeFalsy();
      expect(emisorLineRule).toBeDefined();
      expect(emisorMetaBox).toBeDefined();
    });

    it('debe renderizar la imagen de firma cuando incluirFirmaEmisor === true o por defecto', () => {
      const dataConFirmaActiva = {
        ...basePayload,
        incluirFirmaEmisor: true,
        firma_cliente_base64: FIRMA_BASE64_VALIDA,
        firma_cliente_fecha: '2026-10-22 14:30:00',
        detalles: basePayload.items,
      };

      const doc = ContratoAlquilerPDF({
        data: dataConFirmaActiva,
        pageSize: 'LETTER',
        empresaConfig: {
          ...DEFAULT_EMPRESA_CONFIG,
          razonSocial: 'ALQUILERES SYSTEM SAS',
          firmaDigitalBase64: FIRMA_BASE64_VALIDA,
        },
      });

      const signaturesView = extractSignaturesView(doc);
      expect(signaturesView).toBeDefined();

      const [colCliente, colEmisor] = signaturesView.props.children;
      const [clienteImageBox] = colCliente.props.children;
      const [emisorImageBox] = colEmisor.props.children;

      expect(clienteImageBox.props.children).toBeTruthy();
      expect(clienteImageBox.props.children.props.src).toBe(FIRMA_BASE64_VALIDA);

      expect(emisorImageBox.props.children).toBeTruthy();
      expect(emisorImageBox.props.children.props.src).toBe(FIRMA_BASE64_VALIDA);
    });

    it('debe renderizar placeholder de subrayado para llenado manual cuando clienteNit es Sin Registrar o Sin NIT', () => {
      const dataSinNit = {
        ...basePayload,
        clienteNit: 'Sin Registrar',
        detalles: basePayload.items,
      };

      const doc = ContratoAlquilerPDF({
        data: dataSinNit,
        pageSize: 'LETTER',
        empresaConfig: DEFAULT_EMPRESA_CONFIG,
      });

      const signaturesView = extractSignaturesView(doc);
      expect(signaturesView).toBeDefined();

      const [colCliente] = signaturesView.props.children;
      const [, , clienteMetaBox] = colCliente.props.children;
      const textos = Array.isArray(clienteMetaBox.props.children) ? clienteMetaBox.props.children : [clienteMetaBox.props.children];

      const textoNit = textos.find((t: any) => {
        const raw = Array.isArray(t?.props?.children) ? t.props.children.join('') : String(t?.props?.children || '');
        return raw.includes('C.C. / NIT:');
      });

      expect(textoNit).toBeDefined();
      const nitContent = Array.isArray(textoNit.props.children) ? textoNit.props.children.join('') : String(textoNit.props.children);
      expect(nitContent).toContain('____________________');
      expect(nitContent).not.toContain('Sin Registrar');
    });
  });
});
