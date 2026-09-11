'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirección de compatibilidad institucional:
 * Unifica el flujo comercial en el Hub Centralizado de Alquileres & Cotizaciones (/alquileres?tab=cotizaciones).
 */
export default function CotizacionesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/alquileres?tab=cotizaciones');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <div className="w-8 h-8 border-4 border-brand-salmon border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium">Redirigiendo al Hub Unificado de Alquileres & Cotizaciones...</p>
    </div>
  );
}
