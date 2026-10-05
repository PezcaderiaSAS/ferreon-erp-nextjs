import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { obtenerCotizacionesAction } from '@/app/actions/cotizaciones';
import { obtenerClientesAction } from '@/app/actions/clientes';
import { obtenerEquiposAction } from '@/app/actions/equipos';
import { CotizacionesInteractiveIsland } from '@/components/cotizaciones/CotizacionesInteractiveIsland';
import { CotizacionesSkeleton } from '@/components/cotizaciones/CotizacionesSkeleton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Alquileres System — Cotizaciones Rápidas y Pipeline Comercial',
  description: 'Gestión y emisión de cotizaciones express de maquinaria en 30 segundos, seguimiento comercial y conversión poka-yoke a contratos.',
};

/**
 * React Server Component (RSC) Canónico para Alquileres System
 * -------------------------------------------------------------
 * Consulta cotizaciones, catálogo de clientes y equipos de bodega en paralelo en el servidor,
 * transmitiendo la carga inicial a la isla de interactividad bajo streaming Suspense.
 */
export default async function CotizacionesPage() {
  const [cotizacionesRes, clientesRes, equiposRes] = await Promise.allSettled([
    obtenerCotizacionesAction(),
    obtenerClientesAction(),
    obtenerEquiposAction(),
  ]);

  const initialCotizaciones =
    cotizacionesRes.status === 'fulfilled' &&
    cotizacionesRes.value?.success &&
    Array.isArray(cotizacionesRes.value.data)
      ? cotizacionesRes.value.data
      : [];

  const initialClientes =
    clientesRes.status === 'fulfilled' &&
    clientesRes.value?.success &&
    Array.isArray(clientesRes.value.data)
      ? clientesRes.value.data
      : [];

  const initialEquipos =
    equiposRes.status === 'fulfilled' &&
    equiposRes.value?.success &&
    Array.isArray(equiposRes.value.data)
      ? equiposRes.value.data
      : [];

  return (
    <Suspense fallback={<CotizacionesSkeleton />}>
      <CotizacionesInteractiveIsland
        initialCotizaciones={initialCotizaciones}
        initialClientes={initialClientes}
        initialEquipos={initialEquipos}
      />
    </Suspense>
  );
}
