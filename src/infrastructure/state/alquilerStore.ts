import { create, persist } from '../../lib/zustand';

// Compatibilidad con DB y Front
export interface AlquilerUI {
  id: string | number;
  consecutivo: number;
  cliente_id: string | number;
  clienteNombre?: string;
  estado: string;
  subtotal_equipos: number;
  flete_entrega: number;
  flete_recogida: number;
  subtotal_general: number;
  total: number;
  deposito: number;
  garantia_monto: number;
  garantia_tipo: string;
  garantia_estado: string;
  observaciones?: string;
  detalles_logistica?: string;
  detalles: any[];
  created_at: string;
}

interface AlquilerStore {
  alquileres: AlquilerUI[];
  idempotencyKeys: string[];
  setAlquileres: (alquileres: AlquilerUI[]) => void;
  addAlquiler: (alquiler: AlquilerUI, idempotencyKey?: string) => boolean;
  updateAlquiler: (alquiler: AlquilerUI, idempotencyKey?: string) => boolean;
  eliminarAlquiler: (id: string | number) => Promise<void>;
  restoreSnapshot: (previousAlquileres: AlquilerUI[]) => void;
}

const MAX_IDEMPOTENCY_KEYS = 50;

export const useAlquilerStore = create<AlquilerStore>()(
  persist(
    (set, get) => ({
      alquileres: [],
      idempotencyKeys: [],

      setAlquileres: (alquileres) => set({ alquileres }),

      addAlquiler: (alquiler, idempotencyKey) => {
        const state = get();
        if (idempotencyKey && state.idempotencyKeys.includes(idempotencyKey)) {
          console.warn(`[AlquilerStore] Transacción duplicada bloqueada por Idempotencia: ${idempotencyKey}`);
          return false;
        }

        const newKeys = idempotencyKey 
          ? [...state.idempotencyKeys.slice(-MAX_IDEMPOTENCY_KEYS + 1), idempotencyKey]
          : state.idempotencyKeys;

        set({
          alquileres: [...state.alquileres, alquiler],
          idempotencyKeys: newKeys,
        });
        return true;
      },

      updateAlquiler: (alquiler, idempotencyKey) => {
        const state = get();
        if (idempotencyKey && state.idempotencyKeys.includes(idempotencyKey)) {
          console.warn(`[AlquilerStore] Transacción duplicada bloqueada por Idempotencia: ${idempotencyKey}`);
          return false;
        }

        const newKeys = idempotencyKey 
          ? [...state.idempotencyKeys.slice(-MAX_IDEMPOTENCY_KEYS + 1), idempotencyKey]
          : state.idempotencyKeys;

        set({
          alquileres: state.alquileres.map((a) => (a.id === alquiler.id ? alquiler : a)),
          idempotencyKeys: newKeys,
        });
        return true;
      },

      eliminarAlquiler: async (id: string | number) => {
        const state = get();
        const previousAlquileres = state.alquileres;

        // Mutación Optimista: Asumimos éxito
        set({
          alquileres: state.alquileres.filter((a) => a.id !== id),
        });

        try {
          const res = await fetch(`/api/alquileres/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Error al cancelar alquiler');
        } catch (error) {
          console.error('Aplicando Rollback optimista tras fallo de API', error);
          set({ alquileres: previousAlquileres });
          throw error;
        }
      },

      restoreSnapshot: (previousAlquileres) => {
        console.info('[AlquilerStore] Ejecutando Rollback Optimista...');
        set({ alquileres: previousAlquileres });
      }
    }),
    {
      name: 'alquiler-storage',
      partialize: (state) => ({ alquileres: state.alquileres, idempotencyKeys: state.idempotencyKeys })
    }
  )
);
