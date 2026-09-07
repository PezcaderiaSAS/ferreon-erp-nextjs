import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { generateIdempotencyKey } from '../../../lib/utils/idempotency';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';

export interface RegistrarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoParaPago: any | null; 
  onConfirmarPago: (monto: number, metodo: string, referencia: string, efectivoRecibido?: number, cambioEntregado?: number) => void;
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
  const [efectivoRecibido, setEfectivoRecibido] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cambioEntregado = (pagoMetodo === 'EFECTIVO' && typeof efectivoRecibido === 'number' && typeof pagoMonto === 'number') 
    ? Math.max(0, efectivoRecibido - pagoMonto) 
    : 0;

  const { formatearMoneda, monedaConfig } = useCurrencyFormatter();

  useEffect(() => {
    if (isOpen && contratoParaPago) {
      const saldoPendiente = Math.max(0, contratoParaPago.total - (contratoParaPago.totalPagado || 0));
      setPagoMonto(saldoPendiente > 0 ? saldoPendiente : "");
      setPagoMetodo("TRANSFERENCIA");
      setPagoReferencia("");
      setEfectivoRecibido("");
    }
  }, [isOpen, contratoParaPago]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (typeof pagoMonto === 'number' && pagoMonto > 0) {
      if (pagoMetodo === 'EFECTIVO' && typeof efectivoRecibido === 'number' && efectivoRecibido < pagoMonto) {
        alert('Poka-Yoke: El efectivo recibido no puede ser menor al monto a abonar.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onConfirmarPago(
          pagoMonto, 
          pagoMetodo, 
          pagoReferencia, 
          pagoMetodo === 'EFECTIVO' ? Number(efectivoRecibido) : undefined,
          pagoMetodo === 'EFECTIVO' ? cambioEntregado : undefined
        );
      } finally {
        setIsSubmitting(false);
      }
    }
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
              <span>Total Contrato: <strong>{formatearMoneda(contratoParaPago.total)}</strong></span>
              <span>Saldo Pendiente: <strong className="text-amber-500">{formatearMoneda(saldoPendiente)}</strong></span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E293B] block">Monto a Abonar ({monedaConfig.codigo})*</label>
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

          {pagoMetodo === 'EFECTIVO' && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mt-4 animate-fadeIn">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>💵</span>
                <span>Calculadora de Vueltas (Poka-Yoke)</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Efectivo Recibido</label>
                  <input
                    type="number"
                    min={typeof pagoMonto === 'number' ? pagoMonto : 1}
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(e.target.value === "" ? "" : parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 50000"
                    className="w-full p-2.5 mt-1 bg-white border border-amber-200 focus:border-amber-500 outline-none rounded-xl text-sm font-bold text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Cambio a Entregar</label>
                  <div className="w-full p-2.5 mt-1 bg-slate-100 border border-slate-200 rounded-xl text-sm font-black text-amber-600 flex items-center justify-between">
                    <span>{formatearMoneda(cambioEntregado)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="min-w-[150px]"
            >
              Confirmar Recaudo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
