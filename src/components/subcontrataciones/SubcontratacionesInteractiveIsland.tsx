'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Handshake, Plus, Search, Printer, CheckCircle2,
  Clock, TrendingUp, AlertCircle, AlertTriangle,
  UserPlus, Calculator, Eye, RotateCcw, ShieldCheck,
} from 'lucide-react';
import { useSubcontratacionStore, type SubcontratacionUI, type SubcontratacionEstado } from '@/infrastructure/state/subcontratacionStore';
import { useProveedorStore } from '@/infrastructure/state/proveedorStore';
import { obtenerSubcontratacionesAction, cambiarEstadoSubcontratacionAction } from '@/app/actions/subcontrataciones';
import { obtenerProveedoresAction } from '@/app/actions/proveedores';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { formatearMonedaCOP } from '@/core/utils/numero-a-letras';
import {
  enriquecerSubcontrataciones,
  calcularKPIsSubcontrataciones,
  filtrarSubcontrataciones,
  type SubcontratacionEnriquecida,
} from '@/core/services/subcontrataciones-transaccional.service';

// ---------------------------------------------------------------------------
// Carga perezosa de modales pesados (reducción First Load JS)
// ---------------------------------------------------------------------------

const CrearSubcontratacionModal = dynamic(
  () => import('@/components/subcontrataciones/CrearSubcontratacionModal').then((m) => m.CrearSubcontratacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando formulario de orden..." /> },
);

const OrdenSubcontratacionPDFModal = dynamic(
  () => import('@/components/subcontrataciones/OrdenSubcontratacionPDFModal').then((m) => m.OrdenSubcontratacionPDFModal),
  { ssr: false, loading: () => <ModalSkeleton message="Preparando orden PDF..." /> },
);

const DetalleSubcontratacionModal = dynamic(
  () => import('@/components/subcontrataciones/DetalleSubcontratacionModal').then((m) => m.DetalleSubcontratacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando detalle..." /> },
);

const DevolucionSubcontratacionModal = dynamic(
  () => import('@/components/subcontrataciones/DevolucionSubcontratacionModal').then((m) => m.DevolucionSubcontratacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando registro de retorno..." /> },
);

const LiquidarSubcontratacionModal = dynamic(
  () => import('@/components/subcontrataciones/LiquidarSubcontratacionModal').then((m) => m.LiquidarSubcontratacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando liquidación contable..." /> },
);

const CrearProveedorModal = dynamic(
  () => import('@/components/subcontrataciones/CrearProveedorModal').then((m) => m.CrearProveedorModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando formulario de aliado..." /> },
);

// ---------------------------------------------------------------------------
// Mapa de dot indicator para badges sutiles (Linear Color Budget)
// ---------------------------------------------------------------------------

const ESTADO_DOT_COLOR: Record<SubcontratacionEnriquecida['estadoVariant'], string> = {
  blue:    'bg-blue-500',
  amber:   'bg-amber-500',
  purple:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
  rose:    'bg-rose-500',
  slate:   'bg-zinc-400',
};

// ---------------------------------------------------------------------------
// Interfaz de props
// ---------------------------------------------------------------------------

export interface SubcontratacionesIslandProps {
  /** Snapshot inicial de subcontrataciones pre-fetched en el servidor */
  initialSubcontrataciones?: SubcontratacionUI[];
}

// ---------------------------------------------------------------------------
// Client Island
// ---------------------------------------------------------------------------

/**
 * Client Island Interactiva para el Módulo de Subcontrataciones & Tercerización
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * Spec:     SPEC-2026-ARCH-RESTRUCT-007
 */
export function SubcontratacionesInteractiveIsland({
  initialSubcontrataciones = [],
}: SubcontratacionesIslandProps) {
  const { subcontrataciones, setSubcontrataciones, actualizarEstado } = useSubcontratacionStore();
  const { setProveedores } = useProveedorStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Estado de modales
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showCrearProveedorModal, setShowCrearProveedorModal] = useState(false);
  const [subParaDetalle, setSubParaDetalle] = useState<SubcontratacionUI | null>(null);
  const [subParaPDF, setSubParaPDF] = useState<SubcontratacionUI | null>(null);
  const [subParaDevolucion, setSubParaDevolucion] = useState<SubcontratacionUI | null>(null);
  const [subParaLiquidar, setSubParaLiquidar] = useState<SubcontratacionUI | null>(null);

  // Hidratación desde snapshot del servidor (sin doble fetch innecesario)
  useEffect(() => {
    if (initialSubcontrataciones.length > 0 && subcontrataciones.length === 0) {
      setSubcontrataciones(initialSubcontrataciones);
    }
  }, [initialSubcontrataciones, subcontrataciones.length, setSubcontrataciones]);

  const fetchDatos = useCallback(async () => {
    const [resSubs, resProvs] = await Promise.all([
      obtenerSubcontratacionesAction(),
      obtenerProveedoresAction(),
    ]);
    if (resSubs.success && Array.isArray(resSubs.data)) {
      setSubcontrataciones(resSubs.data);
    }
    if (resProvs.success && Array.isArray(resProvs.data)) {
      setProveedores(resProvs.data);
    }
  }, [setSubcontrataciones, setProveedores]);

  // Sólo re-fetch si el store está vacío tras hidratación inicial
  useEffect(() => {
    if (subcontrataciones.length === 0) {
      fetchDatos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Métricas derivadas (dominio puro)
  // ---------------------------------------------------------------------------

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const kpis = useMemo(() => calcularKPIsSubcontrataciones(subcontrataciones), [subcontrataciones]);
  const filtradas = useMemo(
    () => filtrarSubcontrataciones(subcontrataciones, filtroEstado, searchTerm),
    [subcontrataciones, filtroEstado, searchTerm],
  );
  const filtradasEnriquecidas = useMemo(
    () => enriquecerSubcontrataciones(filtradas, todayStr),
    [filtradas, todayStr],
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleCambiarEstado = useCallback(async (
    sub: SubcontratacionUI,
    nuevoEstado: SubcontratacionEstado,
  ) => {
    if (!window.confirm(`¿Confirmas cambiar el estado de la orden ${sub.consecutivo} a "${nuevoEstado}"?`)) return;

    // Actualización optimista
    actualizarEstado(sub.id, nuevoEstado);

    const res = await cambiarEstadoSubcontratacionAction({ subcontratacionId: sub.id, nuevoEstado });
    if (!res.success) {
      alert(`Error al actualizar estado: ${res.error}`);
      await fetchDatos();
    }
  }, [actualizarEstado, fetchDatos]);

  // ---------------------------------------------------------------------------
  // Pestañas de filtro
  // ---------------------------------------------------------------------------

  const TABS = useMemo(() => [
    { id: 'TODOS',               label: 'Todas',              count: kpis.totalRegistros },
    { id: 'ACTIVA',              label: 'En Obra (Cliente)',   count: kpis.totalActivas },
    { id: 'RECIBIDA_EN_BODEGA',  label: 'En Bodega',          count: kpis.totalEnBodega,   alert: kpis.totalEnBodega > 0 },
    { id: 'DEVUELTA_A_PROVEEDOR',label: 'Devueltas a Aliado', count: kpis.totalDevueltas },
    { id: 'LIQUIDADA',           label: 'Liquidadas',         count: kpis.totalLiquidadas },
    { id: 'SOLICITADA',          label: 'Solicitadas',        count: kpis.totalSolicitadas },
  ], [kpis]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-3 sm:p-4 max-w-7xl mx-auto flex flex-col gap-3.5 isolate stack-isolate animate-fadeIn">

      {/* ── Header Quirúrgico Linear ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700">
            <Handshake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <span>Subcontratación y Re-Alquiler</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-normal">
                Alquileres System
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Gestión de maquinaria de aliados, control de márgenes en tiempo real y retorno
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCrearProveedorModal(true)}
            className="h-7.5 px-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-sm border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nuevo Aliado</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-500">A</kbd>
          </button>
          <button
            type="button"
            onClick={() => setShowCrearModal(true)}
            className="h-7.5 px-3 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-sm flex items-center gap-1.5 transition-colors shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Subcontratación</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-indigo-700 text-indigo-200">N</kbd>
          </button>
        </div>
      </div>

      {/* ── KPI Cards: Densidad Quirúrgica & Cero Sombras ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Órdenes Activas */}
        <div className="p-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Órdenes Activas</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono mt-1">{kpis.totalActivas}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">En obra ({kpis.totalSolicitadas} solicitadas)</p>
        </div>

        {/* Costo Proveedores Activo */}
        <div className="p-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Costo Aliados Activo</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono mt-1">
            {formatearMonedaCOP(kpis.costoTotalActivo)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Compromiso financiero a aliados</p>
        </div>

        {/* Margen Bruto Proyectado */}
        <div className="p-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Margen Proyectado</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatearMonedaCOP(kpis.margenTotalActivo)}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Rentabilidad promedio {kpis.margenPct}%</p>
        </div>

        {/* Alertas en Bodega */}
        <div className="p-3 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">En Bodega (Retorno)</span>
            <AlertCircle className={cn("w-3.5 h-3.5", kpis.totalEnBodega > 0 ? "text-rose-500" : "text-zinc-400")} />
          </div>
          <p className={cn("text-xl font-semibold tracking-tight font-mono mt-1", kpis.totalEnBodega > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100")}>
            {kpis.totalEnBodega}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {kpis.totalEnBodega > 0 ? 'Pendientes retorno a aliado' : `${kpis.totalLiquidadas} liquidadas`}
          </p>
        </div>
      </div>

      {/* ── Barra de Filtros Compacta Linear ─────────────────────────────────── */}
      <div className="p-1.5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, aliado o NIT..."
            className="w-full h-7.5 pl-8 pr-7 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.2 text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 rounded pointer-events-none">
            /
          </kbd>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
          {TABS.map((tab) => {
            const isActive = filtroEstado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFiltroEstado(tab.id)}
                className={cn(
                  "h-7 px-2.5 rounded-sm text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-none"
                    : tab.alert
                      ? "text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1 rounded text-[10px] font-mono tabular-nums",
                  isActive
                    ? "bg-zinc-700 text-zinc-100 dark:bg-zinc-300 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tabla de Densidad Quirúrgica (~30px por fila) ───────────────────── */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed text-xs">
            <colgroup>
              <col className="w-28" />
              <col className="w-48" />
              <col className="w-40" />
              <col className="w-28" />
              <col className="w-28" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-32" />
            </colgroup>
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr className="h-7.5">
                <th className="px-2.5 py-1">Orden / ID</th>
                <th className="px-2.5 py-1">Proveedor Aliado</th>
                <th className="px-2.5 py-1">Fechas Pactadas</th>
                <th className="px-2.5 py-1 text-right">Costo Aliado</th>
                <th className="px-2.5 py-1 text-right">Cobro Cliente</th>
                <th className="px-2.5 py-1 text-right">Margen</th>
                <th className="px-2.5 py-1 text-center">Estado</th>
                <th className="px-2.5 py-1 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtradasEnriquecidas.map((sub) => (
                <tr key={sub.id} className="h-7.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  {/* Consecutivo + badge vencida */}
                  <td className="px-2.5 py-1 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{sub.consecutivo}</span>
                      {sub.isVencida && (
                        <span className="px-1 py-0.2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded text-[9px] font-medium flex items-center gap-0.5 border border-rose-500/20">
                          <AlertTriangle className="w-2.5 h-2.5" /> Vencida
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Proveedor */}
                  <td className="px-2.5 py-1 truncate">
                    <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{sub.proveedorNombre}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">NIT: {sub.proveedorNit || 'N/A'}</div>
                  </td>

                  {/* Fechas */}
                  <td className="px-2.5 py-1 text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="text-[11px] font-mono">
                      {sub.fechaEntregaEstimada} → {sub.fechaDevolucionEstimada}
                    </span>
                  </td>

                  {/* Costo */}
                  <td className="px-2.5 py-1 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearMonedaCOP(sub.costoTotalEstimado)}
                  </td>

                  {/* Ingreso */}
                  <td className="px-2.5 py-1 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearMonedaCOP(sub.ingresoTotalEstimado)}
                  </td>

                  {/* Margen */}
                  <td className="px-2.5 py-1 text-right font-mono tabular-nums">
                    <span className={cn("font-medium", sub.margenBrutoEstimado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                      {formatearMonedaCOP(sub.margenBrutoEstimado)}
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-1">({sub.margenPct.toFixed(0)}%)</span>
                  </td>

                  {/* Estado badge (Linear Color Budget dot) */}
                  <td className="px-2.5 py-1 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", ESTADO_DOT_COLOR[sub.estadoVariant])} />
                      <span className="truncate">{sub.estado === 'RECIBIDA_EN_BODEGA' ? '⚠️ ' : ''}{sub.estadoLabel}</span>
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-2.5 py-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSubParaDetalle(sub)}
                        className="h-6 w-6 p-0 grid place-items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
                        title="Ver Detalle Completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubParaPDF(sub)}
                        className="h-6 w-6 p-0 grid place-items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
                        title="Imprimir Orden en PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {(sub.estado === 'ACTIVA' || sub.estado === 'RECIBIDA_EN_BODEGA') && (
                        <button
                          type="button"
                          onClick={() => setSubParaDevolucion(sub)}
                          className="h-6 px-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Registrar Retorno al Proveedor Aliado"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retornar</span>
                        </button>
                      )}

                      {(sub.estado === 'DEVUELTA_A_PROVEEDOR' || sub.estado === 'DEVUELTA') && (
                        <button
                          type="button"
                          onClick={() => setSubParaLiquidar(sub)}
                          className="h-6 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Liquidar Retenciones y Asentar en Ledger"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Liquidar</span>
                        </button>
                      )}

                      {sub.estado === 'LIQUIDADA' && (
                        <span className="p-0.5 text-emerald-600" title="Orden Asentada en Ledger Contable">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtradasEnriquecidas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <div className="grid place-items-center gap-2">
                      <Handshake className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">
                        No se encontraron órdenes de subcontratación.
                      </p>
                      <p className="text-xs text-zinc-400">
                        Registra una orden para tercerizar maquinaria de aliados comerciales.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modales lazy ──────────────────────────────────────────────────── */}
      <CrearSubcontratacionModal
        isOpen={showCrearModal}
        onClose={() => setShowCrearModal(false)}
        onSuccess={(nuevaSub) => {
          fetchDatos();
          setSubParaPDF(nuevaSub);
        }}
      />

      <CrearProveedorModal
        isOpen={showCrearProveedorModal}
        onClose={() => setShowCrearProveedorModal(false)}
        onSuccess={() => fetchDatos()}
      />

      {subParaDetalle && (
        <DetalleSubcontratacionModal
          isOpen={true}
          onClose={() => setSubParaDetalle(null)}
          subcontratacion={subParaDetalle}
          onImprimirPDF={(s) => setSubParaPDF(s)}
          onCambiarEstado={handleCambiarEstado}
          onRegistrarDevolucion={(s) => {
            setSubParaDetalle(null);
            setSubParaDevolucion(s);
          }}
        />
      )}

      {subParaDevolucion && (
        <DevolucionSubcontratacionModal
          isOpen={true}
          onClose={() => setSubParaDevolucion(null)}
          subcontratacion={subParaDevolucion}
          onSuccess={() => fetchDatos()}
        />
      )}

      {subParaLiquidar && (
        <LiquidarSubcontratacionModal
          isOpen={true}
          onClose={() => setSubParaLiquidar(null)}
          subcontratacion={subParaLiquidar}
          onSuccess={() => fetchDatos()}
        />
      )}

      {subParaPDF && (
        <OrdenSubcontratacionPDFModal
          isOpen={true}
          onClose={() => setSubParaPDF(null)}
          subcontratacion={subParaPDF}
        />
      )}
    </div>
  );
}

export default SubcontratacionesInteractiveIsland;
