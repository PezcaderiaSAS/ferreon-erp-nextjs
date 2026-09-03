import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';

interface RegistrarAbonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: any;
  onConfirmar: (alquilerId: string, monto: number, metodo: string, referencia: string) => void;
}

export function RegistrarAbonoModal({ isOpen, onClose, contrato, onConfirmar }: RegistrarAbonoModalProps) {
  const [montoAbono, setMontoAbono] = useState<number | ''>('');
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');
  const [referencia, setReferencia] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMontoAbono('');
      setMetodoPago('Efectivo');
      setReferencia('');
    }
  }, [isOpen]);

  if (!contrato) return null;

  const total = Number(contrato.total) || 0;
  const depositoActual = Number(contrato.deposito) || 0;
  const saldoPendienteActual = Math.max(0, total - depositoActual);
  
  const montoIngresado = Number(montoAbono) || 0;
  const nuevoDeposito = depositoActual + montoIngresado;
  const nuevoSaldoPendiente = Math.max(0, total - nuevoDeposito);

  const porcentajeActual = total > 0 ? (depositoActual / total) * 100 : 0;
  const porcentajeAbono = total > 0 ? (montoIngresado / total) * 100 : 0;
  const porcentajeRestante = Math.max(0, 100 - porcentajeActual - porcentajeAbono);

  const handleConfirmar = async () => {
    if (montoIngresado <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirmar(contrato.id, montoIngresado, metodoPago, referencia);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Abono" maxWidth="md">
      <div className="space-y-6 animate-fadeIn">
        
        {/* Cabecera del Contrato */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Contrato #{contrato.consecutivo || contrato.id}
          </p>
          <h3 className="text-lg font-bold text-slate-800">
            {contrato.clienteNombre || 'Sin Nombre'}
          </h3>
        </div>

        {/* Barra de Progreso de Deuda */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Valor Total</p>
              <p className="text-lg font-black text-slate-800">{formatearCOP(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-indigo-500 uppercase">Saldo Pendiente Final</p>
              <p className={`text-xl font-black ${nuevoSaldoPendiente === 0 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                {formatearCOP(nuevoSaldoPendiente)}
              </p>
            </div>
          </div>

          <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${Math.min(100, porcentajeActual)}%` }} 
              title="Pagado"
            />
            {montoIngresado > 0 && (
              <div 
                className="h-full bg-indigo-400 transition-all duration-500 animate-pulse" 
                style={{ width: `${Math.min(100 - porcentajeActual, porcentajeAbono)}%` }} 
                title="Este abono"
              />
            )}
          </div>
          
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-600">Pagado: {formatearCOP(depositoActual)}</span>
            <span className="text-slate-400">Deuda Restante: {porcentajeRestante.toFixed(1)}%</span>
          </div>
        </div>

        {/* Formulario de Pago */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Monto del Abono ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input 
                type="number" 
                min={1}
                step={100}
                value={montoAbono}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setMontoAbono('');
                  else setMontoAbono(parseFloat(val));
                }}
                className="w-full pl-8 pr-3 py-3 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                placeholder="0"
                autoFocus
              />
            </div>
            {montoIngresado > saldoPendienteActual && (
              <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                ⚠️ El abono supera el saldo pendiente.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Transferencia">🏦 Transferencia</option>
                <option value="Tarjeta">💳 Tarjeta</option>
                <option value="Nequi">📱 Nequi/Daviplata</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Referencia (Opcional)</label>
              <input 
                type="text" 
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej. TX-12345"
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={isSubmitting || montoIngresado <= 0}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Confirmar Abono"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
