import React from 'react';

export function AlquileresSkeleton() {
  return (
    <div className="flex flex-col gap-6 h-full animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded-full" />
          <div className="h-8 w-72 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-200 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          <div className="h-10 w-44 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-14 bg-slate-100 rounded-2xl border border-slate-200/80 p-1.5 flex gap-2">
        <div className="flex-1 bg-slate-200 rounded-xl" />
        <div className="flex-1 bg-slate-200/60 rounded-xl" />
        <div className="flex-1 bg-slate-200/60 rounded-xl" />
      </div>

      {/* Table Container Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-9 w-72 bg-slate-200 rounded-xl" />
        </div>
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100/80 rounded-xl flex items-center justify-between px-4">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
