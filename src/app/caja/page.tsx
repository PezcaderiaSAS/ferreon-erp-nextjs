import React from 'react';

export default function CajaPage() {
  const cajaAbierta = false; 
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Gestión de Caja (POS)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-amber-500">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Estado Actual</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${cajaAbierta ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-lg font-semibold text-slate-700">
                {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
              </span>
            </div>
            
            {!cajaAbierta ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Para poder registrar pagos en efectivo en facturación, es necesario aperturar la caja del día.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-700">Monto Inicial (Base)</label>
                  <input type="number" className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Ej: 150000" />
                </div>
                <button className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                  Aperturar Caja
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  La caja está operando. Registra los pagos desde el módulo de facturación.
                </p>
                <button className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-lg shadow-md hover:bg-slate-900 transition-colors">
                  Cerrar Caja (Arqueo)
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Resumen del Día</h2>
          </div>
          <div className="p-5">
             <ul className="space-y-3 text-sm">
               <li className="flex justify-between border-b border-slate-50 pb-2">
                 <span className="text-slate-500">Base Inicial:</span>
                 <span className="font-bold text-slate-800">$0</span>
               </li>
               <li className="flex justify-between border-b border-slate-50 pb-2">
                 <span className="text-slate-500">Total Ingresos Efectivo:</span>
                 <span className="font-bold text-emerald-600">$0</span>
               </li>
               <li className="flex justify-between border-b border-slate-50 pb-2">
                 <span className="text-slate-500">Total Vueltas/Cambio:</span>
                 <span className="font-bold text-amber-600">-$0</span>
               </li>
               <li className="flex justify-between pt-2">
                 <span className="text-slate-700 font-bold">Total Esperado en Caja:</span>
                 <span className="font-black text-slate-900 text-lg">$0</span>
               </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
