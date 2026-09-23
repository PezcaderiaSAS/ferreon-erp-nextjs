import React from 'react';

/**
 * Skeleton Loader para el Módulo de Compras, Bodega & Cartera CXP (Alquileres System)
 * Evita saltos acumulativos de layout (CLS) durante el streaming de Server Components.
 */
export function ComprasSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
            <div className="h-8 w-72 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-4 w-96 bg-slate-100 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-2">
        <div className="h-8 w-28 bg-slate-200 rounded-md" />
        <div className="h-8 w-36 bg-slate-100 rounded-md" />
        <div className="h-8 w-32 bg-slate-100 rounded-md" />
        <div className="h-8 w-28 bg-slate-100 rounded-md" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-32 bg-slate-200 rounded" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-80 bg-slate-100 rounded-xl" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 w-36 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-5 w-44 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-100 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
