import { describe, it, expect } from "vitest";
import { PagoEntity } from "../../src/core/domain/entities/pago";
import { DEFAULT_EMPRESA_CONFIG } from "../../src/core/domain/entities/empresa-config";
import { EnterprisePDFService, DocumentoPDFPayload } from "../../src/core/services/pdf-factura-generator.service";

describe("Dominio: EmpresaConfig, Cartera & Pagos", () => {
  it("debe crear un pago válido y calcular balance de cartera", () => {
    const pago = new PagoEntity(
      "PAG-001",
      101,
      "ALQ-101",
      "CLI-001",
      "CONSTRUCCIONES SAS",
      150000,
      "TRANSFERENCIA",
      "ABONO_ALQUILER",
      "Abono parcial 50%"
    );

    expect(pago.monto).toBe(150000);
    expect(pago.metodoPago).toBe("TRANSFERENCIA");
    expect(pago.isDeleted).toBe(false);
  });

  it("debe rechazar un pago con monto menor o igual a cero", () => {
    expect(() => {
      new PagoEntity(
        "PAG-002",
        102,
        "ALQ-101",
        "CLI-001",
        "CONSTRUCCIONES SAS",
        0,
        "EFECTIVO"
      );
    }).toThrow("El monto del pago debe ser mayor a cero.");
  });

  it("debe inyectar el logo, razón social e información bancaria en el HTML del PDF", () => {
    const payload: DocumentoPDFPayload = {
      tipo: "COTIZACION",
      consecutivo: 105,
      fechaEmision: "19 de agosto de 2026",
      fechaInicioGeneral: "2026-08-19",
      clienteNombre: "OBRAS DEL NORTE",
      clienteNit: "900.111.222-3",
      items: [
        {
          cantidad: 1,
          nombre: "MEZCLADORA 2 BULTOS",
          fechaInicio: "2026-08-19",
          fechaFin: "2026-08-22",
          dias: 3,
          tarifaDiaria: 45000,
          subtotal: 135000,
          pesoKilos: 250
        }
      ],
      subtotalEquipos: 135000,
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      subtotalGeneral: 195000,
      depositoAplicado: 50000,
      totalPagar: 145000,
      pesoTotalKilos: 250,
      empresa: {
        ...DEFAULT_EMPRESA_CONFIG,
        razonSocial: "CONSTRUCTORA & ANDAMIOS BOGOTÁ SAS",
        logoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      }
    };

    const html = EnterprisePDFService.generarHTMLDocumento(payload);
    expect(html).toContain("CONSTRUCTORA & ANDAMIOS BOGOTÁ SAS");
    expect(html).toContain("data:image/png;base64");
    expect(html).toContain("Instrucciones de Pago y Transferencia");
    expect(html).toContain("SON: CIENTO CUARENTA Y CINCO MIL PESOS M/CTE");
  });
});
