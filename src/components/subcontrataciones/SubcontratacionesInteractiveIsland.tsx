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
// Mapa de variantes de color para badges de estado
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<SubcontratacionEnriquecida['estadoVariant'], string> = {
  blue:    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200',
  amber:   'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200',
  purple:  'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300',
  rose:    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200',
  slate:   'bg-slate-100 text-slate-700 border-slate-200',
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 rounded-2xl border border-amber-500/20 shadow-xs">
            <Handshake className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Subcontratación y Re-Alquiler
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Gestión de maquinaria rentada a aliados, control de márgenes en tiempo real y retorno
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowCrearProveedorModal(true)}
            className="flex items-center gap-1.5 text-xs bg-white dark:bg-slate-800 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-amber-600" />
            <span>Nuevo Aliado</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => setShowCrearModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 text-xs sm:text-sm font-bold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Subcontratación</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Órdenes Activas */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Activas</span>
            <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg"><Clock className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{kpis.totalActivas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En obra con clientes ({kpis.totalSolicitadas} solicitadas)</p>
        </div>

        {/* Costo Proveedores Activo */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costo Aliados Activo</span>
            <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-2">
            {formatearMonedaCOP(kpis.costoTotalActivo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Compromiso financiero a aliados</p>
        </div>

        {/* Margen Bruto Proyectado */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Margen Bruto Proyectado</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-2">
            {formatearMonedaCOP(kpis.margenTotalActivo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rentabilidad promedio del {kpis.margenPct}%</p>
        </div>

        {/* Alertas en Bodega */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alertas En Bodega</span>
            <div className={`p-1.5 rounded-lg ${kpis.totalEnBodega > 0 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-slate-100 text-slate-400'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${kpis.totalEnBodega > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {kpis.totalEnBodega}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {kpis.totalEnBodega > 0 ? 'Máquinas pendientes de retorno a aliados' : `${kpis.totalLiquidadas} órdenes liquidadas`}
          </p>
        </div>
      </div>

      {/* ── Barra de filtros ──────────────────────────────────────────────── */}
      <div className="p-3.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, aliado o NIT..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filtroEstado === tab.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : tab.alert
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 rounded-full text-[10px] ${
                filtroEstado === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Orden / ID</th>
                <th className="py-3 px-4 font-bold">Proveedor Aliado</th>
                <th className="py-3 px-4 font-bold">Fechas Pactadas</th>
                <th className="py-3 px-4 font-bold text-right">Costo Aliado</th>
                <th className="py-3 px-4 font-bold text-right">Cobro Cliente</th>
                <th className="py-3 px-4 font-bold text-right">Margen</th>
                <th className="py-3 px-4 font-bold text-center">Estado</th>
                <th className="py-3 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtradasEnriquecidas.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Consecutivo + badge vencida */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{sub.consecutivo}</span>
                      {sub.isVencida && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 rounded text-[10px] font-sans font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Vencida
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Proveedor */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{sub.proveedorNombre}</div>
                    <div className="text-[11px] text-slate-400 font-mono">NIT: {sub.proveedorNit || 'N/A'}</div>
                  </td>

                  {/* Fechas */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div className="text-[11px]">
                      {sub.fechaEntregaEstimada} al {sub.fechaDevolucionEstimada}
                    </div>
                  </td>

                  {/* Costo */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatearMonedaCOP(sub.costoTotalEstimado)}
                  </td>

                  {/* Ingreso */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatearMonedaCOP(sub.ingresoTotalEstimado)}
                  </td>

                  {/* Margen */}
                  <td className="py-3 px-4 text-right font-mono">
                    <div className={`font-bold ${sub.margenBrutoEstimado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {formatearMonedaCOP(sub.margenBrutoEstimado)}
                    </div>
                    <div className="text-[10px] text-slate-400">{sub.margenPct.toFixed(0)}% margen</div>
                  </td>

                  {/* Estado badge */}
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${VARIANT_CLASSES[sub.estadoVariant]}`}>
                      {sub.estado === 'RECIBIDA_EN_BODEGA' ? '⚠️ ' : ''}{sub.estadoLabel}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSubParaDetalle(sub)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Ver Detalle Completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSubParaPDF(sub)}
                        className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-lg hover:bg-amber-100 transition-colors"
                        title="Imprimir Orden en PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {(sub.estado === 'ACTIVA' || sub.estado === 'RECIBIDA_EN_BODEGA') && (
                        <button
                          type="button"
                          onClick={() => setSubParaDevolucion(sub)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                          title="Registrar Retorno al Proveedor Aliado"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retornar</span>
                        </button>
                      )}

                      {(sub.estado === 'DEVUELTA_A_PROVEEDOR' || sub.estado === 'DEVUELTA') && (
                        <button
                          type="button"
                          onClick={() => setSubParaLiquidar(sub)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                          title="Liquidar Retenciones y Asentar en Ledger"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Liquidar</span>
                        </button>
                      )}

                      {sub.estado === 'LIQUIDADA' && (
                        <span className="p-1 text-emerald-600" title="Orden Asentada en Ledger Contable">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtradasEnriquecidas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Handshake className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No se encontraron órdenes de subcontratación.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Registra una orden para tercerizar maquinaria de aliados comerciales.
                    </p>
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
