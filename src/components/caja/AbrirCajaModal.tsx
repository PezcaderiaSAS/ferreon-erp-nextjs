"use client";

import React, { useState } from 'react';
import { 
  DollarSign, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  Lock
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useCajaStore } from '../../infrastructure/state/cajaStore';
import { useToastStore } from '../../infrastructure/state/toastStore';

interface AbrirCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCajaAbierta?: () => void;
}

const BASES_SUGERIDAS = [
  { label: '$50.000', valor: 50000 },
  { label: '$100.000', valor: 100000 },
  { label: '$200.000', valor: 200000 },
  { label: '$500.000', valor: 50000 },
];

export function AbrirCajaModal({
  isOpen,
  onClose,
  onCajaAbierta
}: AbrirCajaModalProps) {
  const { abrirCaja, isCajaAbierta, isLoading } = useCajaStore();
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [montoApertura, setMontoApertura] = useState<number>(100000);
  const [observaciones, setObservaciones] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleSeleccionarBase = (valor: number) => {
    setMontoApertura(valor);
    setErrorLocal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (montoApertura < 0) {
      setErrorLocal('El monto base inicial no puede ser negativo.');
      return;
    }

    setErrorLocal(null);
    const res = await abrirCaja(montoApertura, observaciones);

    if (res.success) {
      showSuccessToast(
        `Caja abierta exitosamente con base de $${montoApertura.toLocaleString('es-CO')} COP.`,
        'Punto de Venta Activo'
      );
      if (onCajaAbierta) onCajaAbierta();
      onClose();
    } else {
      setErrorLocal(res.error || 'No se pudo abrir la caja.');
      showErrorToast(res.error || 'Error al abrir caja', 'Error Poka-Yoke');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apertura de Sesión de Caja (POS)"
      maxWidth="md"
    >
      {isCajaAbierta ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-amber-300">Sesión de Caja Ya Activa</h3>
          <p className="text-sm text-slate-300">
            Ya tienes una caja abierta en este momento. La regla Poka-Yoke impide múltiples cajas simultáneas para el mismo cajero.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors border border-slate-700"
          >
            Entendido, volver
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorLocal && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{errorLocal}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
              Base Inicial de Efectivo (Flotante / Cambio) *
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <input
                type="number"
                min="0"
                step="1000"
                value={montoApertura}
                onChange={(e) => setMontoApertura(Math.max(0, parseInt(e.target.value) || 0))}
                className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-lg font-semibold tabular-nums"
                placeholder="0"
                required
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dinero en efectivo entregado para dar cambio a clientes.
            </p>
          </div>

          {/* Botones de sugerencia rápida */}
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sugerencias de Base Rápida:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {BASES_SUGERIDAS.map((base) => (
                <button
                  key={base.valor}
                  type="button"
                  onClick={() => handleSeleccionarBase(base.valor)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-center ${
                    montoApertura === base.valor
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {base.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Observaciones / Turno (Opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="block w-full rounded-lg border border-slate-700 bg-slate-900/80 p-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Ej. Turno de la mañana, recibido por supervisor Carlos M."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-lg shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Abriendo Caja...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Abrir Caja</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
