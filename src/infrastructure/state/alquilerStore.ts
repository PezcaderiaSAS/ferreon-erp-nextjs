import { create, persist } from '../../lib/zustand';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';

interface AlquilerStore {
  alquileres: AlquilerEntity[];
  idempotencyKeys: string[];
  setAlquileres: (alquileres: AlquilerEntity[]) => void;
  addAlquiler: (alquiler: AlquilerEntity, idempotencyKey?: string) => boolean;
  updateAlquiler: (alquiler: AlquilerEntity, idempotencyKey?: string) => boolean;
  removeAlquiler: (id: string, idempotencyKey?: string) => boolean;
  restoreSnapshot: (previousAlquileres: AlquilerEntity[]) => void;
}

const MAX_IDEMPOTENCY_KEYS = 50;
const ALQUILERES_INICIALES: AlquilerEntity[] = [];

export const useAlquilerStore = create<AlquilerStore>()(
  persist(
    (set, get) => ({
      alquileres: ALQUILERES_INICIALES,
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

      removeAlquiler: (id, idempotencyKey) => {
        const state = get();
        if (idempotencyKey && state.idempotencyKeys.includes(idempotencyKey)) {
          console.warn(`[AlquilerStore] Transacción duplicada bloqueada por Idempotencia: ${idempotencyKey}`);
          return false;
        }

        const newKeys = idempotencyKey 
          ? [...state.idempotencyKeys.slice(-MAX_IDEMPOTENCY_KEYS + 1), idempotencyKey]
          : state.idempotencyKeys;

        set({
          alquileres: state.alquileres.filter((a) => a.id !== id),
          idempotencyKeys: newKeys,
        });
        return true;
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
