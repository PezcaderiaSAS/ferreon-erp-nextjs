import React from 'react';

/**
 * Skeleton Loader para el Módulo de Facturación & Cartera CXC
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Evita saltos acumulativos de layout (CLS = 0) durante el streaming de Server Components.
 */
export function FacturacionSkeleton() {
  return (
    <div className="flex flex-col gap-8 h-full animate-pulse pb-12">
      {/* Page Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/80 dark:bg-slate-900 rounded-xl p-6 shadow-md border border-slate-200/60 dark:border-slate-800 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-9 w-40 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Filters & Search Bar Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white/80 dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
        <div className="h-9 w-full sm:w-64 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Data Table Skeleton */}
      <div className="bg-white/80 dark:bg-slate-900 rounded-xl shadow-card border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-slate-800/50">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-7 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
