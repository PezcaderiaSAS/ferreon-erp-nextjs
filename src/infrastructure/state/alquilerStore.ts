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
  total_pagado?: number;
  saldo_pendiente?: number;
  totalPagado?: number;
  saldoPendiente?: number;
  created_at: string;
  fecha_vencimiento?: string;
}

export interface ItemDevolucionPayload {
  equipoId: string;
  cantidadDevuelta: number;
  costoDano: number;
}

export interface DevolucionPayload {
  contratoId: string | number;
  itemsDevueltos: ItemDevolucionPayload[];
  fechaDevolucion: string;
  idempotencyKey: string;
}

interface AlquilerStore {
  alquileres: AlquilerUI[];
  idempotencyKeys: string[];
  setAlquileres: (alquileres: AlquilerUI[]) => void;
  addAlquiler: (alquiler: AlquilerUI, idempotencyKey?: string) => boolean;
  updateAlquiler: (alquiler: AlquilerUI, idempotencyKey?: string) => boolean;
  eliminarAlquiler: (id: string | number) => Promise<void>;
  procesarDevolucionOptimista: (payload: DevolucionPayload) => boolean;
  restoreSnapshot: (previousAlquileres: AlquilerUI[]) => void;
  sanitizeStore: () => void;
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

      procesarDevolucionOptimista: (payload) => {
        const state = get();
        if (state.idempotencyKeys.includes(payload.idempotencyKey)) {
          console.warn(`[AlquilerStore] Devolución duplicada bloqueada por Idempotencia: ${payload.idempotencyKey}`);
          return false;
        }

        const alquilerIndex = state.alquileres.findIndex(a => String(a.id) === String(payload.contratoId));
        if (alquilerIndex === -1) return false;

        const alquilerOriginal = state.alquileres[alquilerIndex];
        // Clon profundo inmutable para no mutar el estado accidentalmente
        const alquilerActualizado = JSON.parse(JSON.stringify(alquilerOriginal)) as AlquilerUI;

        let todosDevueltos = true;

        alquilerActualizado.detalles = alquilerActualizado.detalles.flatMap((it) => {
          const itemPayload = payload.itemsDevueltos.find(p => String(p.equipoId) === String(it.itemId) || String(p.equipoId) === String(it.equipoId));
          
          if (!itemPayload || itemPayload.cantidadDevuelta <= 0) {
            const devuelto = (it.cantidadDevuelta || 0) >= it.cantidad;
            if (!devuelto) todosDevueltos = false;
            return [it];
          }

          const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
          const cantidadDevueltaHoy = Math.min(itemPayload.cantidadDevuelta, pendientes);
          
          if (cantidadDevueltaHoy < pendientes) {
            // Split Line
            const msDiffEst = new Date(it.fechaFinEstimada || it.fechaFin || new Date()).getTime() - new Date(it.fechaInicio || new Date()).getTime();
            const diasEstimados = Math.max(1, Math.ceil(msDiffEst / (1000 * 3600 * 24)));
            
            const uuidSeguro = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `clon-${Date.now()}-${Math.random().toString(36).substring(2,9)}`;

            const newItemClonado = {
              ...it,
              id: it.id ? `${it.id}-clon-${uuidSeguro}` : uuidSeguro,
              cantidad: cantidadDevueltaHoy,
              cantidadDevuelta: cantidadDevueltaHoy,
              fechaDevolucionReal: payload.fechaDevolucion,
              devuelto: true,
              costoDano: itemPayload.costoDano,
              subtotalLineaEstimado: (it.tarifaAplicada || 0) * cantidadDevueltaHoy * diasEstimados
            };

            // Ajustar el original
            const updatedOriginal = {
              ...it,
              cantidad: it.cantidad - cantidadDevueltaHoy,
              subtotalLineaEstimado: (it.tarifaAplicada || 0) * (it.cantidad - cantidadDevueltaHoy) * diasEstimados
            };

            todosDevueltos = false;
            return [updatedOriginal, newItemClonado];
          } else {
            // Devolución completa de la línea
            const totalDevueltas = (it.cantidadDevuelta || 0) + cantidadDevueltaHoy;
            return [{
              ...it,
              cantidadDevuelta: totalDevueltas,
              fechaDevolucionReal: payload.fechaDevolucion,
              devuelto: true,
              costoDano: (it.costoDano || 0) + itemPayload.costoDano
            }];
          }
        });

        if (todosDevueltos && alquilerActualizado.estado !== 'CANCELADO') {
          alquilerActualizado.estado = 'FINALIZADO';
          alquilerActualizado.garantia_estado = 'Liberada';
        }

        const newKeys = [...state.idempotencyKeys.slice(-49), payload.idempotencyKey];
        const nuevosAlquileres = [...state.alquileres];
        nuevosAlquileres[alquilerIndex] = alquilerActualizado;

        set({
          alquileres: nuevosAlquileres,
          idempotencyKeys: newKeys,
        });

        return true;
      },

