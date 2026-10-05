import { describe, it, expect } from 'vitest';
import {
  calcularRangoMaestria,
  calcularProgresoSiguienteNivel,
  evaluarDesbloqueoInsignias,
  registrarCompletitudMision,
  type RangoMaestria,
  type ProgresoGamificationState,
  RANGOS_MAESTRIA_CONFIG,
} from '../../src/core/services/gamification.service';

describe('GamificationService — Academia Alquileres System (TDD Engine)', () => {
  describe('1. Cálculo de Rangos de Maestría según XP', () => {
    it('asigna "APRENDIZ_TALLER" (Nivel 1) para puntajes entre 0 y 200 XP', () => {
      expect(calcularRangoMaestria(0)).toBe('APRENDIZ_TALLER');
      expect(calcularRangoMaestria(100)).toBe('APRENDIZ_TALLER');
      expect(calcularRangoMaestria(200)).toBe('APRENDIZ_TALLER');
    });

    it('asigna "OPERADOR_BODEGA" (Nivel 2) para puntajes entre 201 y 500 XP', () => {
      expect(calcularRangoMaestria(201)).toBe('OPERADOR_BODEGA');
      expect(calcularRangoMaestria(350)).toBe('OPERADOR_BODEGA');
      expect(calcularRangoMaestria(500)).toBe('OPERADOR_BODEGA');
    });

    it('asigna "ASESOR_COMERCIAL" (Nivel 3) para puntajes entre 501 y 900 XP', () => {
      expect(calcularRangoMaestria(501)).toBe('ASESOR_COMERCIAL');
      expect(calcularRangoMaestria(750)).toBe('ASESOR_COMERCIAL');
      expect(calcularRangoMaestria(900)).toBe('ASESOR_COMERCIAL');
    });

    it('asigna "MAESTRO_CONTRATOS" (Nivel 4) para puntajes entre 901 y 1400 XP', () => {
      expect(calcularRangoMaestria(901)).toBe('MAESTRO_CONTRATOS');
      expect(calcularRangoMaestria(1200)).toBe('MAESTRO_CONTRATOS');
      expect(calcularRangoMaestria(1400)).toBe('MAESTRO_CONTRATOS');
    });

    it('asigna "GERENTE_MAQUINARIA" (Nivel 5) para puntajes superiores a 1400 XP', () => {
      expect(calcularRangoMaestria(1401)).toBe('GERENTE_MAQUINARIA');
      expect(calcularRangoMaestria(2500)).toBe('GERENTE_MAQUINARIA');
      expect(calcularRangoMaestria(10000)).toBe('GERENTE_MAQUINARIA');
    });

    it('maneja valores atípicos y negativos devolviendo el nivel inicial seguro', () => {
      expect(calcularRangoMaestria(-50)).toBe('APRENDIZ_TALLER');
    });
  });

  describe('2. Cálculo de Progreso Porcentual hacia el Siguiente Nivel', () => {
    it('calcula 0% de avance al inicio con 0 XP', () => {
      const progreso = calcularProgresoSiguienteNivel(0);
      expect(progreso.nivelActual).toBe(1);
      expect(progreso.rango).toBe('APRENDIZ_TALLER');
      expect(progreso.porcentaje).toBe(0);
      expect(progreso.xpParaSubir).toBe(201);
    });

    it('calcula 50% de avance en Nivel 1 con 100 XP (meta: 200 XP)', () => {
      const progreso = calcularProgresoSiguienteNivel(100);
      expect(progreso.nivelActual).toBe(1);
      expect(progreso.rango).toBe('APRENDIZ_TALLER');
      expect(progreso.porcentaje).toBe(50);
      expect(progreso.xpParaSubir).toBe(101);
    });

    it('calcula el porcentaje correctamente dentro del tramo de Nivel 2 (201 - 500 XP)', () => {
      // Tramo nivel 2: 300 XP totales (500 - 200)
      // 350 XP -> 150 XP dentro del tramo = 50%
      const progreso = calcularProgresoSiguienteNivel(350);
      expect(progreso.nivelActual).toBe(2);
      expect(progreso.rango).toBe('OPERADOR_BODEGA');
      expect(progreso.porcentaje).toBe(50);
      expect(progreso.xpParaSubir).toBe(151);
    });

    it('marca 100% de avance permanente cuando se alcanza el Nivel Máximo 5', () => {
      const progreso = calcularProgresoSiguienteNivel(1500);
      expect(progreso.nivelActual).toBe(5);
      expect(progreso.rango).toBe('GERENTE_MAQUINARIA');
      expect(progreso.porcentaje).toBe(100);
      expect(progreso.xpParaSubir).toBe(0);
    });
  });

  describe('3. Idempotencia y Prevención de Duplicidad de Puntos', () => {
    it('otorga XP y marca la misión como completada si no se había realizado antes', () => {
      const estadoInicial: ProgresoGamificationState = {
        xpTotal: 0,
        rangoActual: 'APRENDIZ_TALLER',
        misionesCompletadas: [],
        toursCompletados: [],
        insigniasDesbloqueadas: [],
      };

      const resultado = registrarCompletitudMision(estadoInicial, 'mision-bienvenida', 100);

      expect(resultado.xpTotal).toBe(100);
      expect(resultado.misionesCompletadas).toContain('mision-bienvenida');
      expect(resultado.huboSubidaNivel).toBe(false);
    });

    it('NO duplica XP si la misma misión o tour se intenta completar una segunda vez', () => {
      const estadoConMision: ProgresoGamificationState = {
        xpTotal: 100,
        rangoActual: 'APRENDIZ_TALLER',
        misionesCompletadas: ['mision-bienvenida'],
        toursCompletados: ['tour-dashboard'],
        insigniasDesbloqueadas: ['primera-mision'],
      };

      const resultado = registrarCompletitudMision(estadoConMision, 'mision-bienvenida', 100);

      expect(resultado.xpTotal).toBe(100); // Sin cambios
      expect(resultado.misionesCompletadas.length).toBe(1);
      expect(resultado.nuevasInsignias.length).toBe(0);
      expect(resultado.huboSubidaNivel).toBe(false);
    });

    it('detecta subida de nivel ("Level-Up") al cruzar el umbral de puntos', () => {
      const estadoCercano: ProgresoGamificationState = {
        xpTotal: 180,
        rangoActual: 'APRENDIZ_TALLER',
        misionesCompletadas: ['mision-1'],
        toursCompletados: [],
        insigniasDesbloqueadas: [],
      };

      // Sumar +100 XP cruza 200 XP hacia 280 XP (Nivel 2: OPERADOR_BODEGA)
      const resultado = registrarCompletitudMision(estadoCercano, 'mision-bodega', 100);

      expect(resultado.xpTotal).toBe(280);
      expect(resultado.rangoActual).toBe('OPERADOR_BODEGA');
      expect(resultado.huboSubidaNivel).toBe(true);
      expect(resultado.nivelPrevio).toBe(1);
      expect(resultado.nivelNuevo).toBe(2);
    });
  });

  describe('4. Evaluación Dinámica de Insignias y Logros', () => {
    it('desbloquea la insignia "Primeros Pasos" al completar la primera misión', () => {
      const progreso: ProgresoGamificationState = {
        xpTotal: 100,
        rangoActual: 'APRENDIZ_TALLER',
        misionesCompletadas: ['mision-1'],
        toursCompletados: [],
        insigniasDesbloqueadas: [],
      };

      const nuevasInsignias = evaluarDesbloqueoInsignias(progreso);
      expect(nuevasInsignias).toContain('primeros-pasos');
    });

    it('desbloquea la insignia "Explorador de Inventario" al completar el tour de Bodega y Alquileres', () => {
      const progreso: ProgresoGamificationState = {
        xpTotal: 300,
        rangoActual: 'OPERADOR_BODEGA',
        misionesCompletadas: ['mision-1', 'mision-bodega'],
        toursCompletados: ['tour-bodega', 'tour-alquileres'],
        insigniasDesbloqueadas: ['primeros-pasos'],
      };

      const nuevasInsignias = evaluarDesbloqueoInsignias(progreso);
      expect(nuevasInsignias).toContain('explorador-flota');
      expect(nuevasInsignias).not.toContain('primeros-pasos'); // Ya estaba desbloqueada
    });

    it('es completamente idempotente: no retorna insignias ya obtenidas', () => {
      const progreso: ProgresoGamificationState = {
        xpTotal: 500,
        rangoActual: 'OPERADOR_BODEGA',
        misionesCompletadas: ['mision-1'],
        toursCompletados: ['tour-bodega', 'tour-alquileres'],
        insigniasDesbloqueadas: ['primeros-pasos', 'explorador-flota'],
      };

      const nuevasInsignias = evaluarDesbloqueoInsignias(progreso);
      expect(nuevasInsignias.length).toBe(0);
    });
  });
});
