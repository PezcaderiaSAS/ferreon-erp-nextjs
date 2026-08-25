import { useEffect } from 'react';
import { supabaseClient } from '../persistence/supabase/client';
import { useBodegaStore } from './bodegaStore';
import { useAlquilerStore } from './alquilerStore';
import { EquipoUI } from './bodegaStore';
import { AlquilerUI } from './alquilerStore';

/**
 * Servicio de sincronización en tiempo real con Supabase Realtime (WebSockets)
 * Escucha cambios en las tablas 'equipos' y 'alquileres' para alimentar los stores
 * de Zustand en segundo plano con latencia mínima.
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
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}

/**
 * Hook de React para inicializar las suscripciones en el ciclo de vida del layout
 */
export function useRealtimeSync() {
  useEffect(() => {
    const unsubscribe = setupRealtimeSubscriptions();
    return () => {
      unsubscribe();
    };
  }, []);
}
