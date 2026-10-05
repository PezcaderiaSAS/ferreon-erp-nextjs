import React from 'react';

/**
 * CotizacionesSkeleton — Shimmer Placeholder para streaming con cero CLS
 * Diseñado bajo la jerarquía de radios anidados de Alquileres System.
 */
export function CotizacionesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* 2. KPIs Skeleton (4 tarjetas con radios anidados) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 bg-slate-100 dark:bg-slate-800/80 rounded" />
              <div className="h-7 w-7 bg-slate-100 dark:bg-slate-800/80 rounded-xl" />
            </div>
            <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* 3. Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="h-9 w-full sm:w-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>

      {/* 4. Table / Cards Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60"
          />
        ))}
      </div>
    </div>
  );
}
