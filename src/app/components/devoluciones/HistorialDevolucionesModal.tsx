import React from 'react';
import { X, Calendar, User, Package } from 'lucide-react';

import { DevolucionEntity } from '../../../core/domain/entities/devolucion';

export interface HistorialDevolucionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contratoParaDevolucion: any | null;
  devoluciones: DevolucionEntity[];
}

export function HistorialDevolucionesModal({
  isOpen,
  onClose,
  contratoParaDevolucion,
  devoluciones
}: HistorialDevolucionesModalProps) {
  if (!isOpen || !contratoParaDevolucion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5 border border-slate-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-600 border border-sky-100">
              ALQ-{contratoParaDevolucion.consecutivo}
            </span>
            <h2 className="text-xl font-black text-slate-800 mt-2">Historial de Devoluciones</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 pt-2">
          {devoluciones.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-500 font-medium">No hay devoluciones registradas</h3>
              <p className="text-xs text-slate-400 mt-1">
                Los reingresos a bodega de este contrato aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-sky-100 ml-4 space-y-8 pb-4">
              {devoluciones.map((dev, index) => (
                <div key={dev.id} className="relative pl-6">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white" />
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                      <div className="flex items-center space-x-2 text-sky-700 font-bold text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{dev.fechaDevolucion.toLocaleDateString()} {dev.fechaDevolucion.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        <User className="w-3.5 h-3.5" />
                        <span>{dev.usuarioRecepcionNombre}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dev.detalles.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-200/60 last:border-0">
                          <span className="text-slate-700">{d.nombreEquipo}</span>
                          <div className="flex items-center space-x-3 text-xs">
                            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              + {d.cantidadDevuelta} u.
                            </span>
                            {d.cantidadDanada > 0 && (
                              <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                {d.cantidadDanada} averiadas
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {dev.totalCobradoPorDanos > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Cobro por Daños/Averías:</span>
                        <span className="text-red-600 font-bold">${dev.totalCobradoPorDanos.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
