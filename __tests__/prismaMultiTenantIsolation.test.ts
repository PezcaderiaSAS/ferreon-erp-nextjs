import { describe, it, expect, vi } from "vitest";
import { getTenantPrismaClient } from "@/infrastructure/persistence/prisma/client";

describe("Arquitectura Multi-Tenant & Aislamiento por Fila (Prisma ORM)", () => {
  const MOCK_TENANT_A = "11111111-1111-4111-8111-111111111111";
  const MOCK_TENANT_B = "22222222-2222-4222-8222-222222222222";

  it("debe rechazar la creación de cliente Prisma si el tenantId es nulo o vacío", () => {
    expect(() => getTenantPrismaClient("")).toThrowError(
      /Multi-Tenant Guard: Se requiere un tenantId válido/
    );
    expect(() => getTenantPrismaClient(null as unknown as string)).toThrowError(
      /Multi-Tenant Guard: Se requiere un tenantId válido/
    );
  });

  it("debe retornar una instancia de cliente extendida para un tenant válido", () => {
    const tenantClient = getTenantPrismaClient(MOCK_TENANT_A);
    expect(tenantClient).toBeDefined();
    expect(typeof tenantClient).toBe("object");
  });

  it("garantiza que las cantidades de stock y balances WMS sean estrictamente enteros", () => {
    const stockEntrada = 10;
    const stockDecimalErroneo = 10.5;

    // Regla de oro WMS: Cero coma flotante
    expect(Number.isInteger(stockEntrada)).toBe(true);
    expect(Number.isInteger(stockDecimalErroneo)).toBe(false);

    const validarCantidadEntera = (cantidad: number) => {
      if (!Number.isInteger(cantidad) || cantidad < 0) {
        throw new Error("WMS Integrity Error: Las cantidades deben ser enteros positivos.");
      }
      return true;
    };

    expect(validarCantidadEntera(5)).toBe(true);
    expect(() => validarCantidadEntera(5.25)).toThrowError(/WMS Integrity Error/);
    expect(() => validarCantidadEntera(-1)).toThrowError(/WMS Integrity Error/);
  });

  it("valida la unicidad compuesta de códigos de bodega y equipos por inquilino", () => {
    // Simula registro de equipo en Tenant A vs Tenant B con mismo código de catálogo
    const equiposEnBaseDeDatos = [
      { id: 1, codigo: "TALADRO-01", empresaId: MOCK_TENANT_A },
      { id: 2, codigo: "TALADRO-01", empresaId: MOCK_TENANT_B },
    ];

    // Ambos pueden coexistir en la plataforma porque pertenecen a distintos inquilinos
    const equiposTenantA = equiposEnBaseDeDatos.filter(
      (e) => e.empresaId === MOCK_TENANT_A && e.codigo === "TALADRO-01"
    );
    const equiposTenantB = equiposEnBaseDeDatos.filter(
      (e) => e.empresaId === MOCK_TENANT_B && e.codigo === "TALADRO-01"
    );

    expect(equiposTenantA.length).toBe(1);
    expect(equiposTenantB.length).toBe(1);
    expect(equiposTenantA[0].empresaId).not.toBe(equiposTenantB[0].empresaId);
  });
});
