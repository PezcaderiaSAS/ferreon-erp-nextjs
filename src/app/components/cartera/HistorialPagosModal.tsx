import React from 'react';
import { X, Receipt } from 'lucide-react';

export interface HistorialPagosModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoParaPago: any | null; 
  pagosFiltrados: any[]; 
}

export function HistorialPagosModal({
  isOpen,
  onClose,
  contratoParaPago,
  pagosFiltrados
}: HistorialPagosModalProps) {
  if (!isOpen || !contratoParaPago) return null;

  const formatearMonedaCOP = (valor: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const totalPagado = contratoParaPago.totalPagado || 0;
  const saldoPendiente = Math.max(0, contratoParaPago.total - totalPagado);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-100 shadow-2xl relative">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200">
              ALQ-{contratoParaPago.consecutivo}
            </span>
            <h2 className="text-lg font-black text-[#1E293B] mt-1">Historial de Pagos y Abonos</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner QC2: Detalle Financiero del Contrato */}
        <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
          <div className="text-sm mb-2 text-slate-500">Cliente: <strong className="text-[#1E293B]">{contratoParaPago.clienteNombre}</strong></div>
          <div className="grid grid-cols-3 gap-2 divide-x divide-slate-200 text-center">
            <div className="px-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Facturado</span>
              <strong className="text-sm font-black text-[#1E293B]">{formatearMonedaCOP(contratoParaPago.total)}</strong>
            </div>
            <div className="px-2">
              <span className="block text-[10px] uppercase font-bold text-emerald-600">Total Pagado</span>
              <strong className="text-sm font-black text-emerald-600">{formatearMonedaCOP(totalPagado)}</strong>
            </div>
            <div className="px-2">
              <span className="block text-[10px] uppercase font-bold text-amber-500">Saldo Pendiente</span>
              <strong className="text-sm font-black text-amber-500">{formatearMonedaCOP(saldoPendiente)}</strong>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            {saldoPendiente <= 0 ? (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                <Receipt className="h-3 w-3" />
                <span>CONTRATO A PAZ Y SALVO</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                PAGOS PENDIENTES
              </span>
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {pagosFiltrados.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No se han registrado abonos o pagos para este contrato.</p>
          ) : (
            pagosFiltrados.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all text-xs flex justify-between items-center group">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-black text-slate-600 group-hover:text-[#1E293B] transition-colors">RECIBO #{p.consecutivo}</span>
                    <span className="text-[10px] font-medium text-slate-400">{p.fecha}</span>
                  </div>
                  <div className="text-slate-500 font-medium">
                    Método: <span className="text-[#1E293B] font-bold">{p.metodoPago}</span>
                    {p.referencia && <span className="ml-2 text-[10px] text-slate-400">Ref: {p.referencia}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Monto Abonado</span>
                  <strong className="text-base font-black text-emerald-600">{formatearMonedaCOP(p.monto)}</strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar Visor
          </button>
        </div>

      </div>
    </div>
  );
}
