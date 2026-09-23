import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { obtenerSubcontratacionesAction } from '@/app/actions/subcontrataciones';
import {
  SubcontratacionesSkeleton,
  SubcontratacionesInteractiveIsland,
} from '@/components/subcontrataciones';

export const metadata: Metadata = {
  title: 'Subcontrataciones & Tercerización | Alquileres System',
  description:
    'Gestión de maquinaria rentada a aliados comerciales, control de márgenes en tiempo real y ciclo de retorno en Alquileres System.',
};

/**
 * Wrapper asíncrono: pre-fetch en servidor + streaming declarativo.
 * Se ejecuta en el servidor — no incluye lógica de UI.
 */
async function SubcontratacionesDataWrapper() {
  const res = await obtenerSubcontratacionesAction();
  const initialSubcontrataciones =
    res.success && Array.isArray(res.data) ? res.data : [];

  return (
    <SubcontratacionesInteractiveIsland
      initialSubcontrataciones={initialSubcontrataciones}
    />
  );
}

/**
 * Página principal de Subcontrataciones & Tercerización (React Server Component)
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * Spec:     SPEC-2026-ARCH-RESTRUCT-007
 */
export default function SubcontratacionesPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <Suspense fallback={<SubcontratacionesSkeleton />}>
        <SubcontratacionesDataWrapper />
      </Suspense>
    </main>
  );
}
