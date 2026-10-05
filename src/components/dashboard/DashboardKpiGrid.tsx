'use client';

import React from 'react';
import {
  Hammer,
  FileText,
  AlertTriangle,
  Coins,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { type DashboardKPIs } from '@/core/types/dashboard';
import { formatearMonedaCOP } from '@/core/services/dashboard-transaccional.service';

interface DashboardKpiGridProps {
  kpis: DashboardKPIs;
}

/**
 * Micro-gráfico Sparkline SVG dinámico y ligero
 */
function MiniSparkline({
  points,
  color = '#ff6b4a',
  gradientId
}: {
  points: number[];
  color?: string;
  gradientId: string;
}) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const width = 110;
  const height = 32;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible opacity-85">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  const tieneDevolucionesUrgentes =
    kpis.devolucionesVencidas > 0 || kpis.devolucionesPendientesHoy > 0;
  const tieneCarteraMora = kpis.carteraMoraCOP > 0;

  // Sparklines de muestra basados en las métricas actuales para consistencia visual
  const sparklineInventario = [
    Math.max(1, kpis.equiposEnObra - 2),
    Math.max(1, kpis.equiposEnObra - 1),
    kpis.equiposEnObra,
    kpis.equiposEnObra + 1,
    kpis.equiposEnObra
  ];
  const sparklineContratos = [
    Math.max(1, kpis.contratosActivos - 1),
    kpis.contratosActivos,
    kpis.contratosActivos + 1,
    kpis.contratosActivos
  ];
  const sparklineRetornos = [
    kpis.devolucionesVencidas + 2,
    kpis.devolucionesVencidas + 1,
    kpis.devolucionesPendientesHoy,
    kpis.devolucionesPendientesHoy + kpis.devolucionesVencidas
  ];
  const sparklineCartera = [
    kpis.carteraPendienteTotalCOP * 0.85,
    kpis.carteraPendienteTotalCOP * 0.92,
    kpis.carteraPendienteTotalCOP * 0.96,
    kpis.carteraPendienteTotalCOP
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Equipos en Obra / Utilización de Inventario */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              INVENTARIO · 01
            </span>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Utilización de Inventario
            </h3>
          </div>
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-brand-salmon dark:text-orange-400 border border-orange-100 dark:border-orange-900/30">
            <Hammer className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {kpis.equiposEnObra}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                / {kpis.equiposTotal} activos
              </span>
            </div>

            {/* Barra de progreso con esquinas redondeadas armónicas */}
            <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-brand-salmon h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis.utilizacionFlotaPct)}%` }}
              />
            </div>
          </div>

          <div className="hidden sm:block">
            <MiniSparkline
              points={sparklineInventario}
              color="#ff6b4a"
              gradientId="spark-inventario"
            />
          </div>
        </div>

        <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-mono tabular-nums">{kpis.utilizacionFlotaPct}%</span> en obra
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] tabular-nums">
            {kpis.equiposTotal - kpis.equiposEnObra} libres
          </span>
        </div>
      </div>

      {/* 2. Contratos Activos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/90 dark:border-slate-800 p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              ALQUILERES · 02
            </span>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Contratos Activos
            </h3>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3 flex items-end justify-between gap-2">
          <div>
            <span className="text-3xl font-extrabold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {kpis.contratosActivos}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              En ejecución en clientes
            </p>
          </div>

          <div className="hidden sm:block">
            <MiniSparkline
              points={sparklineContratos}
              color="#6366f1"
              gradientId="spark-contratos"
            />
          </div>
        </div>

        <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            Flujo comercial
          </span>
          {kpis.cotizacionesPendientes > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40">
              <span className="font-mono tabular-nums">{kpis.cotizacionesPendientes}</span> cotizaciones
            </span>
          )}
        </div>
      </div>

      {/* 3. Retornos / Devoluciones Críticas */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-card border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
          tieneDevolucionesUrgentes
            ? 'border-red-200 dark:border-red-900/60 ring-1 ring-red-100 dark:ring-red-950/40'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              RETORNOS · 03
            </span>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Devoluciones Críticas
            </h3>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              tieneDevolucionesUrgentes
                ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3 flex items-end justify-between gap-2">
          <div>
            <span
              className={`text-3xl font-extrabold font-mono tabular-nums tracking-tight ${
                kpis.devolucionesVencidas > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {kpis.devolucionesPendientesHoy + kpis.devolucionesVencidas}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Retornos pendientes
            </p>
          </div>

          <div className="hidden sm:block">
            <MiniSparkline
              points={sparklineRetornos}
              color={kpis.devolucionesVencidas > 0 ? '#ef4444' : '#10b981'}
              gradientId="spark-retornos"
            />
          </div>
        </div>

        <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {kpis.devolucionesVencidas > 0 ? (
            <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="font-mono tabular-nums">{kpis.devolucionesVencidas}</span> vencidas
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Retornos al día
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] tabular-nums">
            {kpis.devolucionesPendientesHoy} para hoy
          </span>
        </div>
      </div>

      {/* 4. Cartera Pendiente en COP */}
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-card border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
          tieneCarteraMora
            ? 'border-amber-200 dark:border-amber-900/60 ring-1 ring-amber-100 dark:ring-amber-950/40'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              FINANZAS · 04
            </span>
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
              Cartera por Cobrar
            </h3>
          </div>
          <div
            className={`p-2 rounded-xl border ${
              tieneCarteraMora
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
            }`}
          >
            <Coins className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span
              title={formatearMonedaCOP(kpis.carteraPendienteTotalCOP)}
              className={`${
                formatearMonedaCOP(kpis.carteraPendienteTotalCOP).length > 11
                  ? 'text-lg sm:text-xl font-extrabold'
                  : 'text-xl lg:text-2xl font-extrabold'
              } font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100 block whitespace-nowrap`}
            >
              {formatearMonedaCOP(kpis.carteraPendienteTotalCOP)}
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              Saldo pendiente total
            </p>
          </div>

          <div className="hidden xl:block shrink-0">
            <MiniSparkline
              points={sparklineCartera}
              color={tieneCarteraMora ? '#f59e0b' : '#10b981'}
              gradientId="spark-cartera"
            />
          </div>
        </div>

        <div className="text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          {tieneCarteraMora ? (
            <span className="font-semibold text-amber-700 dark:text-amber-400 font-mono text-[11px] tabular-nums flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Mora: {formatearMonedaCOP(kpis.carteraMoraCOP)}
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Cartera corriente al 100%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
