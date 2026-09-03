import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DiscardChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DiscardChangesModal({ isOpen, onConfirm, onCancel }: DiscardChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-modal-title"
      >
        
        {/* Header: Ícono de alerta y Botón X de cierre */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-salmon"
            aria-label="Cerrar modal y seguir editando"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Textos descriptivos */}
        <h3 id="discard-modal-title" className="text-xl font-bold text-slate-800 mb-2">
          ¿Descartar cambios?
        </h3>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          Tienes información sin guardar en este formulario. Si sales ahora, 
          <strong className="font-semibold text-slate-800"> perderás todos los datos ingresados</strong> y no podrás recuperarlos.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 w-full sm:w-auto text-center order-2 sm:order-1"
          >
            Descartar y salir
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 w-full sm:w-auto text-center order-1 sm:order-2"
          >
            Seguir registrando
          </button>
        </div>
      </div>
    </div>
  );
}
