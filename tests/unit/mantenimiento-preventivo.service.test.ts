import { describe, it, expect } from 'vitest';
import {
  MantenimientoPreventivoService,
  MantenimientoConfig,
  EstadoSemaforoMantenimiento,
} from '../../src/core/services/mantenimiento-preventivo.service';

describe('Suite de Pruebas Unitarias: MantenimientoPreventivoService (Alquileres System)', () => {
  describe('1. Evaluación de Semáforo de Mantenimiento Preventivo', () => {
    it('debe retornar OK cuando el equipo no requiere horómetro ni control de días', () => {
      const config: MantenimientoConfig = {
        tieneHorometro: false,
        horasUsoAcumuladas: 0,
        horasLimiteMantenimiento: 0,
        diasUsoAcumulados: 0,
        diasLimiteMantenimiento: 0,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      const semaforo = MantenimientoPreventivoService.evaluarSemaforoMantenimiento(config);
      expect(semaforo).toBe('OK');
    });

    it('debe retornar OK si el uso está por debajo del 80% del límite', () => {
      const config: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 50,
        horasLimiteMantenimiento: 100, // 50%
        diasUsoAcumulados: 10,
        diasLimiteMantenimiento: 30, // 33%
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      const semaforo = MantenimientoPreventivoService.evaluarSemaforoMantenimiento(config);
      expect(semaforo).toBe('OK');
    });

    it('debe retornar PROXIMO si el uso de horas o días está entre 80% y 99%', () => {
      // 85 horas de 100 = 85%
      const configHoras: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 85,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 10,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configHoras)).toBe('PROXIMO');

      // 25 días de 30 = 83.3%
      const configDias: MantenimientoConfig = {
        tieneHorometro: false,
        horasUsoAcumuladas: 0,
        horasLimiteMantenimiento: 0,
        diasUsoAcumulados: 25,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configDias)).toBe('PROXIMO');
    });

    it('debe retornar VENCIDO si las horas o días alcanzaron o superaron el 100%', () => {
      const configVencidoHoras: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 102,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 15,
        diasLimiteMantenimiento: 60,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configVencidoHoras)).toBe('VENCIDO');

      const configVencidoDias: MantenimientoConfig = {
        tieneHorometro: false,
        horasUsoAcumuladas: 0,
        horasLimiteMantenimiento: 0,
        diasUsoAcumulados: 60,
        diasLimiteMantenimiento: 60,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configVencidoDias)).toBe('VENCIDO');
    });

    it('debe retornar VENCIDO si el equipo tiene unidades físicas en stockMantenimiento > 0', () => {
      const configEnTaller: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 20,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 5,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 2, // Hay 2 en el taller
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configEnTaller)).toBe('VENCIDO');
    });
  });

  describe('2. Cálculo de Porcentajes de Uso y Vida Útil', () => {
    it('debe calcular el porcentaje exacto y acotado', () => {
      expect(MantenimientoPreventivoService.calcularPorcentajeUso(50, 100)).toBe(50);
      expect(MantenimientoPreventivoService.calcularPorcentajeUso(85, 100)).toBe(85);
      expect(MantenimientoPreventivoService.calcularPorcentajeUso(120, 100)).toBe(120);
    });

    it('debe ser tolerante y retornar 0 si el límite es 0 o negativo', () => {
      expect(MantenimientoPreventivoService.calcularPorcentajeUso(50, 0)).toBe(0);
      expect(MantenimientoPreventivoService.calcularPorcentajeUso(50, -10)).toBe(0);
    });

    it('debe determinar el porcentaje de desgaste crítico consolidado', () => {
      const config: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 90,
        horasLimiteMantenimiento: 100, // 90%
        diasUsoAcumulados: 15,
        diasLimiteMantenimiento: 30, // 50%
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      // Debe tomar el mayor de los dos (el cuello de botella crítico)
      expect(MantenimientoPreventivoService.obtenerPorcentajeDesgasteMaximo(config)).toBe(90);
    });
  });

  describe('3. Liquidación de Uso tras Devolución', () => {
    it('debe acumular los días en obra a los días de ciclo previo', () => {
      const configInicial: MantenimientoConfig = {
        tieneHorometro: false,
        horasUsoAcumuladas: 0,
        horasLimiteMantenimiento: 0,
        diasUsoAcumulados: 12,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      const resultado = MantenimientoPreventivoService.liquidarCicloDevolucion(configInicial, {
        diasEnObra: 8,
      });

      expect(resultado.valido).toBe(true);
      expect(resultado.configActualizada?.diasUsoAcumulados).toBe(20);
    });

    it('debe calcular el delta de horas y acumularlo si se envían horómetros', () => {
      const configInicial: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 40,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 5,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      // Despachado con 150 hrs, devuelto con 175 hrs -> delta = 25 hrs
      const resultado = MantenimientoPreventivoService.liquidarCicloDevolucion(configInicial, {
        diasEnObra: 5,
        horometroDespacho: 150,
        horometroRetorno: 175,
      });

      expect(resultado.valido).toBe(true);
      expect(resultado.configActualizada?.horasUsoAcumuladas).toBe(65); // 40 + 25
      expect(resultado.configActualizada?.diasUsoAcumulados).toBe(10); // 5 + 5
    });

    it('debe aplicar Poka-Yoke y rechazar si el horómetro de retorno es menor al de despacho', () => {
      const configInicial: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 40,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 5,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 0,
        ultimoMantenimientoAt: null,
        ultimoMantenimientoObs: null,
      };

      const resultado = MantenimientoPreventivoService.liquidarCicloDevolucion(configInicial, {
        diasEnObra: 5,
        horometroDespacho: 200,
        horometroRetorno: 180, // Inconsistencia Poka-Yoke
      });

      expect(resultado.valido).toBe(false);
      expect(resultado.error).toContain('horómetro');
    });
  });

  describe('4. Reseteo de Ciclo tras Mantenimiento Preventivo', () => {
    it('debe reiniciar contadores de horas y días a 0 y actualizar fecha y notas', () => {
      const configVencida: MantenimientoConfig = {
        tieneHorometro: true,
        horasUsoAcumuladas: 105,
        horasLimiteMantenimiento: 100,
        diasUsoAcumulados: 35,
        diasLimiteMantenimiento: 30,
        stockMantenimiento: 1,
        ultimoMantenimientoAt: '2026-08-01T00:00:00Z',
        ultimoMantenimientoObs: 'Cambio anterior',
      };

      const fechaTest = '2026-10-23T10:00:00.000Z';
      const configReseteada = MantenimientoPreventivoService.ejecutarResetMantenimiento(
        configVencida,
        'Cambio de bujías, aceite 10W-30 y filtro de aire en taller central.',
        fechaTest
      );

      expect(configReseteada.horasUsoAcumuladas).toBe(0);
      expect(configReseteada.diasUsoAcumulados).toBe(0);
      expect(configReseteada.ultimoMantenimientoAt).toBe(fechaTest);
      expect(configReseteada.ultimoMantenimientoObs).toContain('Cambio de bujías');
      expect(MantenimientoPreventivoService.evaluarSemaforoMantenimiento(configReseteada)).toBe('OK');
    });
  });
});
