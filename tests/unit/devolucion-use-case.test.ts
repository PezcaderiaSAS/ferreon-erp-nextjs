import { describe, it, expect, vi } from "vitest";
import { DevolverEquipoUseCase } from "../../src/core/application/use-cases/devolver-equipo.use-case";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";
import { EquipoEntity } from "../../src/core/domain/entities/equipo";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";
import { IAlquilerRepository } from "../../src/core/domain/repositories/alquiler-repository.interface";
import { IEquipoRepository } from "../../src/core/domain/repositories/equipo-repository.interface";

describe("Use Case: DevolverEquipoUseCase", () => {
  it("debe procesar la devolución parcial, reingresar stock disponible y sumar costo de daño", async () => {
    const itemDetalle = {
      itemId: "EQ-01",
      nombreItem: "Mezcladora",
      cantidad: 2,
      tarifaAplicada: 45000,
      pesoGramos: PesoGramos.fromKilos(250),
      diasContratados: 3,
      subtotalLinea: 270000,
      fechaInicio: new Date(),
      devuelto: false,
      cantidadDevuelta: 0,
      costoDano: 0,
    };

    const alquiler = new AlquilerEntity(
      "ALQ-001",
      101,
      "CLI-001",
      "CLIENTE SAS",
      "ACTIVO",
      270000,
      270000,
      0,
      0,
      "Efectivo",
      "Activa",
      undefined,
      undefined,
      [itemDetalle]
    );

    const equipo = new EquipoEntity(
      "EQ-01",
      "MEZ-01",
      "MEZCLADORA",
      "MAQUINARIA",
      45000,
      PesoGramos.fromKilos(250),
      10,
      8, // 8 disponibles
      2  // 2 en obra
    );

    const mockAlquilerRepo: IAlquilerRepository = {
      findById: vi.fn().mockResolvedValue(alquiler),
      findByConsecutivo: vi.fn(),
      findByClienteId: vi.fn(),
      findAll: vi.fn(),
      findActivos: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockImplementation((a) => Promise.resolve(a)),
      updateEstado: vi.fn(),
    };

    const mockEquipoRepo: IEquipoRepository = {
      findById: vi.fn().mockResolvedValue(equipo),
      findByCodigo: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      saveBulk: vi.fn(),
      update: vi.fn().mockImplementation((e) => Promise.resolve(e)),
      delete: vi.fn(),
    };

    const useCase = new DevolverEquipoUseCase(mockAlquilerRepo, mockEquipoRepo);

    await useCase.execute({
      alquilerId: "ALQ-001",
      fechaDevolucion: new Date().toISOString(),
      items: [
        {
          itemId: "EQ-01",
          cantidadDevuelta: 1,
          costoDano: 35000,
        },
      ],
    });

    expect(equipo.stockDisponible).toBe(9); // 8 + 1
    expect(equipo.stockEnObra).toBe(1);      // 2 - 1
    expect(alquiler.detalles[0].cantidadDevuelta).toBe(1);
    expect(alquiler.detalles[0].costoDano).toBe(35000);
    expect(alquiler.detalles[0].devuelto).toBe(false); // Solo 1 de 2 fue devuelto
  });
});
