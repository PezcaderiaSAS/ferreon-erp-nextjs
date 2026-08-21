'use client';

import React, { useState } from 'react';
import { RegistrarPagoModal } from '../components/cartera/RegistrarPagoModal';
import { useCurrencyFormatter } from '../../lib/hooks/useCurrencyFormatter';

type EstadoFactura = 'Pagada' | 'Pendiente' | 'Vencida';

interface Factura {
  id: string;
  cliente: string;
  fechaEmision: string;
  vencimiento: string;
  total: number;
  estado: EstadoFactura;
}

const facturasIniciales: Factura[] = [
  { id: '#FAC-001', cliente: 'Constructora Omega S.A.', fechaEmision: '12 Oct 2023', vencimiento: '27 Oct 2023', total: 1250.00, estado: 'Pagada' },
  { id: '#FAC-002', cliente: 'Taller Los Hermanos', fechaEmision: '14 Oct 2023', vencimiento: '29 Oct 2023', total: 850.50, estado: 'Pendiente' },
  { id: '#FAC-003', cliente: 'Mantenimiento Industrial Corp', fechaEmision: '01 Oct 2023', vencimiento: '16 Oct 2023', total: 3150.00, estado: 'Vencida' },
];

export default function FacturacionPage() {
  const [facturas, setFacturas] = useState<Factura[]>(facturasIniciales);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'warning' }>({ visible: false, message: '', type: 'info' });
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);

  const { formatearMoneda } = useCurrencyFormatter();

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

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
    setFacturas(prev => prev.map(f => f.id === facturaSeleccionada.id ? { ...f, estado: 'Pagada' } : f));
    setIsPagoModalOpen(false);
    setFacturaSeleccionada(null);
    showToast(`¡Pago de ${formatearMoneda(monto)} registrado correctamente!`, 'success');
  };

  // KPIs dinámicos
  const ingresosMes = facturas.filter(f => f.estado === 'Pagada').reduce((acc, f) => acc + f.total, 0) + 43980; // Sumado a base ficticia para que no se vea vacío
  const porCobrar = facturas.filter(f => f.estado === 'Pendiente').reduce((acc, f) => acc + f.total, 0) + 11550;
  const vencido = facturas.filter(f => f.estado === 'Vencida').reduce((acc, f) => acc + f.total, 0);

  return (
    <div className="flex flex-col gap-8 h-full relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-fadeIn
          ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
            toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'}`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'info'}
          </span>
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
          onClick={() => showToast('Abriendo generador de facturas...', 'info')}
          className="flex items-center justify-center gap-2 bg-brand-salmonLight text-brand-salmonDark hover:bg-brand-salmon hover:text-white transition-colors px-6 py-2 rounded-lg text-sm font-semibold shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          Generar Factura
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingresos */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200 flex flex-col gap-2 transition-all hover:border-emerald-200 hover:shadow-lg">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Ingresos del Mes</span>
            <span className="material-symbols-outlined text-brand-salmon text-[20px]">trending_up</span>
          </div>
          <span className="text-4xl font-semibold text-slate-900">{formatearMoneda(ingresosMes)}</span>
          <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            <span>+12% vs mes anterior</span>
          </div>
        </div>
        
        {/* Por Cobrar */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-slate-200 flex flex-col gap-2 transition-all hover:border-slate-300 hover:shadow-lg">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-sm font-medium">Por Cobrar</span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">pending_actions</span>
          </div>
          <span className="text-4xl font-semibold text-slate-900">{formatearMoneda(porCobrar)}</span>
          <p className="text-sm text-slate-500">Facturas pendientes</p>
        </div>
        
        {/* Vencido */}
        <div className="bg-red-50 p-6 rounded-xl shadow-card border border-red-200 flex flex-col gap-2 transition-all hover:border-red-300 hover:shadow-lg">
          <div className="flex items-center justify-between text-red-700">
            <span className="text-sm font-medium">Vencido</span>
            <span className="material-symbols-outlined text-red-600 text-[20px]">warning</span>
          </div>
          <span className="text-4xl font-semibold text-red-600">{formatearMoneda(vencido)}</span>
          <p className="text-sm text-red-600">Fuera de plazo</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-2 rounded-xl shadow-card border border-slate-200">
        <div className="flex gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <button className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium border border-transparent transition-colors">Todas</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Pagadas</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Pendientes</button>
          <button className="px-4 py-1.5 rounded-lg text-slate-600 bg-white hover:bg-slate-50 text-sm font-medium border border-transparent transition-colors">Vencidas</button>
        </div>
        <div className="flex items-center gap-2 px-3 bg-white rounded-lg border border-slate-200 focus-within:border-brand-salmon focus-within:ring-1 focus-within:ring-brand-salmon w-full sm:w-64 transition-all">
          <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
          <input 
            className="w-full bg-transparent border-none focus:ring-0 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 outline-none" 
            placeholder="N° Factura..." 
            type="text"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Factura</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha Emisión</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vencimiento</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {facturas.map((factura) => (
                <tr key={factura.id} className={`transition-colors group cursor-pointer 
                  ${factura.estado === 'Vencida' ? 'bg-red-50/30 hover:bg-red-50/50 border-l-2 border-l-red-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
                >
                  <td className="py-4 px-4 text-sm font-medium text-brand-salmon">{factura.id}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-900">{factura.cliente}</td>
                  <td className="py-4 px-4 text-sm text-slate-600">{factura.fechaEmision}</td>
                  <td className={`py-4 px-4 text-sm ${factura.estado === 'Vencida' ? 'font-medium text-red-600' : 'text-slate-600'}`}>{factura.vencimiento}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-900 text-right">{formatearMoneda(factura.total)}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium 
                      ${factura.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700' : 
                        factura.estado === 'Vencida' ? 'bg-red-100 text-red-800' : 
                        'bg-slate-100 text-slate-700'}`}
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
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> {factura.estado === 'Pagada' && 'PDF'}
                      </button>
                      
                      <button 
                        onClick={(e) => handleEnviarCorreo(e, factura.id)}
                        title={factura.estado === 'Pagada' ? 'Reenviar por Correo' : 'Enviar por Correo'} 
                        className={`flex items-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors
                          ${factura.estado === 'Pagada' ? 'px-3 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50' : 'px-2 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50'}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">mail</span> {factura.estado === 'Pagada' && 'Enviar'}
                      </button>

                      {factura.estado === 'Vencida' && (
                        <button 
                          onClick={(e) => handleNotificarAtraso(e, factura.id)}
                          title="Notificar Atraso" 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 shadow-sm rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">warning</span> Reclamar
                        </button>
                      )}

                      {factura.estado !== 'Pagada' && (
                        <button 
                          onClick={(e) => abrirModalPago(e, factura)}
                          title="Registrar Pago" 
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">payments</span> Cobrar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No hay facturas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Static) */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-slate-500 text-sm bg-white rounded-b-xl">
          <span>Mostrando 1 - {facturas.length} de {facturas.length}</span>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-400 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button className="p-1 hover:bg-slate-50 rounded border border-slate-200 text-slate-600 disabled:opacity-50 transition-colors" disabled>
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <RegistrarPagoModal 
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          setFacturaSeleccionada(null);
        }}
        contratoParaPago={facturaSeleccionada ? {
          consecutivo: facturaSeleccionada.id.replace('#FAC-', ''),
          clienteNombre: facturaSeleccionada.cliente,
          total: facturaSeleccionada.total,
          totalPagado: 0
        } : null}
        onConfirmarPago={handleConfirmarPago}
      />
    </div>
  );
}
