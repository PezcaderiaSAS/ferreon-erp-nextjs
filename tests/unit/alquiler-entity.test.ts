import { describe, it, expect } from "vitest";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";

describe("AlquilerEntity Domain Tests", () => {
  it("debe calcular subtotalEstimado con fletes de entrega y recogida, totalEstimado con depósito y peso totalEstimado correctamente", () => {
    const item1 = {
      itemId: "EQ-01",
      nombreItem: "Mezcladora",
      cantidad: 2,
      tarifaAplicada: 45000,
      
      fechaFinEstimada: new Date(),
      subtotalLineaEstimado: 2 * 45000 * 3, // 270,000
      fechaInicio: new Date("2026-08-18"),
    };

    const item2 = {
      itemId: "EQ-02",
      nombreItem: "Vibrador",
      cantidad: 1,
      tarifaAplicada: 25000,
      
      fechaFinEstimada: new Date(),
      subtotalLineaEstimado: 1 * 25000 * 3, // 75,000
      fechaInicio: new Date("2026-08-18"),
    };

    const alquiler = new AlquilerEntity(
      "ALQ-001",
      1,
      "CLI-001",
      "CONSTRUCCIONES SAS",
      "ACTIVO",
      0,
      30000, // Flete Entrega
      30000, // Flete Recogida
      0,
      0,
      50000, // Depósito
      200000,
      "Efectivo",
      "Activa",
      "Sin observaciones",
      "Lleva Don Carlos Cárdenas en Camión NPR",
      "admin",
      [item1, item2]
    );

    // subtotalEquiposEstimado = 345,000
    // totalEstimadoFletes = 60,000
    // subtotalGeneralEstimado = 405,000
    // totalEstimado = 405,000 - 50,000 = 355,000
    expect(alquiler.subtotalEquiposEstimado).toBe(345000);
    expect(alquiler.fleteEntrega).toBe(30000);
    expect(alquiler.fleteRecogida).toBe(30000);
    expect(alquiler.subtotalGeneralEstimado).toBe(405000);
    expect(alquiler.totalEstimado).toBe(355000);
    expect(alquiler.detallesLogistica).toBe("Lleva Don Carlos Cárdenas en Camión NPR");
  });

  it("debe manejar transiciones de estado de forma coherente", () => {
    const alquiler = new AlquilerEntity(
      "ALQ-002",
      2,
      "CLI-001",
      "CLIENTE PRUEBA",
      "COTIZACION",
      100000,
      0,
      0,
      100000,
      100000,
      0,
      0,
      "Efectivo",
      "Pendiente",
      undefined,
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

  it("debe ordenar un listado de contratos en orden descendente estricto por ID / consecutivo", () => {
    const listado = [
      { id: "ALQ-1001", consecutivo: 1001, clienteNombre: "Cliente A" },
      { id: "ALQ-1003", consecutivo: 1003, clienteNombre: "Cliente C" },
      { id: "ALQ-1002", consecutivo: 1002, clienteNombre: "Cliente B" },
      { id: "ALQ-1004", consecutivo: 1004, clienteNombre: "Cliente D" },
    ];

    const ordenados = [...listado].sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ""), 10) || a.consecutivo || 0;
      const numB = parseInt(b.id.replace(/\D/g, ""), 10) || b.consecutivo || 0;
      if (numA !== numB) return numB - numA;
      if (b.consecutivo !== a.consecutivo) return b.consecutivo - a.consecutivo;
      return b.id.localeCompare(a.id, undefined, { numeric: true });
    });

    expect(ordenados.map((c) => c.id)).toEqual(["ALQ-1004", "ALQ-1003", "ALQ-1002", "ALQ-1001"]);
    expect(ordenados[0].id).toBe("ALQ-1004");
    expect(ordenados[3].id).toBe("ALQ-1001");
  });
});
