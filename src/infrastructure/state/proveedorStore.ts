import { create, persist } from '../../lib/zustand';
import { ProveedorUI } from '@/app/actions/proveedores';

export type { ProveedorUI };

interface ProveedorState {
  proveedores: ProveedorUI[];
  setProveedores: (proveedores: ProveedorUI[]) => void;
  agregarProveedor: (proveedor: ProveedorUI) => void;
  updateProveedor: (proveedor: ProveedorUI) => void;
}

export const useProveedorStore = create<ProveedorState>()(
  persist(
    (set) => ({
      proveedores: [],
      setProveedores: (proveedores) => set({ proveedores }),
      agregarProveedor: (proveedor) =>
        set((state) => ({ proveedores: [proveedor, ...state.proveedores] })),
      updateProveedor: (proveedor) =>
        set((state) => ({
          proveedores: state.proveedores.map((p) => (p.id === proveedor.id ? proveedor : p)),
        })),
    }),
    {
      name: 'proveedor-storage',
    } as any
  )
);
