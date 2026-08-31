import React from 'react';
import { Skeleton } from './Skeleton';

export function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4 mb-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px] ml-auto" />
      </div>
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/50 p-4 flex gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex gap-4 items-center border-b border-slate-100 last:border-0">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-8 w-8 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
