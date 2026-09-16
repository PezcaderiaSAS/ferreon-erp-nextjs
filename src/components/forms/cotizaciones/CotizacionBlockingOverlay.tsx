'use client';

import React from 'react';
import { Lock, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type EtapaConversion = 
  | 'VERIFICANDO_STOCK'
  | 'BLOQUEANDO_INVENTARIO'
  | 'GENERANDO_CONTRATO'
  | 'COMPLETADO'
  | 'ERROR';

interface CotizacionBlockingOverlayProps {
  isVisible: boolean;
  consecutivo?: string;
  etapa?: EtapaConversion;
  mensaje?: string;
}

/**
 * Componente Poka-Yoke: Overlay de Bloqueo Transaccional
 * Impide clics repetidos y concurrencia errática en el cliente mientras se ejecuta
 * la transacción atómica con bloqueo pesimista en Supabase PostgreSQL.
 */
export function CotizacionBlockingOverlay({
  isVisible,
  consecutivo,
  etapa = 'BLOQUEANDO_INVENTARIO',
  mensaje
}: CotizacionBlockingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="poka-yoke-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Icono central de estado con animación reactiva */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-200 dark:border-amber-800/40">
          {etapa === 'COMPLETADO' ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-in zoom-in-50" />
          ) : etapa === 'ERROR' ? (
            <AlertTriangle className="w-8 h-8 text-rose-600 animate-bounce" />
          ) : (
            <>
              <Lock className="w-8 h-8 text-amber-600 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              </div>
            </>
          )}
        </div>

        {/* Textos descriptivos */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transacción Atómica en Curso
          </div>
          
          <h3 id="poka-yoke-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {etapa === 'COMPLETADO' 
              ? '¡Contrato Formalizado con Éxito!' 
              : `Formalizando ${consecutivo || 'Cotización'}...`}
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            {mensaje || (
              etapa === 'VERIFICANDO_STOCK' 
                ? 'Comprobando existencias físicas en tiempo real...'
                : etapa === 'BLOQUEANDO_INVENTARIO'
                ? 'Bloqueando stock pesimista (ORDER BY id ASC FOR UPDATE)...'
                : etapa === 'GENERANDO_CONTRATO'
                ? 'Emitiendo contrato legal y registrando movimientos en Kardex...'
                : 'Por favor, espere. No cierre ni recargue esta ventana.'
            )}
          </p>
        </div>

        {/* Línea de progreso interactiva */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-brand-salmon to-emerald-500 h-full w-full animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Pie informativo Poka-Yoke */}
        <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 font-mono">
          <span>Idempotencia garantizada</span>
          <span>•</span>
          <span>Cero sobreventa</span>
        </div>
      </div>
    </div>
  );
}
