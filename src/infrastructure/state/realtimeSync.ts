import { useEffect } from 'react';
import { supabaseClient } from '../persistence/supabase/client';
import { useBodegaStore } from './bodegaStore';
import { useAlquilerStore } from './alquilerStore';
import { useClienteStore } from './clienteStore';
import { EquipoUI } from './bodegaStore';
import { AlquilerUI } from './alquilerStore';
import { ClienteUI } from './clienteStore';

/**
 * Servicio de sincronización en tiempo real con Supabase Realtime (WebSockets)
 * Escucha cambios en las tablas 'equipos', 'alquileres' y 'clientes' para alimentar los stores
 * de Zustand en segundo plano con latencia mínima (<100ms).
 */
export function setupRealtimeSubscriptions() {
  if (typeof window === 'undefined') return () => {};

  const channel = supabaseClient
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'equipos',
      },
      (payload) => {
        console.info('[Realtime] Cambio detectado en tabla equipos:', payload.eventType);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const bodegaState = useBodegaStore.getState();

        if (eventType === 'INSERT' && newRecord) {
          const equipo: EquipoUI = {
            id: newRecord.id,
            codigo: newRecord.sku || newRecord.codigo || 'EQ-NEW',
            sku: newRecord.sku || newRecord.codigo || 'EQ-NEW',
            nombre: newRecord.nombre,
            categoria: newRecord.categoria,
            tarifa_diaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            tarifaDiaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            stock_total: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stockTotal: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stock_disponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stockDisponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stock_en_obra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            stockEnObra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            estado: (newRecord.estado as string) || 'Disponible',
            created_at: newRecord.created_at || new Date().toISOString(),
          };
          if (!bodegaState.equipos.some((e) => e.id === equipo.id)) {
            bodegaState.agregarEquipo(equipo);
          }
        } else if (eventType === 'UPDATE' && newRecord) {
          const updatedEquipo: EquipoUI = {
            id: newRecord.id,
            codigo: newRecord.sku || newRecord.codigo || 'EQ-UP',
            sku: newRecord.sku || newRecord.codigo || 'EQ-UP',
            nombre: newRecord.nombre,
            categoria: newRecord.categoria,
            tarifa_diaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            tarifaDiaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            stock_total: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stockTotal: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stock_disponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stockDisponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stock_en_obra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            stockEnObra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            estado: (newRecord.estado as string) || 'Disponible',
            created_at: newRecord.created_at || new Date().toISOString(),
          };
          bodegaState.updateEquipo(updatedEquipo);
        } else if (eventType === 'DELETE' && oldRecord) {
          bodegaState.setEquipos(bodegaState.equipos.filter((e) => e.id !== oldRecord.id));
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'alquileres',
      },
      (payload) => {
        console.info('[Realtime] Cambio detectado en tabla alquileres:', payload.eventType);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const alquilerState = useAlquilerStore.getState();

        if (eventType === 'INSERT' && newRecord) {
          if (!alquilerState.alquileres.some((a) => a.id === newRecord.id)) {
            alquilerState.addAlquiler(newRecord as AlquilerUI);
          }
        } else if (eventType === 'UPDATE' && newRecord) {
          alquilerState.updateAlquiler(newRecord as AlquilerUI);
        } else if (eventType === 'DELETE' && oldRecord) {
          alquilerState.eliminarAlquiler(oldRecord.id);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'clientes',
      },
      (payload) => {
        console.info('[Realtime] Cambio detectado en tabla clientes:', payload.eventType);
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const clienteState = useClienteStore.getState();

        if (eventType === 'INSERT' && newRecord) {
          const cliente: ClienteUI = {
            id: newRecord.id,
            nit_cedula: newRecord.nit_cedula || newRecord.nit || '',
            nit: newRecord.nit_cedula || newRecord.nit || '',
            nombre: newRecord.nombre,
            telefono: newRecord.telefono || newRecord.contacto || '',
            contacto: newRecord.contacto || newRecord.telefono || '',
            email: newRecord.email || '',
            direccion: newRecord.direccion || '',
            estado: (newRecord.estado as string) || 'Activo',
            nivel_riesgo: (newRecord.nivel_riesgo as string) || 'Bajo',
            created_at: newRecord.created_at || new Date().toISOString(),
          };
          if (!clienteState.clientes.some((c) => c.id === cliente.id)) {
            clienteState.agregarCliente(cliente);
          }
        } else if (eventType === 'UPDATE' && newRecord) {
          const updatedCliente: ClienteUI = {
            id: newRecord.id,
            nit_cedula: newRecord.nit_cedula || newRecord.nit || '',
            nit: newRecord.nit_cedula || newRecord.nit || '',
            nombre: newRecord.nombre,
            telefono: newRecord.telefono || newRecord.contacto || '',
            contacto: newRecord.contacto || newRecord.telefono || '',
            email: newRecord.email || '',
            direccion: newRecord.direccion || '',
            estado: (newRecord.estado as string) || 'Activo',
            nivel_riesgo: (newRecord.nivel_riesgo as string) || 'Bajo',
            created_at: newRecord.created_at || new Date().toISOString(),
          };
          clienteState.updateCliente(updatedCliente);
        } else if (eventType === 'DELETE' && oldRecord) {
          clienteState.setClientes(clienteState.clientes.filter((c) => c.id !== oldRecord.id));
        }
      }
    )
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}

/**
 * Hook de React para inicializar las suscripciones en el ciclo de vida del layout
 * con reconciliación automática ante reactivación de pestaña en macOS (App Nap / Safari).
 */
export function useRealtimeSync() {
  useEffect(() => {
    let unsubscribe = setupRealtimeSubscriptions();

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        try {
          const channels = supabaseClient.getChannels();
          channels.forEach((ch) => {
            if (ch.state === 'closed' || ch.state === 'errored') {
              console.info('[RealtimeSync] Reconectando canal tras evento de foco/visibilidad en macOS');
              ch.subscribe();
            }
          });
        } catch (e) {
          console.warn('[RealtimeSync] Error al verificar canales en reconexión:', e);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    return () => {
      unsubscribe();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
    };
  }, []);
}
