"use client";

import React, { useState } from 'react';
import { TrendingUp, LayoutDashboard, FileText, Wrench, Shield, AlertTriangle, Hammer, Package } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function HeroMockup() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const { mockup } = LANDING_CONFIG.hero;

  const chartData = {
    '7d': [
      { label: 'CAT 416', value: 85, contracts: 14 },
      { label: 'Planta 10k', value: 70, contracts: 10 },
      { label: 'Andamio x4', value: 95, contracts: 26 },
      { label: 'Rana 5.5', value: 60, contracts: 8 },
      { label: 'Taladro', value: 45, contracts: 12 },
      { label: 'Bomba 3"', value: 75, contracts: 15 },
      { label: 'Mezcladora', value: 90, contracts: 19 },
    ],
    '30d': [
      { label: 'Sem 1', value: 65, contracts: 45 },
      { label: 'Sem 2', value: 78, contracts: 62 },
      { label: 'Sem 3', value: 88, contracts: 78 },
      { label: 'Sem 4', value: 96, contracts: 92 },
    ],
    '90d': [
      { label: 'Mes 1', value: 60, contracts: 180 },
      { label: 'Mes 2', value: 82, contracts: 230 },
      { label: 'Mes 3', value: 95, contracts: 295 },
    ],
  };

  const currentBars = chartData[activeRange];

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 lg:mt-16 group">
      {/* Glow Effect behind the Mockup */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-cyan-500/25 rounded-2xl blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-500 -z-10" />

      {/* Main Window Container en Modo Claro Nítido */}
      <div className="relative rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-black/50 overflow-hidden text-slate-900">
        {/* Window Chrome / Titlebar */}
        <div className="h-10 px-4 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:inline-block">
              alquileres-system.app/dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Flota Sincronizada en Vivo
            </span>
          </div>
        </div>

        {/* Dashboard Layout inside Laptop */}
        <div className="grid grid-cols-12 min-h-[360px] sm:min-h-[420px]">
          {/* Mini Sidebar */}
          <div className="hidden sm:flex col-span-3 lg:col-span-2 bg-slate-50 border-r border-slate-200 p-3 flex-col justify-between">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos ERP
              </div>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200/80 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Alquileres
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Bodega
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                Devoluciones
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Caja & COP
              </button>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-500 shadow-sm">
              <span className="font-semibold text-slate-700 block">PostgreSQL + RLS</span>
              Gobernanza Multi-Tenant
            </div>
          </div>

          {/* Main Dashboard Canvas */}
          <div className="col-span-12 sm:col-span-9 lg:col-span-10 p-5 sm:p-6 flex flex-col justify-between bg-white">
            {/* Header of the inner view */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  {mockup.title}
                  <span className="text-xs px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-200/80 font-medium">
                    Tiempo Real
                  </span>
                </h2>
                <p className="text-xs text-slate-500">Rotación de maquinaria pesada y contratos activos de obra</p>
              </div>

              {/* Range Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setActiveRange(range)}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                      activeRange === range
                        ? 'bg-[#FF8A65] text-white font-semibold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Bar Chart Area */}
            <div className="my-5">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Utilización por Tipo de Equipo / Período (%)</span>
                {hoveredBarIndex !== null && (
                  <span className="text-orange-600 font-mono font-bold animate-fadeIn">
                    {currentBars[hoveredBarIndex].label}: {currentBars[hoveredBarIndex].value}% ({currentBars[hoveredBarIndex].contracts} contratos)
                  </span>
                )}
              </div>

              {/* Bars container */}
              <div className="h-40 sm:h-44 flex items-end gap-2.5 sm:gap-5 pt-6 pb-2 px-3 bg-slate-50/80 rounded-xl border border-slate-200">
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
                          className={`w-full max-w-[44px] rounded-t-lg transition-all duration-300 transform-gpu ${
                            isHovered
                              ? 'bg-gradient-to-t from-[#FF8A65] to-[#0EA5E9] shadow-md shadow-orange-500/25 scale-y-105'
                              : 'bg-gradient-to-t from-[#FF8A65] to-[#F4683E] hover:from-[#F4683E] hover:to-[#0EA5E9]'
                          }`}
                        />
                      </div>
                      <span className="mt-2 text-[10px] sm:text-[11px] font-medium text-slate-500 group-hover/bar:text-slate-900 transition-colors truncate max-w-full">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real ERP KPIs Row (Sincronizado con Dashboard del sistema) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              {/* KPI 1: Equipos Alquilados */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-slate-500 block">Equipos Alquilados</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">124</span>
                  <span className="text-[10px] text-emerald-600 block font-medium">+5% desde ayer</span>
                </div>
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Hammer className="w-4 h-4" />
                </div>
              </div>

              {/* KPI 2: Contratos Activos */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-slate-500 block">Contratos Activos</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">45</span>
                  <span className="text-[10px] text-slate-500 block font-medium">Estable</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>

              {/* KPI 3: Devoluciones Pendientes (Alerta Real) */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-medium text-red-700 block">Devoluciones Pendientes</span>
                  <span className="text-lg font-bold text-red-600 font-mono">12</span>
                  <span className="text-[10px] text-red-600/90 block font-medium">Requiere atención hoy</span>
                </div>
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stat Badge: Rotación de Maquinaria */}
        <div className="absolute top-14 right-4 sm:top-16 sm:right-8 bg-white/95 backdrop-blur-md border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xl shadow-slate-900/10 flex items-center gap-3 transform-gpu hover:scale-105 transition-transform duration-200">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono leading-none">
              {mockup.growthMetric}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {mockup.growthLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
