import { create } from 'zustand';
import { EmpresaDirectorioItem } from '@/app/actions/ultraadmin';

export type FiltroEstado = 'TODOS' | 'PENDIENTES' | 'ACTIVAS' | 'SUSPENDIDAS' | 'EXPIRADAS';

interface UltraAdminState {
  empresas: EmpresaDirectorioItem[];
  filtroEstado: FiltroEstado;
  tenantSeleccionado: EmpresaDirectorioItem | null;
  drawerAbierto: boolean;
  isMutating: boolean; // Previene doble clicks
  
  // Acciones de Inicialización
  setEmpresas: (empresas: EmpresaDirectorioItem[]) => void;
  
  // Acciones de UI
  setFiltro: (filtro: FiltroEstado) => void;
  abrirTenant: (tenant: EmpresaDirectorioItem) => void;
  cerrarDrawer: () => void;
  setMutating: (status: boolean) => void;
  
  // Optimistic Updates
  optimisticUpdateTenant: (id: string, partialData: Partial<EmpresaDirectorioItem>) => void;
}

export const useUltraAdminStore = create<UltraAdminState>((set) => ({
  empresas: [],
  filtroEstado: 'TODOS',
  tenantSeleccionado: null,
  drawerAbierto: false,
  isMutating: false,

  setEmpresas: (empresas) => set({ empresas }),

  setFiltro: (filtro) => set({ filtroEstado: filtro }),

  abrirTenant: (tenant) => set({ 
    tenantSeleccionado: tenant, 
    drawerAbierto: true 
  }),

  cerrarDrawer: () => set({ 
    drawerAbierto: false, 
    // Mantenemos el tenantSeleccionado por unos milisegundos para que 
    // la animación de salida del Drawer no muestre datos en blanco.
    // tenantSeleccionado: null 
  }),

  setMutating: (status) => set({ isMutating: status }),

  optimisticUpdateTenant: (id, partialData) => set((state) => {
    // Actualizamos la empresa en la lista
    const nuevasEmpresas = state.empresas.map((emp) =>
      emp.id === id ? { ...emp, ...partialData } : emp
    );
    
    // Si la empresa actualizada es la que está seleccionada, también la actualizamos
    const nuevoTenantSeleccionado = 
      state.tenantSeleccionado?.id === id 
        ? { ...state.tenantSeleccionado, ...partialData } 
        : state.tenantSeleccionado;

    return {
      empresas: nuevasEmpresas,
      tenantSeleccionado: nuevoTenantSeleccionado
    };
  })
}));
