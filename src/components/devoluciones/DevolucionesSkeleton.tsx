import React from 'react';

/**
 * Skeleton Loader para el Módulo de Devoluciones & Modales On-The-Fly
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Evita saltos acumulativos de layout (CLS) durante el streaming de Server Components.
 */
export function DevolucionesSkeleton() {
  return (
    <div className="flex flex-col gap-6 h-full animate-pulse pb-12">
      {/* Cabecera Principal Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 bg-amber-100 dark:bg-amber-950/60 rounded-full" />
            <div className="h-5 w-24 bg-emerald-100 dark:bg-emerald-950/60 rounded-md" />
          </div>
          <div className="h-8 w-80 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Selector de Pestañas Skeleton */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-8 w-56 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      </div>

      {/* Buscador Skeleton */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="h-8 w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>

      {/* Tabla Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="space-y-1 w-44">
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
              <div className="h-5 w-24 bg-emerald-100 dark:bg-emerald-950/60 rounded-md" />
              <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
