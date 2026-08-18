import { describe, it, expect, vi } from "vitest";
import { CrearAlquilerUseCase } from "../../src/core/application/use-cases/crear-alquiler.use-case";
import { IAlquilerRepository } from "../../src/core/domain/repositories/alquiler-repository.interface";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";

describe("Use Case: CrearAlquilerUseCase", () => {
  it("debe rechazar la creación si no se incluyen ítems", async () => {
    const mockRepo: IAlquilerRepository = {
      findById: vi.fn(),
      findActivos: vi.fn(),
      save: vi.fn(),
      updateEstado: vi.fn(),
    };

    const useCase = new CrearAlquilerUseCase(mockRepo);

    await expect(
      useCase.execute({
        clienteId: "CLI-001",
        deposito: 50000,
        garantiaMonto: 200000,
        items: [],
      })
    ).rejects.toThrow("Debe incluir al menos un ítem en el alquiler.");
  });

  it("debe crear y guardar un alquiler válido correctamente", async () => {
    const mockSave = vi.fn().mockImplementation((alquiler: AlquilerEntity) => Promise.resolve(alquiler));

    const mockRepo: IAlquilerRepository = {
      findById: vi.fn(),
      findActivos: vi.fn(),
      save: mockSave,
      updateEstado: vi.fn(),
    };

    const useCase = new CrearAlquilerUseCase(mockRepo);

    const resultado = await useCase.execute({
      clienteId: "CLI-001",
      deposito: 100000,
      garantiaMonto: 500000,
      garantiaTipo: "Efectivo",
      observaciones: "Entrega urgente",
      creadoPor: "USER-001",
      items: [
        {
          itemId: "ITEM-001",
          cantidad: 2,
          tarifaAplicada: 45000,
          pesoKilos: 25.5,
          diasContratados: 3,
          fechaInicio: "2026-08-18T08:00:00.000Z",
        },
      ],
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(resultado.subtotal).toBe(270000); // 2 * 45000 * 3
    expect(resultado.total).toBe(170000); // 270000 - 100000
    expect(resultado.estado).toBe("ACTIVO");
    expect(resultado.detalles[0].pesoGramos.toKilos()).toBe(25.5);
  });
});
