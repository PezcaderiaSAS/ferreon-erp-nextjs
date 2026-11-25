import React, { Suspense } from 'react';
import {
  obtenerRutasDespachoAction,
  obtenerZonasFleteAction,
} from '@/app/actions/logistica';
import { LogisticaInteractiveIsland } from '@/components/logistica/LogisticaInteractiveIsland';
import { LogisticaSkeleton } from '@/components/logistica/LogisticaSkeleton';

export const metadata = {
  title: 'Logística, Rutas & Flota WMS | Alquileres System',
  description:
    'Planificación de rutas de transporte, matriz de fletes para el Área Metropolitana de Bucaramanga y georreferenciación de despachos.',
};

/**
 * React Server Component (RSC): Módulo de Logística & Rutas de Despacho (Alquileres System)
 * 
 * Ejecuta prefetching concurrente en el servidor para evitar cascadas de red en el cliente
 * y transmite el HTML con streaming progresivo mediante <Suspense fallback={<LogisticaSkeleton />}>.
 */
export default async function LogisticaPage() {
  const [resRutas, resZonas] = await Promise.all([
    obtenerRutasDespachoAction(),
    obtenerZonasFleteAction(),
  ]);

  const initialRutas = resRutas.success && resRutas.data ? resRutas.data : [];
  const initialZonas = resZonas.success && resZonas.data ? resZonas.data : [];

  return (
    <Suspense fallback={<LogisticaSkeleton />}>
      <LogisticaInteractiveIsland
        initialRutas={initialRutas}
        initialZonas={initialZonas}
      />
    </Suspense>
  );
}
