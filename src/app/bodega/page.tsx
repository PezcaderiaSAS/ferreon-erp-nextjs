import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { obtenerEquiposAction } from '@/app/actions/equipos';
import { BodegaSkeleton, BodegaInteractiveIsland } from '@/components/bodega';

export const metadata: Metadata = {
  title: 'Bodega e Inventario | Alquileres System',
  description: 'Control de existencias físicas, disponibilidad para alquiler y ajustes de stock en Alquileres System.',
};

/**
 * Componente asíncrono para streaming con Suspense
 */
async function BodegaDataWrapper() {
  const res = await obtenerEquiposAction();
  const initialEquipos = res.success && Array.isArray(res.data) ? res.data : [];

  return <BodegaInteractiveIsland initialEquipos={initialEquipos} />;
}

/**
 * Página principal de Bodega e Inventario (React Server Component)
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 */
export default function BodegaPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<BodegaSkeleton />}>
        <BodegaDataWrapper />
      </Suspense>
    </div>
  );
}
