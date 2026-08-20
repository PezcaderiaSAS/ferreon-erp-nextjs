import { describe, it, expect, vi } from "vitest";
import { CrearAlquilerUseCase } from "../../src/core/application/use-cases/crear-alquiler.use-case";
import { IAlquilerRepository } from "../../src/core/domain/repositories/alquiler-repository.interface";
import { AlquilerEntity } from "../../src/core/domain/entities/alquiler";

describe("Use Case: CrearAlquilerUseCase", () => {
  it("debe rechazar la creación si no se incluyen ítems", async () => {
    const mockRepo: IAlquilerRepository = {
      findById: vi.fn(),
      findByConsecutivo: vi.fn(),
      findByClienteId: vi.fn(),
      findAll: vi.fn(),
      findActivos: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
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

  it("debe crear y guardar un alquiler con fletes y logística correctamente", async () => {
    const mockSave = vi.fn().mockImplementation((alquiler: AlquilerEntity) => Promise.resolve(alquiler));

    const mockRepo: IAlquilerRepository = {
      findById: vi.fn(),
      findByConsecutivo: vi.fn(),
      findByClienteId: vi.fn(),
      findAll: vi.fn(),
      findActivos: vi.fn(),
      save: mockSave,
      update: vi.fn(),
      updateEstado: vi.fn(),
    };

    const useCase = new CrearAlquilerUseCase(mockRepo);

    const resultado = await useCase.execute({
      clienteId: "CLI-001",
      clienteNombre: "CONSTRUCCIONES SAS",
      fleteEntrega: 25000,
      fleteRecogida: 25000,
      deposito: 100000,
      garantiaMonto: 500000,
      garantiaTipo: "Efectivo",
      observaciones: "Entrega en obra",
      detallesLogistica: "Lleva Don Carlos Cárdenas en Camión NPR",
      creadoPor: "USER-001",
      items: [
        {
          itemId: "ITEM-001",
          nombreItem: "Mezcladora",
          cantidad: 2,
          tarifaAplicada: 45000,
          fechaFinEstimada: new Date().toISOString(),
          fechaInicio: "2026-08-18T08:00:00.000Z",
        },
      ],
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(resultado.subtotalEquiposEstimado).toBe(270000); // 2 * 45000 * 3
    expect(resultado.fleteEntrega).toBe(25000);
    expect(resultado.fleteRecogida).toBe(25000);
    expect(resultado.subtotalGeneralEstimado).toBe(320000); // 270,000 + 50,000 fletes
    expect(resultado.totalEstimado).toBe(220000); // 320,000 - 100,000 deposito
    expect(resultado.detallesLogistica).toBe("Lleva Don Carlos Cárdenas en Camión NPR");
    expect(resultado.estado).toBe("ACTIVO");
  });
});
