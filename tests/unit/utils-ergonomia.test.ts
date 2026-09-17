import { describe, it, expect } from 'vitest';
import { parsearNumeroErgonomico, formatearValorErgonomico } from '../../src/lib/utils';

describe('Utilidades de Ergonomía de Inputs Numéricos', () => {
  it('parsearNumeroErgonomico debe devolver 0 cuando la cadena está vacía o contiene solo espacios', () => {
    expect(parsearNumeroErgonomico('')).toBe(0);
    expect(parsearNumeroErgonomico('   ')).toBe(0);
  });

  it('parsearNumeroErgonomico debe parsear números enteros y decimales válidos', () => {
    expect(parsearNumeroErgonomico('50000')).toBe(50000);
    expect(parsearNumeroErgonomico('12500.50')).toBe(12500.50);
  });

  it('parsearNumeroErgonomico debe respetar el valor mínimo especificado', () => {
    expect(parsearNumeroErgonomico('-500', 0)).toBe(0);
    expect(parsearNumeroErgonomico('5', 10)).toBe(10);
  });

  it('parsearNumeroErgonomico debe retornar el mínimo ante caracteres no numéricos', () => {
    expect(parsearNumeroErgonomico('abc')).toBe(0);
    expect(parsearNumeroErgonomico('xyz', 1)).toBe(1);
  });

  it('formatearValorErgonomico debe retornar cadena vacía cuando el valor es 0, null o undefined', () => {
    expect(formatearValorErgonomico(0)).toBe('');
    expect(formatearValorErgonomico(null)).toBe('');
    expect(formatearValorErgonomico(undefined)).toBe('');
  });

  it('formatearValorErgonomico debe retornar el número intacto cuando es mayor a 0', () => {
    expect(formatearValorErgonomico(35000)).toBe(35000);
    expect(formatearValorErgonomico(1)).toBe(1);
  });
});
