import React from 'react';

/**
 * Skeleton Loader para el Módulo de Caja & Arqueos (Alquileres System)
 * Evita saltos acumulativos de layout (CLS) durante el streaming de Server Components.
 */
export function CajaSkeleton() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-9 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Table / Details Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
