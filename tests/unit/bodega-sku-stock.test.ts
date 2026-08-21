import { describe, it, expect, beforeEach } from 'vitest';
import { useBodegaStore } from '../../src/infrastructure/state/bodegaStore';
import { useClienteStore } from '../../src/infrastructure/state/clienteStore';
import { Equipo } from '../../src/core/domain/entities/equipo';

describe('Suite de Pruebas Unitarias: Bodega, SKU Inteligente y Stock', () => {
  beforeEach(() => {
    // Reset bodega store state
    useBodegaStore.setState({
      equipos: [
        {
          id: '1',
          sku: 'EQ-001',
          nombre: 'Taladro Percutor 800W',
          categoria: 'Herramientas Eléctricas',
          estado: 'Disponible',
          tarifaDiaria: 45000,
          stockTotal: 10,
          stockDisponible: 8,
          stockEnObra: 2,
          creado_en: new Date()
        },
        {
          id: '2',
          sku: 'EQ-002',
          nombre: 'Andamio Tubular 2x2m',
          categoria: 'Construcción',
          estado: 'En Alquiler',
          tarifaDiaria: 12000,
          stockTotal: 25,
          stockDisponible: 5,
          stockEnObra: 20,
          creado_en: new Date()
        }
      ],
      idempotencyKeys: []
    });
  });

  it('debe autocalcular el siguiente SKU correlativo con formato padStart (EQ-003)', () => {
    const nextSku = useBodegaStore.getState().generarSiguienteSKU();
    expect(nextSku).toBe('EQ-003');
  });

  it('debe manejar resiliencia de SKU ante números no secuenciales o saltos', () => {
    useBodegaStore.setState({
      equipos: [
        {
          id: '1',
          sku: 'EQ-009',
          nombre: 'Equipo 9',
          categoria: 'Construcción',
          estado: 'Disponible',
          tarifaDiaria: 10000,
          stockTotal: 1,
          stockDisponible: 1,
          stockEnObra: 0,
          creado_en: new Date()
        }
      ]
    });

    const nextSku = useBodegaStore.getState().generarSiguienteSKU();
    expect(nextSku).toBe('EQ-010');
  });

  it('debe ajustar el stock disponible y recalcular el stock total sin afectar stock en obra', () => {
    const { ajustarStock } = useBodegaStore.getState();
    
    // Equipo 1: stockDisponible: 8, stockEnObra: 2, stockTotal: 10
    ajustarStock('1', 15, 'Entrada por nueva compra');
    
    const equipoActualizado = useBodegaStore.getState().equipos.find(e => e.id === '1');
    expect(equipoActualizado?.stockDisponible).toBe(15);
    expect(equipoActualizado?.stockEnObra).toBe(2);
    expect(equipoActualizado?.stockTotal).toBe(17); // 15 + 2
    expect(equipoActualizado?.estado).toBe('Disponible');
  });

  it('debe descontar e incrementar stock en ciclos de alquiler y devolución', () => {
    const { descontarStock, incrementarStock } = useBodegaStore.getState();

    // Despachar 3 unidades de equipo 1 (disponible: 8, obra: 2)
    descontarStock('1', 3);
    let eq = useBodegaStore.getState().equipos.find(e => e.id === '1');
    expect(eq?.stockDisponible).toBe(5);
    expect(eq?.stockEnObra).toBe(5);

    // Devolver 2 unidades (disponible: 5 + 2 = 7, obra: 5 - 2 = 3)
    incrementarStock('1', 2);
    eq = useBodegaStore.getState().equipos.find(e => e.id === '1');
    expect(eq?.stockDisponible).toBe(7);
    expect(eq?.stockEnObra).toBe(3);
  });

  it('debe actualizar los datos de un cliente de forma inmutable en useClienteStore', () => {
    const { updateCliente } = useClienteStore.getState();
    const clienteOriginal = useClienteStore.getState().clientes[0];

    updateCliente({
      ...clienteOriginal,
      nombre: 'Constructora Omega Renovada SAS',
      nivel_riesgo: 'Alto'
    });

    const clienteModificado = useClienteStore.getState().clientes.find(c => c.id === clienteOriginal.id);
    expect(clienteModificado?.nombre).toBe('Constructora Omega Renovada SAS');
    expect(clienteModificado?.nivel_riesgo).toBe('Alto');
  });
});
