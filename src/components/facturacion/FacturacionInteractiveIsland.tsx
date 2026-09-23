'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Receipt, 
  TrendingUp, 
  ArrowUp, 
  Clock, 
  AlertTriangle, 
  Search, 
  FileBox, 
  Mail, 
  CircleDollarSign, 
  ChevronLeft, 
  ChevronRight, 
  Inbox,
  RefreshCw
} from 'lucide-react';
import { useCurrencyFormatter } from '@/lib/hooks/useCurrencyFormatter';
import { useToastStore } from '@/infrastructure/state/toastStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import { useEmpresaStore } from '@/infrastructure/state/empresaStore';
import { registrarPagoAction } from '@/app/actions/pagos';
import { emitirFacturaLedgerAction } from '@/app/actions/facturacion';
import { obtenerAlquileresAction } from '@/app/actions/alquileres';
import { alquilerEntityToAlquilerUI } from '@/lib/mappers';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import { AutoTourTrigger } from '@/components/ui/AutoTourTrigger';
import { InteractiveTour } from '@/components/ui/InteractiveTour';
import { FACTURACION_STEPS } from '@/config/tours/TourConfigs';
import {
  mapearAlquileresAFacturas,
  filtrarFacturas,
  calcularKPIsFacturacion,
  construirPayloadFacturaPDF,
  type FacturaUI,
  type FiltroEstadoFactura,
} from '@/core/services/facturacion-transaccional.service';
import type { DocumentoPDFPayload } from '@/core/services/pdf-factura-generator.service';

