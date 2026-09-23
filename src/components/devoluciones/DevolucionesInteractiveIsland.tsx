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
    <div className="flex flex-col gap-6 h-full">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-400 uppercase tracking-wider">
              Módulo de Bodega & Devoluciones
            </span>
            {sesionCajaActiva && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ● Caja Abierta
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Recepción e Inspección de Maquinaria
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Alquileres System — Inspección física de daños, aplicación de Split-Line inmutable y compensación de depósitos en garantía.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refrescarAlquileres();
              cargarHistorial();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refrescar</span>
          </button>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTabActiva('pendientes')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            tabActiva === 'pendientes'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Contratos con Retorno Pendiente ({contratosConPendientes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('historial')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            tabActiva === 'historial'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Actas Emitidas ({historialDevoluciones.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: PENDIENTES */}
      {tabActiva === 'pendientes' && (
        <div className="space-y-4">
          {/* Buscador */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, # contrato o maquinaria..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="bg-transparent w-full focus:outline-none text-slate-800 dark:text-slate-100"
                aria-label="Buscar contratos con retorno pendiente"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Mostrando {contratosFiltrados.length} contrato(s)
            </span>
          </div>

          {/* Tabla de Contratos con Maquinaria en Obra */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Contrato</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Cliente</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Depósito</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Equipos en Obra</th>
                    <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contratosFiltrados.map((ctr) => (
                    <tr 
                      key={ctr.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                      onClick={() => handleOpenInspeccion(ctr)}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-800 dark:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                          #{ctr.consecutivo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{ctr.clienteNombre}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{ctr.clienteNit}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
                          ${ctr.depositoGarantia.toLocaleString('es-CO')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {ctr.equiposResumen}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInspeccion(ctr);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                          <span>Inspeccionar y Devolver</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {contratosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                        No hay contratos activos con maquinaria pendiente por devolver.
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Acta Consecutivo</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Fecha / Hora</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Cliente / Contrato</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Alquiler Causado</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Cargos Daño</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">Saldo Neto</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {historialDevoluciones.map((acta) => {
                  const saldo = Number(acta.saldo_neto) || 0;
                  const esReembolso = saldo > 0;
                  const esCobro = saldo < 0;

                  return (
                    <tr key={acta.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-all">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {acta.consecutivo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(acta.fecha_devolucion).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {acta.alquileres?.clientes?.nombre || 'Cliente General'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Contrato #{acta.alquileres?.consecutivo || acta.alquiler_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        ${Number(acta.total_alquiler_liquidado).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-700 dark:text-amber-400">
                        ${(Number(acta.total_danos) + Number(acta.total_reposiciones)).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold ${
                          esReembolso 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                            : esCobro 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {esReembolso ? `Devuelto: $${saldo.toLocaleString('es-CO')}` : esCobro ? `Cobrado: $${Math.abs(saldo).toLocaleString('es-CO')}` : '$0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleVerComprobanteHistorial(acta)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-all cursor-pointer"
                          title="Ver e Imprimir Comprobante Oficial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {historialDevoluciones.length === 0 && !loadingHistorial && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No se han registrado actas de devolución en el historial todavía.
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
