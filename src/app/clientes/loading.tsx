import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { TableSkeleton } from '../../components/ui/TableSkeleton';

export default function LoadingClientes() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-card border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>

      {/* Table Section */}
      <TableSkeleton />
    </div>
  );
}
