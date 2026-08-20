import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoParaPago: any | null; 
  onConfirmarPago: (monto: number, metodo: string, referencia: string) => void;
}

export function RegistrarPagoModal({
  isOpen,
  onClose,
  contratoParaPago,
  onConfirmarPago
}: RegistrarPagoModalProps) {
  const [pagoMonto, setPagoMonto] = useState<number | "">("");
  const [pagoMetodo, setPagoMetodo] = useState("TRANSFERENCIA");
  const [pagoReferencia, setPagoReferencia] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && contratoParaPago) {
      const saldoPendiente = Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0));
      setPagoMonto(saldoPendiente > 0 ? saldoPendiente : "");
      setPagoMetodo("TRANSFERENCIA");
      setPagoReferencia("");
    }
  }, [isOpen, contratoParaPago]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (typeof pagoMonto === 'number' && pagoMonto > 0) {
      setIsSubmitting(true);
      try {
        await onConfirmarPago(pagoMonto, pagoMetodo, pagoReferencia);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatearMonedaCOP = (valor: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  if (!isOpen || !contratoParaPago) return null;

  const saldoPendiente = Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-100 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
              ALQ-{contratoParaPago.consecutivo}
            </span>
            <h2 className="text-lg font-black text-[#1E293B] mt-1">Registrar Recaudo / Abono</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
            <div className="text-slate-500">Cliente: <strong className="text-[#1E293B]">{contratoParaPago.clienteNombre}</strong></div>
            <div className="flex justify-between text-[#1E293B]">
              <span>Total Contrato: <strong>{formatearMonedaCOP(contratoParaPago.total)}</strong></span>
              <span>Saldo Pendiente: <strong className="text-amber-500">{formatearMonedaCOP(saldoPendiente)}</strong></span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E293B] block">Monto a Abonar (COP)*</label>
            <input
              type="number"
              min={1}
              value={pagoMonto}
              onChange={(e) => setPagoMonto(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 mt-1 bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-xl text-sm font-bold text-slate-700 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[#1E293B] font-bold block">Método de Pago</label>
              <select
                value={pagoMetodo}
                onChange={(e) => setPagoMetodo(e.target.value)}
                className="w-full p-2.5 mt-1 bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-xl text-slate-700 transition-colors"
              >
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="NEQUI">Nequi</option>
                <option value="DAVIPLATA">Daviplata</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="text-[#1E293B] font-bold block">No. Comprobante / Ref.</label>
              <input
                type="text"
                value={pagoReferencia}
                onChange={(e) => setPagoReferencia(e.target.value)}
                placeholder="Ej: Aprobación #8844"
                className="w-full p-2.5 mt-1 bg-white border border-slate-200 focus:border-emerald-500 outline-none rounded-xl text-slate-700 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Recaudo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
