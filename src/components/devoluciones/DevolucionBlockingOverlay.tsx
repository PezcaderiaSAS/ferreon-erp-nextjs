"use client";

import React, { useEffect } from 'react';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

interface DevolucionBlockingOverlayProps {
  isOpen: boolean;
  mensajePersonalizado?: string;
}

/**
 * DevolucionBlockingOverlay
 * 
 * Capa de bloqueo visual y físico (Glassmorphism Poka-Yoke)
 * que se activa en el milisegundo 0 del envío de una devolución.
 * Evita clics repetidos, rebotes de mouse y notifica al operador que la
 * transacción se está sincronizando con la base de datos de forma segura.
 */
export const DevolucionBlockingOverlay: React.FC<DevolucionBlockingOverlayProps> = ({
  isOpen,
  mensajePersonalizado,
}) => {
  // Prevenir navegación accidental con tecla ESC o Tab mientras se procesa
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="devolucion-loading-title"
      aria-describedby="devolucion-loading-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none cursor-wait"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200/80 text-center space-y-4 scale-100 animate-in zoom-in-95 duration-200">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none bg-amber-400" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none bg-blue-400" />

        {/* Contenedor del Spinner Principal */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-amber-500" />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner bg-amber-50 text-amber-700 border border-amber-200">
            <Loader2 className="w-8 h-8 animate-spin text-current" />
          </div>
        </div>

        {/* Textos y Jerarquía */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>FerreOn Cloud Transaccional</span>
          </div>

          <h3 
            id="devolucion-loading-title"
            className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
          >
            {mensajePersonalizado || 'Procesando Devolución e Inspección...'}
          </h3>

          <p 
            id="devolucion-loading-desc"
            className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto"
          >
            Aplicando Split-Line inmutable, clasificando inventario físico y liquidando depósitos y garantías en tiempo real.
          </p>
        </div>

        {/* Barra de Progreso Indeterminada */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
          <div className="h-full rounded-full animate-pulse bg-amber-500 w-3/4 mx-auto" />
        </div>

        {/* Nota de Idempotencia y Seguridad */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Idempotencia y protección contra doble clic activa</span>
        </div>
      </div>
    </div>
  );
};
