import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCajaStore } from '../../src/infrastructure/state/cajaStore';

vi.mock('@/app/actions/caja', () => ({
  obtenerSesionActivaAction: vi.fn(),
  abrirSesionCajaAction: vi.fn(),
  registrarMovimientoCajaAction: vi.fn(),
  cerrarSesionCajaAction: vi.fn(),
  listarHistorialSesionesCajaAction: vi.fn(),
}));

import { 
  obtenerSesionActivaAction, 
  abrirSesionCajaAction, 
  cerrarSesionCajaAction 
} from '@/app/actions/caja';

describe('useCajaStore (Zustand State Management)', () => {
  beforeEach(() => {
    useCajaStore.getState().reset();
    vi.clearAllMocks();
  });

  it('debe tener el estado inicial esperado cuando la caja está cerrada', () => {
    const state = useCajaStore.getState();
    expect(state.sesionActiva).toBeNull();
    expect(state.isCajaAbierta).toBe(false);
    expect(state.resumenTurno).toBeNull();
    expect(state.movimientos).toEqual([]);
    expect(state.pagosEfectivo).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('debe cargar la sesión activa y computar isCajaAbierta en true', async () => {
    const mockSesion = {
      id: 'sesion-123',
      usuario_id: 'user-1',
      estado: 'ABIERTA',
      monto_apertura: 100000,
      fecha_apertura: '2026-09-14T08:00:00Z'
    };

    const mockResumen = {
      montoApertura: 100000,
      totalCobrosEfectivo: 250000,
      cantidadPagos: 2,
      totalIngresos: 0,
      totalEgresos: 30000,
      saldoEsperado: 320000
    };

    (obtenerSesionActivaAction as any).mockResolvedValueOnce({
      success: true,
      sesion: mockSesion,
      resumen: mockResumen,
      movimientos: [],
      pagosEfectivo: []
    });

    await useCajaStore.getState().cargarSesionActiva();

    const state = useCajaStore.getState();
    expect(state.sesionActiva).toEqual(mockSesion);
    expect(state.isCajaAbierta).toBe(true);
    expect(state.resumenTurno?.saldoEsperado).toBe(320000);
    expect(state.isLoading).toBe(false);
  });

  it('debe manejar errores en la apertura de caja y persistir el mensaje de error', async () => {
    (abrirSesionCajaAction as any).mockResolvedValueOnce({
      success: false,
      error: 'Poka-Yoke: Ya existe una caja abierta'
    });

    const res = await useCajaStore.getState().abrirCaja(50000);

    expect(res.success).toBe(false);
    expect(res.error).toBe('Poka-Yoke: Ya existe una caja abierta');
    expect(useCajaStore.getState().error).toBe('Poka-Yoke: Ya existe una caja abierta');
    expect(useCajaStore.getState().isCajaAbierta).toBe(false);
  });

  it('debe actualizar isCajaAbierta a false al cerrar la caja exitosamente', async () => {
    // Establecer primero una caja abierta en el store
    useCajaStore.setState({
      sesionActiva: {
        id: 'sesion-123',
        usuario_id: 'user-1',
        estado: 'ABIERTA',
        monto_apertura: 100000,
        fecha_apertura: '2026-09-14T08:00:00Z'
      } as any,
      isCajaAbierta: true
    });

    (cerrarSesionCajaAction as any).mockResolvedValueOnce({
      success: true,
      sesion: {
        id: 'sesion-123',
        estado: 'CERRADA',
        monto_cierre: 100000
      },
      balance: {
        saldoEsperado: 100000,
        montoFisicoContado: 100000,
        diferencia: 0,
        clasificacionDescuadre: 'CUADRADO'
      }
    });

    const res = await useCajaStore.getState().cerrarCaja({
      montoCierreFisico: 100000
    });

    expect(res.success).toBe(true);
    expect(useCajaStore.getState().isCajaAbierta).toBe(false);
    expect(useCajaStore.getState().sesionActiva?.estado).toBe('CERRADA');
  });
});
