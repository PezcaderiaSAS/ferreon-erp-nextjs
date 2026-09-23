import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { obtenerAlquileresAction } from '../actions/alquileres';
import { obtenerCotizacionesAction } from '../actions/cotizaciones';
import { AlquileresInteractiveIsland } from '../../components/alquileres/AlquileresInteractiveIsland';
import { AlquileresSkeleton } from '../../components/alquileres/AlquileresSkeleton';
import { alquilerEntityToAlquilerUI } from '../../lib/mappers';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alquileres System — Plataforma Integral de Gestión de Alquileres y Maquinaria',
  description: 'Gestión centralizada de contratos de alquiler en obra, cotizaciones comerciales y control WMS de inventario con Alquileres System.',
};

/**
 * React Server Component (RSC) Canónico para Alquileres System
 * -------------------------------------------------------------
 * Ejecuta la consulta de datos en paralelo en el servidor (SSR / Server Component),
 * transmitiendo la carga inicial de contratos y cotizaciones como props a la
 * isla de interactividad del cliente (AlquileresInteractiveIsland) bajo <Suspense>.
 */
export default async function AlquileresPage() {
  const [alquileresRes, cotizacionesRes] = await Promise.allSettled([
    obtenerAlquileresAction(),
    obtenerCotizacionesAction(),
  ]);

  const initialAlquileres =
    alquileresRes.status === 'fulfilled' &&
    alquileresRes.value?.success &&
    Array.isArray(alquileresRes.value.data)
      ? alquileresRes.value.data.map(alquilerEntityToAlquilerUI)
      : [];

  const initialCotizaciones =
    cotizacionesRes.status === 'fulfilled' &&
    cotizacionesRes.value?.success &&
    Array.isArray(cotizacionesRes.value.data)
      ? cotizacionesRes.value.data
      : [];

  return (
    <Suspense fallback={<AlquileresSkeleton />}>
      <AlquileresInteractiveIsland
        initialAlquileres={initialAlquileres}
        initialCotizaciones={initialCotizaciones}
      />
    </Suspense>
  );
}
