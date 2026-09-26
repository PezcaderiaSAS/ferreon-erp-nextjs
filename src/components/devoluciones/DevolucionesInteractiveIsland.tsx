'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  CheckCircle2, 
  Package, 
  History, 
  Printer, 
  RefreshCw,
  Search,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import { alquilerEntityToAlquilerUI } from '@/lib/mappers';
import { cn } from '@/lib/utils';
import { obtenerHistorialDevolucionesAction } from '@/app/actions/devoluciones';
import { AutoTourTrigger } from '@/components/ui/AutoTourTrigger';
import { InteractiveTour } from '@/components/ui/InteractiveTour';
import { DEVOLUCIONES_STEPS } from '@/config/tours/TourConfigs';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import {
  DevolucionesTransaccionalService,
  ContratoConPendientesUI,
} from '@/core/services/devoluciones-transaccional.service';

const InspeccionTecnicaModal = dynamic(
  () => import('@/components/devoluciones/InspeccionTecnicaModal').then((m) => m.InspeccionTecnicaModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando módulo de inspección técnica..." /> }
);

const ComprobanteDevolucionPDFModal = dynamic(
  () => import('@/components/devoluciones/ComprobanteDevolucionPDFModal').then((m) => m.ComprobanteDevolucionPDFModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando visor de acta..." /> }
);

interface DevolucionesInteractiveIslandProps {
  initialAlquileres: any[];
  initialHistorial: any[];
  initialSesionCaja: any | null;
}

export function DevolucionesInteractiveIsland({
  initialAlquileres,
  initialHistorial,
  initialSesionCaja,
}: DevolucionesInteractiveIslandProps) {
  const { alquileres, setAlquileres } = useAlquilerStore();

  const [tabActiva, setTabActiva] = useState<'pendientes' | 'historial'>('pendientes');
  const [showInspeccionModal, setShowInspeccionModal] = useState<boolean>(false);
  const [contratoSeleccionado, setContratoSeleccionado] = useState<any | null>(null);
  const [sesionCajaActiva] = useState<any | null>(initialSesionCaja);
  const [historialDevoluciones, setHistorialDevoluciones] = useState<any[]>(initialHistorial || []);
  const [loadingHistorial, setLoadingHistorial] = useState<boolean>(false);
  const [filtroTexto, setFiltroTexto] = useState<string>('');

  // Estado para comprobante de reimpresión
  const [selectedActaData, setSelectedActaData] = useState<any | null>(null);
  const [showReimpresionModal, setShowReimpresionModal] = useState<boolean>(false);

  // Hidratación inicial desde Server Component
  useEffect(() => {
    if (initialAlquileres && initialAlquileres.length > 0) {
      setAlquileres(initialAlquileres.map(alquilerEntityToAlquilerUI));
    }
  }, [initialAlquileres, setAlquileres]);

  const refrescarAlquileres = useCallback(() => {
    fetch('/api/alquileres', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setAlquileres(json.data.map(alquilerEntityToAlquilerUI));
        }
      })
      .catch((e) => console.warn('[DevolucionesIsland] Error refrescando alquileres:', e));
  }, [setAlquileres]);

  const cargarHistorial = useCallback(async () => {
    setLoadingHistorial(true);
    try {
      const res = await obtenerHistorialDevolucionesAction();
      if (res.success && res.data) {
        setHistorialDevoluciones(res.data);
      }
    } catch (e) {
      console.warn('[DevolucionesIsland] Error al cargar historial:', e);
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  // Mapear contratos con equipos pendientes de retorno usando el servicio de dominio
  const contratosConPendientes = useMemo(() => {
    return DevolucionesTransaccionalService.mapearContratosConPendientes(alquileres);
  }, [alquileres]);

  // Contratos filtrados por buscador reactivo insensible a acentos
  const contratosFiltrados = useMemo(() => {
    return DevolucionesTransaccionalService.filtrarContratosPendientes(
      contratosConPendientes,
      filtroTexto
    );
  }, [contratosConPendientes, filtroTexto]);

  const handleOpenInspeccion = (contrato: ContratoConPendientesUI) => {
    setContratoSeleccionado({
      id: contrato.id,
      consecutivo: contrato.consecutivo,
      clienteNombre: contrato.clienteNombre,
      clienteNit: contrato.clienteNit,
      clienteTelefono: contrato.clienteTelefono,
      depositoGarantia: contrato.depositoGarantia,
      fechaInicio: contrato.fechaInicio,
      detalles: contrato.detallesCompletos,
    });
    setShowInspeccionModal(true);
  };

  const handleVerComprobanteHistorial = (acta: any) => {
    const data = DevolucionesTransaccionalService.adaptarActaAComprobanteData(acta);
    setSelectedActaData(data);
    setShowReimpresionModal(true);
  };

  return (
    <div className="flex flex-col gap-3.5 h-full isolate stack-isolate animate-fadeIn">
      {/* ── Cabecera Principal Linear ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-1.5 py-0.2 text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
              Alquileres System
            </span>
            {sesionCajaActiva && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Caja Abierta</span>
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Recepción e Inspección de Maquinaria
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Inspección física de daños, Split-Line inmutable y compensación de depósitos en garantía.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              refrescarAlquileres();
              cargarHistorial();
            }}
            className="h-7.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded-sm border border-zinc-200 dark:border-zinc-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-500">R</kbd>
          </button>
        </div>
      </div>

      {/* ── Selector de Pestañas Linear ─────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800 w-fit">
        <button
          type="button"
          onClick={() => setTabActiva('pendientes')}
          className={cn(
            "h-7 px-3 rounded-sm text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
            tabActiva === 'pendientes'
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-none"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Contratos Pendientes ({contratosConPendientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('historial')}
          className={cn(
            "h-7 px-3 rounded-sm text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer",
            tabActiva === 'historial'
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-none"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          )}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial de Actas ({historialDevoluciones.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: PENDIENTES */}
      {tabActiva === 'pendientes' && (
        <div className="flex flex-col gap-2.5">
          {/* Buscador Compacto */}
          <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900/60 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 shadow-none">
            <div className="relative w-full max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por cliente, # contrato o maquinaria..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full h-7.5 pl-8 pr-7 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-sm text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Buscar contratos con retorno pendiente"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.2 text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800 rounded pointer-events-none">
                /
              </kbd>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono pr-2">
              {contratosFiltrados.length} contrato(s)
            </span>
          </div>

          {/* Tabla de Densidad Quirúrgica (~30px por fila) */}
          <div className="bg-white dark:bg-zinc-900/50 rounded-md shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <colgroup>
                  <col className="w-28" />
                  <col className="w-56" />
                  <col className="w-32" />
                  <col className="w-auto" />
                  <col className="w-44" />
                </colgroup>
                <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <tr className="h-7.5">
                    <th className="px-2.5 py-1">Contrato</th>
                    <th className="px-2.5 py-1">Cliente</th>
                    <th className="px-2.5 py-1 text-right">Depósito</th>
                    <th className="px-2.5 py-1">Equipos en Obra</th>
                    <th className="px-2.5 py-1 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {contratosFiltrados.map((ctr) => (
                    <tr 
                      key={ctr.id} 
                      className="h-7.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      onClick={() => handleOpenInspeccion(ctr)}
                    >
                      <td className="px-2.5 py-1 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                          #{ctr.consecutivo}
                        </span>
                      </td>
                      <td className="px-2.5 py-1 truncate">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">{ctr.clienteNombre}</span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">{ctr.clienteNit}</span>
                      </td>
                      <td className="px-2.5 py-1 text-right font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                        ${ctr.depositoGarantia.toLocaleString('es-CO')}
                      </td>
                      <td className="px-2.5 py-1 text-zinc-600 dark:text-zinc-400 truncate">
                        {ctr.equiposResumen}
                      </td>
                      <td className="px-2.5 py-1 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInspeccion(ctr);
                          }}
                          className="h-6 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-none cursor-pointer"
                        >
                          <Package className="w-3 h-3 text-indigo-200" />
                          <span>Inspeccionar & Retornar</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {contratosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <div className="grid place-items-center gap-2">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500 opacity-80" />
                          <p className="font-medium text-zinc-700 dark:text-zinc-300">
                            No hay contratos activos con maquinaria pendiente por devolver.
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Todo el equipo alquilado se encuentra actualmente en patio o ya fue inspeccionado.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: HISTORIAL DE ACTAS */}
      {tabActiva === 'historial' && (
        <div className="bg-white dark:bg-zinc-900/50 rounded-md shadow-none border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <colgroup>
                <col className="w-28" />
                <col className="w-36" />
                <col className="w-56" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-36" />
                <col className="w-24" />
              </colgroup>
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                <tr className="h-7.5">
                  <th className="px-2.5 py-1">Acta</th>
                  <th className="px-2.5 py-1">Fecha / Hora</th>
                  <th className="px-2.5 py-1">Cliente / Contrato</th>
                  <th className="px-2.5 py-1 text-right">Alquiler Causado</th>
                  <th className="px-2.5 py-1 text-right">Cargos Daño</th>
                  <th className="px-2.5 py-1 text-right">Saldo Neto</th>
                  <th className="px-2.5 py-1 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {historialDevoluciones.map((acta) => {
                  const saldo = Number(acta.saldo_neto) || 0;
                  const esReembolso = saldo > 0;
                  const esCobro = saldo < 0;

                  return (
                    <tr key={acta.id} className="h-7.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-2.5 py-1 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                          {acta.consecutivo}
                        </span>
                      </td>
                      <td className="px-2.5 py-1 text-zinc-500 dark:text-zinc-400 text-[11px] font-mono truncate">
                        {new Date(acta.fecha_devolucion).toLocaleString('es-CO')}
                      </td>
                      <td className="px-2.5 py-1 truncate">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate block">
                          {acta.alquileres?.clientes?.nombre || 'Cliente General'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono truncate">
                          Contrato #{acta.alquileres?.consecutivo || acta.alquiler_id}
                        </span>
                      </td>
                      <td className="px-2.5 py-1 text-right font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                        ${Number(acta.total_alquiler_liquidado).toLocaleString('es-CO')}
                      </td>
                      <td className="px-2.5 py-1 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                        ${(Number(acta.total_danos) + Number(acta.total_reposiciones)).toLocaleString('es-CO')}
                      </td>
                      <td className="px-2.5 py-1 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono tabular-nums font-medium",
                          esReembolso 
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : esCobro 
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                          <span className={cn("w-1 h-1 rounded-full", esReembolso ? "bg-emerald-500" : esCobro ? "bg-rose-500" : "bg-zinc-400")} />
                          {esReembolso ? `Devuelto: $${saldo.toLocaleString('es-CO')}` : esCobro ? `Cobrado: $${Math.abs(saldo).toLocaleString('es-CO')}` : '$0'}
                        </span>
                      </td>
                      <td className="px-2.5 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleVerComprobanteHistorial(acta)}
                          className="h-6 w-6 p-0 grid place-items-center mx-auto bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-sm border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                          title="Ver e Imprimir Comprobante Oficial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {historialDevoluciones.length === 0 && !loadingHistorial && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400">
                      <div className="grid place-items-center gap-2">
                        <History className="w-7 h-7 text-zinc-300 dark:text-zinc-700" />
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          No se han registrado actas de devolución en el historial todavía.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Principal de Inspección Técnica & Split-Line */}
      <InspeccionTecnicaModal
        isOpen={showInspeccionModal}
        onClose={() => {
          setShowInspeccionModal(false);
          setContratoSeleccionado(null);
        }}
        contrato={contratoSeleccionado}
        sesionCajaActiva={sesionCajaActiva}
        onSuccess={() => {
          refrescarAlquileres();
          cargarHistorial();
        }}
      />

      {/* Modal de Reimpresión de Comprobante PDF */}
      <ComprobanteDevolucionPDFModal
        isOpen={showReimpresionModal}
        onClose={() => {
          setShowReimpresionModal(false);
          setSelectedActaData(null);
        }}
        data={selectedActaData}
      />

      {/* Tour Guiado */}
      <AutoTourTrigger tourId="devoluciones-core" delay={1000} forceMode={true} />
      <InteractiveTour tourId="devoluciones-core" steps={DEVOLUCIONES_STEPS} />
    </div>
  );
}
