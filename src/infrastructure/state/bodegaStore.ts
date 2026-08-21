import { create, persist } from '../../lib/zustand';
import { Equipo } from '../../core/domain/entities/equipo';

interface BodegaState {
  equipos: Equipo[];
  idempotencyKeys: string[];
  setEquipos: (equipos: Equipo[]) => void;
  generarSiguienteSKU: () => string;
  agregarEquipo: (equipo: Equipo, idempotencyKey?: string) => boolean;
  updateEquipo: (equipo: Equipo, idempotencyKey?: string) => boolean;
  ajustarStock: (equipoId: string, nuevoStockDisponible: number, motivo?: string) => boolean;
  descontarStock: (equipoId: string, cantidad: number) => boolean;
  incrementarStock: (equipoId: string, cantidad: number) => boolean;
  restoreSnapshot: (previousEquipos: Equipo[]) => void;
}

const MAX_IDEMPOTENCY_KEYS = 50;

const EQUIPOS_INICIALES: Equipo[] = [
  {
    id: '1',
    sku: 'EQ-001',
    nombre: 'Taladro Percutor 800W',
    categoria: 'Herramientas Eléctricas',
    estado: 'Disponible',
    tarifaDiaria: 45000,
    stockTotal: 10,
    stockDisponible: 8,
    stockEnObra: 2,
    creado_en: new Date()
  },
  {
    id: '2',
    sku: 'EQ-002',
    nombre: 'Andamio Tubular 2x2m',
    categoria: 'Construcción',
    estado: 'En Alquiler',
    tarifaDiaria: 12000,
    stockTotal: 25,
    stockDisponible: 5,
    stockEnObra: 20,
    creado_en: new Date()
  }
];

export const useBodegaStore = create<BodegaState>()(
  persist(
    (set, get) => ({
      equipos: EQUIPOS_INICIALES,
      idempotencyKeys: [],

      setEquipos: (equipos) => set({ equipos }),

      generarSiguienteSKU: () => {
        const state = get();
        if (!state.equipos || state.equipos.length === 0) {
          return 'EQ-001';
        }
        let maxNum = 0;
        state.equipos.forEach((e) => {
          const match = (e.sku || '').match(/(\d+)$/);
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
              const enObra = e.stockEnObra || 0;
              const total = nuevoStockDisponible + enObra;
              const estado = nuevoStockDisponible > 0 ? ('Disponible' as const) : (enObra > 0 ? ('En Alquiler' as const) : ('Mantenimiento' as const));
              return {
                ...e,
                stockDisponible: nuevoStockDisponible,
                stockTotal: total,
                estado
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
              const disponible = Math.max(0, (e.stockDisponible || 0) - cantidad);
              const enObra = (e.stockEnObra || 0) + cantidad;
              const estado = disponible > 0 ? ('Disponible' as const) : ('En Alquiler' as const);
              return {
                ...e,
                stockDisponible: disponible,
                stockEnObra: enObra,
                estado
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
              const enObra = Math.max(0, (e.stockEnObra || 0) - cantidad);
              const disponible = (e.stockDisponible || 0) + cantidad;
              const estado = disponible > 0 ? ('Disponible' as const) : (enObra > 0 ? ('En Alquiler' as const) : ('Mantenimiento' as const));
              return {
                ...e,
                stockDisponible: disponible,
                stockEnObra: enObra,
                estado
              };
            }
            return e;
          })
        }));
        return true;
      },

      restoreSnapshot: (previousEquipos) => {
        console.info('[BodegaStore] Ejecutando Rollback Optimista...');
        set({ equipos: previousEquipos });
      }
    }),
    {
      name: 'bodega-storage',
      partialize: (state) => ({ equipos: state.equipos, idempotencyKeys: state.idempotencyKeys })
    }
  )
);
