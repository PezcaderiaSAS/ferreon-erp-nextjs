import { describe, it, expect } from "vitest";
import { numeroALetras, formatearMonedaCOP } from "../../src/core/utils/numero-a-letras";

describe("Utils: numeroALetras & formatearMonedaCOP", () => {
  it("debe formatear números a formato moneda colombiano $40.000", () => {
    expect(formatearMonedaCOP(40000)).toBe("$40.000");
    expect(formatearMonedaCOP(145000)).toBe("$145.000");
    expect(formatearMonedaCOP(1500000)).toBe("$1.500.000");
    expect(formatearMonedaCOP(0)).toBe("$0");
  });

  it("debe convertir números a su valor textual formal en español", () => {
    expect(numeroALetras(40000)).toBe("SON: CUARENTA MIL PESOS M/CTE");
    expect(numeroALetras(145000)).toBe("SON: CIENTO CUARENTA Y CINCO MIL PESOS M/CTE");
    expect(numeroALetras(270000)).toBe("SON: DOSCIENTOS SETENTA MIL PESOS M/CTE");
    expect(numeroALetras(1000000)).toBe("SON: UN MILLON PESOS M/CTE");
    expect(numeroALetras(2500000)).toBe("SON: DOS MILLONES QUINIENTOS MIL PESOS M/CTE");
  });
});
