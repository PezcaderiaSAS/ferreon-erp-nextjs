'use client';

import React, { useState } from 'react';
import {
  FileText, Calendar, Building2, User, Phone, CheckCircle2,
  AlertCircle, Send, ShieldCheck, DollarSign
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  LiquidacionCorteAlquiler,
  construirMensajeWhatsAppCuentaCobro
} from '@/core/services/facturacion-recurrente.service';
import { emitirCuentaCobroPeriodicaAction } from '@/app/actions/facturacion-recurrente';

export interface EmitirCuentaCobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacion: LiquidacionCorteAlquiler;
  onEmitidoExitoso?: (resultado: any) => void;
}

export function EmitirCuentaCobroModal({
  isOpen,
  onClose,
  liquidacion,
  onEmitidoExitoso,
}: EmitirCuentaCobroModalProps) {
  const [tipoDocumento, setTipoDocumento] = useState<'CUENTA_COBRO' | 'FACTURA_VENTA'>('CUENTA_COBRO');
  const [aplicaIva, setAplicaIva] = useState<boolean>(false);
  const [aplicaRetenciones, setAplicaRetenciones] = useState<boolean>(false);
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recálculo reactivo si el usuario cambia tipo de documento
  const subtotal = liquidacion.subtotal;
  const valorIva = (tipoDocumento === 'FACTURA_VENTA' || aplicaIva) ? Math.round(subtotal * 0.19) : 0;
  const valorRetefuente = aplicaRetenciones ? Math.round(subtotal * 0.025) : 0;
  const valorReteica = aplicaRetenciones ? Math.round(subtotal * 0.00966) : 0;
  const totalNeto = Math.max(0, subtotal + valorIva - valorRetefuente - valorReteica);

  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  const handleEmitir = async (conWhatsApp = false) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await emitirCuentaCobroPeriodicaAction({
        alquilerId: liquidacion.alquilerId,
        tipoDocumento,
        fechaInicioPeriodo: liquidacion.fechaDesdeEfectiva,
        fechaFinPeriodo: liquidacion.fechaHastaEfectiva,
        diasFacturables: liquidacion.diasFacturablesPeriodo,
        subtotal,
        valorIva,
        valorRetefuente,
        valorReteica,
        totalNeto,
        observaciones: observaciones.trim() || undefined,
        items: liquidacion.items.map((it) => ({
          nombre: it.nombre,
          cantidad: it.cantidad,
          dias: it.diasFacturables,
          tarifaDiaria: it.tarifaDiaria,
          subtotal: it.subtotal,
        })),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Error al emitir el documento');
        setIsSubmitting(false);
        return;
      }

      const docCreado = res.data;

      if (conWhatsApp) {
        const { url } = construirMensajeWhatsAppCuentaCobro({
          telefonoDestino: liquidacion.clienteTelefono,
          clienteNombre: liquidacion.clienteNombre,
          consecutivoDocumento: docCreado.consecutivoTexto,
          numeroContrato: liquidacion.numeroContrato,
          obraNombre: liquidacion.obraNombre,
          fechaDesde: liquidacion.fechaDesdeEfectiva,
          fechaHasta: liquidacion.fechaHastaEfectiva,
          diasFacturados: liquidacion.diasFacturablesPeriodo,
          total: totalNeto,
          itemsResumen: liquidacion.items.map((it) => ({
            nombre: it.nombre,
            cantidad: it.cantidad,
          })),
        });

        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      if (onEmitidoExitoso) {
        onEmitidoExitoso(docCreado);
      }
      onClose();
    } catch (err: any) {
      console.error('Error al emitir documento periódico:', err);
      setErrorMsg(err.message || 'Error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📄 Emisión de Cuenta de Cobro / Corte Periódico"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-100 text-sm">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Datos del Contrato y Obra */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-mono text-xs font-bold text-brand-salmon">
                Contrato #{liquidacion.numeroContrato}
              </span>
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                {liquidacion.clienteNombre}
              </h4>
            </div>

            <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setTipoDocumento('CUENTA_COBRO');
                  setAplicaIva(false);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tipoDocumento === 'CUENTA_COBRO'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Cuenta de Cobro
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoDocumento('FACTURA_VENTA');
                  setAplicaIva(true);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  tipoDocumento === 'FACTURA_VENTA'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Factura con IVA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase">Periodo del Corte</span>
              <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-200">
                {liquidacion.fechaDesdeEfectiva} al {liquidacion.fechaHastaEfectiva}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase">Días Devengados</span>
              <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {liquidacion.diasFacturablesPeriodo} días en obra
              </span>
            </div>
            {liquidacion.obraNombre && (
              <div className="col-span-2 sm:col-span-1 truncate">
                <span className="block text-[10px] text-slate-400 uppercase">Obra</span>
                <span className="truncate">{liquidacion.obraNombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Desglose de Maquinaria y Tarifas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Detalle de Maquinaria Pro-Rata ({liquidacion.items.length})
          </span>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {liquidacion.items.map((it, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center text-xs">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{it.nombre}</span>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {it.cantidad} unidad(es) × {formatearCOP(it.tarifaDiaria)}/día × {it.diasFacturables} días
                  </div>
                </div>
                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                  {formatearCOP(it.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Resumen Financiero e Impuestos */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Subtotal Días en Obra:</span>
            <span className="font-mono tabular-nums font-semibold">{formatearCOP(subtotal)}</span>
          </div>

          {valorIva > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>IVA (19%):</span>
              <span className="font-mono tabular-nums font-medium">+{formatearCOP(valorIva)}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
            <span className="text-xs font-medium">Aplicar Retenciones (RteFuente 2.5% + RteICA)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aplicaRetenciones}
                onChange={(e) => setAplicaRetenciones(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-salmon" />
            </label>
          </div>

          {aplicaRetenciones && (
            <div className="space-y-1 text-xs text-amber-600 dark:text-amber-400 pl-2 border-l-2 border-amber-500">
              <div className="flex justify-between">
                <span>RteFuente (2.5%):</span>
                <span className="font-mono tabular-nums">-{formatearCOP(valorRetefuente)}</span>
              </div>
              <div className="flex justify-between">
                <span>ReteICA (0.966%):</span>
                <span className="font-mono tabular-nums">-{formatearCOP(valorReteica)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Total a Cobrar:</span>
            <span className="text-lg font-bold font-mono tabular-nums text-brand-salmon">
              {formatearCOP(totalNeto)}
            </span>
          </div>
        </div>

        {/* 4. Botones de Acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleEmitir(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs transition-all shadow-xs"
          >
            {isSubmitting ? 'Guardando...' : 'Emitir Documento'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleEmitir(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Procesando...' : 'Emitir y Enviar WhatsApp 💬'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
