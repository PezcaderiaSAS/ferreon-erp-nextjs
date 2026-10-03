'use client';

import React from 'react';
import { Hammer, FileText, AlertTriangle, Coins, TrendingUp } from 'lucide-react';
import { type DashboardKPIs } from '@/core/types/dashboard';
import { formatearMonedaCOP } from '@/core/services/dashboard-transaccional.service';

interface DashboardKpiGridProps {
  kpis: DashboardKPIs;
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const tieneDevolucionesUrgentes = kpis.devolucionesVencidas > 0 || kpis.devolucionesPendientesHoy > 0;
  const tieneCarteraMora = kpis.carteraMoraCOP > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Equipos en Obra / Utilización */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Utilización de Flota
          </span>
          <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
            <Hammer className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {kpis.equiposEnObra}
            </span>
            <span className="text-sm font-medium text-slate-500">
              / {kpis.equiposTotal} equipos
            </span>
          </div>

          {/* Barra de progreso de utilización */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-brand-salmon h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.utilizacionFlotaPct)}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            {kpis.utilizacionFlotaPct}% en obra
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {kpis.equiposTotal - kpis.equiposEnObra} libres
          </span>
        </div>
      </div>

      {/* 2. Contratos Activos */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Contratos Activos
          </span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {kpis.contratosActivos}
          </span>
        </div>

        <div className="text-xs text-slate-600 flex items-center justify-between">
          <span className="text-slate-500">En ejecución activa</span>
          {kpis.cotizacionesPendientes > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
              {kpis.cotizacionesPendientes} cotizaciones
            </span>
          )}
        </div>
      </div>

      {/* 3. Devoluciones Críticas / Hoy */}
      <div
        className={`bg-white rounded-xl shadow-card border p-5 flex flex-col justify-between transition-all duration-200 ${
          tieneDevolucionesUrgentes
            ? 'border-red-200 ring-1 ring-red-100'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Retornos / Devoluciones
          </span>
          <div
            className={`p-2 rounded-lg ${
              tieneDevolucionesUrgentes
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <span
            className={`text-2xl font-bold font-mono tabular-nums ${
              kpis.devolucionesVencidas > 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {kpis.devolucionesPendientesHoy + kpis.devolucionesVencidas}
          </span>
        </div>

        <div className="text-xs flex items-center justify-between">
          {kpis.devolucionesVencidas > 0 ? (
            <span className="font-semibold text-red-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              {kpis.devolucionesVencidas} vencidas
            </span>
          ) : (
            <span className="text-emerald-700 font-medium">Al día</span>
          )}
          <span className="text-slate-500 font-mono text-[11px]">
            {kpis.devolucionesPendientesHoy} hoy
          </span>
        </div>
      </div>

      {/* 4. Cartera Pendiente en COP */}
      <div
        className={`bg-white rounded-xl shadow-card border p-5 flex flex-col justify-between transition-all duration-200 ${
          tieneCarteraMora
            ? 'border-amber-200 ring-1 ring-amber-100'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cartera por Cobrar
          </span>
          <div
            className={`p-2 rounded-lg ${
              tieneCarteraMora ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2">
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 tracking-tight block truncate">
            {formatearMonedaCOP(kpis.carteraPendienteTotalCOP)}
          </span>
        </div>

        <div className="text-xs flex items-center justify-between">
          {tieneCarteraMora ? (
            <span className="font-medium text-amber-700 font-mono text-[11px]">
              Mora: {formatearMonedaCOP(kpis.carteraMoraCOP)}
            </span>
          ) : (
            <span className="text-emerald-700 font-medium">Sin cartera en mora</span>
          )}
        </div>
      </div>
    </div>
  );
}
