import { describe, it, expect } from "vitest";
import { formatearMonedaCOP, numeroALetras } from "../../src/core/utils/numero-a-letras";

describe("Reglas de Negocio: Moneda COP sin Centavos & Precisión Matemática", () => {
  it("debe redondear valores con fracciones y formatear como entero sin centavos", () => {
    // Si llegara un valor con decimales por operación flotante, se formatea como entero
    expect(formatearMonedaCOP(40000.75)).toBe("$40.001");
    expect(formatearMonedaCOP(40000.20)).toBe("$40.000");
    expect(formatearMonedaCOP(1500000)).toBe("$1.500.000");
    expect(formatearMonedaCOP(0)).toBe("$0");
  });

  it("debe formatear estrictamente con separadores de miles y sin decimales de centavos", () => {
    const formatted = formatearMonedaCOP(45000);
    expect(formatted).toBe("$45.000");
    // Debe coincidir exactamente con el patrón de pesos enteros con separador de miles: $XX.XXX
    expect(formatted).toMatch(/^\$\d{1,3}(\.\d{3})*$/);
    expect(formatted).not.toContain(",");
  });

  it("debe generar la glosa legal colombiana en letras finalizando en PESOS M/CTE", () => {
    expect(numeroALetras(40000)).toBe("SON: CUARENTA MIL PESOS M/CTE");
    expect(numeroALetras(145000)).toBe("SON: CIENTO CUARENTA Y CINCO MIL PESOS M/CTE");
    expect(numeroALetras(2500000)).toBe("SON: DOS MILLONES QUINIENTOS MIL PESOS M/CTE");
  });
});
