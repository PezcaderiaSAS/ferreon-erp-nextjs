import React from 'react';

interface FinancialHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinancialHelpModal({ isOpen, onClose }: FinancialHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-50 w-full max-w-2xl rounded-3xl shadow-[12px_12px_24px_#d1d5db,-12px_-12px_24px_#ffffff] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>💡</span> Guía Rápida Financiera
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 rounded-full transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-indigo-500">Q.</span> ¿Cómo saco dinero para pagar la luz o a un empleado?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              El sistema usa &quot;Partida Doble&quot;. Para registrar un gasto, debes hacer clic en el botón <strong>&quot;Nuevo Gasto&quot;</strong> (Próximamente en Fase 5). 
              El sistema <strong>descontará</strong> el dinero de la caja que elijas (ej: Caja Menor) y lo <strong>registrará</strong> en la cuenta de Gastos correspondiente.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-indigo-500">Q.</span> ¿Me equivoqué al registrar un cobro, puedo borrarlo?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>NO.</strong> En contabilidad real, no se puede borrar ni alterar dinero (es ilegal). 
              Si te equivocas, debes crear un <strong>&quot;Contra-Asiento&quot;</strong>. Esto significa registrar una operación inversa (una devolución) para que la suma matemática quede en cero.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="text-indigo-500">Q.</span> ¿Cómo funciona el ROI (Retorno de Inversión)?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              El ROI te dice si un equipo ya recuperó lo que costó. <br/><br/>
              <em>Ejemplo:</em> Si compras un andamio por $500,000 COP y en 3 meses ha generado $600,000 COP en alquileres, el sistema te mostrará un ROI positivo (Ganancia). Si solo ha generado $100,000 COP, estará en rojo, indicando que aún necesitas alquilarlo más para recuperar la inversión.
            </p>
          </div>

        </div>

        {/* Pie */}
        <div className="bg-slate-100 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