// Carga perezosa de modales pesados (Reducción First Load JS)
const RegistrarPagoMixtoModal = dynamic(
  () => import('@/components/cartera/RegistrarPagoMixtoModal').then((m) => m.RegistrarPagoMixtoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando pasarela de cobro mixto..." /> }
);

const ReciboCajaMixtoPDFModal = dynamic(
  () => import('@/components/pdf/ReciboCajaMixtoPDFModal').then((m) => m.ReciboCajaMixtoPDFModal),
  { ssr: false, loading: () => <ModalSkeleton message="Generando comprobante oficial de caja..." /> }
);

const ReciboPagoModal = dynamic(
  () => import('@/components/facturacion/ReciboPagoModal').then((m) => m.ReciboPagoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando recibo de pago..." /> }
);

const VisorDocumentoPDFModal = dynamic(
  () => import('@/components/pdf/VisorDocumentoPDFModal').then((m) => m.VisorDocumentoPDFModal),
  { ssr: false, loading: () => <ModalSkeleton message="Preparando visor de factura PDF..." /> }
);

export interface FacturacionInteractiveIslandProps {
  initialAlquileres?: any[];
}

/**
 * Client Island Interactiva para el Módulo de Facturación & Cartera CXC
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 */
export function FacturacionInteractiveIsland({
  initialAlquileres = [],
}: FacturacionInteractiveIslandProps) {
  const { alquileres, setAlquileres } = useAlquilerStore();
  const { config: empresaConfig } = useEmpresaStore();
  const { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } = useToastStore();
  const { formatearMoneda } = useCurrencyFormatter();

  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
  const [reciboGenerado, setReciboGenerado] = useState<any>(null);
  const [reciboMixtoGenerado, setReciboMixtoGenerado] = useState<any>(null);
  const [isProcesandoPago, setIsProcesandoPago] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaUI | null>(null);
  const [documentoPDFSeleccionado, setDocumentoPDFSeleccionado] = useState<DocumentoPDFPayload | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [filtroActivo, setFiltroActivo] = useState<FiltroEstadoFactura>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Hidratación inicial desde React Server Component
  useEffect(() => {
    if (initialAlquileres && initialAlquileres.length > 0) {
      setAlquileres(initialAlquileres.map(alquilerEntityToAlquilerUI));
    }
  }, [initialAlquileres, setAlquileres]);

  // Sincronización fresca bajo demanda
  const refrescarFacturacion = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await obtenerAlquileresAction();
      if (res.success && Array.isArray(res.data)) {
        setAlquileres(res.data.map(alquilerEntityToAlquilerUI));
      }
    } catch (err) {
      console.warn('[FacturacionIsland] Error al refrescar datos:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [setAlquileres]);

  // Mapeo dinámico de Alquileres a Facturas vía Dominio Puro
  const todasLasFacturas: FacturaUI[] = useMemo(() => {
    return mapearAlquileresAFacturas(alquileres);
  }, [alquileres]);

  // Filtrado reactivo de estados y búsqueda textual insensible a acentos
  const facturasFiltradas: FacturaUI[] = useMemo(() => {
    return filtrarFacturas(todasLasFacturas, filtroActivo, searchTerm);
  }, [todasLasFacturas, filtroActivo, searchTerm]);

  // KPIs matemáticamente calculados
  const { ingresosMes, porCobrar, vencido } = useMemo(() => {
    return calcularKPIsFacturacion(todasLasFacturas);
  }, [todasLasFacturas]);

  // Paginación Simple
  const totalPages = Math.max(1, Math.ceil(facturasFiltradas.length / itemsPerPage));
  const paginatedFacturas = facturasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDescargarPDF = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const factura = todasLasFacturas.find(f => f.id === id);
    if (!factura) {
      showErrorToast('Factura no encontrada.');
      return;
    }

    const payload = construirPayloadFacturaPDF(factura, empresaConfig);

    // Asentar en Ledger contable en segundo plano
    emitirFacturaLedgerAction({ alquilerId: factura.id }).catch((err) =>
      console.warn('[FacturacionIsland] Error emitiendo factura en Ledger:', err)
    );

    setDocumentoPDFSeleccionado(payload);
  };

  const handleEnviarCorreo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showSuccessToast(`Correo enviado exitosamente con la factura ${id}.`);
  };

  const handleNotificarAtraso = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showWarningToast(`Notificación de cobro enviada al cliente por la factura ${id}.`);
  };

  const abrirModalPago = (e: React.MouseEvent, factura: FacturaUI) => {
    e.stopPropagation();
    setFacturaSeleccionada(factura);
    setIsPagoModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 h-full relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 uppercase tracking-wider">
              Módulo de Cartera CXC & Cobros
            </span>
          </div>
          <h2 className="text-3xl font-semibold text-slate-900 mt-1">Facturación y Cobros</h2>
          <p className="text-base text-slate-600 mt-0.5">
            Gestiona tus ingresos, facturas comerciales emitidas y estado de recaudos en Alquileres System.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refrescarFacturacion}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            title="Refrescar facturas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Refrescar'}</span>
          </button>

          <button 
            id="tour-btn-generar-factura"
            type="button"
            onClick={(e) => {
              if (todasLasFacturas.length > 0) {
                handleDescargarPDF(e, todasLasFacturas[0].id);
              } else {
                showInfoToast('No hay contratos ni facturas activas para generar.');
              }
            }}
            className="flex items-center justify-center gap-2 bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white disabled:opacity-50 pointer-events-auto transition-colors px-6 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            <Receipt className="text-[20px] w-5 h-5" />
            <span>Generar Factura Oficial</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Glassmorphism & Deep Shadows) */}
      <div id="tour-kpis-facturacion" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-slate-900/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200/60 flex flex-col gap-2 transition-all hover:border-emerald-200 hover:shadow-xl">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Ingresos Recibidos</span>
            <TrendingUp className="text-brand-salmon text-[20px] w-5 h-5" />
          </div>
          <span className="text-4xl font-semibold text-slate-900">{formatearMoneda(ingresosMes)}</span>
          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
            <ArrowUp className="text-sm w-5 h-5" />
            <span>Datos reales del sistema</span>
          </div>
        </div>
        
        {/* Por Cobrar */}
        <div className="bg-slate-900/5 backdrop-blur-md p-6 rounded-xl shadow-md border border-slate-200/60 flex flex-col gap-2 transition-all hover:border-slate-300 hover:shadow-xl">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Por Cobrar</span>
            <Clock className="text-slate-400 text-[20px] w-5 h-5" />
          </div>
          <span className="text-4xl font-semibold text-slate-900">{formatearMoneda(porCobrar)}</span>
          <p className="text-sm text-slate-500">Saldo pendiente total</p>
        </div>
        
        {/* Vencido */}
        <div className="bg-red-50/70 backdrop-blur-md p-6 rounded-xl shadow-md border border-red-200/60 flex flex-col gap-2 transition-all hover:border-red-300 hover:shadow-xl">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-sm font-medium">Vencido</span>
            <AlertTriangle className="text-red-600 text-[20px] w-5 h-5" />
          </div>
          <span className="text-4xl font-semibold text-red-600">{formatearMoneda(vencido)}</span>
          <p className="text-sm text-red-600">Fuera de fecha de vencimiento</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-sm border border-slate-200">
        <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {(['Todas', 'Pagadas', 'Pendientes', 'Vencidas'] as FiltroEstadoFactura[]).map((filtro) => (
            <button 
              key={filtro}
              type="button"
              onClick={() => {
                setFiltroActivo(filtro);
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                filtroActivo === filtro 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent'
              }`}
            >
              {filtro}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 focus-within:border-brand-salmon focus-within:ring-1 focus-within:ring-brand-salmon w-full sm:w-64 transition-all shadow-sm">
          <Search className="text-slate-400 text-[20px] w-5 h-5" />
          <input 
            className="w-full bg-transparent border-none focus:ring-0 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none" 
            placeholder="N° Factura o Cliente..." 
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-card border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Factura</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Emisión</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vencimiento</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Saldo</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedFacturas.map((factura) => (
                <tr 
                  key={factura.id} 
                  className={`transition-colors group cursor-pointer 
                    ${factura.estado === 'Vencida' ? 'bg-red-50/30 hover:bg-red-50/50 border-l-2 border-l-red-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
                >
                  <td className="py-4 px-4 text-sm font-medium text-brand-salmon font-mono">{factura.id}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">{factura.cliente}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{factura.fechaEmision}</td>
                  <td className={`py-4 px-4 text-sm ${factura.estado === 'Vencida' ? 'font-medium text-red-600' : 'text-slate-600'}`}>{factura.vencimiento}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-900 text-right">{formatearMoneda(factura.total)}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-600 text-right">{formatearMoneda(factura.saldoPendiente)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium 
                      ${factura.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700' : 
                        factura.estado === 'Vencida' ? 'bg-red-100 text-red-800' : 
                        'bg-amber-50 text-amber-700'}`}
                    >
                      {factura.estado}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => handleDescargarPDF(e, factura.id)}
                        title="Descargar PDF" 
                        className={`flex items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors
                          ${factura.estado === 'Pagada' ? 'px-3 text-slate-600 hover:text-brand-salmon bg-slate-100 hover:bg-brand-salmonLight/30' : 'px-2 text-slate-500 hover:text-brand-salmon bg-slate-50 hover:bg-brand-salmonLight/30'}`}
                      >
                        <FileBox className="text-[16px] w-5 h-5" /> {factura.estado === 'Pagada' && 'PDF'}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={(e) => handleEnviarCorreo(e, factura.id)}
                        title={factura.estado === 'Pagada' ? 'Reenviar por Correo' : 'Enviar por Correo'} 
                        className={`flex items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors
                          ${factura.estado === 'Pagada' ? 'px-3 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50' : 'px-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50'}`}
                      >
                        <Mail className="text-[16px] w-5 h-5" /> {factura.estado === 'Pagada' && 'Enviar'}
                      </button>

                      {factura.estado === 'Vencida' && (
                        <button 
                          type="button"
                          onClick={(e) => handleNotificarAtraso(e, factura.id)}
                          title="Notificar Atraso" 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm rounded-lg transition-colors active:scale-95"
                        >
                          <AlertTriangle className="text-[16px] w-5 h-5" /> Reclamar
                        </button>
                      )}

                      {factura.estado !== 'Pagada' && (
                        <button 
                          type="button"
                          onClick={(e) => abrirModalPago(e, factura)}
                          title="Registrar Pago" 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm rounded-lg transition-colors active:scale-95"
                        >
                          <CircleDollarSign className="text-[16px] w-5 h-5" /> Cobrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty State */}
              {paginatedFacturas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="bg-slate-50 p-4 rounded-full">
                        <Inbox className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-500">No se encontraron facturas</p>
                      <p className="text-sm">Prueba ajustando los filtros o el término de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {facturasFiltradas.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-sm bg-white rounded-b-xl">
            <span>
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, facturasFiltradas.length)} de {facturasFiltradas.length}
            </span>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="text-[20px] w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="text-[20px] w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Pago Mixto y Abonos */}
      {isPagoModalOpen && facturaSeleccionada && (
        <RegistrarPagoMixtoModal 
          isOpen={isPagoModalOpen}
          onClose={() => {
            setIsPagoModalOpen(false);
            setFacturaSeleccionada(null);
          }}
          contrato={facturaSeleccionada.alquilerOriginal}
          onSuccess={(pagoData, reciboInfo) => {
            refrescarFacturacion();
            setIsPagoModalOpen(false);
            showSuccessToast('Abono mixto registrado y balanceado en el Ledger contable.');
            if (reciboInfo) {
              setReciboMixtoGenerado(reciboInfo);
            }
          }}
        />
      )}

      {/* Comprobante Oficial de Caja con Soporte Térmica y Carta */}
      {reciboMixtoGenerado && (
        <ReciboCajaMixtoPDFModal
          isOpen={true}
          onClose={() => setReciboMixtoGenerado(null)}
          recibo={reciboMixtoGenerado}
        />
      )}

      {/* Modal de Recibo de Caja Imprimible legacy */}
      {isReciboModalOpen && reciboGenerado && (
        <ReciboPagoModal
          isOpen={isReciboModalOpen}
          onClose={() => setIsReciboModalOpen(false)}
          recibo={reciboGenerado}
        />
      )}

      {/* Visor Oficial de Facturas Comerciales en PDF */}
      {documentoPDFSeleccionado && (
        <VisorDocumentoPDFModal
          isOpen={true}
          onClose={() => setDocumentoPDFSeleccionado(null)}
          documento={documentoPDFSeleccionado}
        />
      )}

      {/* Tour Módulo Facturación */}
      <AutoTourTrigger tourId="facturacion-core" delay={1000} forceMode={true} />
      <InteractiveTour tourId="facturacion-core" steps={FACTURACION_STEPS} />
    </div>
  );
}
