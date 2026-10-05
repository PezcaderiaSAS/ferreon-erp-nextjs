'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Layers,
} from 'lucide-react';

export function PremiumDashboardPreview() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');

  const metrics = [
    {
      label: 'Revenue (COP)',
      value: '$48,250,000',
      change: '+12.5%',
      isPositive: true,
      icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'Active Rentals',
      value: '2,340',
      change: '+8.2%',
      isPositive: true,
      icon: <Users className="w-4 h-4 text-blue-400" />,
    },
    {
      label: 'Fleet Utilization',
      value: '84.8%',
      change: '+4.1%',
      isPositive: true,
      icon: <Activity className="w-4 h-4 text-indigo-400" />,
    },
    {
      label: 'Churn Rate',
      value: '1.2%',
      change: '-0.4%',
      isPositive: true,
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
    },
  ];

  return (
    <div className="w-full bg-[#0f172a] text-[#f8fafc] p-6 sm:p-7 rounded-[22px] shadow-2xl border border-slate-800 flex flex-col gap-6">
      {/* 1. Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
            AS
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Analytics <span className="text-indigo-400">Hub</span>
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search metrics..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            Upgrade
          </button>
        </div>
      </header>

      {/* 2. Greeting Section */}
      <section className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Welcome back, Jordan 👋
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational and financial performance summary for Alquileres System.
          </p>
        </div>
      </section>

      {/* 3. Metric Cards Grid (Flat Accent Colors) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-[#1e293b] border border-[#334155] rounded-[14px] p-4.5 hover:border-indigo-500 transition-all flex flex-col justify-between h-32"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">
                {m.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-800">{m.icon}</div>
            </div>

            <div className="my-1">
              <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">
                {m.value}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {m.change}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                vs previous period
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* 4. Interactive Chart Area with Time Toggles */}
      <section className="bg-[#1e293b] border border-[#334155] rounded-[16px] p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Daily Revenue Flow
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ingresos diarios de contratos y liquidaciones de maquinaria
            </p>
          </div>

          {/* Time Toggles */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setActiveRange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  activeRange === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="h-44 w-full pt-2 flex items-end">
          <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Area Fill */}
            <path
              d="M0,90 Q70,40 140,65 T280,30 T420,50 L500,20 L500,120 L0,120 Z"
              fill="url(#chartGradient)"
            />
            {/* Smooth Stroke Line */}
            <path
              d="M0,90 Q70,40 140,65 T280,30 T420,50 L500,20"
              fill="none"
              stroke="#6366f1"
              strokeWidth="3"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
