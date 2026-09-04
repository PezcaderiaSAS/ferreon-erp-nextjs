'use client';

import { Box, Receipt, TrendingUp, ArrowUp, Clock, AlertTriangle, Search, FileBox, Mail, CircleDollarSign, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

import React, { useState, useMemo } from 'react';
import { RegistrarPagoModal } from '../components/cartera/RegistrarPagoModal';
import { useCurrencyFormatter } from '../../lib/hooks/useCurrencyFormatter';

import { AutoTourTrigger } from '../../components/ui/AutoTourTrigger';
import { InteractiveTour } from '../../components/ui/InteractiveTour';
import { FACTURACION_STEPS } from '../../config/tours/TourConfigs';
import { useAlquilerStore, AlquilerUI } from '../../infrastructure/state/alquilerStore';

type EstadoFactura = 'Pagada' | 'Pendiente' | 'Vencida';

interface Factura {
  id: string;
  cliente: string;
  fechaEmision: string;
  vencimiento: string;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: EstadoFactura;
  alquilerOriginal: AlquilerUI;
}

export default function FacturacionPage() {
  const { alquileres } = useAlquilerStore();
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  
  const [filtroActivo, setFiltroActivo] = useState<'Todas' | 'Pagadas' | 'Pendientes' | 'Vencidas'>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { formatearMoneda } = useCurrencyFormatter();

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  // Mapeo dinámico de Alquileres a Facturas
  const todasLasFacturas = useMemo<Factura[]>(() => {
    return alquileres
      .filter(a => a.estado !== 'CANCELADO')
      .map(a => {
        const saldo = a.saldo_pendiente ?? a.saldoPendiente ?? 0;
        const total = a.total || 0;
        const pagado = a.total_pagado ?? a.totalPagado ?? 0;
        
        // Regla de vencimiento asignada por el comercial
        let estado: EstadoFactura = 'Pendiente';
        if (saldo <= 0 || pagado >= total) {
          estado = 'Pagada';
        } else if (a.fecha_vencimiento) {
          const hoy = new Date();
          const vencimiento = new Date(a.fecha_vencimiento);
          if (hoy > vencimiento) {
            estado = 'Vencida';
          }
        }
        
        return {
          id: String(a.id),
          cliente: a.clienteNombre || `Cliente ${a.cliente_id}`,
          fechaEmision: new Date(a.created_at).toLocaleDateString(),
          vencimiento: a.fecha_vencimiento ? new Date(a.fecha_vencimiento).toLocaleDateString() : 'Por definir',
          total,
          totalPagado: pagado,
          saldoPendiente: saldo,
          estado,
          alquilerOriginal: a
        };
      })
      .sort((a, b) => {
        // Orden descendente (más reciente al más antiguo)
        return new Date(b.alquilerOriginal.created_at).getTime() - new Date(a.alquilerOriginal.created_at).getTime();
      });
  }, [alquileres]);

  // Filtrado de estados y búsqueda
  const facturasFiltradas = useMemo(() => {
    let result = todasLasFacturas;
    
    if (filtroActivo !== 'Todas') {
      const mapaEstado: Record<string, EstadoFactura> = {
        Pagadas: 'Pagada',
        Pendientes: 'Pendiente',
        Vencidas: 'Vencida'
      };
      result = result.filter(f => f.estado === mapaEstado[filtroActivo]);
    }
    
    if (searchTerm) {
      result = result.filter(f => 
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cliente.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [todasLasFacturas, filtroActivo, searchTerm]);

  // KPIs matemáticamente precisos
  const { ingresosMes, porCobrar, vencido } = useMemo(() => {
    let ingresos = 0;
    let cobrar = 0;
    let vencidos = 0;
    
    todasLasFacturas.forEach(f => {
      ingresos += f.totalPagado; 
      if (f.estado === 'Pendiente') cobrar += f.saldoPendiente;
      if (f.estado === 'Vencida') vencidos += f.saldoPendiente;
    });
    
    return { ingresosMes: ingresos, porCobrar: cobrar, vencido: vencidos };
  }, [todasLasFacturas]);

  // Paginación Simple (Client-side)
  const totalPages = Math.max(1, Math.ceil(facturasFiltradas.length / itemsPerPage));
  const paginatedFacturas = facturasFiltradas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDescargarPDF = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showToast(`Generando y descargando PDF para la factura ${id}...`, 'info');
  };

  const handleEnviarCorreo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showToast(`Correo enviado exitosamente con la factura ${id}.`, 'success');
  };

  const handleNotificarAtraso = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    showToast(`Notificación de cobro enviada al cliente por la factura ${id}.`, 'warning');
  };

  const abrirModalPago = (e: React.MouseEvent, factura: Factura) => {
    e.stopPropagation();
    setFacturaSeleccionada(factura);
    setIsPagoModalOpen(true);
  };

  const handleConfirmarPago = (monto: number, metodo: string, referencia: string) => {
    if (!facturaSeleccionada) return;
    setIsPagoModalOpen(false);
    setFacturaSeleccionada(null);
    showToast(`¡Pago de ${formatearMoneda(monto)} registrado correctamente!`, 'success');
  };

  return (
    <div className="flex flex-col gap-8 h-full relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn
          ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'}`}
        >
          <Box className="text-[20px] w-5 h-5" />
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Facturación y Cobros</h2>
          <p className="text-base text-slate-600 mt-1">Gestiona tus ingresos, facturas emitidas y estado de pagos.</p>
        </div>
        <button 
          id="tour-btn-generar-factura"
          onClick={() => showToast('Abriendo generador de facturas...', 'info')}
          className="flex items-center justify-center gap-2 bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white disabled:opacity-50 pointer-events-auto transition-colors px-6 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <Receipt className="text-[20px] w-5 h-5" />
          Generar Factura
        </button>
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
          {['Todas', 'Pagadas', 'Pendientes', 'Vencidas'].map((filtro) => (
            <button 
              key={filtro}
              onClick={() => {
                setFiltroActivo(filtro as any);
                setCurrentPage(1); // Resetear paginación al filtrar
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
                <tr key={factura.id} className={`transition-colors group cursor-pointer 
                  ${factura.estado === 'Vencida' ? 'bg-red-50/30 hover:bg-red-50/50 border-l-2 border-l-red-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
                >
                  <td className="py-4 px-4 text-sm font-medium text-brand-salmon">{factura.id}</td>
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
                        onClick={(e) => handleDescargarPDF(e, factura.id)}
                        title="Descargar PDF" 
                        className={`flex items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors
                          ${factura.estado === 'Pagada' ? 'px-3 text-slate-600 hover:text-brand-salmon bg-slate-100 hover:bg-brand-salmonLight/30' : 'px-2 text-slate-500 hover:text-brand-salmon bg-slate-50 hover:bg-brand-salmonLight/30'}`}
                      >
                        <FileBox className="text-[16px] w-5 h-5" /> {factura.estado === 'Pagada' && 'PDF'}
                      </button>
                      
                      <button 
                        onClick={(e) => handleEnviarCorreo(e, factura.id)}
                        title={factura.estado === 'Pagada' ? 'Reenviar por Correo' : 'Enviar por Correo'} 
                        className={`flex items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors
                          ${factura.estado === 'Pagada' ? 'px-3 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50' : 'px-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50'}`}
                      >
                        <Mail className="text-[16px] w-5 h-5" /> {factura.estado === 'Pagada' && 'Enviar'}
                      </button>

                      {factura.estado === 'Vencida' && (
                        <button 
                          onClick={(e) => handleNotificarAtraso(e, factura.id)}
                          title="Notificar Atraso" 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm rounded-lg transition-colors active:scale-95"
                        >
                          <AlertTriangle className="text-[16px] w-5 h-5" /> Reclamar
                        </button>
                      )}

                      {factura.estado !== 'Pagada' && (
                        <button 
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

              {/* Empty State Mejorado */}
              {paginatedFacturas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="bg-slate-50 p-4 rounded-full">
                        <Inbox className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-base font-medium text-slate-500">No se encontraron facturas</p>
                      <p className="text-sm">Prueba ajustando los filtros o la búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Client-side) */}
        {facturasFiltradas.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-sm bg-white rounded-b-xl">
            <span>
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, facturasFiltradas.length)} de {facturasFiltradas.length}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="text-[20px] w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="text-[20px] w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <RegistrarPagoModal 
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          setFacturaSeleccionada(null);
        }}
        contratoParaPago={facturaSeleccionada ? {
          consecutivo: String(facturaSeleccionada.id || "").replace('#FAC-', ''),
          clienteNombre: facturaSeleccionada.cliente,
          total: facturaSeleccionada.total,
          totalPagado: facturaSeleccionada.totalPagado
        } : null}
        onConfirmarPago={handleConfirmarPago}
      />

      {/* Tour Módulo Facturación */}
      <AutoTourTrigger tourId="facturacion-core" delay={1000} forceMode={true} />
      <InteractiveTour tourId="facturacion-core" steps={FACTURACION_STEPS} />
    </div>
  );
}
