'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Split, Calendar, Layers, X, ShieldAlert } from 'lucide-react';

export interface OverbookingConflictInfo {
  lineaIndex: number;
  lineaNumero: number;
  equipoId: string | number;
  equipoNombre: string;
  cantidadSolicitada: number;
  capacidadDisponible: number;
  deficit: number;
  diaPico: string;
}

export interface ModalResolucionOverbookingProps {
  isOpen: boolean;
  onClose: () => void;
  conflicto: OverbookingConflictInfo | null;
  onDividirLinea: (lineaIndex: number, cantidadDisponible: number, cantidadSubcontratada: number) => void;
  onAjustarFechas: (lineaIndex: number, nuevaFechaInicio: string) => void;
  onAjustarCantidad: (lineaIndex: number, nuevaCantidad: number) => void;
}

export const ModalResolucionOverbooking: React.FC<ModalResolucionOverbookingProps> = ({
  isOpen,
  onClose,
  conflicto,
  onDividirLinea,
  onAjustarFechas,
  onAjustarCantidad,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !conflicto) return null;

  // Fecha sugerida siguiente (7 días después del día pico)
  const fechaSugerida = (() => {
    try {
      const d = new Date(`${conflicto.diaPico}T00:00:00Z`);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  })();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-overbooking-title"
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-overbooking-title" className="text-sm font-bold text-slate-900">Conflicto de Capacidad Concurrente WMS</h3>
              <p className="text-xs text-rose-700 font-medium">Sobreventa temporal detectada en muelle • Alquileres System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con Diagnóstico Forense */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Línea de Alquiler Afectada:</span>
              <span className="font-bold text-slate-900 font-mono">#{conflicto.lineaNumero}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Equipo / Maquinaria:</span>
              <span className="font-bold text-slate-900">{conflicto.equipoNombre}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Fecha Pico de Colapso:</span>
              <span className="font-bold text-rose-700 font-mono">{conflicto.diaPico}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white rounded border border-slate-100">
                <span className="block text-[10px] uppercase text-slate-400">Solicitadas</span>
                <span className="text-sm font-bold text-slate-800">{conflicto.cantidadSolicitada}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                <span className="block text-[10px] uppercase text-emerald-600">Disponibles</span>
                <span className="text-sm font-bold text-emerald-800">{conflicto.capacidadDisponible}</span>
              </div>
              <div className="p-2 bg-rose-50 rounded border border-rose-100">
                <span className="block text-[10px] uppercase text-rose-600">Déficit</span>
                <span className="text-sm font-bold text-rose-700">-{conflicto.deficit}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Para formalizar este contrato sin retrasar la obra del cliente, seleccione una de las siguientes soluciones asistidas:
          </p>

          {/* Opciones de Resolución Asistida */}
          <div className="space-y-2.5">
            {/* Opción 1: Dividir Línea (Re-Rent) */}
            <button
              type="button"
              onClick={() => onDividirLinea(conflicto.lineaIndex, conflicto.capacidadDisponible, conflicto.deficit)}
              className="w-full p-3 text-left border border-slate-200 hover:border-slate-900 rounded-lg hover:bg-slate-50 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 bg-sky-50 text-sky-700 rounded-lg group-hover:bg-sky-100 transition-colors shrink-0 mt-0.5">
                <Split className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-slate-950">
                  Dividir Línea (Subcontratación Re-Rent)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Asigna {conflicto.capacidadDisponible} unidades de bodega propia y crea automáticamente una línea contigua por {conflicto.deficit} unidades para subcontratar con aliado.
                </span>
              </div>
            </button>

            {/* Opción 2: Ajustar Fechas */}
            <button
              type="button"
              onClick={() => onAjustarFechas(conflicto.lineaIndex, fechaSugerida)}
              className="w-full p-3 text-left border border-slate-200 hover:border-slate-900 rounded-lg hover:bg-slate-50 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg group-hover:bg-amber-100 transition-colors shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-slate-950">
                  Ajustar Fechas a Próxima Ventana Libre
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Desplaza el inicio de este bloque temporal a partir del {fechaSugerida}, cuando retornan equipos de contratos previos.
                </span>
              </div>
            </button>

            {/* Opción 3: Ajustar Cantidad */}
            <button
              type="button"
              onClick={() => onAjustarCantidad(conflicto.lineaIndex, conflicto.capacidadDisponible)}
              className="w-full p-3 text-left border border-slate-200 hover:border-slate-900 rounded-lg hover:bg-slate-50 transition-all flex items-start gap-3 group"
            >
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-100 transition-colors shrink-0 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900 group-hover:text-slate-950">
                  Ajustar Cantidad a Cupo Máximo ({conflicto.capacidadDisponible} unidades)
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Reduce las unidades de esta línea al cupo exacto disponible en muelle sin recurrir a terceros.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar y Editar Manualmente
          </button>
        </div>
      </div>
    </div>
  );
};
