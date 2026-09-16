'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Wallet, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useCurrencyFormatter } from '../../lib/hooks/useCurrencyFormatter';
import { registrarPagoMixtoAction } from '../../app/actions/pagos';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';

export interface MetodoPagoRow {
  id: string;
  metodo: 'EFECTIVO' | 'BANCO_BANCOLOMBIA' | 'BANCO_DAVIVIENDA' | 'NEQUI' | 'DAVIPLATA' | 'SALDO_FAVOR_CLIENTE';
  monto: number;
  referencia: string;
  efectivoRecibido?: number;
}

export interface RegistrarPagoMixtoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: any | null;
  onSuccess?: (pagoData: any, reciboInfo: any) => void;
}

export function RegistrarPagoMixtoModal({
  isOpen,
  onClose,
  contrato,
  onSuccess
}: RegistrarPagoMixtoModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();
  const { clientes } = useClienteStore();
  const { updateAlquiler } = useAlquilerStore();

  const [metodos, setMetodos] = useState<MetodoPagoRow[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Obtener datos del cliente y saldo a favor
  const clienteData = useMemo(() => {
    if (!contrato) return null;
    const clienteId = contrato.clienteId || contrato.cliente_id;
    return clientes.find((c) => String(c.id) === String(clienteId)) || contrato.clientes || null;
  }, [contrato, clientes]);

  const saldoAFavorCliente = Number(clienteData?.saldo_a_favor ?? clienteData?.saldoAFavor ?? 0);

  // Inicializar líneas de pago
  useEffect(() => {
    if (isOpen && contrato) {
      const totalContrato = Number(contrato.total || 0);
      const totalPagado = Number(contrato.totalPagado ?? contrato.total_pagado ?? 0);
      const saldoPendiente = Math.max(0, totalContrato - totalPagado);

      setErrorMsg(null);
      setObservaciones('');

      // Si el cliente tiene saldo a favor, sugerir dividir o cargar una línea inicial
      setMetodos([
        {
          id: 'row_1',
          metodo: 'EFECTIVO',
          monto: saldoPendiente > 0 ? saldoPendiente : 0,
          referencia: '',
          efectivoRecibido: saldoPendiente > 0 ? saldoPendiente : 0
        }
      ]);
    }
  }, [isOpen, contrato]);

  // Cálculos reactivos de liquidación
  const liquidacion = useMemo(() => {
    if (!contrato) {
      return {
        totalAbonar: 0,
        totalContrato: 0,
        saldoPendiente: 0,
        nuevoSaldo: 0,
        totalEfectivoRecibido: 0,
        totalCambio: 0,
        montoSaldoFavor: 0,
        saldoFavorRestante: 0,
        esValido: false,
        error: null
      };
    }

    const totalContrato = Number(contrato.total || 0);
    const totalPagado = Number(contrato.totalPagado ?? contrato.total_pagado ?? 0);
    const saldoPendiente = Math.max(0, totalContrato - totalPagado);

    let totalAbonar = 0;
    let montoSaldoFavor = 0;
    let totalEfectivoRecibido = 0;
    let totalEfectivoEsperado = 0;
    let error: string | null = null;

    for (const row of metodos) {
      const m = Number(row.monto) || 0;
      if (m <= 0) {
        error = 'Todos los métodos de pago deben tener un monto mayor a cero.';
      }
      totalAbonar += m;

      if (row.metodo === 'SALDO_FAVOR_CLIENTE') {
        montoSaldoFavor += m;
      }

      if (row.metodo === 'EFECTIVO') {
        totalEfectivoEsperado += m;
        const rec = Number(row.efectivoRecibido) || 0;
        totalEfectivoRecibido += rec;
        if (rec < m) {
          error = 'El efectivo recibido no puede ser inferior al monto asignado a efectivo.';
        }
      }
    }

    if (totalAbonar <= 0) {
      error = 'Debe ingresar un monto a abonar.';
    }

    if (totalAbonar > saldoPendiente) {
      error = `El total a abonar (${formatearMoneda(totalAbonar)}) supera el saldo pendiente del contrato (${formatearMoneda(saldoPendiente)}).`;
    }

    if (montoSaldoFavor > saldoAFavorCliente) {
      error = `El saldo a favor imputado (${formatearMoneda(montoSaldoFavor)}) excede el saldo a favor disponible del cliente (${formatearMoneda(saldoAFavorCliente)}).`;
    }

    const nuevoSaldo = Math.max(0, saldoPendiente - totalAbonar);
    const totalCambio = Math.max(0, totalEfectivoRecibido - totalEfectivoEsperado);
    const saldoFavorRestante = Math.max(0, saldoAFavorCliente - montoSaldoFavor);

    return {
      totalAbonar,
      totalContrato,
      saldoPendiente,
      nuevoSaldo,
      totalEfectivoRecibido,
      totalCambio,
      montoSaldoFavor,
      saldoFavorRestante,
      esValido: !error,
      error
    };
  }, [contrato, metodos, saldoAFavorCliente, formatearMoneda]);

  if (!isOpen || !contrato) return null;

  const handleAddMetodo = () => {
    const restante = Math.max(0, liquidacion.saldoPendiente - liquidacion.totalAbonar);
    const nuevoId = `row_${Date.now()}`;
    setMetodos((prev) => [
      ...prev,
      {
        id: nuevoId,
        metodo: restante > 0 && saldoAFavorCliente > liquidacion.montoSaldoFavor ? 'SALDO_FAVOR_CLIENTE' : 'NEQUI',
        monto: restante,
        referencia: ''
      }
    ]);
  };

  const handleRemoveMetodo = (id: string) => {
    if (metodos.length <= 1) return;
    setMetodos((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdateMetodo = (id: string, field: keyof MetodoPagoRow, value: any) => {
    setMetodos((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, [field]: value };
        if (field === 'monto' && updated.metodo === 'EFECTIVO' && (updated.efectivoRecibido === undefined || updated.efectivoRecibido === m.monto)) {
          updated.efectivoRecibido = Number(value) || 0;
        }
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liquidacion.esValido || isPending) return;

    setErrorMsg(null);

    startTransition(async () => {
      try {
        const payload = {
          alquilerId: contrato.id,
          clienteId: contrato.clienteId || contrato.cliente_id,
          totalAbonar: liquidacion.totalAbonar,
          metodos: metodos.map((m) => ({
            metodo: m.metodo,
            monto: Number(m.monto),
            referencia: m.referencia?.trim() || undefined,
            efectivoRecibido: m.metodo === 'EFECTIVO' ? Number(m.efectivoRecibido) : undefined
          })),
          observaciones: observaciones.trim() || undefined,
          idempotencyKey: `pago_mixto_${contrato.id}_${Date.now()}`
        };

        const res = await registrarPagoMixtoAction(payload);

        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar el pago mixto.');
          return;
        }

        // Actualizar contrato reactivo en store local
        try {
          updateAlquiler({
            ...contrato,
            totalPagado: (Number(contrato.totalPagado || 0)) + liquidacion.totalAbonar,
            estado: liquidacion.nuevoSaldo === 0 ? 'LIQUIDADO' : contrato.estado
          });
        } catch (stErr) {
          console.warn('[RegistrarPagoMixtoModal] Warning store update:', stErr);
        }

        if (onSuccess) {
          onSuccess(res.data, res.recibo);
        }

        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inesperado al procesar el recaudo.');
      }
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pago-mixto-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Encabezado Institucional */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  ALQ-{contrato.consecutivo || contrato.id}
                </span>
                <h2 id="modal-pago-mixto-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Registrar Recaudo Mixto
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cliente: <strong className="text-slate-700 dark:text-slate-200">{clienteData?.nombre || contrato.clienteNombre || 'Cliente'}</strong>
                {clienteData?.documento ? ` (${clienteData.documento})` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Mensaje de Error */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-sm">Error en la transacción</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Ficha de Estado de Cartera del Contrato */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Total Contrato:</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatearMoneda(liquidacion.totalContrato)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Saldo Pendiente:</span>
                <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatearMoneda(liquidacion.saldoPendiente)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Saldo a Favor Cliente:</span>
                <span className={`text-sm font-bold font-mono tabular-nums ${
                  saldoAFavorCliente > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                }`}>
                  {formatearMoneda(saldoAFavorCliente)}
                </span>
              </div>
            </div>

            {/* Sección de Métodos de Pago Multilínea */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  Desglose Multilínea de Métodos de Pago
                </h3>
                <button
                  type="button"
                  onClick={handleAddMetodo}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar otro método
                </button>
              </div>

              <div className="space-y-3">
                {metodos.map((row, index) => (
                  <div 
                    key={row.id} 
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{index + 1}
                      </span>

                      {/* Selector de Método */}
                      <select
                        value={row.metodo}
                        onChange={(e) => handleUpdateMetodo(row.id, 'metodo', e.target.value)}
                        disabled={isPending}
                        className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="NEQUI">🟣 Nequi</option>
                        <option value="DAVIPLATA">🔴 Daviplata</option>
                        <option value="BANCO_BANCOLOMBIA">🏦 Bancolombia (Transferencia)</option>
                        <option value="BANCO_DAVIVIENDA">🏦 Davivienda (Transferencia)</option>
                        <option value="SALDO_FAVOR_CLIENTE" disabled={saldoAFavorCliente <= 0}>
                          ⭐ Saldo a Favor ({formatearMoneda(saldoAFavorCliente)})
                        </option>
                      </select>

                      {/* Input Monto */}
                      <div className="flex-1 max-w-[180px]">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-400">$</span>
                          <input
                            type="number"
                            min={0}
                            value={row.monto || ''}
                            onChange={(e) => handleUpdateMetodo(row.id, 'monto', parseFloat(e.target.value) || 0)}
                            placeholder="Monto"
                            disabled={isPending}
                            className="w-full text-xs font-mono font-bold pl-6 pr-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Botón Eliminar Fila */}
                      {metodos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMetodo(row.id)}
                          disabled={isPending}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Fila secundaria: Referencia o Conteo de Efectivo */}
                    {row.metodo === 'EFECTIVO' ? (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <label className="text-slate-500 block mb-1">Efectivo Recibido:</label>
                          <input
                            type="number"
                            min={row.monto}
                            value={row.efectivoRecibido ?? ''}
                            onChange={(e) => handleUpdateMetodo(row.id, 'efectivoRecibido', parseFloat(e.target.value) || 0)}
                            placeholder="Monto entregado por cliente"
                            disabled={isPending}
                            className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-1">Cambio a Devolver:</label>
                          <div className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-right tabular-nums">
                            {formatearMoneda(Math.max(0, (row.efectivoRecibido || 0) - row.monto))}
                          </div>
                        </div>
                      </div>
                    ) : row.metodo === 'SALDO_FAVOR_CLIENTE' ? (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          Se debitará del crédito acumulado del cliente
                        </span>
                        <span className="font-mono">
                          Restante: {formatearMoneda(Math.max(0, saldoAFavorCliente - row.monto))}
                        </span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <input
                          type="text"
                          value={row.referencia}
                          onChange={(e) => handleUpdateMetodo(row.id, 'referencia', e.target.value)}
                          placeholder="Número de comprobante / Referencia de transferencia..."
                          disabled={isPending}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Observaciones del Recaudo (Opcional):
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles sobre el pago o acuerdos de saldo..."
                rows={2}
                disabled={isPending}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            {/* Panel de Liquidación en Vivo */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Total Abonado con Métodos:</span>
                <span className="font-bold text-white tabular-nums text-sm">
                  {formatearMoneda(liquidacion.totalAbonar)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Nuevo Saldo Pendiente:</span>
                <span className={`font-bold tabular-nums text-sm ${
                  liquidacion.nuevoSaldo === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {formatearMoneda(liquidacion.nuevoSaldo)}
                </span>
              </div>
              {liquidacion.totalCambio > 0 && (
                <div className="flex justify-between text-emerald-400 border-t border-slate-800 pt-2 font-bold">
                  <span>Cambio Total en Efectivo a Devolver:</span>
                  <span className="tabular-nums text-sm">{formatearMoneda(liquidacion.totalCambio)}</span>
                </div>
              )}
            </div>

            {/* Mensaje de validación rápida si hay error */}
            {liquidacion.error && (
              <p className="text-xs font-medium text-rose-500 text-center">
                ⚠️ {liquidacion.error}
              </p>
            )}
          </div>

          {/* Pie de Acciones */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!liquidacion.esValido || isPending}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
                !liquidacion.esValido || isPending
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-500/20'
              }`}
            >
              <span>{isPending ? 'Procesando Recaudo...' : 'Confirmar Recaudo Mixto'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
