'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Scale, ShieldCheck, AlertTriangle, ArrowRight, Loader2, FileCheck2 } from 'lucide-react';
import { ConsentCheckbox } from './ConsentCheckbox';
import { registrarAceptacionTerminosAction } from '@/app/actions/terminos';

interface TermsReacceptanceModalProps {
  isOpen: boolean;
  empresaId: string;
}

export const TermsReacceptanceModal: React.FC<TermsReacceptanceModalProps> = ({
  isOpen,
  empresaId,
}) => {
  const [open, setOpen] = useState(isOpen);
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!accepted) {
      setErrorMessage('Debes marcar la casilla para confirmar que has leído y aceptas los términos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await registrarAceptacionTerminosAction({ empresaId });
      if (res.success) {
        setOpen(false);
      } else {
        setErrorMessage(res.error || 'No se pudo registrar la aceptación. Intenta nuevamente.');
      }
    } catch (err: any) {
      setErrorMessage('Ocurrió un error de red al procesar tu solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header con gradiente */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 id="terms-modal-title" className="text-lg font-bold text-white tracking-tight">
              Actualización Obligatoria de Términos de Servicio
            </h2>
            <p className="text-xs text-slate-400">
              Marco de Gobernanza, Blindaje Legal y Supervisión de Maquinaria v1.0.0
            </p>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300">
          <p className="leading-relaxed">
            Hemos actualizado nuestros <strong>Términos y Condiciones</strong> y nuestra <strong>Política de Privacidad</strong> para consolidar las mejores prácticas de gobernanza tecnológica, protección de datos y deslinde de responsabilidades operativas en el ERP:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Supervisión Humana Obligatoria</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                El software es una herramienta de asistencia. El personal de tu empresa retiene el deber ineludible de verificar tarifas, tramos y devoluciones de equipos.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Aislamiento RLS y No Reentrenamiento</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tus datos de obra e inventario se aíslan mediante Row Level Security en Supabase y nunca se transfieren para entrenar modelos de IA públicos.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Para continuar utilizando los módulos de Alquileres, Bodega, Facturación y Caja de <strong>Alquileres System</strong>, es necesario que ratifiques tu conformidad con estas directrices.
          </p>

          {/* Checkbox de consentimiento */}
          <div className="pt-2">
            <ConsentCheckbox
              id="reacceptance-consent-checkbox"
              checked={accepted}
              onChange={(val) => {
                setAccepted(val);
                if (val) setErrorMessage(null);
              }}
              error={errorMessage || undefined}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Footer con botón bloqueante y Poka-Yoke */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Versión 1.0.0 Oficial</span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!accepted || isSubmitting}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-lg ${
              !accepted || isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none opacity-60'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] shadow-orange-500/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando Consentimiento...</span>
              </>
            ) : (
              <>
                <span>Aceptar y Continuar al ERP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
