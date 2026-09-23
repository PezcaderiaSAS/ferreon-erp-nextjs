import React, { Suspense } from 'react';
import { obtenerComprasAction } from '@/app/actions/compras';
import { obtenerProveedoresAction } from '@/app/actions/proveedores';
import { obtenerCuentasPorPagarAction } from '@/app/actions/cuentas-por-pagar';
import { ComprasInteractiveIsland } from '@/components/compras/ComprasInteractiveIsland';
import { ComprasSkeleton } from '@/components/compras/ComprasSkeleton';

export const metadata = {
  title: 'Compras, Bodega & Cartera CXP | Alquileres System',
  description: 'Gestión integral de compras, recepción física en bodega, recálculo de Costo Promedio Ponderado (PMP) y Cuentas por Pagar a Proveedores.',
};

/**
 * React Server Component (RSC): Módulo de Compras & Proveedores (Alquileres System)
 * 
 * Ejecuta prefetching concurrente en el servidor para eliminar la cascada de red en cliente
 * y transmite el HTML con streaming progresivo mediante <Suspense>.
 */
export default async function ComprasPage() {
  const [resCompras, resProveedores, resCXP] = await Promise.all([
    obtenerComprasAction(100),
    obtenerProveedoresAction(),
    obtenerCuentasPorPagarAction(),
  ]);

  const initialCompras = resCompras.success && resCompras.data ? resCompras.data : [];
  const initialProveedores = resProveedores.success && resProveedores.data ? resProveedores.data : [];
  const initialCuentasPagar = resCXP.success && resCXP.data ? resCXP.data : [];

  return (
    <Suspense fallback={<ComprasSkeleton />}>
      <ComprasInteractiveIsland
        initialCompras={initialCompras}
        initialProveedores={initialProveedores}
        initialCuentasPagar={initialCuentasPagar}
      />
    </Suspense>
  );
}
