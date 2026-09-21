"use client";

import React, { useState } from 'react';
import { TrendingUp, LayoutDashboard, FileText, Wrench, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function HeroMockup() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const { mockup } = LANDING_CONFIG.hero;

  const chartData = {
    '7d': [
      { label: 'Lun', value: 45, contracts: 12 },
      { label: 'Mar', value: 65, contracts: 18 },
      { label: 'Mie', value: 55, contracts: 14 },
      { label: 'Jue', value: 80, contracts: 22 },
      { label: 'Vie', value: 95, contracts: 28 },
      { label: 'Sab', value: 60, contracts: 16 },
      { label: 'Dom', value: 35, contracts: 9 },
    ],
    '30d': [
      { label: 'Sem 1', value: 52, contracts: 45 },
      { label: 'Sem 2', value: 68, contracts: 62 },
      { label: 'Sem 3', value: 84, contracts: 78 },
      { label: 'Sem 4', value: 96, contracts: 92 },
    ],
    '90d': [
      { label: 'Mes 1', value: 60, contracts: 180 },
      { label: 'Mes 2', value: 78, contracts: 230 },
      { label: 'Mes 3', value: 94, contracts: 295 },
    ],
  };

  const currentBars = chartData[activeRange];

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 lg:mt-16 group">
      {/* Glow Effect behind the Mockup */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-cyan-500/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-500 -z-10" />

      {/* Main Window Container */}
      <div className="relative rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-blue-950/40 overflow-hidden text-slate-100">
        {/* Window Chrome / Titlebar */}
        <div className="h-10 px-4 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline-block">
              alquileres-system.app/panel-operativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Flota Sincronizada
            </span>
          </div>
        </div>

        {/* Dashboard Layout inside Laptop */}
        <div className="grid grid-cols-12 min-h-[360px] sm:min-h-[420px]">
          {/* Mini Sidebar */}
          <div className="hidden sm:flex col-span-3 lg:col-span-2 bg-slate-950/40 border-r border-slate-800/80 p-3 flex-col justify-between">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Menú
              </div>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Resumen
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Contratos
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                Maquinaria
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Auditoría
              </button>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block">V8 Engine Activo</span>
              99.9% Disponibilidad
            </div>
          </div>

          {/* Main Dashboard Canvas */}
          <div className="col-span-12 sm:col-span-9 lg:col-span-10 p-5 sm:p-6 flex flex-col justify-between">
            {/* Header of the inner view */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {mockup.title}
                  <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-normal">
                    Tiempo Real
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Rendimiento y contratos de alquiler de maquinaria activa</p>
              </div>

              {/* Range Selector */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setActiveRange(range)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      activeRange === range
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Bar Chart Area */}
            <div className="my-6">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Tasa de Utilización de Maquinaria (%)</span>
                {hoveredBarIndex !== null && (
                  <span className="text-blue-400 font-mono font-medium animate-fadeIn">
                    {currentBars[hoveredBarIndex].label}: {currentBars[hoveredBarIndex].value}% ({currentBars[hoveredBarIndex].contracts} contratos)
                  </span>
                )}
              </div>

              {/* Bars container */}
              <div className="h-44 sm:h-48 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 bg-slate-950/50 rounded-xl border border-slate-800/60">
                {currentBars.map((bar, index) => {
                  const isHovered = hoveredBarIndex === index;
                  return (
                    <div
                      key={bar.label}
                      className="flex-1 flex flex-col items-center h-full justify-end group/bar cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {/* Interactive bar */}
                      <div className="w-full relative flex items-end justify-center">
                        <div
                          style={{ height: `${bar.value}%` }}
                          className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 transform-gpu ${
                            isHovered
                              ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/40 scale-y-105'
                              : 'bg-gradient-to-t from-blue-700 to-blue-500 hover:from-blue-600 hover:to-cyan-400'
                          }`}
                        />
                      </div>
                      <span className="mt-2 text-[11px] font-medium text-slate-400 group-hover/bar:text-white transition-colors">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Equipos en Obra</span>
                <span className="text-lg font-bold text-white font-mono">124 unid.</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Contratos Vigentes</span>
                <span className="text-lg font-bold text-white font-mono">45 activos</span>
              </div>
              <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Retorno de Inversión</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">+32.4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stat Badge 1: Productivity (+48%) */}
        <div className="absolute top-14 right-4 sm:top-16 sm:right-8 bg-slate-950/90 backdrop-blur-md border border-blue-500/40 p-3 sm:p-4 rounded-xl shadow-xl shadow-blue-950/50 flex items-center gap-3 transform-gpu hover:scale-105 transition-transform duration-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono leading-none">
              {mockup.growthMetric}
            </div>
            <div className="text-[11px] text-slate-300 font-medium mt-0.5">
              {mockup.growthLabel}
            </div>
          </div>
        </div>

        {/* Floating Stat Badge 2: Work Smarter Together */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 hidden md:flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{mockup.floatingTag}</span>
        </div>
      </div>
    </div>
  );
}
