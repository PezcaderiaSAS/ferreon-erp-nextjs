import { useEffect } from 'react';
import { supabaseClient } from '../persistence/supabase/client';
import { useBodegaStore } from './bodegaStore';
import { useAlquilerStore } from './alquilerStore';
import { Equipo } from '../../core/domain/entities/equipo';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';

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
          const equipo: Equipo = {
            id: newRecord.id,
            sku: newRecord.sku || newRecord.codigo || 'EQ-NEW',
            nombre: newRecord.nombre,
            categoria: newRecord.categoria,
            tarifaDiaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            stockTotal: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stockDisponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stockEnObra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            estado: (newRecord.estado as any) || 'Disponible',
            creado_en: new Date(newRecord.created_at || Date.now()),
          };
          // Validar si ya existe localmente
          if (!bodegaState.equipos.some((e) => e.id === equipo.id)) {
            bodegaState.agregarEquipo(equipo);
          }
        } else if (eventType === 'UPDATE' && newRecord) {
          const updatedEquipo: Equipo = {
            id: newRecord.id,
            sku: newRecord.sku || newRecord.codigo || 'EQ-UP',
            nombre: newRecord.nombre,
            categoria: newRecord.categoria,
            tarifaDiaria: Number(newRecord.tarifa_diaria || newRecord.tarifaDiaria || 0),
            stockTotal: Number(newRecord.stock_total || newRecord.stockTotal || 0),
            stockDisponible: Number(newRecord.stock_disponible || newRecord.stockDisponible || 0),
            stockEnObra: Number(newRecord.stock_en_obra || newRecord.stockEnObra || 0),
            estado: (newRecord.estado as any) || 'Disponible',
            creado_en: new Date(newRecord.created_at || Date.now()),
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
          // Si no existe, lo insertamos
          if (!alquilerState.alquileres.some((a) => a.id === newRecord.id)) {
            alquilerState.addAlquiler(newRecord as AlquilerEntity);
          }
        } else if (eventType === 'UPDATE' && newRecord) {
          alquilerState.updateAlquiler(newRecord as AlquilerEntity);
        } else if (eventType === 'DELETE' && oldRecord) {
          alquilerState.removeAlquiler(oldRecord.id);
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
