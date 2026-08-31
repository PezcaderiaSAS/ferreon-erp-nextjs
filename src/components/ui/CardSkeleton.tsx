import React from 'react';
import { Skeleton } from './Skeleton';

export function CardSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4 mb-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-10 w-[120px] ml-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-4 flex flex-col gap-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
