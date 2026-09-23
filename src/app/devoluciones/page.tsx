import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { obtenerAlquileresAction } from '@/app/actions/alquileres';
import { obtenerHistorialDevolucionesAction } from '@/app/actions/devoluciones';
import { obtenerSesionActivaAction } from '@/app/actions/caja';
import { DevolucionesSkeleton, DevolucionesInteractiveIsland } from '@/components/devoluciones';

export const metadata: Metadata = {
  title: 'Recepción y Devoluciones | Alquileres System',
  description: 'Inspección técnica de maquinaria, liquidación de depósitos y Split-Line en Alquileres System.',
};

/**
 * Componente asíncrono para streaming con Suspense y prefetching en servidor
 */
async function DevolucionesDataWrapper() {
  const [alquileresRes, historialRes, sesionCajaRes] = await Promise.all([
    obtenerAlquileresAction(),
    obtenerHistorialDevolucionesAction(),
    obtenerSesionActivaAction(),
  ]);

  const initialAlquileres = alquileresRes?.success && Array.isArray(alquileresRes.data)
    ? alquileresRes.data
    : [];

  const initialHistorial = historialRes?.success && Array.isArray(historialRes.data)
    ? historialRes.data
    : [];

  const initialSesionCaja = sesionCajaRes?.success && sesionCajaRes.sesion
    ? sesionCajaRes.sesion
    : null;

  return (
    <DevolucionesInteractiveIsland
      initialAlquileres={initialAlquileres}
      initialHistorial={initialHistorial}
      initialSesionCaja={initialSesionCaja}
    />
  );
}

/**
 * Página principal de Devoluciones e Inspección Técnica (React Server Component)
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 */
export default function DevolucionesPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<DevolucionesSkeleton />}>
        <DevolucionesDataWrapper />
      </Suspense>
    </main>
  );
}
