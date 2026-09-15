"use client";

import React, { useEffect } from 'react';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

interface AlquilerBlockingOverlayProps {
  isOpen: boolean;
  tipoDocumento: 'COTIZACION' | 'CONTRATO';
  mensajePersonalizado?: string;
}

/**
 * AlquilerBlockingOverlay
 * 
 * Capa de bloqueo visual y físico de alta gama (Glassmorphism Poka-Yoke)
 * que se activa en el milisegundo 0 del envío de una cotización o contrato.
 * Evita clics repetidos, rebotes de mouse y notifica al operador que la
 * transacción se está sincronizando con la nube de forma segura.
 */
export const AlquilerBlockingOverlay: React.FC<AlquilerBlockingOverlayProps> = ({
  isOpen,
  tipoDocumento,
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

  const esCotizacion = tipoDocumento === 'COTIZACION';

  return (
    <div 
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="alquiler-loading-title"
      aria-describedby="alquiler-loading-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none cursor-wait"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200/80 text-center space-y-4 scale-100 animate-in zoom-in-95 duration-200">
        {/* Glow de fondo decorativo sutil */}
        <div className={`absolute -top-10 -left-10 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none ${
          esCotizacion ? 'bg-blue-400' : 'bg-emerald-400'
        }`} />
        <div className={`absolute -bottom-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-40 pointer-events-none ${
          esCotizacion ? 'bg-teal-300' : 'bg-teal-400'
        }`} />

        {/* Contenedor del Spinner Principal */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${
            esCotizacion ? 'bg-blue-500' : 'bg-emerald-500'
          }`} />
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
            esCotizacion ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
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
            id="alquiler-loading-title"
            className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
          >
            {mensajePersonalizado || (esCotizacion ? 'Emitiendo Cotización Oficial...' : 'Formalizando Contrato de Alquiler...')}
          </h3>

          <p 
            id="alquiler-loading-desc"
            className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto"
          >
            {esCotizacion
              ? 'Registrando cotización comercial e indexando precios de maquinaria sin descontar inventario propio.'
              : 'Verificando bloqueo pesimista de stock, descontando maquinaria en bodega y generando orden de despacho.'}
          </p>
        </div>

        {/* Barra de Progreso Indeterminada */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
          <div className={`h-full rounded-full animate-pulse ${
            esCotizacion ? 'bg-blue-600' : 'bg-emerald-600'
          } w-3/4 mx-auto`} />
        </div>

        {/* Nota de Idempotencia y Seguridad */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Idempotencia y protección contra duplicados activa</span>
        </div>
      </div>
    </div>
  );
};
