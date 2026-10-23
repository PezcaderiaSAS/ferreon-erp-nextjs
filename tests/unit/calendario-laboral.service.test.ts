import { describe, it, expect } from 'vitest';
import {
  CalendarioLaboralService,
  ModoCobroDias,
} from '@/core/services/calendario-laboral.service';

describe('CalendarioLaboralService (TDD Dominio Puro)', () => {
  describe('calcularPascua (Computus Gregoriano)', () => {
    it('debe calcular la fecha exacta de Domingo de Resurrección para 2026', () => {
      // En 2026, Pascua es el 5 de Abril
      const pascua2026 = CalendarioLaboralService.calcularPascua(2026);
      expect(pascua2026.getUTCFullYear()).toBe(2026);
      expect(pascua2026.getUTCMonth()).toBe(3); // 3 = Abril (0-indexed)
      expect(pascua2026.getUTCDate()).toBe(5);
    });

    it('debe calcular la fecha exacta de Pascua para 2027 y 2028', () => {
      // En 2027, Pascua es el 28 de Marzo
      const pascua2027 = CalendarioLaboralService.calcularPascua(2027);
      expect(pascua2027.getUTCMonth()).toBe(2); // 2 = Marzo
      expect(pascua2027.getUTCDate()).toBe(28);

      // En 2028, Pascua es el 16 de Abril
      const pascua2028 = CalendarioLaboralService.calcularPascua(2028);
      expect(pascua2028.getUTCMonth()).toBe(3);
      expect(pascua2028.getUTCDate()).toBe(16);
    });
  });

  describe('obtenerFestivosColombia (Ley 51 de 1983 - Emiliani)', () => {
    it('debe retornar exactamente 18 festivos para el año 2026', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      expect(festivos.length).toBe(18);
    });

    it('debe incluir festivos fijos no trasladables', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      expect(fechas).toContain('2026-01-01'); // Año Nuevo
      expect(fechas).toContain('2026-05-01'); // Día del Trabajo
      expect(fechas).toContain('2026-07-20'); // Grito de Independencia
      expect(fechas).toContain('2026-08-07'); // Batalla de Boyacá
      expect(fechas).toContain('2026-12-08'); // Inmaculada Concepción
      expect(fechas).toContain('2026-12-25'); // Navidad
    });

    it('debe trasladar festivos de la Ley Emiliani al lunes siguiente', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      // Reyes Magos (6 de enero cae martes -> lunes 12 de enero)
      expect(fechas).toContain('2026-01-12');
      expect(fechas).not.toContain('2026-01-06');

      // San José (19 de marzo cae jueves -> lunes 23 de marzo)
      expect(fechas).toContain('2026-03-23');

      // Asunción de la Virgen (15 de agosto cae sábado -> lunes 17 de agosto)
      expect(fechas).toContain('2026-08-17');

      // Independencia de Cartagena (11 de nov cae miércoles -> lunes 16 de nov)
      expect(fechas).toContain('2026-11-16');
    });

    it('debe calcular correctamente los festivos dependientes de Pascua', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      expect(fechas).toContain('2026-04-02'); // Jueves Santo
      expect(fechas).toContain('2026-04-03'); // Viernes Santo
      expect(fechas).toContain('2026-05-18'); // Ascensión del Señor
      expect(fechas).toContain('2026-06-08'); // Corpus Christi
      expect(fechas).toContain('2026-06-15'); // Sagrado Corazón
    });
  });

  describe('esFestivo', () => {
    it('debe detectar correctamente si una fecha es festivo en Colombia', () => {
      expect(CalendarioLaboralService.esFestivo('2026-05-01').esFestivo).toBe(true);
      expect(CalendarioLaboralService.esFestivo('2026-05-01').nombre).toBe('Día del Trabajo');

      expect(CalendarioLaboralService.esFestivo('2026-05-02').esFestivo).toBe(false);
      expect(CalendarioLaboralService.esFestivo('2026-04-03').esFestivo).toBe(true); // Viernes Santo
    });
  });

  describe('esDiaHabil', () => {
    it('en CALENDARIO cualquier día es considerado válido para cobro', () => {
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'CALENDARIO')).toBe(true); // Festivo
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'CALENDARIO')).toBe(true); // Domingo
      expect(CalendarioLaboralService.esDiaHabil('2026-05-05', 'CALENDARIO')).toBe(true); // Martes
    });

    it('en HABILES_LUNES_VIERNES excluye sábados, domingos y festivos', () => {
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'HABILES_LUNES_VIERNES')).toBe(false); // Festivo (Viernes)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-02', 'HABILES_LUNES_VIERNES')).toBe(false); // Sábado
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'HABILES_LUNES_VIERNES')).toBe(false); // Domingo
      expect(CalendarioLaboralService.esDiaHabil('2026-05-04', 'HABILES_LUNES_VIERNES')).toBe(true);  // Lunes no festivo
      expect(CalendarioLaboralService.esDiaHabil('2026-05-05', 'HABILES_LUNES_VIERNES')).toBe(true);  // Martes
    });

    it('en HABILES_LUNES_SABADO incluye sábados pero excluye domingos y festivos', () => {
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'HABILES_LUNES_SABADO')).toBe(false); // Festivo
      expect(CalendarioLaboralService.esDiaHabil('2026-05-02', 'HABILES_LUNES_SABADO')).toBe(true);  // Sábado (Cobrado)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'HABILES_LUNES_SABADO')).toBe(false); // Domingo (Excluido)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-04', 'HABILES_LUNES_SABADO')).toBe(true);  // Lunes
    });
  });

  describe('calcularDiasCobrables y desglosarDiasPeriodo', () => {
    // Del 1 al 10 de Mayo de 2026 (10 días calendario en total):
    // 01-May (Vie): Festivo (Día del Trabajo)
    // 02-May (Sáb): Sábado
    // 03-May (Dom): Domingo
    // 04-May (Lun): Habil
    // 05-May (Mar): Habil
    // 06-May (Mié): Habil
    // 07-May (Jue): Habil
    // 08-May (Vie): Habil
    // 09-May (Sáb): Sábado
    // 10-May (Dom): Domingo

    it('debe calcular correctamente en modo CALENDARIO', () => {
      const dias = CalendarioLaboralService.calcularDiasCobrables('2026-05-01', '2026-05-10', 'CALENDARIO');
      expect(dias).toBe(10);

      const desglose = CalendarioLaboralService.desglosarDiasPeriodo('2026-05-01', '2026-05-10', 'CALENDARIO');
      expect(desglose.totalDiasCalendario).toBe(10);
      expect(desglose.diasCobrables).toBe(10);
      expect(desglose.diasExcluidos).toBe(0);
    });

    it('debe calcular correctamente en modo HABILES_LUNES_VIERNES', () => {
      // Excluye: 01 (Festivo), 02 (Sáb), 03 (Dom), 09 (Sáb), 10 (Dom) -> 5 días excluidos.
      // Quedan: 04, 05, 06, 07, 08 -> 5 días cobrables.
      const dias = CalendarioLaboralService.calcularDiasCobrables('2026-05-01', '2026-05-10', 'HABILES_LUNES_VIERNES');
      expect(dias).toBe(5);

      const desglose = CalendarioLaboralService.desglosarDiasPeriodo('2026-05-01', '2026-05-10', 'HABILES_LUNES_VIERNES');
      expect(desglose.totalDiasCalendario).toBe(10);
      expect(desglose.diasCobrables).toBe(5);
      expect(desglose.diasExcluidos).toBe(5);
    });

    it('debe calcular correctamente en modo HABILES_LUNES_SABADO', () => {
      // Excluye: 01 (Festivo), 03 (Dom), 10 (Dom) -> 3 días excluidos.
      // Cobra: 02 (Sáb), 04, 05, 06, 07, 08, 09 (Sáb) -> 7 días cobrables.
      const dias = CalendarioLaboralService.calcularDiasCobrables('2026-05-01', '2026-05-10', 'HABILES_LUNES_SABADO');
      expect(dias).toBe(7);

      const desglose = CalendarioLaboralService.desglosarDiasPeriodo('2026-05-01', '2026-05-10', 'HABILES_LUNES_SABADO');
      expect(desglose.totalDiasCalendario).toBe(10);
      expect(desglose.diasCobrables).toBe(7);
      expect(desglose.diasExcluidos).toBe(3);
    });

    it('debe lanzar error o retornar 0 si fecha fin es anterior a fecha inicio', () => {
      expect(() =>
        CalendarioLaboralService.calcularDiasCobrables('2026-05-10', '2026-05-01', 'CALENDARIO')
      ).toThrowError('La fecha final debe ser posterior o igual a la fecha de inicio');
    });

    it('debe manejar alquiler de 1 solo día cobrable correctamente', () => {
      const dias = CalendarioLaboralService.calcularDiasCobrables('2026-05-04', '2026-05-04', 'HABILES_LUNES_VIERNES');
      expect(dias).toBe(1);
    });

    it('debe manejar alquiler de 1 día que cae en festivo (retornando 0 días cobrables)', () => {
      const dias = CalendarioLaboralService.calcularDiasCobrables('2026-05-01', '2026-05-01', 'HABILES_LUNES_VIERNES');
      expect(dias).toBe(0);
    });
  });
});
