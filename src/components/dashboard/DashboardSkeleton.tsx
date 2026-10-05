'use client';

import React from 'react';

/**
 * DashboardSkeleton - Esqueleto Shimmer con Zero Cumulative Layout Shift (CLS = 0)
 * Replica fielmente el layout 65/35 y los 4 KPIs del Dashboard de Alquileres System
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse w-full">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-slate-200 rounded-md" />
        <div className="h-4 w-80 bg-slate-100 rounded-md" />
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-32"
          >
            <div className="flex justify-between items-start">
              <div className="h-3 w-28 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded" />
            <div className="h-3 w-36 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main 2-Column Grid (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar (65% = 8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 min-h-[580px]">
          {/* Calendar Header Controls Skeleton */}
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div className="h-6 w-44 bg-slate-200 rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-slate-200 rounded-lg" />
              <div className="h-8 w-32 bg-slate-200 rounded-lg" />
            </div>
          </div>

          {/* Filter Pills Skeleton */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((f) => (
              <div key={f} className="h-7 w-24 bg-slate-100 rounded-full" />
            ))}
          </div>

          {/* Calendar Grid 7x5 Skeleton */}
          <div className="grid grid-cols-7 gap-2 flex-1 pt-2">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div
                key={idx}
                className="h-20 bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col gap-1"
              >
                <div className="h-3 w-4 bg-slate-200 rounded self-end" />
                {idx % 3 === 0 && <div className="h-2 w-full bg-slate-200 rounded" />}
                {idx % 5 === 0 && <div className="h-2 w-3/4 bg-slate-150 rounded" />}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Tasks & Alerts (35% = 4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Tasks Card Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 min-h-[300px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="h-4 w-36 bg-slate-200 rounded" />
              <div className="h-4 w-8 bg-slate-100 rounded-full" />
            </div>
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3, 4].map((t) => (
                <div key={t} className="h-10 bg-slate-50 border border-slate-100 rounded-lg p-2 flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-slate-200" />
                  <div className="h-3 w-44 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Feed Skeleton */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 min-h-[250px]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-8 bg-slate-100 rounded-full" />
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((a) => (
                <div key={a} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-1.5">
                  <div className="h-3 w-32 bg-slate-200 rounded" />
                  <div className="h-2.5 w-full bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
