import { create, persist } from '../../lib/zustand';

export type SubcontratacionEstado = 
  | 'ORDENADA' 
  | 'RECIBIDA_EN_BODEGA' 
  | 'EN_CLIENTE' 
  | 'DEVUELTA_A_PROVEEDOR' 
  | 'CANCELADA'
  | 'BORRADOR'
  | 'SOLICITADA'
  | 'ACTIVA'
  | 'DEVUELTA';

export interface SubcontratacionDetalleUI {
  id: string;
  subcontratacion_id?: string;
  equipo_id?: string | null;
  equipo_codigo?: string;
  equipo_nombre?: string;
  equipoNombre?: string;
  equipoCodigo?: string;
  serial_proveedor?: string;
  serialProveedor?: string;
  cantidad: number;
  dias_contratados?: number;
  diasContratados?: number;
  tarifa_diaria_proveedor?: number;
  tarifaDiariaProveedor?: number;
  tarifa_diaria_cliente?: number;
  tarifaDiariaCliente?: number;
  margen_bruto_estimado?: number;
  margenBrutoEstimado?: number;
  estado_item?: string;
}

export interface SubcontratacionUI {
  id: string;
  consecutivo: string;
  alquiler_id?: string | number | null;
  proveedor_id?: string;
  proveedorId?: string;
  proveedor_nombre?: string;
  proveedorNombre: string;
  proveedor_nit?: string;
  proveedorNit?: string;
  proveedor_contacto?: string;
  proveedorContacto?: string;
  proveedor_telefono?: string;
  proveedorTelefono?: string;
  fecha_emision?: string;
  fechaEmision?: string;
  fecha_recepcion_estimada?: string;
  fechaEntregaEstimada?: string;
  fecha_devolucion_estimada?: string;
  fechaDevolucionEstimada?: string;
  fecha_recepcion_real?: string;
  fecha_devolucion_real?: string;
  estado: SubcontratacionEstado;
  costo_total_estimado?: number;
  costoTotalEstimado: number;
  costo_total_real?: number;
  ingreso_total_estimado?: number;
  ingresoTotalEstimado: number;
  margen_bruto_estimado?: number;
  margenBrutoEstimado: number;
  deposito_garantia_proveedor?: number;
  depositoGarantia: number;
  observaciones?: string;
  subcontrataciones_detalles?: SubcontratacionDetalleUI[];
  detalles?: SubcontratacionDetalleUI[];
  created_at?: string;
}

interface SubcontratacionState {
  subcontrataciones: SubcontratacionUI[];
  isLoading: boolean;
  setSubcontrataciones: (list: SubcontratacionUI[]) => void;
  agregarSubcontratacion: (sub: SubcontratacionUI) => void;
  actualizarEstado: (id: string, nuevoEstado: SubcontratacionEstado) => void;
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
