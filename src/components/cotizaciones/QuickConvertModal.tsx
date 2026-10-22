'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import {
  Zap,
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { convertirCotizacionAContratoPosAction } from '@/app/actions/cotizaciones';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { obtenerFechaHoyISO } from '@/core/utils/fechas';

interface QuickConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: any;
  onSuccess?: (contratoGenerado: any) => void;
}

export function QuickConvertModal({
  isOpen,
  onClose,
  cotizacion,
  onSuccess,
}: QuickConvertModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [esErrorStock, setEsErrorStock] = useState(false);

  // Form states
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [montoDeposito, setMontoDeposito] = useState<number>(0);
  const [detallesLogistica, setDetallesLogistica] = useState<string>('');

  const todayStr = useMemo(() => obtenerFechaHoyISO(), []);

  // Formateador monetario COP
  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  const totalCotizacion = useMemo(() => {
    if (!cotizacion) return 0;
    return Number(cotizacion.total || cotizacion.total_estimado || cotizacion.subtotal || 0);
  }, [cotizacion]);

  // Inicializar depósito con valor sugerido de la cotización
  useEffect(() => {
    if (cotizacion) {
      const sugerido = Number(cotizacion.deposito_garantia || cotizacion.depositoGarantia || 0);
      setMontoDeposito(sugerido > 0 ? sugerido : 0);
      setDetallesLogistica(cotizacion.obra_direccion || cotizacion.obraDireccion || 'Entrega Mostrador POS');
      setErrorMsg(null);
      setEsErrorStock(false);
    }
  }, [cotizacion, isOpen]);

  // Accesibilidad WCAG 2.1 AA con trampa de foco y Escape
  const modalContainerRef = useModalAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
    isBlocked: isPending,
  });

  // Atajo de teclado: Enter para confirmar rápido
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isPending && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleEjecutarConversion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, montoDeposito, metodoPago, detallesLogistica]);

  if (!isOpen || !cotizacion) return null;

  const items = Array.isArray(cotizacion.cotizaciones_detalles)
    ? cotizacion.cotizaciones_detalles
    : Array.isArray(cotizacion.detalles)
      ? cotizacion.detalles
      : [];

  const handleEjecutarConversion = () => {
    setErrorMsg(null);
    setEsErrorStock(false);

    startTransition(async () => {
      try {
        const res = await convertirCotizacionAContratoPosAction({
          cotizacionId: cotizacion.id,
          montoDeposito: Number(montoDeposito) || 0,
          metodoPago,
          detallesLogistica: detallesLogistica.trim(),
          idempotencyKey: `pos_quick_${cotizacion.id}_${Date.now()}`
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al formalizar la cotización.');
          if (res.esErrorStock) {
            setEsErrorStock(true);
          }
          return;
        }

        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inesperado durante la transacción de mostrador.');
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-convert-modal-title"
    >
      <div
        ref={modalContainerRef}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-150 outline-none"
        tabIndex={-1}
      >
        {/* Cabecera Linear High-Density */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Zap className="w-4 h-4 fill-amber-500/20" />
            </div>
            <div>
              <h3 id="quick-convert-modal-title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Conversión Rápida POS (1-Clic)</span>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  #{cotizacion.consecutivo || cotizacion.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px] sm:max-w-[340px]">
                {cotizacion.cliente_nombre || 'Cliente Mostrador'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Cerrar modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 space-y-4 text-xs">
          {/* Banner de Error Poka-Yoke */}
          {errorMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                esErrorStock
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200'
                  : 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-tight font-medium">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Resumen de Equipos y Total */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Equipos</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {items.length} {items.length === 1 ? 'línea' : 'líneas'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Cotizado</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {formatearCOP(totalCotizacion)}
              </span>
            </div>
          </div>

          {/* Control de Depósito / Anticipo */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="deposito-pos-input" className="font-semibold text-slate-700 dark:text-slate-300">
                Depósito / Anticipo en Caja
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Saldo: {formatearCOP(Math.max(0, totalCotizacion - montoDeposito))}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
              <input
                id="deposito-pos-input"
                type="number"
                min="0"
                step="1000"
                value={montoDeposito || ''}
                onChange={(e) => setMontoDeposito(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="0"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: '$0 (Crédito)', val: 0 },
                { label: '20%', val: Math.round(totalCotizacion * 0.2) },
                { label: '50%', val: Math.round(totalCotizacion * 0.5) },
                { label: '100% (Total)', val: totalCotizacion },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMontoDeposito(p.val)}
                  className={`py-1 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer ${
                    montoDeposito === p.val
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Método de Pago del Depósito */}
          {montoDeposito > 0 && (
            <div className="space-y-1.5 animate-in fade-in duration-100">
              <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                Método de Pago para Depósito
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { id: 'TRANSFERENCIA', label: 'Transferencia', icon: Building2 },
                  { id: 'DATAFONO', label: 'Datafono', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = metodoPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoPago(m.id)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detalles / Destino de Logística */}
          <div className="space-y-1">
            <label htmlFor="logistica-input" className="font-semibold text-slate-700 dark:text-slate-300">
              Destino / Entrega en Obra
            </label>
            <input
              id="logistica-input"
              type="text"
              value={detallesLogistica}
              onChange={(e) => setDetallesLogistica(e.target.value)}
              placeholder="Mostrador POS / Dirección de obra"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Atajo: <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">Ctrl+Enter</kbd>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleEjecutarConversion}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 dark:border-slate-950/30 border-t-white dark:border-t-slate-950 rounded-full animate-spin" />
                  <span>Formalizando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Formalizar Contrato (1-Clic)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
