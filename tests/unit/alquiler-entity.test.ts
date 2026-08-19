import { describe, it, expect } from "vitest";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";

describe("AlquilerEntity Domain Tests", () => {
  it("debe calcular subtotal, total con depósito y peso total correctamente", () => {
    const item1 = {
      itemId: "EQ-01",
      nombreItem: "Mezcladora",
      cantidad: 2,
      tarifaAplicada: 45000,
      pesoGramos: PesoGramos.fromKilos(250),
      diasContratados: 3,
      subtotalLinea: 2 * 45000 * 3, // 270,000
      fechaInicio: new Date("2026-08-18"),
    };

    const item2 = {
      itemId: "EQ-02",
      nombreItem: "Vibrador",
      cantidad: 1,
      tarifaAplicada: 25000,
      pesoGramos: PesoGramos.fromKilos(15),
      diasContratados: 3,
      subtotalLinea: 1 * 25000 * 3, // 75,000
      fechaInicio: new Date("2026-08-18"),
    };

    const alquiler = new AlquilerEntity(
      "ALQ-001",
      1,
      "CLI-001",
      "CONSTRUCCIONES SAS",
      "ACTIVO",
      0,
      0,
      50000, // Depósito
      200000,
      "Efectivo",
      "Activa",
      "Sin observaciones",
      "admin",
      [item1, item2]
    );

    expect(alquiler.subtotal).toBe(345000);
    expect(alquiler.total).toBe(295000); // 345,000 - 50,000
    expect(alquiler.calcularPesoTotalKilos()).toBe(515); // (2*250) + (1*15) = 515 Kg
  });

  it("debe manejar transiciones de estado de forma coherente", () => {
    const alquiler = new AlquilerEntity(
      "ALQ-002",
      2,
      "CLI-001",
      "CLIENTE PRUEBA",
      "COTIZACION",
      100000,
      100000,
      0,
      0,
      "Efectivo",
      "Pendiente",
      undefined,
      undefined,
      []
    );

    alquiler.activar();
    expect(alquiler.estado).toBe("ACTIVO");

    alquiler.finalizar();
    expect(alquiler.estado).toBe("FINALIZADO");
    expect(alquiler.garantiaEstado).toBe("Liberada");
  });
});
