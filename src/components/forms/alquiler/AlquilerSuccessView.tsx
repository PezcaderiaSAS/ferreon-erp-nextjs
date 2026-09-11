import React from 'react';
import { CheckCircle, FileText, Printer, ArrowRight } from 'lucide-react';

interface AlquilerSuccessViewProps {
  isEditMode: boolean;
  savedAlquilerData: any;
  onPrint: (size: 'LETTER' | 'A5') => void;
  onContinue: (alquiler: any) => void;
}

export const AlquilerSuccessView: React.FC<AlquilerSuccessViewProps> = ({
  isEditMode,
  savedAlquilerData,
  onPrint,
  onContinue,
}) => {
  const consecutivoDisplay = savedAlquilerData?.consecutivo || '101';
  const nombreCliente = savedAlquilerData?.clienteNombre || 'Cliente';

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl shadow-inner">
        <CheckCircle className="w-9 h-9 text-emerald-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {isEditMode ? "¡Contrato Actualizado Exitosamente!" : "¡Contrato Guardado Exitosamente!"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          El contrato <span className="font-bold text-slate-700 font-mono">#{consecutivoDisplay}</span> ({nombreCliente}) ha sido registrado en el sistema.
        </p>
      </div>

      {/* Opciones de Emisión Oficial */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 w-full max-w-lg space-y-4 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Emisión y Descarga del Documento (PDF)
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPrint('LETTER')}
            className="px-4 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-98"
          >
            <FileText className="w-4 h-4" />
            <span>Ver / Imprimir Carta (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => onPrint('A5')}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>Media Carta / A5 (PDF)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => onContinue(savedAlquilerData)}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Continuar y Ver en Listado</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
