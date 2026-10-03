'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet, Plus, Search, Filter, Phone, MessageSquare,
  ArrowRight, CheckCircle2, Clock, AlertTriangle, FileText,
  Calendar, Building2, User, RefreshCw, ChevronRight, Check
} from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  calcularKPIsPipelineCotizaciones,
  filtrarCotizacionesComerciales,
  construirEnlaceWhatsAppCotizacion,
  type RawCotizacionComercial
} from '@/core/services/cotizacion-rapida.service';
import { convertirCotizacionAContratoAction } from '@/app/actions/cotizaciones';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';

// Carga perezosa de modales para rendimiento de carga óptimo
const CotizacionRapidaModal = dynamic(
  () => import('./CotizacionRapidaModal').then((m) => m.CotizacionRapidaModal),
  { ssr: false, loading: () => <ModalSkeleton message="Preparando cotizador express..." /> }
);

const ConvertirCotizacionModal = dynamic(
  () => import('@/components/forms/cotizaciones/ConvertirCotizacionModal').then((m) => m.ConvertirCotizacionModal),
  { ssr: false, loading: () => <ModalSkeleton message="Verificando disponibilidad de bodega..." /> }
);

interface CotizacionesInteractiveIslandProps {
  initialCotizaciones: RawCotizacionComercial[];
  initialClientes: any[];
  initialEquipos: any[];
}

