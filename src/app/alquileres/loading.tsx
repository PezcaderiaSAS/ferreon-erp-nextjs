import React from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { TableSkeleton } from '../../components/ui/TableSkeleton';

export default function LoadingAlquileres() {
  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-1" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Controls Section & Table skeleton */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col">
        {/* Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-2">
             <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-24" />
          </div>
          <div className="w-full sm:w-64">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        {/* Table Content */}
        <div className="p-4">
          <div className="flex items-center mb-4">
             <Skeleton className="h-5 w-32" />
             <Skeleton className="h-5 w-32 ml-auto" />
          </div>
          <div className="border border-slate-100 rounded-md overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex gap-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
             </div>
             {[...Array(6)].map((_, i) => (
               <div key={i} className="p-4 flex gap-4 border-b border-slate-100 last:border-0 items-center">
                 <Skeleton className="h-5 w-1/4" />
                 <Skeleton className="h-5 w-1/4" />
                 <Skeleton className="h-5 w-1/4" />
                 <Skeleton className="h-8 w-8 rounded-full ml-auto" />
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
