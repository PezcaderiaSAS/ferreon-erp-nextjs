'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, X, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { FirmaTouchCanvas, FirmaTouchCanvasRef } from './FirmaTouchCanvas';
import { guardarFirmaClienteAlquilerAction } from '@/app/actions/firma-cliente';
import { useToastStore } from '@/infrastructure/state/toastStore';

export interface FirmaTouchPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  alquilerId?: string | number;
  clienteNombre?: string;
  clienteNit?: string;
  onFirmaConfirmada?: (firmaBase64: string, estampaLegal?: string) => void;
}

export function FirmaTouchPadModal({
  isOpen,
  onClose,
  alquilerId,
  clienteNombre = 'Cliente',
  clienteNit = '',
  onFirmaConfirmada,
}: FirmaTouchPadModalProps) {
  const canvasRef = useRef<FirmaTouchCanvasRef>(null);
  const [tieneTrazo, setTieneTrazo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showSuccessToast, showErrorToast } = useToastStore();

  useEffect(() => {
    if (isOpen) {
      setTieneTrazo(false);
      setErrorMsg(null);
      // Limpiar al abrir
      setTimeout(() => {
        canvasRef.current?.limpiar();
      }, 50);
    }
  }, [isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleLimpiar = () => {
    canvasRef.current?.limpiar();
    setTieneTrazo(false);
    setErrorMsg(null);
  };

  const handleConfirmar = async () => {
    if (!canvasRef.current || !tieneTrazo) {
      setErrorMsg('Debe ingresar su firma en el recuadro antes de certificar.');
      return;
    }

    const firmaBase64 = canvasRef.current.obtenerFirmaBase64();
    if (!firmaBase64) {
      setErrorMsg('No se pudo procesar el trazo de la firma.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // Si tenemos alquilerId, persistimos directamente mediante Server Action
      if (alquilerId) {
        const res = await guardarFirmaClienteAlquilerAction({
          alquilerId,
          firmaBase64,
          clienteNombre,
          clienteNit,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al guardar la firma en el servidor.');
          showErrorToast(res.error || 'No se pudo guardar la firma digital.');
          return;
        }

        showSuccessToast('Firma digital del cliente certificada exitosamente.');
        if (onFirmaConfirmada) {
          onFirmaConfirmada(firmaBase64, res.data?.estampaLegal);
        }
      } else {
        // Modo en memoria (ej. antes de crear el alquiler en mostrador POS)
        showSuccessToast('Firma digital capturada.');
        if (onFirmaConfirmada) {
          onFirmaConfirmada(firmaBase64);
        }
      }

      onClose();
    } catch (err: any) {
      console.error('[FirmaTouchPadModal] Error:', err);
      setErrorMsg(err.message || 'Error inesperado al certificar la firma.');
      showErrorToast(err.message || 'Error al procesar la firma.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="firma-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-salmon/10 text-brand-salmon flex items-center justify-center font-bold">
              <PenTool className="w-5 h-5 text-brand-salmon" />
            </div>
            <div>
              <h2 id="firma-modal-title" className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Firma Digital del Cliente
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {clienteNombre} {clienteNit ? `• ${clienteNit}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lienzo Touch */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Lienzo de Firma Electrónica:
              </span>
              <button
                type="button"
                onClick={handleLimpiar}
                disabled={!tieneTrazo || isSubmitting}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-salmon disabled:opacity-40 disabled:hover:text-slate-500 transition-colors font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar Trazo
              </button>
            </div>
            <FirmaTouchCanvas
              ref={canvasRef}
              onCambioTrazo={setTieneTrazo}
              altura={180}
            />
          </div>

          {/* Respaldo Legal */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              La estampa de esta firma certifica la aceptación y recepción de los equipos contratados, con validez jurídica según la Ley 527 de 1999 y el Decreto 2364 de 2012 de Colombia.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!tieneTrazo || isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-salmon hover:bg-brand-salmonDark text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Certificando...
              </span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Aceptar y Certificar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
