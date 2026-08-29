import { describe, it, expect } from 'vitest';
import { numeroALetras, formatearMonedaCOP, formatearMonedaConLetras } from '../src/core/utils/numero-a-letras';

describe('Utilidad de Moneda y Números a Letras', () => {
  it('formatearMonedaCOP debe formatear enteros correctamente con separadores de miles', () => {
    expect(formatearMonedaCOP(10000)).toBe('$10.000');
    expect(formatearMonedaCOP(350000)).toBe('$350.000');
    expect(formatearMonedaCOP(0)).toBe('$0');
  });

  it('numeroALetras debe convertir valores numéricos en texto formal colombiano', () => {
    expect(numeroALetras(0)).toBe('CERO PESOS M/CTE');
    expect(numeroALetras(10000)).toBe('SON: DIEZ MIL PESOS M/CTE');
    expect(numeroALetras(350000)).toBe('SON: TRESCIENTOS CINCUENTA MIL PESOS M/CTE');
    expect(numeroALetras(1000000)).toBe('SON: UN MILLON PESOS M/CTE');
  });

  it('formatearMonedaConLetras debe generar el texto combinado para la interfaz', () => {
    expect(formatearMonedaConLetras(10000)).toBe('$10.000 (Diez mil pesos)');
    expect(formatearMonedaConLetras(350000)).toBe('$350.000 (Trescientos cincuenta mil pesos)');
    expect(formatearMonedaConLetras(0)).toBe('$0 (Cero pesos)');
  });
});
