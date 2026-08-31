import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { CardSkeleton } from '../../components/ui/CardSkeleton';

export default function LoadingBodega() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-card border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        ))}
      </div>

      {/* Grid de Equipos */}
      <CardSkeleton />
    </div>
  );
}
