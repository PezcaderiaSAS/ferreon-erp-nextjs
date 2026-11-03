import { describe, it, expect } from 'vitest';
import {
  CalendarioLaboralService,
  ModoCobroDias,
} from '@/core/services/calendario-laboral.service';

describe('CalendarioLaboralService — Suite TDD SPEC-014', () => {
  describe('1. Algoritmo de Computus (Domingo de Pascua)', () => {
    it('debe calcular con precisión matemática el Domingo de Pascua para múltiples años de referencia', () => {
      // 2024: 31 de Marzo
      expect(
        CalendarioLaboralService.formatearFechaISO(
          CalendarioLaboralService.calcularPascua(2024)
        )
      ).toBe('2024-03-31');
      // 2025: 20 de Abril
      expect(
        CalendarioLaboralService.formatearFechaISO(
          CalendarioLaboralService.calcularPascua(2025)
        )
      ).toBe('2025-04-20');
      // 2026: 5 de Abril
      expect(
        CalendarioLaboralService.formatearFechaISO(
          CalendarioLaboralService.calcularPascua(2026)
        )
      ).toBe('2026-04-05');
      // 2027: 28 de Marzo
      expect(
        CalendarioLaboralService.formatearFechaISO(
          CalendarioLaboralService.calcularPascua(2027)
        )
      ).toBe('2027-03-28');
    });
  });

  describe('2. Festivos Oficiales de Colombia (Ley 51 de 1983 - Emiliani)', () => {
    it('debe generar exactamente 18 festivos oficiales para el año 2026 en Colombia', () => {
      const festivos2026 = CalendarioLaboralService.obtenerFestivosColombia(2026);
      expect(festivos2026).toHaveLength(18);

      // Verificar que todos los festivos tengan fecha ISO válida YYYY-MM-DD
      festivos2026.forEach((f) => {
        expect(f.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(f.nombre).toBeDefined();
        expect(['FIJO', 'EMILIANI', 'PASCUA']).toContain(f.tipo);
      });
    });

    it('debe respetar festivos inamovibles (Fijos) en sus fechas exactas de calendario', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      expect(fechas).toContain('2026-01-01'); // Año Nuevo
      expect(fechas).toContain('2026-05-01'); // Día del Trabajo
      expect(fechas).toContain('2026-07-20'); // Grito de Independencia
      expect(fechas).toContain('2026-08-07'); // Batalla de Boyacá
      expect(fechas).toContain('2026-12-08'); // Inmaculada Concepción
      expect(fechas).toContain('2026-12-25'); // Navidad
    });

    it('debe trasladar festivos de la Ley Emiliani al lunes siguiente cuando caen en otros días', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      expect(fechas).toContain('2026-01-12'); // Reyes Magos
      expect(fechas).toContain('2026-03-23'); // San José
      expect(fechas).toContain('2026-06-29'); // San Pedro y San Pablo
      expect(fechas).toContain('2026-08-17'); // Asunción de la Virgen
      expect(fechas).toContain('2026-10-12'); // Día de la Raza
      expect(fechas).toContain('2026-11-02'); // Todos los Santos
      expect(fechas).toContain('2026-11-16'); // Independencia de Cartagena
    });

    it('debe calcular con precisión los festivos móviles derivados de la Pascua 2026', () => {
      const festivos = CalendarioLaboralService.obtenerFestivosColombia(2026);
      const fechas = festivos.map((f) => f.fecha);

      expect(fechas).toContain('2026-04-02'); // Jueves Santo
      expect(fechas).toContain('2026-04-03'); // Viernes Santo
      expect(fechas).toContain('2026-05-18'); // Ascensión del Señor
      expect(fechas).toContain('2026-06-08'); // Corpus Christi
      expect(fechas).toContain('2026-06-15'); // Sagrado Corazón de Jesús
    });
  });

  describe('3. Identificación de Día Festivo y Hábil', () => {
    it('debe detectar correctamente si una fecha dada es festivo en Colombia', () => {
      expect(CalendarioLaboralService.esFestivo('2026-01-01').esFestivo).toBe(true); // Año nuevo
      expect(CalendarioLaboralService.esFestivo('2026-01-02').esFestivo).toBe(false); // Viernes hábil
      expect(CalendarioLaboralService.esFestivo('2026-01-12').esFestivo).toBe(true); // Reyes Magos trasladado
      expect(CalendarioLaboralService.esFestivo('2026-05-01').esFestivo).toBe(true); // Día del trabajo
      expect(CalendarioLaboralService.esFestivo('2026-05-02').esFestivo).toBe(false); // Sábado no festivo
    });

    it('debe evaluar correctamente esDiaHabil según la modalidad pactada', () => {
      // 2026-05-01 (Viernes festivo - Día del Trabajo)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'CALENDARIO')).toBe(true);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'HABILES_LUNES_VIERNES')).toBe(false);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-01', 'HABILES_LUNES_SABADO')).toBe(false);

      // 2026-05-02 (Sábado normal)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-02', 'CALENDARIO')).toBe(true);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-02', 'HABILES_LUNES_VIERNES')).toBe(false);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-02', 'HABILES_LUNES_SABADO')).toBe(true);

      // 2026-05-03 (Domingo normal)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'CALENDARIO')).toBe(true);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'HABILES_LUNES_VIERNES')).toBe(false);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-03', 'HABILES_LUNES_SABADO')).toBe(false);

      // 2026-05-04 (Lunes hábil normal)
      expect(CalendarioLaboralService.esDiaHabil('2026-05-04', 'CALENDARIO')).toBe(true);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-04', 'HABILES_LUNES_VIERNES')).toBe(true);
      expect(CalendarioLaboralService.esDiaHabil('2026-05-04', 'HABILES_LUNES_SABADO')).toBe(true);
    });
  });

  describe('4. Cálculo de Días Cobrables en Rango (calcularDiasCobrables)', () => {
    it('debe cobrar todos los días continuos en modalidad CALENDARIO', () => {
      // Del lunes 2026-05-04 al domingo 2026-05-10: 7 días calendario
      const dias = CalendarioLaboralService.calcularDiasCobrables(
        '2026-05-04',
        '2026-05-10',
        'CALENDARIO'
      );
      expect(dias).toBe(7);
    });

    it('debe cobrar 5 días (L-V) excluyendo fin de semana en semana ordinaria para HABILES_LUNES_VIERNES', () => {
      // Del lunes 2026-05-04 al domingo 2026-05-10 (sin festivos): 5 hábiles
      const dias = CalendarioLaboralService.calcularDiasCobrables(
        '2026-05-04',
        '2026-05-10',
        'HABILES_LUNES_VIERNES'
      );
      expect(dias).toBe(5);
    });

    it('debe cobrar 6 días (L-S) excluyendo solo domingo en semana ordinaria para HABILES_LUNES_SABADO', () => {
      // Del lunes 2026-05-04 al domingo 2026-05-10: 6 días (lunes a sábado)
      const dias = CalendarioLaboralService.calcularDiasCobrables(
        '2026-05-04',
        '2026-05-10',
        'HABILES_LUNES_SABADO'
      );
      expect(dias).toBe(6);
    });

    it('debe descontar festivos en HABILES_LUNES_VIERNES y HABILES_LUNES_SABADO', () => {
      // Semana de la Ascensión: del Lunes 2026-05-18 (Festivo) al Domingo 2026-05-24
      // Total días calendario: 7
      // HABILES_LUNES_VIERNES: normalmente 5, pero lunes es festivo -> 4 días
      // HABILES_LUNES_SABADO: normalmente 6, pero lunes es festivo -> 5 días
      expect(
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-18',
          '2026-05-24',
          'CALENDARIO'
        )
      ).toBe(7);

      expect(
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-18',
          '2026-05-24',
          'HABILES_LUNES_VIERNES'
        )
      ).toBe(4);

      expect(
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-18',
          '2026-05-24',
          'HABILES_LUNES_SABADO'
        )
      ).toBe(5);
    });

    it('debe arrojar error si fechaFin es estrictamente anterior a fechaInicio', () => {
      expect(() => {
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-10',
          '2026-05-04',
          'CALENDARIO'
        );
      }).toThrowError(/fecha final/i);
    });

    it('debe cobrar 1 día si fechaInicio y fechaFin son el mismo día hábil', () => {
      expect(
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-04',
          '2026-05-04',
          'HABILES_LUNES_VIERNES'
        )
      ).toBe(1);
    });

    it('debe cobrar 0 días si fechaInicio y fechaFin caen en un festivo no hábil', () => {
      expect(
        CalendarioLaboralService.calcularDiasCobrables(
          '2026-05-01',
          '2026-05-01',
          'HABILES_LUNES_VIERNES'
        )
      ).toBe(0);
    });
  });

  describe('5. Desglose Detallado del Período (desglosarDiasPeriodo)', () => {
    it('debe retornar resumen completo y detalle día a día con motivos de exclusión', () => {
      // Del Viernes 2026-05-01 (Festivo) al Domingo 2026-05-03: 3 días calendario
      const resultado = CalendarioLaboralService.desglosarDiasPeriodo(
        '2026-05-01',
        '2026-05-03',
        'HABILES_LUNES_VIERNES'
      );

      expect(resultado.totalDiasCalendario).toBe(3);
      expect(resultado.diasCobrables).toBe(0); // Viernes festivo, Sábado no hábil, Domingo no hábil
      expect(resultado.diasExcluidos).toBe(3);
      expect(resultado.modoCobro).toBe('HABILES_LUNES_VIERNES');
      expect(resultado.detalles).toHaveLength(3);

      // Día 1: 2026-05-01
      expect(resultado.detalles[0].fecha).toBe('2026-05-01');
      expect(resultado.detalles[0].esFestivo).toBe(true);
      expect(resultado.detalles[0].esCobrable).toBe(false);
      expect(resultado.detalles[0].motivoExclusion).toContain('Festivo (Día del Trabajo)');

      // Día 2: 2026-05-02
      expect(resultado.detalles[1].fecha).toBe('2026-05-02');
      expect(resultado.detalles[1].esCobrable).toBe(false);
      expect(resultado.detalles[1].motivoExclusion).toContain('Sábado');

      // Día 3: 2026-05-03
      expect(resultado.detalles[2].fecha).toBe('2026-05-03');
      expect(resultado.detalles[2].esCobrable).toBe(false);
      expect(resultado.detalles[2].motivoExclusion).toContain('Domingo');
    });

    it('debe soportar cruces de año con festivos correspondientes', () => {
      // Del 2025-12-30 al 2026-01-04 (6 días calendario)
      const res = CalendarioLaboralService.desglosarDiasPeriodo(
        '2025-12-30',
        '2026-01-04',
        'HABILES_LUNES_VIERNES'
      );

      expect(res.totalDiasCalendario).toBe(6);
      expect(res.diasCobrables).toBe(3); // 30 Dic, 31 Dic, 2 Ene
      expect(res.diasExcluidos).toBe(3); // 1 Ene (Festivo), 3 Ene (Sábado), 4 Ene (Domingo)
    });
  });
});
