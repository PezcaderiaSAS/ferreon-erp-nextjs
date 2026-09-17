"use client";

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Building2, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Receipt, 
  Loader2, 
  ShieldAlert, 
  Wallet,
  Sparkles
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { 
  CuentaPagarUI, 
  AbonoProveedorUI, 
  registrarAbonoProveedorAction 
} from '../../actions/cuentas-por-pagar';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';
import { useToastStore } from '../../../infrastructure/state/toastStore';

interface RegistrarAbonoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cuentaPagar: CuentaPagarUI | null;
  onAbonoExitoso: (abono: AbonoProveedorUI, cxpActualizada: CuentaPagarUI) => void;
}

export function RegistrarAbonoProveedorModal({
  isOpen,
  onClose,
  cuentaPagar,
  onAbonoExitoso
}: RegistrarAbonoProveedorModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE'>('TRANSFERENCIA');
  const [referenciaBancaria, setReferenciaBancaria] = useState('');
  const [fechaAbono, setFechaAbono] = useState(() => new Date().toISOString().split('T')[0]);
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cuentaPagar) {
      setMontoAbono(cuentaPagar.saldo_pendiente);
      setMetodoPago('TRANSFERENCIA');
      setReferenciaBancaria('');
      setFechaAbono(new Date().toISOString().split('T')[0]);
      setObservaciones('');
    }
  }, [cuentaPagar]);

  if (!cuentaPagar) return null;

  const saldoPendiente = cuentaPagar.saldo_pendiente;
  const nuevoSaldoSimulado = Math.max(0, saldoPendiente - (montoAbono || 0));
  const superaSaldo = (montoAbono || 0) > saldoPendiente;
  const abonoInvalido = (montoAbono || 0) <= 0 || superaSaldo;

  const handlePagarTotal = () => {
    setMontoAbono(saldoPendiente);
  };

  const handlePagarMitad = () => {
    setMontoAbono(Math.round(saldoPendiente / 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (abonoInvalido) {
      if (superaSaldo) {
        showErrorToast(`El abono ($${montoAbono.toLocaleString('es-CO')}) excede el saldo pendiente ($${saldoPendiente.toLocaleString('es-CO')}).`);
      } else {
        showErrorToast('El monto del abono debe ser mayor a cero.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registrarAbonoProveedorAction({
        cuentaPagarId: cuentaPagar.id,
        montoAbono,
        metodoPago,
        fechaAbono,
        referenciaBancaria: referenciaBancaria.trim() || undefined,
        observaciones: observaciones.trim() || undefined
      });

      if (res.success && res.data) {
        showSuccessToast('Abono asentado y comprobante de egreso generado con éxito.');
        
        // Simular CXP actualizada
        const cxpActualizada: CuentaPagarUI = {
          ...cuentaPagar,
          saldo_pendiente: res.data.nuevoSaldo,
          estado: res.data.nuevoEstado,
          total_abonos: (cuentaPagar.total_abonos || 0) + montoAbono
        };

        const abonoCreado: AbonoProveedorUI = {
          id: res.data.abonoId,
          cuenta_pagar_id: cuentaPagar.id,
          numero_comprobante: res.data.numeroComprobante,
          fecha_abono: fechaAbono,
          monto_abono: montoAbono,
          metodo_pago: metodoPago,
          referencia_bancaria: referenciaBancaria.trim() || null,
          observaciones: observaciones.trim() || null,
          created_at: new Date().toISOString()
        };

        onAbonoExitoso(abonoCreado, cxpActualizada);
        onClose();
      } else {
        showErrorToast(res.error || 'Error al procesar el abono a proveedor.');
      }
    } catch (err: any) {
      console.error('[RegistrarAbonoProveedorModal] Error:', err);
      showErrorToast(err.message || 'Error inesperado al registrar el abono.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Abono / Pago a Proveedor — ${cuentaPagar.numero_orden}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Ficha Resumen de la Deuda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Proveedor:
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
              {cuentaPagar.proveedor_nombre || 'Proveedor Desconocido'}
            </p>
            <p className="text-slate-500 font-mono">NIT: {cuentaPagar.proveedor_nit || 'N/A'}</p>
          </div>

          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Vencimiento:
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
              {cuentaPagar.fecha_vencimiento}
            </p>
            <div className="mt-1">
              {cuentaPagar.semaforo === 'VENCIDA' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Vencido ({cuentaPagar.dias_mora} días)
                </span>
              )}
              {cuentaPagar.semaforo === 'POR_VENCER' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Próximo a vencer ({cuentaPagar.dias_restantes} días)
                </span>
              )}
              {cuentaPagar.semaforo === 'AL_DIA' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Al día ({cuentaPagar.dias_restantes} días)
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Saldo Pendiente:
            </span>
            <p className="font-extrabold text-rose-600 dark:text-rose-400 text-base mt-0.5">
              {formatearMoneda(cuentaPagar.saldo_pendiente)}
            </p>
            <p className="text-slate-500 text-[11px]">
              Deuda Total: {formatearMoneda(cuentaPagar.monto_total)}
            </p>
          </div>
        </div>

        {/* Input de Monto con Accesos Rápidos Poka-Yoke */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Monto a Abonar (COP) *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePagarMitad}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                50% ({formatearMoneda(Math.round(saldoPendiente / 2))})
              </button>
              <button
                type="button"
                onClick={handlePagarTotal}
                className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                Totalidad ({formatearMoneda(saldoPendiente)})
              </button>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
            <input
              type="number"
              min="1"
              max={saldoPendiente}
              value={montoAbono || ''}
              onChange={(e) => setMontoAbono(parseInt(e.target.value, 10) || 0)}
              className={`w-full pl-8 pr-4 py-3 text-lg font-mono font-bold rounded-xl border transition-all ${
                superaSaldo
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
              placeholder="0"
              required
            />
          </div>

          {/* Feedback Poka-Yoke dinámico */}
          {superaSaldo ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              El abono no puede ser superior al saldo pendiente ({formatearMoneda(saldoPendiente)}).
            </p>
          ) : (
            <div className="flex items-center justify-between text-xs p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Saldo tras este abono:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {formatearMoneda(nuevoSaldoSimulado)}
                {nuevoSaldoSimulado === 0 ? (
                  <span className="ml-2 text-emerald-600 font-black">(Liquidada / 100% Pagada)</span>
                ) : (
                  <span className="ml-2 text-amber-600 font-semibold">(Pago Parcial)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Método de Pago y Referencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Método de Pago *
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="TRANSFERENCIA">Transferencia Bancaria / PSE</option>
              <option value="EFECTIVO">Efectivo (Afecta Caja Menor/POS)</option>
              <option value="CHEQUE">Cheque de Gerencia / Postfechado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Fecha del Pago *
            </label>
            <input
              type="date"
              value={fechaAbono}
              onChange={(e) => setFechaAbono(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {metodoPago === 'EFECTIVO' && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <Wallet className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-bold">Efectivo / Caja:</span> Este egreso se vinculará a la sesión de caja abierta actualmente en el sistema y descontará del saldo físico disponible.
            </div>
          </div>
        )}

        {metodoPago !== 'EFECTIVO' && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {metodoPago === 'TRANSFERENCIA' ? 'Número de Aprobación / Comprobante Bancario' : 'Número de Cheque y Banco'}
            </label>
            <input
              type="text"
              placeholder={metodoPago === 'TRANSFERENCIA' ? 'Ej. REF-983419 Bancolombia' : 'Ej. CHQ-44910 Banco de Bogotá'}
              value={referenciaBancaria}
              onChange={(e) => setReferenciaBancaria(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Concepto / Observaciones del Egreso
          </label>
          <input
            type="text"
            placeholder="Ej. Abono a factura 1042 por compra de andamios tubulares..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || abonoInvalido}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando Abono y Emitiendo CE...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4" />
                Asentar Pago de {formatearMoneda(montoAbono || 0)}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
