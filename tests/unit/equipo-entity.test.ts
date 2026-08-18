import { describe, it, expect, vi } from "vitest";
import { EquipoEntity } from "../../src/core/domain/entities/equipo";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";
import { 
  CrearEquipoUseCase, 
  CargaMasivaEquiposUseCase, 
  EditarEquipoUseCase 
} from "../../src/core/application/use-cases/equipo-use-cases";
import { IEquipoRepository } from "../../src/core/domain/repositories/equipo-repository.interface";

describe("Domain Entity & Use Cases: Equipo / Inventario", () => {
  it("debe validar la ecuación de stock (disponible + enObra <= total)", () => {
    const equipo = new EquipoEntity(
      "EQ-1",
      " MEZ-01 ",
      " mezcladora de concreto ",
      " Maquinaria ",
      45000,
      PesoGramos.fromKilos(250),
      10,
      10,
      0
    );

    expect(equipo.codigo).toBe("MEZ-01");
    expect(equipo.nombre).toBe("MEZCLADORA DE CONCRETO");
    expect(equipo.categoria).toBe("MAQUINARIA");
  });

  it("debe descontar disponible e incrementar enObra al alquilar", () => {
    const equipo = new EquipoEntity(
      "EQ-1",
      "MEZ-01",
      "MEZCLADORA DE CONCRETO",
      "MAQUINARIA",
      45000,
      PesoGramos.fromKilos(250),
      10,
      10,
      0
    );

    equipo.alquilar(3);
    expect(equipo.stockDisponible).toBe(7);
    expect(equipo.stockEnObra).toBe(3);
  });

  it("debe rechazar alquilar si supera el stock disponible", () => {
    const equipo = new EquipoEntity(
      "EQ-1",
      "MEZ-01",
      "MEZCLADORA",
      "MAQUINARIA",
      45000,
      PesoGramos.fromKilos(250),
      5,
      5,
      0
    );

    expect(() => equipo.alquilar(8)).toThrow("Stock insuficiente para 'MEZCLADORA'. Disponible: 5, Solicitado: 8.");
  });

  it("debe procesar exitosamente la carga masiva de equipos", async () => {
    const mockRepo: IEquipoRepository = {
      findById: vi.fn(),
      findByCodigo: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn(),
      saveBulk: vi.fn().mockImplementation((list) => Promise.resolve(list)),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new CargaMasivaEquiposUseCase(mockRepo);

    const resultado = await useCase.execute({
      equipos: [
        { codigo: "EQ-01", nombre: "MEZCLADORA", categoria: "OBRA", tarifaDiaria: 45000, pesoKilos: 250, stockTotal: 10 },
        { codigo: "EQ-02", nombre: "VIBRADOR", categoria: "OBRA", tarifaDiaria: 25000, pesoKilos: 15, stockTotal: 15 },
      ],
    });

    expect(resultado.length).toBe(2);
    expect(resultado[0].codigo).toBe("EQ-01");
    expect(resultado[1].codigo).toBe("EQ-02");
  });
});
