import React, { Suspense } from 'react';
import { obtenerSesionActivaAction, listarHistorialSesionesCajaAction } from '@/app/actions/caja';
import { CajaInteractiveIsland } from '@/components/caja/CajaInteractiveIsland';
import { CajaSkeleton } from '@/components/caja/CajaSkeleton';

export const metadata = {
  title: 'Caja y Punto de Venta (POS) | Alquileres System',
  description: 'Control de caja en vivo, arqueo ciego, gastos menores y actas oficiales de turno.',
};

/**
 * React Server Component (RSC): Módulo de Caja & Arqueos (Alquileres System)
 * 
 * Ejecuta prefetching concurrente en el servidor para eliminar la cascada de red
 * y transmite el HTML con streaming progresivo vía Suspense.
 */
export default async function CajaPage() {
  const [resSesion, resHistorial] = await Promise.all([
    obtenerSesionActivaAction(),
    listarHistorialSesionesCajaAction({ limite: 30 }),
  ]);

  const initialSesion = resSesion.success ? resSesion.sesion : null;
  const initialResumen = resSesion.success ? resSesion.resumen : null;
  const initialMovimientos = resSesion.success ? resSesion.movimientos : [];
  const initialPagosEfectivo = resSesion.success ? resSesion.pagosEfectivo : [];
  const initialHistorial = resHistorial.success ? (resHistorial.sesiones || resHistorial.historial || []) : [];

  return (
    <Suspense fallback={<CajaSkeleton />}>
      <CajaInteractiveIsland
        initialSesion={initialSesion}
        initialResumen={initialResumen}
        initialMovimientos={initialMovimientos}
        initialPagosEfectivo={initialPagosEfectivo}
        initialHistorial={initialHistorial}
      />
    </Suspense>
  );
}
