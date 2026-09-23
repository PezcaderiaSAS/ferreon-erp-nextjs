import React from 'react';

/**
 * Skeleton de carga de alta fidelidad para el módulo de Subcontrataciones & Tercerización
 * Alquileres System - FerreOn ERP SaaS
 */
export function SubcontratacionesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Cargando módulo de subcontrataciones">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-amber-500/20 rounded-md" />
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-44 bg-amber-500/30 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Filter and Search Bar Skeleton */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full sm:w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="h-12 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded hidden md:block" />
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded hidden sm:block" />
              <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SubcontratacionesSkeleton;
