import { describe, it, expect } from 'vitest';
import { 
  calcularDiasLicenciaRestantes, 
  evaluarModuloActivo, 
  resolverPermisosEfectivos,
  ModuloKey,
  LicenciaEstado
} from '../../src/core/services/licencias-modulos.service';

describe('Servicio de Dominio Puro: Licencias, Módulos & Permisos UltraAdmin', () => {

  describe('1. Cálculo Determinístico de Días de Licencia y Semáforo', () => {
    
    it('debe calcular correctamente una licencia ACTIVA con más de 30 días restantes', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const expiracion = new Date('2026-10-27T12:00:00.000Z'); // 40 días después
      
      const res = calcularDiasLicenciaRestantes(expiracion, hoy, 5);

      expect(res.diasRestantes).toBe(40);
      expect(res.estado).toBe('ACTIVA');
      expect(res.enPeriodoGracia).toBe(false);
      expect(res.diasMora).toBe(0);
    });

    it('debe categorizar como POR_VENCER cuando restan entre 1 y 30 días', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const expiracion = new Date('2026-09-27T12:00:00.000Z'); // 10 días después
      
      const res = calcularDiasLicenciaRestantes(expiracion, hoy, 5);

      expect(res.diasRestantes).toBe(10);
      expect(res.estado).toBe('POR_VENCER');
      expect(res.enPeriodoGracia).toBe(false);
    });

    it('debe activar el estado EN_GRACIA cuando la fecha expiró pero está dentro de los días de gracia', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const expiracion = new Date('2026-09-15T12:00:00.000Z'); // Venció hace 2 días, con 5 de gracia
      
      const res = calcularDiasLicenciaRestantes(expiracion, hoy, 5);

      expect(res.diasRestantes).toBeLessThanOrEqual(0);
      expect(res.estado).toBe('EN_GRACIA');
      expect(res.enPeriodoGracia).toBe(true);
      expect(res.diasMora).toBe(2);
    });

    it('debe categorizar como VENCIDA cuando supera los días de gracia otorgados', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const expiracion = new Date('2026-09-01T12:00:00.000Z'); // Venció hace 16 días (gracia = 5)
      
      const res = calcularDiasLicenciaRestantes(expiracion, hoy, 5);

      expect(res.estado).toBe('VENCIDA');
      expect(res.enPeriodoGracia).toBe(false);
      expect(res.diasMora).toBe(16);
    });

    it('debe tolerar entradas de fecha como string ISO y calcular sin arrojar excepciones', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const res = calcularDiasLicenciaRestantes('2026-11-01T00:00:00Z', hoy);

      expect(res.diasRestantes).toBeGreaterThan(30);
      expect(res.estado).toBe('ACTIVA');
    });

    it('debe retornar estado VENCIDA de forma segura ante fechas nulas o corruptas', () => {
      const hoy = new Date('2026-09-17T12:00:00.000Z');
      const res = calcularDiasLicenciaRestantes(null as any, hoy);

      expect(res.estado).toBe('VENCIDA');
      expect(res.diasRestantes).toBe(0);
    });
  });

  describe('2. Evaluación de Feature Toggles de Módulos por Tenant', () => {
    const modulosEmpresa: ModuloKey[] = ['ALQUILERES', 'BODEGA', 'COMPRAS', 'CAJA'];

    it('debe retornar true si el módulo solicitado está activo en la empresa', () => {
      expect(evaluarModuloActivo(modulosEmpresa, 'ALQUILERES')).toBe(true);
      expect(evaluarModuloActivo(modulosEmpresa, 'COMPRAS')).toBe(true);
      expect(evaluarModuloActivo(modulosEmpresa, 'CAJA')).toBe(true);
    });

    it('debe retornar false si el módulo no fue contratado o está desactivado', () => {
      expect(evaluarModuloActivo(modulosEmpresa, 'SUBCONTRATACIONES')).toBe(false);
      expect(evaluarModuloActivo(modulosEmpresa, 'FACTURACION')).toBe(false);
      expect(evaluarModuloActivo(modulosEmpresa, 'DEVOLUCIONES')).toBe(false);
    });

    it('debe ser insensible a mayúsculas/minúsculas y espacios en blanco', () => {
      expect(evaluarModuloActivo(modulosEmpresa, ' alquileres ')).toBe(true);
      expect(evaluarModuloActivo(modulosEmpresa, 'caja')).toBe(true);
    });

    it('debe manejar arrays vacíos o nulos retornando false', () => {
      expect(evaluarModuloActivo([], 'ALQUILERES')).toBe(false);
      expect(evaluarModuloActivo(null as any, 'ALQUILERES')).toBe(false);
      expect(evaluarModuloActivo(undefined as any, 'ALQUILERES')).toBe(false);
    });
  });

  describe('3. Resolución de Permisos Granulares (RBAC + Overwrites)', () => {

    it('debe otorgar los permisos base correspondientes al rol cuando no hay overwrites', () => {
      const permisos = resolverPermisosEfectivos('OPERADOR_BODEGA', {}, 'ACTIVO');

      expect(permisos).toContain('GESTION_EQUIPOS');
      expect(permisos).toContain('VER_CATALOGO');
      expect(permisos).not.toContain('ANULAR_PAGOS');
      expect(permisos).not.toContain('GESTION_USUARIOS');
    });

    it('debe agregar un permiso sensible si el UltraAdmin configuró un overwrite positivo', () => {
      const overwrites = { ANULAR_PAGOS: true, EDITAR_TARIFAS: true };
      const permisos = resolverPermisosEfectivos('VENDEDOR', overwrites, 'ACTIVO');

      expect(permisos).toContain('ANULAR_PAGOS');
      expect(permisos).toContain('EDITAR_TARIFAS');
      expect(permisos).toContain('CREAR_ALQUILER'); // Heredado de VENDEDOR
    });

    it('debe revocar un permiso base si el UltraAdmin configuró un overwrite negativo', () => {
      const overwrites = { GESTION_EQUIPOS: false };
      const permisos = resolverPermisosEfectivos('ADMIN', overwrites, 'ACTIVO');

      expect(permisos).not.toContain('GESTION_EQUIPOS');
      expect(permisos).toContain('GESTION_USUARIOS'); // Mantiene otros del ADMIN
    });

    it('debe retornar lista vacía de permisos si el usuario se encuentra BLOQUEADO o INACTIVO', () => {
      const permisosInactivo = resolverPermisosEfectivos('ADMIN', { ACCESO_TOTAL: true }, 'INACTIVO');
      const permisosBloqueado = resolverPermisosEfectivos('ADMIN', {}, 'BLOQUEADO');

      expect(permisosInactivo).toEqual([]);
      expect(permisosBloqueado).toEqual([]);
    });
  });

});
