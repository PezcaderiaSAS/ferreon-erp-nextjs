import { describe, it, expect, beforeEach } from 'vitest';
import { IdempotencyManager, generateIdempotencyKey } from '../../src/lib/utils/idempotency';
import { useBodegaStore } from '../../src/infrastructure/state/bodegaStore';
import { useAlquilerStore } from '../../src/infrastructure/state/alquilerStore';

describe('Verificación E2E: Idempotencia, Garbage Collection y Optimistic Rollback', () => {
  beforeEach(() => {
    useBodegaStore.setState({
      equipos: [
        {
          id: 'test-1',
          sku: 'EQ-TEST-001',
          nombre: 'Equipo de Prueba',
          categoria: 'Construcción',
          estado: 'Disponible',
          tarifaDiaria: 50000,
          codigo: '',
          tarifa_diaria: 50000,
          stock_total: 1,
          stock_disponible: 1,
          stock_en_obra: 0
        },
      ],
      idempotencyKeys: [],
    });

    useAlquilerStore.setState({
      alquileres: [],
      idempotencyKeys: [],
    });
  });

  describe('5.1 Validación de Idempotencia y Prevención de Doble Click', () => {
    it('debe generar llaves únicas con prefijo correcto', () => {
      const key1 = generateIdempotencyKey('tx');
      const key2 = generateIdempotencyKey('tx');
      expect(key1).toContain('tx_');
      expect(key1).not.toBe(key2);
    });

    it('debe registrar y bloquear transacciones duplicadas por doble click en IdempotencyManager', () => {
      const manager = new IdempotencyManager(10);
      const key = generateIdempotencyKey('tx');

      expect(manager.has(key)).toBe(false);
      manager.register(key);
      expect(manager.has(key)).toBe(true);

      // Simular segundo click
      expect(manager.has(key)).toBe(true);
    });

    it('debe rechazar mutación duplicada en BodegaStore si se repite la idempotencyKey', () => {
      const store = useBodegaStore.getState();
      const idempotencyKey = 'idemp-12345';

      const equipoMock = {
        id: 'nuevo-1',
        sku: 'EQ-099',
        nombre: 'Generador 5000W',
        categoria: 'Maquinaria',
        estado: 'Disponible' as const,
        tarifaDiaria: 80000,
        codigo: '',
        tarifa_diaria: 80000,
        stock_total: 1,
        stock_disponible: 1,
        stock_en_obra: 0
      };

      // Primer click -> Éxito
      const res1 = store.agregarEquipo(equipoMock, idempotencyKey);
      expect(res1).toBe(true);
      expect(useBodegaStore.getState().equipos.length).toBe(2);

      // Segundo click (nervioso/accidental) -> Bloqueado
      const res2 = useBodegaStore.getState().agregarEquipo(equipoMock, idempotencyKey);
      expect(res2).toBe(false);
      expect(useBodegaStore.getState().equipos.length).toBe(2); // No se duplica
    });
  });

  describe('5.2 & 5.3 Garbage Collection y Protección contra Memory Leaks', () => {
    it('debe purgar llaves antiguas cuando se supera el límite máximo en IdempotencyManager', () => {
      const maxLimit = 5;
      const manager = new IdempotencyManager(maxLimit);

      const keys: string[] = [];
      for (let i = 0; i < 7; i++) {
        const k = `key_${i}`;
        keys.push(k);
        manager.register(k);
      }

      // Las primeras 2 llaves deben haber sido purgadas (FIFO)
      expect(manager.has(keys[0])).toBe(false);
      expect(manager.has(keys[1])).toBe(false);
      // Las últimas 5 deben mantenerse
      expect(manager.has(keys[2])).toBe(true);
      expect(manager.has(keys[6])).toBe(true);
    });
  });

  describe('5.2 Validación de Optimistic Rollback', () => {
    it('debe restaurar el snapshot previo si la transacción en background falla', () => {
      const store = useBodegaStore.getState();
      const snapshotOriginal = [...store.equipos];

      // Mutación optimista local
      store.agregarEquipo({
        id: 'temp-1',
        sku: 'TEMP-SKU',
        nombre: 'Herramienta Temporal',
        categoria: 'Herramientas',
        estado: 'Disponible',
        tarifaDiaria: 20000,
        codigo: '',
        tarifa_diaria: 20000,
        stock_total: 1,
        stock_disponible: 1,
        stock_en_obra: 0
      });

      expect(useBodegaStore.getState().equipos.length).toBe(2);

      // Simulación de fallo en Supabase -> Ejecución de Rollback
      useBodegaStore.getState().restoreSnapshot(snapshotOriginal);

      expect(useBodegaStore.getState().equipos.length).toBe(1);
      expect(useBodegaStore.getState().equipos[0].id).toBe('test-1');
    });
  });

  describe('5.4 Propagación Cruzada de Stock (Alquiler / Devolución)', () => {
    it('debe alternar estado a En Alquiler al descontar stock y Disponible al devolver', () => {
      const store = useBodegaStore.getState();

      store.descontarStock('test-1', 1);
      expect(useBodegaStore.getState().equipos.find((e) => e.id === 'test-1')?.estado).toBe('En Alquiler');

      store.incrementarStock('test-1', 1);
      expect(useBodegaStore.getState().equipos.find((e) => e.id === 'test-1')?.estado).toBe('Disponible');
    });
  });
});
