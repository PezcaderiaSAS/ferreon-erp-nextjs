import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { obtenerAlquileresAction } from '@/app/actions/alquileres';
import { FacturacionSkeleton, FacturacionInteractiveIsland } from '@/components/facturacion';

export const metadata: Metadata = {
  title: 'Facturación & Cartera CXC | Alquileres System',
  description: 'Gestión de ingresos, facturas comerciales emitidas y estado de recaudos en Alquileres System.',
};

/**
 * Componente asíncrono para prefetch en servidor y streaming con Suspense
 */
async function FacturacionDataWrapper() {
  const resAlq = await obtenerAlquileresAction();
  const initialAlquileres = resAlq.success && Array.isArray(resAlq.data) ? resAlq.data : [];

  return <FacturacionInteractiveIsland initialAlquileres={initialAlquileres} />;
}

/**
 * Página principal de Facturación & Cartera CXC (React Server Component)
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 */
export default function FacturacionPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<FacturacionSkeleton />}>
        <FacturacionDataWrapper />
      </Suspense>
    </div>
  );
}
