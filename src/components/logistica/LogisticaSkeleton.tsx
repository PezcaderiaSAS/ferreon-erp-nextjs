import React from 'react';

/**
 * Skeleton Loader para el Módulo de Logística, Rutas y Matriz de Fletes Bucaramanga
 * Previene Cumulative Layout Shift (CLS) y garantiza streaming fluido en Next.js App Router.
 */
export function LogisticaSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-6 w-28 bg-slate-100 dark:bg-slate-800/80 rounded-full" />
          </div>
          <div className="h-4 w-96 max-w-full bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-40 bg-teal-600/30 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-44 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Rutas List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-3.5 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>

            {/* Paradas Skeleton Timeline */}
            <div className="space-y-2.5 pt-1">
              {[1, 2].map((p) => (
                <div key={p} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-1">
                      <div className="h-4 w-52 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-36 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
