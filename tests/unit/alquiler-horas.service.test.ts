import { describe, it, expect } from 'vitest';
import { AlquilerHorasService } from '@/core/services/alquiler-horas.service';

describe('SPEC-015: AlquilerHorasService (Dominio Puro y Cálculos por Horas)', () => {
  describe('1. Cálculo de Tarifa por Hora con Recargo Express (20%)', () => {
    it('calcula la tarifa por hora exacta para $80.000 COP con 20% de recargo', () => {
      // 80.000 / 8 = 10.000 -> 10.000 * 1.20 = 12.000 COP
      const tarifaHora = AlquilerHorasService.calcularTarifaHora(80000, 20);
      expect(tarifaHora).toBe(12000);
    });

    it('utiliza 20% de recargo como valor predeterminado si no se especifica', () => {
      const tarifaHora = AlquilerHorasService.calcularTarifaHora(80000);
      expect(tarifaHora).toBe(12000);
    });

    it('redondea adecuadamente al entero COP más cercano sin decimales', () => {
      // 55.000 / 8 = 6.875 -> 6.875 * 1.20 = 8.250 COP
      const tarifa1 = AlquilerHorasService.calcularTarifaHora(55000);
      expect(tarifa1).toBe(8250);

      // 45.000 / 8 = 5.625 -> 5.625 * 1.20 = 6.750 COP
      const tarifa2 = AlquilerHorasService.calcularTarifaHora(45000);
      expect(tarifa2).toBe(6750);

      // 10.500 / 8 = 1.312,5 -> 1.312,5 * 1.20 = 1.575 COP
      const tarifa3 = AlquilerHorasService.calcularTarifaHora(10500);
      expect(tarifa3).toBe(1575);
    });

    it('soporta recargos personalizados (ej. 0%, 15%, 25%)', () => {
      // Sin recargo: 80.000 / 8 = 10.000
      expect(AlquilerHorasService.calcularTarifaHora(80000, 0)).toBe(10000);

      // 15% recargo: 80.000 / 8 = 10.000 * 1.15 = 11.500
      expect(AlquilerHorasService.calcularTarifaHora(80000, 15)).toBe(11500);

      // 25% recargo: 80.000 / 8 = 10.000 * 1.25 = 12.500
      expect(AlquilerHorasService.calcularTarifaHora(80000, 25)).toBe(12500);
    });

    it('retorna 0 para tarifas diarias menores o iguales a cero', () => {
      expect(AlquilerHorasService.calcularTarifaHora(0)).toBe(0);
      expect(AlquilerHorasService.calcularTarifaHora(-50000)).toBe(0);
    });
  });

  describe('2. Normalización y Validación Poka-Yoke de Horas', () => {
    it('autocorrige valores menores a 1 al mínimo de 1 hora [W01]', () => {
      expect(AlquilerHorasService.normalizarHoras(0)).toBe(1);
      expect(AlquilerHorasService.normalizarHoras(-3)).toBe(1);
      expect(AlquilerHorasService.normalizarHoras(NaN)).toBe(1);
    });

    it('mantiene enteros positivos mayores a 1', () => {
      expect(AlquilerHorasService.normalizarHoras(2)).toBe(2);
      expect(AlquilerHorasService.normalizarHoras(4)).toBe(4);
      expect(AlquilerHorasService.normalizarHoras(8)).toBe(8);
    });
  });

  describe('3. Proyección Automática de Hora de Devolución', () => {
    it('proyecta la hora de retorno sumando horas en formato 24h', () => {
      const horaRetorno = AlquilerHorasService.proyectarHoraRetorno('08:30', 4);
      expect(horaRetorno).toBe('12:30');
    });

    it('soporta formato 12h legible con AM/PM', () => {
      const retorno12 = AlquilerHorasService.proyectarHoraRetorno('08:30 AM', 4, '12h');
      expect(retorno12).toBe('12:30 PM');

      const retornoTarde = AlquilerHorasService.proyectarHoraRetorno('10:15 AM', 3, '12h');
      expect(retornoTarde).toBe('01:15 PM');
    });

    it('cruza correctamente el mediodía y la tarde', () => {
      // 11:45 + 2h = 13:45 (01:45 PM)
      expect(AlquilerHorasService.proyectarHoraRetorno('11:45', 2)).toBe('13:45');
      expect(AlquilerHorasService.proyectarHoraRetorno('11:45', 2, '12h')).toBe('01:45 PM');
    });

    it('maneja horas en formato 24h cuando se solicita salida en formato 12h', () => {
      expect(AlquilerHorasService.formatearHora12('14:30')).toBe('02:30 PM');
      expect(AlquilerHorasService.formatearHora12('09:05')).toBe('09:05 AM');
      expect(AlquilerHorasService.formatearHora12('12:00')).toBe('12:00 PM');
      expect(AlquilerHorasService.formatearHora12('00:15')).toBe('12:15 AM');
    });
  });

  describe('4. Detección de Sobrepaso de Horario Laboral [W02]', () => {
    it('detecta si la hora proyectada supera el horario de cierre (18:00)', () => {
      // 17:30 está dentro de horario laboral (cierre 18:00)
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('17:30', '18:00')).toBe(false);

      // 18:00 es la hora exacta de cierre
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('18:00', '18:00')).toBe(false);

      // 18:30 sobrepasa el horario laboral
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('18:30', '18:00')).toBe(true);

      // 19:15 sobrepasa el horario laboral
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('19:15', '18:00')).toBe(true);
    });

    it('soporta horarios de cierre personalizados', () => {
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('16:30', '16:00')).toBe(true);
      expect(AlquilerHorasService.esSobrepasoHorarioLaboral('15:59', '16:00')).toBe(false);
    });
  });

  describe('5. Cálculo de Horas Extras y Recargos por Retraso', () => {
    it('retorna 0 si la hora real de recepción es antes o igual a la hora pactada', () => {
      expect(AlquilerHorasService.calcularHorasRetraso('14:00', '13:45')).toBe(0);
      expect(AlquilerHorasService.calcularHorasRetraso('14:00', '14:00')).toBe(0);
    });

    it('calcula horas completas de retraso', () => {
      // 2 horas completas de retraso
      expect(AlquilerHorasService.calcularHorasRetraso('14:00', '16:00')).toBe(2);
    });

    it('redondea hacia arriba (CEIL) las fracciones de hora para cobro estándar express', () => {
      // 14:00 pactada vs 14:15 real (15 minutos tarde = 1 hora cobrable)
      expect(AlquilerHorasService.calcularHorasRetraso('14:00', '14:15')).toBe(1);

      // 14:00 pactada vs 15:05 real (1 hora y 5 minutos tarde = 2 horas cobrables)
      expect(AlquilerHorasService.calcularHorasRetraso('14:00', '15:05')).toBe(2);
    });

    it('soporta cálculo exacto fraccionario en horas si se especifica', () => {
      const horasExactas = AlquilerHorasService.calcularHorasRetraso('14:00', '15:30', 'EXACT');
      expect(horasExactas).toBe(1.5);
    });
  });

  describe('6. Poka-Yoke: Control de Tope Configurable de Equipos [E03]', () => {
    it('permite agregar equipos si la suma es menor al límite configurado', () => {
      const evaluacion = AlquilerHorasService.validarTopeEquipos(3, 5);
      expect(evaluacion.permitido).toBe(true);
      expect(evaluacion.restante).toBe(2);
    });

    it('bloquea la adición de equipos si se alcanza o supera el límite', () => {
      const tope5 = AlquilerHorasService.validarTopeEquipos(5, 5);
      expect(tope5.permitido).toBe(false);
      expect(tope5.restante).toBe(0);
      expect(tope5.mensaje).toContain('Tope de equipos alcanzado');

      const topeExcedido = AlquilerHorasService.validarTopeEquipos(6, 5);
      expect(topeExcedido.permitido).toBe(false);
      expect(topeExcedido.restante).toBe(0);
    });
  });

  describe('7. Subtotales Reactivos en 0 ms', () => {
    it('calcula el subtotal exacto de línea por horas: tarifaHora * horas * cantidad', () => {
      // Taladro: $80.000/día -> $12.000/hora. 4 horas x 2 unidades = $96.000 COP
      const subtotal = AlquilerHorasService.calcularSubtotalItem(80000, 4, 2, 20);
      expect(subtotal).toBe(96000);
    });

    it('calcula subtotal para 1 hora y 1 unidad', () => {
      const subtotal = AlquilerHorasService.calcularSubtotalItem(80000, 1, 1, 20);
      expect(subtotal).toBe(12000);
    });
  });
});
