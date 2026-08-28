import { create, persist } from '../../lib/zustand';

// Actualizamos la interfaz para que empate con la estructura de Supabase + estado
export interface ClienteUI {
  id: string | number;
  nit_cedula: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  estado: string; // 'Activo' | 'Inactivo'
  created_at: string;
  // Campos heredados por compatibilidad
  nit?: string;
  contacto?: string;
  nivel_riesgo?: string;
}

interface ClienteState {
  clientes: ClienteUI[];
  setClientes: (clientes: ClienteUI[]) => void;
  agregarCliente: (cliente: ClienteUI) => void;
  updateCliente: (cliente: ClienteUI) => void;
  inactivarCliente: (id: string | number) => Promise<void>;
}

export const useClienteStore = create<ClienteState>()(
  persist(
    (set, get) => ({
      clientes: [],
      setClientes: (clientes) => set({ clientes }),
      agregarCliente: (cliente) => set((state) => ({ clientes: [...state.clientes, cliente] })),
      updateCliente: (cliente) => set((state) => ({
        clientes: state.clientes.map((c) => (c.id === cliente.id ? cliente : c))
      })),
      inactivarCliente: async (id: string | number) => {
        const state = get();
        const previousClientes = state.clientes;

        // Mutación Optimista: Asumimos que la API tendrá 200 OK
        set({
          clientes: state.clientes.filter((c) => c.id !== id), // Opcionalmente filtrar o marcar como Inactivo
        });

        try {
          const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Error en Soft Delete');
        } catch (error) {
          console.error('Aplicando Rollback optimista tras fallo de API', error);
          // Rollback: restauramos la lista previa si falló la API
          set({ clientes: previousClientes });
        }
      }
    }),
    {
      name: 'cliente-storage',
      partialize: (state) => ({ 
        clientes: state.clientes.filter(c => typeof c.id === 'number' || !String(c.id).startsWith('temp_'))
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.clientes = state.clientes.filter(c => typeof c.id === 'number' || !String(c.id).startsWith('temp_'));
        }
      }
    }
  )
);
