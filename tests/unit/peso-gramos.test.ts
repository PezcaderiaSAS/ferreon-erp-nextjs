import { describe, it, expect } from "vitest";
import { PesoGramos } from "../../src/core/domain/value-objects/peso-gramos";

describe("Value Object: PesoGramos", () => {
  it("debe crear un PesoGramos a partir de kilos correctamente", () => {
    const peso = PesoGramos.fromKilos(24.575);
    expect(peso.gramos).toBe(BigInt(24575));
    expect(peso.toKilos()).toBe(24.575);
  });

  it("debe redondear decimales de kilos a gramos enteros sin perder precisión", () => {
    const peso = PesoGramos.fromKilos(10.1234);
    expect(peso.gramos).toBe(BigInt(10123));
    expect(peso.toKilos()).toBe(10.123);
  });

  it("debe lanzar error si el peso en kilos es negativo", () => {
    expect(() => PesoGramos.fromKilos(-5)).toThrow("El peso en kilos debe ser un número mayor o igual a 0.");
  });

  it("debe lanzar error si los gramos son negativos", () => {
    expect(() => PesoGramos.fromGramos(-100)).toThrow("El peso en gramos no puede ser negativo.");
  });
});