export function CotizacionesInteractiveIsland({
  initialCotizaciones,
  initialClientes,
  initialEquipos,
}: CotizacionesInteractiveIslandProps) {
  const [cotizaciones, setCotizaciones] = useState<RawCotizacionComercial[]>(initialCotizaciones);
  const [clientes] = useState<any[]>(initialClientes);
  const [equipos] = useState<any[]>(initialEquipos);

  // Estados de control
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [cotizacionParaConvertir, setCotizacionParaConvertir] = useState<any | null>(null);
  const [isConvertirOpen, setIsConvertirOpen] = useState(false);
  const [convertiendoId, setConvertiendoId] = useState<string | null>(null);
  const [alertaExito, setAlertaExito] = useState<string | null>(null);
  const [alertaError, setAlertaError] = useState<string | null>(null);

  // Cálculo de KPIs de Pipeline Comercial
  const kpis = useMemo(() => {
    return calcularKPIsPipelineCotizaciones(cotizaciones);
  }, [cotizaciones]);

  // Filtrado reactivo de cotizaciones
  const cotizacionesFiltradas = useMemo(() => {
    return filtrarCotizacionesComerciales(cotizaciones, filtroEstado, busqueda);
  }, [cotizaciones, filtroEstado, busqueda]);

  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  // Manejo de nueva cotización creada
  const handleCotizacionCreada = (nueva: any) => {
    setCotizaciones((prev) => [nueva, ...prev]);
    setAlertaExito(`Cotización #${nueva.consecutivo || nueva.id} generada y registrada con éxito.`);
    setTimeout(() => setAlertaExito(null), 6000);
  };

  // Conversión Directa 1-Clic
  const handleIniciarConversion = (cot: RawCotizacionComercial) => {
    setCotizacionParaConvertir(cot);
    setIsConvertirOpen(true);
  };

  const handleConversionExitosa = (resultado: any) => {
    setIsConvertirOpen(false);
    setCotizacionParaConvertir(null);
    setAlertaExito(
      `¡Cotización formalizada con éxito! Contrato #${resultado?.consecutivo || resultado?.alquilerId} generado en bodega.`
    );
    // Actualizar estado local a CONVERTIDA
    if (resultado?.cotizacionId) {
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.id === resultado.cotizacionId || c.consecutivo === resultado.cotizacionId
            ? { ...c, estado: 'CONVERTIDA', alquiler_id: resultado.alquilerId }
            : c
        )
      );
    }
    setTimeout(() => setAlertaExito(null), 8000);
  };

  // Enlace directo WhatsApp
  const handleEnviarWhatsApp = (cot: RawCotizacionComercial) => {
    const items = (cot.cotizaciones_detalles || cot.detalles || []).map((d: any) => ({
      nombre: d.equipos?.nombre || d.nombre || 'Equipo',
      cantidad: d.cantidad || 1,
      dias: d.dias || 1,
    }));

    const { url } = construirEnlaceWhatsAppCotizacion({
      telefonoDestino: cot.cliente_telefono,
      clienteNombre: cot.cliente_nombre || 'Cliente',
      consecutivo: cot.consecutivo || cot.id,
      items,
      total: Number(cot.total) || 0,
      fechaVencimiento: cot.fecha_vencimiento,
    });

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de Marca y Acción Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-brand-salmon/10 text-brand-salmon dark:bg-brand-salmon/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Alquileres System — Cotizaciones Rápidas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generación express en 30 segundos, seguimiento de pipeline comercial y conversión poka-yoke a contratos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalCrearOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-salmon hover:bg-brand-salmon/90 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-salmon/25 transition-all hover:scale-[1.02] active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Cotización (30s)</span>
        </button>
      </div>

      {/* Alertas Globales de Acción */}
      {alertaExito && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{alertaExito}</span>
        </div>
      )}

      {alertaError && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-700 dark:text-red-300 flex items-center gap-2.5 text-xs font-medium animate-fadeIn">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <span>{alertaError}</span>
        </div>
      )}

      {/* 2. Grid de KPIs del Pipeline Comercial (Radios Anidados & Tabular Nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Volumen Cotizado */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Volumen Cotizado</span>
            <span className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white tracking-tight">
            {formatearCOP(kpis.totalMontoCotizado)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {kpis.totalCotizaciones} cotizaciones totales
          </span>
        </div>

        {/* KPI 2: Tasa de Conversión */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Tasa de Cierre / Conversión</span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 tracking-tight">
            {kpis.tasaConversionPorcentaje}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {kpis.cotizacionesConvertidas} convertidas a contrato
          </span>
        </div>

        {/* KPI 3: Cotizaciones Vigentes */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Cotizaciones Vigentes</span>
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 tracking-tight">
            {kpis.cotizacionesVigentes}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            En seguimiento comercial
          </span>
        </div>

        {/* KPI 4: Aprobadas por Cliente */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Aprobadas / Por Entregar</span>
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Check className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 tracking-tight">
            {kpis.cotizacionesAprobadas}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Listas para formalizar contrato
          </span>
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros de Estado */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por #COT, cliente, documento u obra..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-salmon/20 outline-none"
          />
        </div>

        {/* Píldoras de Filtros */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'TODOS', label: 'Todas' },
            { id: 'PENDIENTES', label: 'Pendientes' },
            { id: 'APROBADAS', label: 'Aprobadas' },
            { id: 'CONVERTIDAS', label: 'Convertidas' },
            { id: 'VENCIDAS', label: 'Vencidas' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFiltroEstado(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filtroEstado === pill.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Listado: Desktop Table & Mobile Cards Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        {cotizacionesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <FileSpreadsheet className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">No se encontraron cotizaciones con los criterios seleccionados.</p>
            <p className="text-xs">Haga clic en &quot;+ Nueva Cotización&quot; para generar la primera oferta comercial.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Cliente / Obra</th>
                    <th className="py-3 px-4">Emisión / Vigencia</th>
                    <th className="py-3 px-4 text-right">Monto Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {cotizacionesFiltradas.map((cot) => {
                    const estado = (cot.estado || 'BORRADOR').toUpperCase();
                    const esConvertida = estado === 'CONVERTIDA';
                    const esAprobada = estado === 'APROBADA';

                    return (
                      <tr
                        key={cot.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Consecutivo */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{cot.consecutivo || cot.id}
                        </td>

                        {/* Cliente y Obra */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">
                            {cot.cliente_nombre}
                          </div>
                          {cot.obra_nombre && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{cot.obra_nombre}</span>
                            </div>
                          )}
                        </td>

                        {/* Fechas */}
                        <td className="py-3.5 px-4 text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          <div>E: {cot.fecha_emision ? cot.fecha_emision.slice(0, 10) : 'Hoy'}</div>
                          {cot.fecha_vencimiento && (
                            <div className="text-slate-400">V: {cot.fecha_vencimiento.slice(0, 10)}</div>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white text-sm">
                          {formatearCOP(Number(cot.total) || 0)}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              esConvertida
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : esAprobada
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  : estado === 'VENCIDA'
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>

                        {/* Acciones Rápidas */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botón WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleEnviarWhatsApp(cot)}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Compartir por WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {/* Botón Convertir en 1-Clic */}
                            {!esConvertida && (
                              <button
                                type="button"
                                onClick={() => handleIniciarConversion(cot)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-[11px] inline-flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                              >
                                <span>Convertir</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid (<768px) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {cotizacionesFiltradas.map((cot) => {
                const estado = (cot.estado || 'BORRADOR').toUpperCase();
                const esConvertida = estado === 'CONVERTIDA';

                return (
                  <div key={cot.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                          #{cot.consecutivo || cot.id}
                        </span>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {cot.cliente_nombre}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          esConvertida
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {estado}
                      </span>
                    </div>

                    {cot.obra_nombre && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cot.obra_nombre}</span>
                      </p>
                    )}

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-xs text-slate-400 font-mono">
                        Vigencia: {cot.fecha_vencimiento?.slice(0, 10) || 'N/A'}
                      </span>
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatearCOP(Number(cot.total) || 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleEnviarWhatsApp(cot)}
                        className="py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-500/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {!esConvertida ? (
                        <button
                          type="button"
                          onClick={() => handleIniciarConversion(cot)}
                          className="py-2 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>Convertir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs text-center font-medium">
                          Formalizada ✓
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 5. Modales Integrados */}
      {isModalCrearOpen && (
        <CotizacionRapidaModal
          isOpen={isModalCrearOpen}
          onClose={() => setIsModalCrearOpen(false)}
          clientes={clientes}
          equipos={equipos}
          onCotizacionCreada={handleCotizacionCreada}
        />
      )}

      {isConvertirOpen && cotizacionParaConvertir && (
        <ConvertirCotizacionModal
          isOpen={isConvertirOpen}
          onClose={() => setIsConvertirOpen(false)}
          cotizacion={cotizacionParaConvertir}
          onSuccess={handleConversionExitosa}
        />
      )}
    </div>
  );
}
