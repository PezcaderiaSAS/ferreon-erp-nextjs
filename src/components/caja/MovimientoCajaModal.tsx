"use client";

import React, { useState } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  DollarSign, 
  Tag, 
  User, 
  Receipt, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useCajaStore } from '../../infrastructure/state/cajaStore';
import { useToastStore } from '../../infrastructure/state/toastStore';

interface MovimientoCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMovimientoRegistrado?: () => void;
  tipoInicial?: 'INGRESO' | 'EGRESO';
}

const CONCEPTOS_EGRESO = [
  'Compra de combustible motobomba',
  'Flete / Transporte urgente',
  'Almuerzo / Refrigerio operario',
  'Insumos de ferretería menores',
  'Pago de servicios menores'
];

const CONCEPTOS_INGRESO = [
  'Aporte de sencillo / monedas',
  'Devolución de viáticos',
  'Inyección de efectivo administrativo'
];

export function MovimientoCajaModal({
  isOpen,
  onClose,
  onMovimientoRegistrado,
  tipoInicial = 'EGRESO'
}: MovimientoCajaModalProps) {
  const { registrarMovimiento, resumenTurno, isCajaAbierta, isLoading } = useCajaStore();
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [tipo, setTipo] = useState<'INGRESO' | 'EGRESO'>(tipoInicial);
  const [monto, setMonto] = useState<number>(0);
  const [concepto, setConcepto] = useState('');
  const [beneficiario, setBeneficiario] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const saldoDisponible = resumenTurno?.saldoEsperado ?? 0;

  const handleSelectConcepto = (c: string) => {
    setConcepto(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (monto <= 0) {
      setErrorLocal('El monto debe ser mayor a 0 pesos.');
      return;
    }

    if (!concepto.trim()) {
      setErrorLocal('Debes indicar el concepto o motivo del movimiento.');
      return;
    }

    if (tipo === 'EGRESO' && monto > saldoDisponible) {
      setErrorLocal(
        `Efectivo insuficiente en caja. Saldo disponible: $${saldoDisponible.toLocaleString('es-CO')} COP.`
      );
      return;
    }

    const res = await registrarMovimiento({
      tipo,
      monto,
      concepto: concepto.trim(),
      beneficiario: beneficiario.trim() || undefined,
      comprobante: comprobante.trim() || undefined
    });

    if (res.success) {
      showSuccessToast(
        `${tipo === 'EGRESO' ? 'Gasto' : 'Ingreso'} de $${monto.toLocaleString('es-CO')} registrado con éxito.`,
        'Movimiento de Caja'
      );
      if (onMovimientoRegistrado) onMovimientoRegistrado();
      handleClose();
    } else {
      setErrorLocal(res.error || 'Error al guardar movimiento.');
      showErrorToast(res.error || 'Error en movimiento', 'Error de Caja');
    }
  };

  const handleClose = () => {
    setMonto(0);
    setConcepto('');
    setBeneficiario('');
    setComprobante('');
    setErrorLocal(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Movimiento de Caja Menor (POS)"
      maxWidth="md"
    >
      {!isCajaAbierta ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-amber-300">No hay caja abierta</p>
          <p className="text-xs text-slate-400">
            Debes abrir una sesión de caja antes de registrar gastos menores o ingresos.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Indicador de Saldo en Vivo */}
          <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Efectivo Disponible en Caja:</span>
            </div>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              ${saldoDisponible.toLocaleString('es-CO')} COP
            </span>
          </div>

          {errorLocal && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* Toggle de Tipo de Movimiento */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setTipo('EGRESO'); setErrorLocal(null); }}
              className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tipo === 'EGRESO'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-400" />
              EGRESO (Gasto Menor)
            </button>
            <button
              type="button"
              onClick={() => { setTipo('INGRESO'); setErrorLocal(null); }}
              className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                tipo === 'INGRESO'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
              INGRESO (Inyección)
            </button>
          </div>

          {/* Campo Monto */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              Monto en Efectivo *
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <DollarSign className={`h-5 w-5 ${tipo === 'EGRESO' ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <input
                type="number"
                min="1"
                step="500"
                value={monto || ''}
                onChange={(e) => setMonto(parseInt(e.target.value) || 0)}
                className={`block w-full rounded-lg border bg-slate-900/90 py-2 pl-10 pr-4 text-white text-lg font-bold tabular-nums placeholder-slate-500 focus:outline-none focus:ring-1 ${
                  tipo === 'EGRESO' 
                    ? 'border-slate-700 focus:border-rose-500 focus:ring-rose-500' 
                    : 'border-slate-700 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Conceptos rápidos */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Concepto / Motivo *
            </label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="block w-full rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-1.5"
              placeholder="Ej. Combustible para transporte de retroexcavadora"
              required
            />
            <div className="flex flex-wrap gap-1.5">
              {(tipo === 'EGRESO' ? CONCEPTOS_EGRESO : CONCEPTOS_INGRESO).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectConcepto(c)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Beneficiario y Comprobante */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {tipo === 'EGRESO' ? 'Beneficiario / Proveedor' : 'Entregado por'}
              </label>
              <input
                type="text"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Ej. Juan Pérez / Estación"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                No. Recibo / Soporte
              </label>
              <input
                type="text"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Ej. FACT-1029"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-lg transition-all disabled:opacity-50 active:scale-[0.98] ${
                tipo === 'EGRESO'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar {tipo === 'EGRESO' ? 'Gasto' : 'Ingreso'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
