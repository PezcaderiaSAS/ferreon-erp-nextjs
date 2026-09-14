'use client';

import { create } from '../../lib/zustand';
import { 
  obtenerSesionActivaAction, 
  abrirSesionCajaAction, 
  registrarMovimientoCajaAction, 
  cerrarSesionCajaAction,
  listarHistorialSesionesCajaAction 
} from '@/app/actions/caja';

export interface ResumenTurnoCaja {
  montoApertura: number;
  totalCobrosEfectivo: number;
  cantidadPagos: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoEsperado: number;
}

export interface MovimientoCajaItem {
  id: string;
  sesion_caja_id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto: string;
  beneficiario?: string | null;
  comprobante?: string | null;
  created_at: string;
}

export interface PagoEfectivoItem {
  id: number;
  consecutivo: number;
  monto: number;
  efectivo_recibido?: number | null;
  cambio_entregado?: number | null;
  fecha_pago: string;
  alquiler_id?: number | null;
  cliente_id?: number | null;
  clientes?: { nombre?: string } | null;
}

export interface SesionCajaItem {
  id: string;
  usuario_id: string;
  empresa_id?: string | null;
  estado: 'ABIERTA' | 'CERRADA';
  monto_apertura: number;
  monto_cierre?: number | null;
  monto_esperado?: number | null;
  diferencia?: number | null;
  motivo_descuadre?: string | null;
  arqueo_detalle?: any;
  observaciones?: string | null;
  fecha_apertura: string;
  fecha_cierre?: string | null;
}

interface CajaState {
  sesionActiva: SesionCajaItem | null;
  isCajaAbierta: boolean;
  resumenTurno: ResumenTurnoCaja | null;
  movimientos: MovimientoCajaItem[];
  pagosEfectivo: PagoEfectivoItem[];
  historialSesiones: SesionCajaItem[];
  isLoading: boolean;
  error: string | null;

  // Acciones asíncronas con Server Actions
  cargarSesionActiva: () => Promise<void>;
  abrirCaja: (montoApertura: number, observaciones?: string) => Promise<{ success: boolean; error?: string }>;
  registrarMovimiento: (input: {
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    concepto: string;
    beneficiario?: string;
    comprobante?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  cerrarCaja: (input: {
    montoCierreFisico: number;
    arqueoDetalle?: any;
    motivoDescuadre?: string;
    observaciones?: string;
  }) => Promise<{ success: boolean; error?: string; balance?: any }>;
  cargarHistorial: (filtros?: { fechaDesde?: string; fechaHasta?: string; limite?: number }) => Promise<void>;
  limpiarError: () => void;
  reset: () => void;
}

export const useCajaStore = create<CajaState>()((set, get) => ({
  sesionActiva: null,
  isCajaAbierta: false,
  resumenTurno: null,
  movimientos: [],
  pagosEfectivo: [],
  historialSesiones: [],
  isLoading: false,
  error: null,

  cargarSesionActiva: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await obtenerSesionActivaAction();
      if (!res.success) {
        set({ 
          isLoading: false, 
          error: res.error || 'Error al cargar sesión activa',
          sesionActiva: null,
          isCajaAbierta: false,
          resumenTurno: null,
          movimientos: [],
          pagosEfectivo: []
        });
        return;
      }

      set({
        sesionActiva: (res.sesion as unknown as SesionCajaItem) || null,
        isCajaAbierta: res.sesion?.estado === 'ABIERTA',
        resumenTurno: res.resumen || null,
        movimientos: (res.movimientos as unknown as MovimientoCajaItem[]) || [],
        pagosEfectivo: (res.pagosEfectivo as unknown as PagoEfectivoItem[]) || [],
        isLoading: false,
        error: null
      });
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.message || 'Error de conexión al cargar la caja',
        sesionActiva: null,
        isCajaAbierta: false
      });
    }
  },

  abrirCaja: async (montoApertura: number, observaciones?: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await abrirSesionCajaAction({
        montoApertura,
        observaciones
      });

      if (!res.success) {
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      }

      // Recargar estado consolidado en vivo
      await get().cargarSesionActiva();
      return { success: true };
    } catch (err: any) {
      const mensaje = err.message || 'Error inesperado al abrir la caja';
      set({ isLoading: false, error: mensaje });
      return { success: false, error: mensaje };
    }
  },

  registrarMovimiento: async (input) => {
    const sesion = get().sesionActiva;
    if (!sesion || sesion.estado !== 'ABIERTA') {
      return { success: false, error: 'No hay una sesión de caja abierta activa.' };
    }

    set({ isLoading: true, error: null });
    try {
      const res = await registrarMovimientoCajaAction({
        sesionCajaId: sesion.id,
        tipo: input.tipo,
        monto: input.monto,
        concepto: input.concepto,
        beneficiario: input.beneficiario,
        comprobante: input.comprobante
      });

      if (!res.success) {
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      }

      // Recargar estado de turno en vivo
      await get().cargarSesionActiva();
      return { success: true };
    } catch (err: any) {
      const mensaje = err.message || 'Error al registrar el movimiento';
      set({ isLoading: false, error: mensaje });
      return { success: false, error: mensaje };
    }
  },

  cerrarCaja: async (input) => {
    const sesion = get().sesionActiva;
    if (!sesion || sesion.estado !== 'ABIERTA') {
      return { success: false, error: 'No hay una sesión de caja abierta para cerrar.' };
    }

    set({ isLoading: true, error: null });
    try {
      const res = await cerrarSesionCajaAction({
        sesionCajaId: sesion.id,
        montoCierreFisico: input.montoCierreFisico,
        arqueoDetalle: input.arqueoDetalle,
        motivoDescuadre: input.motivoDescuadre,
        observaciones: input.observaciones
      });

      if (!res.success) {
        set({ isLoading: false, error: res.error });
        return { success: false, error: res.error };
      }

      // Actualizar estado a cerrado
      set({
        sesionActiva: (res.sesion as unknown as SesionCajaItem) || null,
        isCajaAbierta: false,
        isLoading: false,
        error: null
      });

      return { success: true, balance: res.balance };
    } catch (err: any) {
      const mensaje = err.message || 'Error inesperado al cerrar la caja';
      set({ isLoading: false, error: mensaje });
      return { success: false, error: mensaje };
    }
  },

  cargarHistorial: async (filtros) => {
    set({ isLoading: true });
    try {
      const res = await listarHistorialSesionesCajaAction(filtros);
      if (res.success) {
        set({ 
          historialSesiones: (res.sesiones as unknown as SesionCajaItem[]) || [],
          isLoading: false 
        });
      } else {
        set({ isLoading: false, error: res.error });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Error al cargar historial' });
    }
  },

  limpiarError: () => set({ error: null }),

  reset: () => set({
    sesionActiva: null,
    isCajaAbierta: false,
    resumenTurno: null,
    movimientos: [],
    pagosEfectivo: [],
    historialSesiones: [],
    isLoading: false,
    error: null
  })
}));
