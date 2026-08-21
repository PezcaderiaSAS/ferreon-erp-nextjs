import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Equipo } from '../../core/domain/entities/equipo';

interface BodegaState {
  equipos: Equipo[];
  idempotencyKeys: string[];
  setEquipos: (equipos: Equipo[]) => void;
  agregarEquipo: (equipo: Equipo, idempotencyKey?: string) => boolean;
  updateEquipo: (equipo: Equipo, idempotencyKey?: string) => boolean;
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
    creado_en: new Date()
  },
  {
    id: '2',
    sku: 'EQ-002',
    nombre: 'Andamio Tubular 2x2m',
    categoria: 'Construcción',
    estado: 'En Alquiler',
    tarifaDiaria: 12000,
    creado_en: new Date()
  }
];

export const useBodegaStore = create<BodegaState>()(
  persist(
    (set, get) => ({
      equipos: EQUIPOS_INICIALES,
      idempotencyKeys: [],

      setEquipos: (equipos) => set({ equipos }),

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

      descontarStock: (equipoId, cantidad) => {
        set((state) => ({
          equipos: state.equipos.map((e) => {
            if (e.id === equipoId) {
              return {
                ...e,
                estado: 'En Alquiler'
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
              return {
                ...e,
                estado: 'Disponible'
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
