import { describe, it, expect, beforeEach } from 'vitest';
import { useAlquilerStore } from '../../src/infrastructure/state/alquilerStore';

describe('AlquilerStore - Rollback Optimista', () => {
  beforeEach(() => {
    // Limpiar store antes de cada prueba
    useAlquilerStore.setState({ alquileres: [], idempotencyKeys: [] });
  });

  it('debería agregar un alquiler y revertirlo al llamar a restoreSnapshot tras fallo simulado', () => {
    const store = useAlquilerStore.getState();
    const initialState = [...store.alquileres];

    // Mock alquiler data
    const newAlquiler = {
      id: 'temp_123',
      cliente_id: 'C-1',
      clienteNombre: 'Test Client',
      estado: 'ACTIVO',
      consecutivo: 1001,
      flete_entrega: 0,
      flete_recogida: 0,
      deposito: 0,
      garantia_monto: 0,
      garantia_tipo: 'Efectivo',
      garantia_estado: 'Activa',
      detalles: [],
      subtotal_equipos: 0,
      subtotal_general: 0,
      total: 0,
      created_at: new Date().toISOString()
    };

    // 1. Optimistic Add
    useAlquilerStore.getState().addAlquiler(newAlquiler);
    
    // Verificamos que se haya agregado localmente
    expect(useAlquilerStore.getState().alquileres.length).toBe(1);
    expect(useAlquilerStore.getState().alquileres[0].id).toBe('temp_123');

    // 2. Simulamos fallo en la API (ej: error 500)
    const apiCallFails = true;

    if (apiCallFails) {
      // 3. Rollback
      useAlquilerStore.getState().restoreSnapshot(initialState);
    }

    // Verificamos que el estado haya vuelto a cero
    expect(useAlquilerStore.getState().alquileres.length).toBe(0);
  });
});