      restoreSnapshot: (previousAlquileres) => {
        console.info('[AlquilerStore] Ejecutando Rollback Optimista...');
        set({ alquileres: previousAlquileres });
      },

      sanitizeStore: () => {
        const state = get();
        let modified = false;
        
        const sanitized = state.alquileres.map((alq) => {
          let updated = false;
          const clone = { ...alq };

          if (!clone.id || String(clone.id) === 'ALQ-NaN' || String(clone.id).trim() === '') {
            clone.id = `ALQ-${Math.floor(1000 + Math.random() * 9000)}`;
            updated = true;
          }

          if (!clone.created_at || new Date(clone.created_at).toString() === 'Invalid Date') {
            clone.created_at = new Date().toISOString();
            updated = true;
          }

          if (clone.detalles && Array.isArray(clone.detalles)) {
            let calcSubtotalEquipos = 0;
            clone.detalles = clone.detalles.map((d: any) => {
              const tarifa = d.tarifaAplicada || d.valorUnitario || d.precioDiario || d.tarifaDiaria || 0;
              let fInicio = d.fechaInicio || clone.created_at;
              let fFin = d.fechaFinEstimada || d.fechaFin || clone.created_at;
              
              const isValidDate = (dString: string) => !isNaN(new Date(dString).getTime());
              const isoInicio = isValidDate(fInicio) ? new Date(fInicio).toISOString() : new Date().toISOString();
              const isoFin = isValidDate(fFin) ? new Date(fFin).toISOString() : new Date().toISOString();

              const dias = Math.max(1, Math.ceil((new Date(isoFin).getTime() - new Date(isoInicio).getTime()) / 86400000));
              const sub = d.subtotalLineaReal || d.subtotalLineaEstimado || (tarifa * dias * (d.cantidad || 1)) || 0;
              calcSubtotalEquipos += sub;

              const needsUpdate = d.tarifaAplicada !== tarifa || d.fechaInicio !== isoInicio || d.fechaFinEstimada !== isoFin || d.subtotalLineaEstimado !== sub;
              if (needsUpdate) updated = true;

              return {
                ...d,
                tarifaAplicada: tarifa,
                fechaInicio: isoInicio,
                fechaFinEstimada: isoFin,
                subtotalLineaEstimado: sub
              };
            });

            const calcSubtotalGeneral = calcSubtotalEquipos + (clone.flete_entrega || 0) + (clone.flete_recogida || 0);
            const calcTotal = Math.max(0, calcSubtotalGeneral - (clone.deposito || 0));

            if (clone.subtotal_equipos !== calcSubtotalEquipos || clone.total !== calcTotal) {
              clone.subtotal_equipos = calcSubtotalEquipos;
              clone.subtotal_general = calcSubtotalGeneral;
              clone.total = calcTotal;
              updated = true;
            }
          }

          if (updated) modified = true;
          return clone;
        });

        if (modified) {
          console.info('[AlquilerStore] Sanitando datos corruptos en el storage local...');
          set({ alquileres: sanitized });
        }
      }
    }),
    {
      name: 'alquiler-storage',
      partialize: (state) => ({ 
        alquileres: state.alquileres.filter(a => typeof a.id === 'number' || !String(a.id).startsWith('temp_')), 
        idempotencyKeys: state.idempotencyKeys 
      }),
      merge: (persistedState: any, currentState) => {
        if (persistedState?.alquileres) {
          persistedState.alquileres = persistedState.alquileres.filter((a: any) => typeof a.id === 'number' || !String(a.id).startsWith('temp_'));
        }
        return { ...currentState, ...persistedState };
      }
    } as any
  )
);
