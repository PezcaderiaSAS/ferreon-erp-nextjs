import { describe, it, expect } from "vitest";
import { ClienteEntity } from "../../src/core/domain/entities/cliente";
import { EquipoEntity } from "../../src/core/domain/entities/equipo";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";

describe("Data Architecture: Soft Delete & Audit Tests", () => {
  it("debe aplicar soft delete y restaurar un cliente preservando su historial", () => {
    const cliente = new ClienteEntity(
      "CLI-100",
      "900123456",
      "CONSTRUCCIONES EL DORADO",
      "3001234567",
      "contacto@eldorado.com",
      "Calle 100"
    );

    expect(cliente.isDeleted).toBe(false);
    expect(cliente.activo).toBe(true);

    // Soft Delete
    cliente.softDelete("admin_user");
    expect(cliente.isDeleted).toBe(true);
    expect(cliente.activo).toBe(false);
    expect(cliente.deletedBy).toBe("admin_user");
    expect(cliente.deletedAt).toBeInstanceOf(Date);

    // Restore
    cliente.restore();
    expect(cliente.isDeleted).toBe(false);
    expect(cliente.activo).toBe(true);
    expect(cliente.deletedAt).toBeNull();
  });

  it("debe rechazar el soft delete de un equipo si tiene unidades en obra", () => {
    const equipo = new EquipoEntity(
      "EQ-100",
      "VIB-01",
      "VIBRADOR INDUSTRIAL",
      "MAQUINARIA",
      35000,
      PesoGramos.fromKilos(18),
      5,
      3,
      2 // 2 unidades en obra
    );

    expect(() => equipo.softDelete("admin")).toThrow(
      "No se puede eliminar el equipo 'VIBRADOR INDUSTRIAL' porque tiene 2 unidades en obra."
    );
  });

  it("debe rechazar el soft delete de un contrato en estado ACTIVO", () => {
    const alquiler = new AlquilerEntity(
      "ALQ-100",
      100,
      "CLI-100",
      "CLIENTE ACTIVO",
      "ACTIVO",
      100000,
      0,
      0,
      100000,
      100000,
      0,
      0,
      "Efectivo",
      "Activa",
      undefined,
      undefined,
      undefined,
      []
    );

    expect(() => alquiler.softDelete("admin")).toThrow(
      "No se puede eliminar un contrato en estado ACTIVO. Primero debe recibir las devoluciones o cancelarlo."
    );
  });
});
