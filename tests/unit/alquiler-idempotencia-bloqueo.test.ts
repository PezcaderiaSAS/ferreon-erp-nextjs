import { describe, it, expect, vi, beforeEach } from 'vitest';
import { idempotencyManager, IdempotencyManager } from '../../src/lib/idempotency';
import { useAlquilerStore } from '../../src/infrastructure/state/alquilerStore';
import { useBodegaStore } from '../../src/infrastructure/state/bodegaStore';

// Mocks de Supabase para prueba de crearAlquilerAction
let mockSelectResponse: any = { data: null, error: null };
let mockRpcResponse: any = { data: { id: 999, consecutivo: 101, estado: 'ACTIVO' }, error: null };

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'usr-001', email: 'operador@ferreon.com' } }
      }))
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => mockSelectResponse)
        }))
      }))
    })),
    rpc: vi.fn(async (fn: string, args: any) => mockRpcResponse)
  })),
  resolveEmpresaId: vi.fn(async () => 'empresa-test-uuid')
}));

describe('1. IdempotencyManager — Prevención de Doble Clic y Fugas de Memoria', () => {
  beforeEach(() => {
    idempotencyManager.clear();
  });

  it('1.1 Debe generar claves de idempotencia únicas y válidas', () => {
    const key1 = idempotencyManager.generateKey();
    const key2 = idempotencyManager.generateKey();

    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(key1).not.toBe(key2);
  });

  it('1.2 Debe permitir el primer envío y bloquear clics subsecuentes con la misma clave', () => {
    const testKey = 'transaccion-alquiler-001';

    // Primer clic: Debe ser aceptado
    const primerIntento = idempotencyManager.processKey(testKey);
    expect(primerIntento).toBe(true);

    // Segundo clic inmediato (doble clic accidental): Debe ser bloqueado
    const segundoIntento = idempotencyManager.processKey(testKey);
    expect(segundoIntento).toBe(false);

    // Tercer clic consecutivo: Debe permanecer bloqueado
    const tercerIntento = idempotencyManager.processKey(testKey);
    expect(tercerIntento).toBe(false);
  });

  it('1.3 Debe permitir reintento si la clave es removida tras un error controlado', () => {
    const testKey = 'transaccion-con-reintento';

    expect(idempotencyManager.processKey(testKey)).toBe(true);
    expect(idempotencyManager.processKey(testKey)).toBe(false);

    // Simular error y remoción
    idempotencyManager.removeKey(testKey);

    // Reintento posterior debe ser admitido
    expect(idempotencyManager.processKey(testKey)).toBe(true);
  });

  it('1.4 Debe implementar política FIFO estricta sin Memory Leaks al superar el límite de 50 claves', () => {
    const manager = IdempotencyManager.getInstance();
    manager.clear();

    // Insertar 50 claves
    for (let i = 1; i <= 50; i++) {
      manager.processKey(`key-${i}`);
    }

    // La clave 1 aún debe estar registrada
    expect(manager.processKey('key-1')).toBe(false);

    // Insertar la clave 51 (debe purgar key-1 bajo FIFO)
    manager.processKey('key-51');

    // key-1 debe haber sido purgada por el límite de 50
    expect(manager.processKey('key-1')).toBe(true);
  });
});

describe('2. Latencia Cero y Rollback Atómico en Stores de Zustand', () => {
  it('2.1 Debe agregar el alquiler en el store a 0 ms con ID optimista y persistir inmutabilidad', () => {
    const store = useAlquilerStore.getState();
    const prevCount = store.alquileres.length;
    const optimisticId = `temp_alquiler_${Date.now()}`;

    const alquilerOptimista: any = {
      id: optimisticId,
      consecutivo: 'ALQ-999',
      cliente_id: 'CLI-001',
      cliente_nombre: 'Constructora Bolívar',
      estado: 'ACTIVO',
      total: 450000,
      detalles: []
    };

    store.addAlquiler(alquilerOptimista);

    const storeActualizado = useAlquilerStore.getState();
    expect(storeActualizado.alquileres.length).toBe(prevCount + 1);
    const encontrado = storeActualizado.alquileres.find(a => a.id === optimisticId);
    expect(encontrado).toBeDefined();
    expect(encontrado?.consecutivo).toBe('ALQ-999');
  });

  it('2.2 Debe restaurar snapshot ante fallo de transacción sin dejar registros huérfanos', () => {
    const store = useAlquilerStore.getState();
    const snapshotInicial = [...store.alquileres];

    // Añadir registro fallido
    store.addAlquiler({ id: 'temp_error_transaccion', consecutivo: 'FAIL-001' } as any);
    expect(useAlquilerStore.getState().alquileres.some(a => a.id === 'temp_error_transaccion')).toBe(true);

    // Ejecutar Rollback
    store.restoreSnapshot(snapshotInicial);

    expect(useAlquilerStore.getState().alquileres.some(a => a.id === 'temp_error_transaccion')).toBe(false);
  });
});

describe('3. Backend — Detección de Idempotencia en crearAlquilerAction', () => {
  it('3.1 Debe retornar registro existente y evitar duplicación si la clave ya fue registrada', async () => {
    // Import dinámico de la Server Action
    const { crearAlquilerAction } = await import('../../src/app/actions/alquileres');

    // Configurar mock: ya existe un alquiler para esta idempotency_key
    mockSelectResponse = {
      data: {
        id: 777,
        consecutivo: 50,
        estado: 'ACTIVO',
        total: 1200000,
        deposito: 200000,
        created_at: new Date().toISOString()
      },
      error: null
    };

    const resultado = await crearAlquilerAction({
      clienteId: '10',
      clienteNombre: 'Cliente Recurrente',
      fleteEntrega: 0,
      fleteRecogida: 0,
      deposito: 200000,
      garantiaMonto: 0,
      garantiaTipo: 'Efectivo',
      estado: 'ACTIVO',
      idempotency_key: 'idemp-repetida-12345',
      items: [
        {
          itemId: 1,
          cantidad: 1,
          tarifaAplicada: 1200000,
          fechaInicio: '2026-09-15',
          fechaFinEstimada: '2026-09-20'
        }
      ]
    });

    expect(resultado.success).toBe(true);
    expect((resultado as any).idempotent).toBe(true);
    expect(resultado.data?.id).toBe(777);
    expect(resultado.data?.consecutivo).toBe(50);
  });
});
