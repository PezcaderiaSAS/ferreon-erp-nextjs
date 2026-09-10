import { create, persist } from '../../lib/zustand';

export interface SubcontratacionUI {
  id: string;
  consecutivo: string;
  alquiler_id?: string | number | null;
  proveedor_id: string;
  proveedor_nombre: string;
  proveedor_nit: string;
  proveedor_telefono?: string;
  fecha_emision: string;
  fecha_recepcion_estimada: string;
  fecha_devolucion_estimada: string;
  fecha_recepcion_real?: string;
  fecha_devolucion_real?: string;
  estado: 'ORDENADA' | 'RECIBIDA_EN_BODEGA' | 'EN_CLIENTE' | 'DEVUELTA_A_PROVEEDOR' | 'CANCELADA';
  costo_total_estimado: number;
  costo_total_real: number;
  deposito_garantia_proveedor: number;
  observaciones?: string;
  subcontrataciones_detalles?: any[];
  detalles?: any[];
  created_at: string;
}

interface SubcontratacionState {
  subcontrataciones: SubcontratacionUI[];
  isLoading: boolean;
  setSubcontrataciones: (list: SubcontratacionUI[]) => void;
  agregarSubcontratacion: (sub: SubcontratacionUI) => void;
  actualizarEstado: (id: string, nuevoEstado: SubcontratacionUI['estado']) => void;
  restoreSnapshot: (snapshot: SubcontratacionUI[]) => void;
}

export const useSubcontratacionStore = create<SubcontratacionState>()(
  persist(
    (set) => ({
      subcontrataciones: [],
      isLoading: false,
      setSubcontrataciones: (list) => set({ subcontrataciones: list }),
      agregarSubcontratacion: (sub) => set((state) => ({
        subcontrataciones: [sub, ...state.subcontrataciones]
      })),
      actualizarEstado: (id, nuevoEstado) => set((state) => ({
        subcontrataciones: state.subcontrataciones.map((s) =>
          s.id === id ? { ...s, estado: nuevoEstado } : s
        )
      })),
      restoreSnapshot: (snapshot) => set({ subcontrataciones: snapshot })
    }),
    {
      name: 'ferreon-subcontrataciones-storage',
      partialize: (state) => ({ subcontrataciones: state.subcontrataciones })
    } as any
  )
);
