"use client";

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Coins, 
  Banknote, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Loader2, 
  ShieldCheck,
  FileText,
  DollarSign
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useCajaStore } from '../../infrastructure/state/cajaStore';
import { useToastStore } from '../../infrastructure/state/toastStore';
import { 
  calcularTotalFisicoArqueo, 
  calcularBalanceSesionCaja, 
  ConteoDenominaciones,
  DENOMINACIONES_BILLETES,
  DENOMINACIONES_MONEDAS
} from '@/core/services/calculoCajaArqueo';

interface ArqueoCierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCajaCerrada?: (resultado: any) => void;
}

export function ArqueoCierreModal({
  isOpen,
  onClose,
  onCajaCerrada
}: ArqueoCierreModalProps) {
  const { sesionActiva, resumenTurno, isCajaAbierta, cerrarCaja, isLoading } = useCajaStore();
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Estado del conteo físico
  const [billetes, setBilletes] = useState<Record<string, number>>({
    '100000': 0,
    '50000': 0,
    '20000': 0,
    '10000': 0,
    '5000': 0,
    '2000': 0
  });

  const [monedas, setMonedas] = useState<Record<string, number>>({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0
  });

  const [motivoDescuadre, setMotivoDescuadre] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const conteoActual: ConteoDenominaciones = {
    billetes: billetes as any,
    monedas: monedas as any
  };

  const totalFisicoContado = calcularTotalFisicoArqueo(conteoActual);

  // Resetear estados al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso(1);
      setErrorLocal(null);
      setMotivoDescuadre('');
      setObservacionesCierre('');
    }
  }, [isOpen]);

  const handleUpdateCantidad = (tipo: 'billete' | 'moneda', denom: number, delta: number) => {
    if (tipo === 'billete') {
      const key = denom.toString();
      const actual = billetes[key] || 0;
      setBilletes({ ...billetes, [key]: Math.max(0, actual + delta) });
    } else {
      const key = denom.toString();
      const actual = monedas[key] || 0;
      setMonedas({ ...monedas, [key]: Math.max(0, actual + delta) });
    }
  };

  const handleSetCantidadDirecta = (tipo: 'billete' | 'moneda', denom: number, valor: string) => {
    const cant = Math.max(0, parseInt(valor) || 0);
    const key = denom.toString();
    if (tipo === 'billete') {
      setBilletes({ ...billetes, [key]: cant });
    } else {
      setMonedas({ ...monedas, [key]: cant });
    }
  };

  // Cálculo de balance para paso 2 y 3
  const balance = calcularBalanceSesionCaja({
    montoApertura: resumenTurno?.montoApertura || 0,
    totalCobrosEfectivo: resumenTurno?.totalCobrosEfectivo || 0,
    totalIngresosCaja: resumenTurno?.totalIngresos || 0,
    totalEgresosCaja: resumenTurno?.totalEgresos || 0,
    montoFisicoContado: totalFisicoContado
  });

  const handleAvanzarPaso2 = () => {
    if (totalFisicoContado === 0) {
      const confirmarCero = window.confirm(
        'Has registrado $0 en efectivo físico contado. ¿Estás seguro de continuar con el arqueo?'
      );
      if (!confirmarCero) return;
    }
    setErrorLocal(null);
    setPaso(2);
  };

  const handleAvanzarPaso3 = () => {
    if (balance.requiereJustificacion && (!motivoDescuadre || motivoDescuadre.trim().length < 3)) {
      setErrorLocal('Es obligatorio ingresar la justificación o motivo del descuadre antes de continuar.');
      return;
    }
    setErrorLocal(null);
    setPaso(3);
  };

  const handleConfirmarCierre = async () => {
    setErrorLocal(null);
    const res = await cerrarCaja({
      montoCierreFisico: totalFisicoContado,
      arqueoDetalle: { billetes, monedas },
      motivoDescuadre: balance.requiereJustificacion ? motivoDescuadre : undefined,
      observaciones: observacionesCierre || undefined
    });

    if (res.success) {
      showSuccessToast(
        `Sesión de caja cerrada formalmente (${balance.clasificacionDescuadre}).`,
        'Arqueo Concluido'
      );
      if (onCajaCerrada) onCajaCerrada(res);
      onClose();
    } else {
      setErrorLocal(res.error || 'Error al ejecutar el cierre de caja.');
      showErrorToast(res.error || 'Fallo en cierre', 'Error de Caja');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arqueo y Cierre Formal de Caja (POS)"
      maxWidth="3xl"
    >
      {!isCajaAbierta ? (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-amber-300">No hay caja abierta</p>
          <p className="text-xs text-slate-400">
            Esta caja ya se encuentra cerrada o no hay sesión activa para arquear.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Barra de progreso de pasos */}
          <div className="grid grid-cols-3 gap-2 border-b border-slate-800 pb-3 text-xs font-semibold">
            <div className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
              paso === 1 ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
              <span>Conteo Físico (Ciego)</span>
            </div>
            <div className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
              paso === 2 ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
              <span>Balance & Descuadre</span>
            </div>
            <div className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
              paso === 3 ? 'border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-500'
            }`}>
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
              <span>Cierre Inmutable</span>
            </div>
          </div>

          {errorLocal && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              <span>{errorLocal}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASO 1: CONTEO FÍSICO A CIEGAS */}
          {/* ================================================================= */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Protocolo de Arqueo Ciego: Cuente el efectivo físico en su gaveta.</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Físico Contado</span>
                  <span className="text-lg font-black text-emerald-400 tabular-nums">
                    ${totalFisicoContado.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Sección Billetes */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  Billetes en Circulación
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DENOMINACIONES_BILLETES.map((denom) => {
                    const cant = billetes[denom.toString()] || 0;
                    const subtotal = cant * denom;
                    return (
                      <div key={denom} className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">${(denom / 1000).toFixed(0)}k COP</span>
                          <span className="text-[11px] text-emerald-400 font-semibold tabular-nums">
                            ${subtotal.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCantidad('billete', denom, -1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={cant || ''}
                            onChange={(e) => handleSetCantidadDirecta('billete', denom, e.target.value)}
                            className="w-full text-center bg-slate-950 border border-slate-700 rounded py-1 text-xs text-white font-bold tabular-nums"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCantidad('billete', denom, 1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección Monedas */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Monedas
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {DENOMINACIONES_MONEDAS.map((denom) => {
                    const cant = monedas[denom.toString()] || 0;
                    const subtotal = cant * denom;
                    return (
                      <div key={denom} className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">${denom.toLocaleString('es-CO')} COP</span>
                          <span className="text-[11px] text-amber-400 font-semibold tabular-nums">
                            ${subtotal.toLocaleString('es-CO')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateCantidad('moneda', denom, -1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={cant || ''}
                            onChange={(e) => handleSetCantidadDirecta('moneda', denom, e.target.value)}
                            className="w-full text-center bg-slate-950 border border-slate-700 rounded py-1 text-xs text-white font-bold tabular-nums"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCantidad('moneda', denom, 1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAvanzarPaso2}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-all"
                >
                  <span>Verificar Balance y Descuadre</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASO 2: BALANCE REVELADO & DESCUADRE */}
          {/* ================================================================= */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Comparativa de Cierre de Caja
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-1">Saldo Esperado (Sistema)</span>
                    <span className="text-base font-bold text-white tabular-nums">
                      ${balance.saldoEsperado.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60">
                    <span className="text-[11px] text-slate-400 block mb-1">Físico Contado (Cajero)</span>
                    <span className="text-base font-bold text-emerald-400 tabular-nums">
                      ${balance.montoFisicoContado.toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    balance.clasificacionDescuadre === 'CUADRADO'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : balance.clasificacionDescuadre === 'SOBRANTE'
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    <span className="text-[11px] block mb-1 font-medium">Diferencia Final</span>
                    <span className="text-base font-black tabular-nums">
                      {balance.diferencia > 0 ? `+` : ''}${balance.diferencia.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Banner de Estado */}
                <div className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
                  balance.clasificacionDescuadre === 'CUADRADO'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : balance.clasificacionDescuadre === 'SOBRANTE'
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {balance.clasificacionDescuadre === 'CUADRADO' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span>¡Excelente! El arqueo cuadra exactamente con las transacciones registradas.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>
                        Atención: Se detectó un {balance.clasificacionDescuadre} de ${Math.abs(balance.diferencia).toLocaleString('es-CO')} COP.
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Justificación obligatoria si hay descuadre */}
              {balance.requiereJustificacion && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Motivo / Justificación del Descuadre *
                  </label>
                  <textarea
                    value={motivoDescuadre}
                    onChange={(e) => setMotivoDescuadre(e.target.value)}
                    rows={2}
                    className="block w-full rounded-lg border border-amber-500/40 bg-slate-900/90 p-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    placeholder="Explica detalladamente la causa de la diferencia (ej. Billete falso retenido, cambio entregado de más en contrato #X, etc.)"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Modificar Conteo</span>
                </button>
                <button
                  type="button"
                  onClick={handleAvanzarPaso3}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-all"
                >
                  <span>Continuar a Confirmación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PASO 3: CONFIRMACIÓN INMUTABLE */}
          {/* ================================================================= */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Resumen de Liquidación del Turno
                </h4>

                <div className="text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Base Inicial:</span>
                    <span className="font-semibold text-white">${(resumenTurno?.montoApertura || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Cobros en Efectivo ({resumenTurno?.cantidadPagos || 0} pagos):</span>
                    <span className="font-semibold text-emerald-400">+${(resumenTurno?.totalCobrosEfectivo || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Ingresos Menores de Caja:</span>
                    <span className="font-semibold text-emerald-400">+${(resumenTurno?.totalIngresos || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Egresos / Gastos Menores:</span>
                    <span className="font-semibold text-rose-400">-${(resumenTurno?.totalEgresos || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Físico Entregado:</span>
                    <span className="font-bold text-white text-sm">${totalFisicoContado.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between py-1 font-bold">
                    <span className="text-slate-300">Resultado Arqueo:</span>
                    <span className={`${
                      balance.clasificacionDescuadre === 'CUADRADO' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {balance.clasificacionDescuadre} ({balance.diferencia >= 0 ? '+' : ''}${balance.diferencia.toLocaleString('es-CO')})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Observaciones Finales de Cierre (Opcional)
                </label>
                <input
                  type="text"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Ej. Entregado a supervisor nocturno, gaveta limpia"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                <span>
                  Esta acción es **definitiva e inmutable**. Una vez cerrada la caja, no podrás registrar pagos ni movimientos en este turno y se generará el acta contable de arqueo.
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al Balance</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCierre}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-rose-950/30 transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cerrando Caja...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar y Cerrar Caja Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
