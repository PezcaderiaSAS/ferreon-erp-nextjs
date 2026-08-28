import { create, persist } from '../../lib/zustand';

// Actualizamos la interfaz para que empate con la estructura de Supabase + UI
export interface EquipoUI {
  id: string | number;
  codigo: string;
  nombre: string;
  categoria: string;
  tarifa_diaria: number;
  stock_total: number;
  stock_disponible: number;
  stock_en_obra: number;
  estado: string; // 'Activo' | 'Inactivo' | 'Disponible' | 'En Alquiler' | 'Mantenimiento'
  created_at?: string;
  // Campos por retrocompatibilidad
  sku?: string;
  tarifaDiaria?: number;
  stockTotal?: number;
  stockDisponible?: number;
  stockEnObra?: number;
}

interface BodegaState {
  equipos: EquipoUI[];
  idempotencyKeys: string[];
  setEquipos: (equipos: EquipoUI[]) => void;
  generarSiguienteSKU: () => string;
  agregarEquipo: (equipo: EquipoUI, idempotencyKey?: string) => boolean;
  updateEquipo: (equipo: EquipoUI, idempotencyKey?: string) => boolean;
  ajustarStock: (equipoId: string | number, nuevoStockDisponible: number, motivo?: string) => boolean;
  descontarStock: (equipoId: string | number, cantidad: number) => boolean;
  incrementarStock: (equipoId: string | number, cantidad: number) => boolean;
  inactivarEquipo: (id: string | number) => Promise<void>;
  restoreSnapshot: (previousEquipos: EquipoUI[]) => void;
}

const MAX_IDEMPOTENCY_KEYS = 50;

export const useBodegaStore = create<BodegaState>()(
  persist(
    (set, get) => ({
      equipos: [],
      idempotencyKeys: [],

      setEquipos: (equipos) => set({ equipos }),

      generarSiguienteSKU: () => {
        const state = get();
        if (!state.equipos || state.equipos.length === 0) {
          return 'EQ-001';
        }
        let maxNum = 0;
        state.equipos.forEach((e) => {
          const match = (e.codigo || e.sku || '').match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        const nextNum = maxNum + 1;
        return `EQ-${String(nextNum).padStart(3, '0')}`;
      },

      agregarEquipo: (equipo, idempotencyKey) => {
        const state = get();
        if (idempotencyKey && state.idempotencyKeys.includes(idempotencyKey)) {
          console.warn(`[BodegaStore] Transacción duplicada bloqueada por Idempotencia: ${idempotencyKey}`);
          return false;
        }

        const newKeys = idempotencyKey 
          ? [...state.idempotencyKeys.slice(-MAX_IDEMPOTENCY_KEYS + 1), idempotencyKey]
          : state.idempotencyKeys;

        set({
          equipos: [...state.equipos, equipo],
          idempotencyKeys: newKeys,
        });
        return true;
      },

      updateEquipo: (equipo, idempotencyKey) => {
        const state = get();
        if (idempotencyKey && state.idempotencyKeys.includes(idempotencyKey)) {
          console.warn(`[BodegaStore] Transacción duplicada bloqueada por Idempotencia: ${idempotencyKey}`);
          return false;
        }

        const newKeys = idempotencyKey 
          ? [...state.idempotencyKeys.slice(-MAX_IDEMPOTENCY_KEYS + 1), idempotencyKey]
          : state.idempotencyKeys;

        set({
          equipos: state.equipos.map((e) => (e.id === equipo.id ? equipo : e)),
          idempotencyKeys: newKeys,
        });
        return true;
      },

      ajustarStock: (equipoId, nuevoStockDisponible, motivo) => {
        if (nuevoStockDisponible < 0) return false;
        set((state) => ({
          equipos: state.equipos.map((e) => {
            if (e.id === equipoId) {
              const enObra = (e.stock_en_obra ?? e.stockEnObra) || 0;
              const total = nuevoStockDisponible + enObra;
              // Compatibilidad de estados
              const estadoUi = nuevoStockDisponible > 0 ? 'Disponible' : (enObra > 0 ? 'En Alquiler' : 'Mantenimiento');
              return {
                ...e,
                stock_disponible: nuevoStockDisponible,
                stockDisponible: nuevoStockDisponible,
                stock_total: total,
                stockTotal: total,
                estado: estadoUi
              };
            }
            return e;
          })
        }));
        if (motivo) {
          console.info(`[BodegaStore] Stock ajustado para equipo ${equipoId}: disponible=${nuevoStockDisponible}. Motivo: ${motivo}`);
        }
        return true;
      },

      descontarStock: (equipoId, cantidad) => {
        set((state) => ({
          equipos: state.equipos.map((e) => {
            if (e.id === equipoId) {
              const disponible = Math.max(0, ((e.stock_disponible ?? e.stockDisponible) || 0) - cantidad);
              const enObra = ((e.stock_en_obra ?? e.stockEnObra) || 0) + cantidad;
              const estadoUi = disponible > 0 ? 'Disponible' : 'En Alquiler';
              return {
                ...e,
                stock_disponible: disponible,
                stockDisponible: disponible,
                stock_en_obra: enObra,
                stockEnObra: enObra,
                estado: estadoUi
              };
            }
            return e;
          })
        }));
        return true;
      },

      incrementarStock: (equipoId, cantidad) => {
        set((state) => ({
          equipos: state.equipos.map((e) => {
            if (e.id === equipoId) {
              const enObra = Math.max(0, ((e.stock_en_obra ?? e.stockEnObra) || 0) - cantidad);
              const disponible = ((e.stock_disponible ?? e.stockDisponible) || 0) + cantidad;
              const estadoUi = disponible > 0 ? 'Disponible' : (enObra > 0 ? 'En Alquiler' : 'Mantenimiento');
              return {
                ...e,
                stock_disponible: disponible,
                stockDisponible: disponible,
                stock_en_obra: enObra,
                stockEnObra: enObra,
                estado: estadoUi
              };
            }
            return e;
          })
        }));
        return true;
      },

      inactivarEquipo: async (id: string | number) => {
        const state = get();
        const previousEquipos = state.equipos;
        const equipoActual = state.equipos.find(e => e.id === id);

        if (equipoActual && ((equipoActual.stock_en_obra ?? equipoActual.stockEnObra) || 0) > 0) {
           throw new Error(`No se puede eliminar el equipo porque tiene unidades en obra.`);
        }

        // Mutación Optimista (0ms Latency)
        set({
          equipos: state.equipos.filter((e) => e.id !== id),
        });

        try {
          const res = await fetch(`/api/equipos/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Error en Soft Delete');
        } catch (error) {
          console.error('Aplicando Rollback optimista tras fallo de API', error);
          set({ equipos: previousEquipos });
          throw error;
        }
      },

      restoreSnapshot: (previousEquipos) => {
        console.info('[BodegaStore] Ejecutando Rollback Optimista...');
        set({ equipos: previousEquipos });
      }
    }),
    {
      name: 'bodega-storage',
      partialize: (state) => ({ 
        // Filtramos cualquier item que tenga un ID temporal para que no se guarde en localStorage
        equipos: state.equipos.filter(e => typeof e.id === 'number' || !String(e.id).startsWith('temp_')), 
        idempotencyKeys: state.idempotencyKeys 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Si por alguna razón ya había items temporales corruptos guardados, los purgamos al recargar
          state.equipos = state.equipos.filter(e => typeof e.id === 'number' || !String(e.id).startsWith('temp_'));
        }
      }
    }
  )
);
