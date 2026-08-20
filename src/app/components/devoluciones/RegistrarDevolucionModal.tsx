import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';


export interface RegistrarDevolucionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoParaDevolucion: any | null;
  onConfirmarDevolucion: (
    cantidades: { [equipoId: string]: number },
    danos: { [equipoId: string]: number },
    pagoDanos: { monto: number; metodo: string; referencia: string } | null
  ) => void;
}

export function RegistrarDevolucionModal({
  isOpen,
  onClose,
  contratoParaDevolucion,
  onConfirmarDevolucion
}: RegistrarDevolucionModalProps) {
  const [cantidades, setCantidades] = useState<{ [equipoId: string]: number }>({});
  const [danos, setDanos] = useState<{ [equipoId: string]: number }>({});
  const [generarPago, setGenerarPago] = useState<boolean>(false);
  const [metodoPago, setMetodoPago] = useState<string>('TRANSFERENCIA');
  const [referencia, setReferencia] = useState<string>('');

  // Sincronizar estado inicial cuando cambia el contrato
  React.useEffect(() => {
    if (isOpen && contratoParaDevolucion) {
      const initialCantidades: { [eqId: string]: number } = {};
      const initialDanos: { [eqId: string]: number } = {};
      contratoParaDevolucion.items.forEach((it) => {
        const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
        initialCantidades[it.equipoId] = pendientes;
        initialDanos[it.equipoId] = 0;
      });
      setCantidades(initialCantidades);
      setDanos(initialDanos);
      setGenerarPago(false);
      setReferencia('');
    }
  }, [isOpen, contratoParaDevolucion]);

  if (!isOpen || !contratoParaDevolucion) return null;

  const totalDanos = Object.values(danos).reduce((acc, curr) => acc + (curr || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pagoDanosInfo = generarPago && totalDanos > 0 
      ? { monto: totalDanos, metodo: metodoPago, referencia }
      : null;

    onConfirmarDevolucion(cantidades, danos, pagoDanosInfo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100">
              ALQ-{contratoParaDevolucion.consecutivo}
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-2">Recepción de Equipos & Registro de Daños</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {contratoParaDevolucion.items.map((it) => {
              const pendientes = it.cantidad - (it.cantidadDevuelta || 0);
              return (
                <div key={it.equipoId} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <strong className="text-slate-700">{it.nombre}</strong>
                    <span className="text-sky-600 font-bold bg-sky-100/50 px-2 py-1 rounded-lg text-xs">
                      Pendientes: {pendientes} u.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">
                        Cant. a Devolver Hoy:
                      </label>
                      <input 
                        type="number" 
                        min={0} 
                        max={pendientes}
                        value={cantidades[it.equipoId] ?? 0}
                        onChange={(e) => setCantidades({ ...cantidades, [it.equipoId]: parseInt(e.target.value, 10) || 0 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">
                        Costo Daño/Avería (COP):
                      </label>
                      <input 
                        type="number" 
                        min={0}
                        value={danos[it.equipoId] ?? 0}
                        onChange={(e) => setDanos({ ...danos, [it.equipoId]: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalDanos > 0 && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 space-y-4">
              <div className="flex items-center space-x-2 text-red-600 font-bold">
                <AlertCircle className="w-5 h-5" />
                <span>Total de daños a facturar: ${totalDanos.toLocaleString('es-CO')}</span>
              </div>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={generarPago} 
                  onChange={(e) => setGenerarPago(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Registrar pago de estos daños inmediatamente
                </span>
              </label>

              {generarPago && (
                <div className="grid grid-cols-2 gap-4 mt-3 animate-fadeIn">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Método de Pago:</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    >
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                      <option value="NEQUI">Nequi</option>
                      <option value="DAVIPLATA">Daviplata</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Ref. Comprobante:</label>
                    <input
                      type="text"
                      placeholder="Obligatorio para digital"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      required={metodoPago !== 'EFECTIVO'}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-sky-600/20"
            >
              Confirmar Reingreso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
