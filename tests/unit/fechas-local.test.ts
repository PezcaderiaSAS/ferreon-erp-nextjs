import { describe, it, expect } from 'vitest';
import { 
  parsearFechaLocal, 
  formatearFechaLocal, 
  calcularDiasEntreFechas 
} from '../../src/core/utils/fechas';

describe('Utilidades de Fecha Segura (fechas.ts)', () => {
  describe('parsearFechaLocal', () => {
    it('debe parsear una cadena YYYY-MM-DD preservando exactamente el día, mes y año ingresados', () => {
      const parsed = parsearFechaLocal('2026-09-17');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8); // Septiembre es mes 8 (0-indexed)
      expect(parsed.getDate()).toBe(17);
      expect(parsed.getHours()).toBe(12); // Mediodía neutraliza desfases de huso horario
    });

    it('debe parsear cadenas ISO completas sin retroceder al día anterior', () => {
      const parsed = parsearFechaLocal('2026-09-17T00:00:00.000Z');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(8);
      expect(parsed.getDate()).toBe(17);
    });

    it('debe manejar correctamente el primer día del año sin saltar al año anterior', () => {
      const parsed = parsearFechaLocal('2026-01-01');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(0); // Enero
      expect(parsed.getDate()).toBe(1);
    });

    it('debe manejar correctamente el último día del año', () => {
      const parsed = parsearFechaLocal('2026-12-31');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(11); // Diciembre
      expect(parsed.getDate()).toBe(31);
    });

    it('debe devolver la fecha actual si la entrada es nula o vacía', () => {
      const parsedNull = parsearFechaLocal(null);
      const parsedEmpty = parsearFechaLocal('');
      expect(parsedNull instanceof Date).toBe(true);
      expect(parsedEmpty instanceof Date).toBe(true);
      expect(isNaN(parsedNull.getTime())).toBe(false);
    });

    it('debe aceptar instancias de Date sin mutarlas', () => {
      const fechaOriginal = new Date(2026, 4, 15);
      const parsed = parsearFechaLocal(fechaOriginal);
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(4);
      expect(parsed.getDate()).toBe(15);
    });
  });

  describe('formatearFechaLocal', () => {
    it('debe formatear a DD/MM/YYYY garantizando que no se reste un día', () => {
      expect(formatearFechaLocal('2026-09-17')).toBe('17/09/2026');
      expect(formatearFechaLocal('2026-01-05')).toBe('05/01/2026');
    });

    it('debe admitir separador personalizado', () => {
      expect(formatearFechaLocal('2026-09-17', { separador: '-' })).toBe('17-09-2026');
    });

    it('debe formatear en modo largo en español', () => {
      expect(formatearFechaLocal('2026-09-17', { formatoLargo: true })).toBe('17 de septiembre de 2026');
      expect(formatearFechaLocal('2026-12-25', { formatoLargo: true })).toBe('25 de diciembre de 2026');
    });

    it('debe devolver "Sin fecha" si no se proporciona entrada válida', () => {
      expect(formatearFechaLocal(null)).toBe('Sin fecha');
      expect(formatearFechaLocal(undefined)).toBe('Sin fecha');
    });
  });

  describe('calcularDiasEntreFechas', () => {
    it('debe calcular exactamente los días calendario entre dos fechas', () => {
      const dias = calcularDiasEntreFechas('2026-09-17', '2026-09-22');
      expect(dias).toBe(5);
    });

    it('debe devolver al menos 1 día si las fechas son iguales', () => {
      const dias = calcularDiasEntreFechas('2026-09-17', '2026-09-17');
      expect(dias).toBe(1);
    });

    it('debe manejar cruce de meses correctamente', () => {
      // De 28 de febrero a 3 de marzo en año no bisiesto 2027 (28 días)
      const dias = calcularDiasEntreFechas('2027-02-28', '2027-03-03');
      expect(dias).toBe(3);
    });
  });
});
