import { describe, it, expect } from "vitest";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";

describe("Domain Entity: AlquilerEntity", () => {
  it("debe calcular los totales del alquiler restando el depósito correctamente", () => {
    const detalles = [
      {
        itemId: "ITEM-001",
        cantidad: 2,
        tarifaAplicada: 45000,
        pesoGramos: PesoGramos.fromKilos(50),
        subtotalLinea: 450000, // 2 * 45000 * 5 dias
        fechaInicio: new Date("2026-08-18"),
      },
      {
        itemId: "ITEM-002",
        cantidad: 1,
        tarifaAplicada: 25000,
        pesoGramos: PesoGramos.fromKilos(15),
        subtotalLinea: 125000, // 1 * 25000 * 5 dias
        fechaInicio: new Date("2026-08-18"),
      },
    ];

    const alquiler = new AlquilerEntity(
      "ALQ-001",
      1,
      "CLI-001",
      "ACTIVO",
      0,
      0,
      100000, // deposito
      500000, // garantia
      "Efectivo",
      "Activa",
      "Obra Norte",
      "USER-001",
      detalles
    );

    alquiler.calcularTotales();

    expect(alquiler.subtotal).toBe(575000);
    expect(alquiler.total).toBe(475000); // 575000 - 100000 deposito
  });
});
