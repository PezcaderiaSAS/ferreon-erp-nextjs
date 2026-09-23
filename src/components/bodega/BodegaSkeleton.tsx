import React from 'react';

/**
 * Skeleton Loader para el Módulo de Bodega, Inventario & Kardex
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Evita saltos acumulativos de layout (CLS) durante el streaming de Server Components.
 */
export function BodegaSkeleton() {
  return (
    <div className="flex flex-col gap-8 h-full animate-pulse pb-12">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* KPI Summary Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Search Bar & Filters Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-card border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="h-9 w-full sm:w-80 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-6 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-6 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
