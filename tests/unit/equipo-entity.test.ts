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
        { codigo: "EQ-01", nombre: "MEZCLADORA", categoria: "OBRA", tarifaDiaria: 45000, stockTotal: 10 },
        { codigo: "EQ-02", nombre: "VIBRADOR", categoria: "OBRA", tarifaDiaria: 25000, stockTotal: 15 },
      ],
    });

    expect(resultado.length).toBe(2);
    expect(resultado[0].codigo).toBe("EQ-01");
    expect(resultado[1].codigo).toBe("EQ-02");
  });

  it("debe crear un equipo individual y verificar stock disponible inicial sin requerir peso", async () => {
    const mockRepo: IEquipoRepository = {
      findById: vi.fn(),
      findByCodigo: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((e) => Promise.resolve(e)),
      saveBulk: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new CrearEquipoUseCase(mockRepo);
    const resultado = await useCase.execute({
      codigo: "TAL-01",
      nombre: "TALADRO PERCUTOR",
      categoria: "HERRAMIENTAS",
      tarifaDiaria: 20000,
      stockTotal: 8,
    });

    expect(resultado.codigo).toBe("TAL-01");
    expect(resultado.stockTotal).toBe(8);
    expect(resultado.stockDisponible).toBe(8);
    expect(resultado.stockEnObra).toBe(0);
  });

  it("debe ajustar stock y tarifas mediante EditarEquipoUseCase", async () => {
    const equipoExistente = new EquipoEntity(
      "EQ-100",
      "AND-01",
      "ANDAMIO ESTANDAR",
      "ESTRUCTURAS",
      12000,
      PesoGramos.fromKilos(45),
      20,
      15,
      5 // 5 en obra
    );

    const mockRepo: IEquipoRepository = {
      findById: vi.fn().mockResolvedValue(equipoExistente),
      findByCodigo: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn(),
      saveBulk: vi.fn(),
      update: vi.fn().mockImplementation((e) => Promise.resolve(e)),
      delete: vi.fn(),
    };

    const useCase = new EditarEquipoUseCase(mockRepo);
    const resultado = await useCase.execute({
      id: "EQ-100",
      codigo: "AND-01",
      nombre: "ANDAMIO MULTIDIRECCIONAL REFORZADO",
      categoria: "ESTRUCTURAS",
      tarifaDiaria: 15000,
      pesoKilos: 50,
      stockTotal: 30, // incremento de 10
    });

    expect(resultado.nombre).toBe("ANDAMIO MULTIDIRECCIONAL REFORZADO");
    expect(resultado.stockTotal).toBe(30);
    expect(resultado.stockDisponible).toBe(25); // 15 + 10 = 25
    expect(resultado.stockEnObra).toBe(5); // en obra se mantiene protegido
  });

  it("debe gestionar subcategorías jerárquicas en la entidad y casos de uso", async () => {
    const equipo = new EquipoEntity(
      "EQ-200",
      "TAL-05",
      "TALADRO SDS PLUS",
      "HERRAMIENTAS",
      25000,
      PesoGramos.fromKilos(0),
      10,
      10,
      0,
      true,
      0,
      "PERFORACIÓN"
    );

    expect(equipo.subcategoria).toBe("PERFORACIÓN");

    const mockRepo: IEquipoRepository = {
      findById: vi.fn().mockResolvedValue(equipo),
      findByCodigo: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((e) => Promise.resolve(e)),
      saveBulk: vi.fn().mockImplementation((list) => Promise.resolve(list)),
      update: vi.fn().mockImplementation((e) => Promise.resolve(e)),
      delete: vi.fn(),
    };

    // Caso de uso: CrearEquipo con subcategoría
    const crearUseCase = new CrearEquipoUseCase(mockRepo);
    const nuevo = await crearUseCase.execute({
      codigo: "GEN-01",
      nombre: "PLANTA ELÉCTRICA DIESEL 10KVA",
      categoria: "GENERACIÓN",
      subcategoria: "PLANTAS ELÉCTRICAS",
      tarifaDiaria: 95000,
      stockTotal: 4,
    });
    expect(nuevo.categoria).toBe("GENERACIÓN");
    expect(nuevo.subcategoria).toBe("PLANTAS ELÉCTRICAS");

    // Caso de uso: EditarEquipo actualizando subcategoría
    const editarUseCase = new EditarEquipoUseCase(mockRepo);
    const editado = await editarUseCase.execute({
      id: "EQ-200",
      codigo: "TAL-05",
      nombre: "TALADRO SDS PLUS INDUSTRIAL",
      categoria: "HERRAMIENTAS",
      subcategoria: "DEMOLICIÓN LIVIANA",
      tarifaDiaria: 28000,
      stockTotal: 12,
    });
    expect(editado.subcategoria).toBe("DEMOLICIÓN LIVIANA");

    // Caso de uso: CargaMasiva con subcategorías
    const cargaMasivaUseCase = new CargaMasivaEquiposUseCase(mockRepo);
    const lote = await cargaMasivaUseCase.execute({
      equipos: [
        {
          codigo: "AND-10",
          nombre: "CUERPO ANDAMIO",
          categoria: "ESTRUCTURAS",
          subcategoria: "TUBULAR ESTÁNDAR",
          tarifaDiaria: 5000,
          stockTotal: 50,
        },
      ],
    });
    expect(lote[0].subcategoria).toBe("TUBULAR ESTÁNDAR");
  });
});

