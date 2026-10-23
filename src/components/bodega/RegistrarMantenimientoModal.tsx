'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, X, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { registrarMantenimientoPreventivoAction } from '@/app/actions/mantenimiento';
import { useToastStore } from '@/infrastructure/state/toastStore';

export interface RegistrarMantenimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: any;
  onSuccess?: () => void;
}

export function RegistrarMantenimientoModal({
  isOpen,
  onClose,
  equipo,
  onSuccess,
}: RegistrarMantenimientoModalProps) {
  const stockEnTaller = Number(equipo?.stock_mantenimiento ?? equipo?.stockMantenimiento ?? 0);
  const [cantidad, setCantidad] = useState<number>(stockEnTaller > 0 ? stockEnTaller : 1);
  const [observaciones, setObservaciones] = useState<string>('');
  const [costoInsumos, setCostoInsumos] = useState<string>('0');
  const [tecnico, setTecnico] = useState<string>('Taller de Mantenimiento');
  const [reiniciarHorometro, setReiniciarHorometro] = useState<boolean>(true);
  const [reiniciarDias, setReiniciarDias] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { showSuccessToast, showErrorToast } = useToastStore();

  useEffect(() => {
    if (equipo) {
      const enTaller = Number(equipo.stock_mantenimiento ?? equipo.stockMantenimiento ?? 0);
      setCantidad(enTaller > 0 ? enTaller : 1);
      setObservaciones('Revisión técnica preventiva, lubricación y puesta a punto operativa.');
      setCostoInsumos('0');
    }
  }, [equipo]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !equipo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observaciones || observaciones.trim().length < 3) {
      showErrorToast('Por favor describe las tareas técnicas u observaciones realizadas.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await registrarMantenimientoPreventivoAction({
        equipoId: equipo.id,
        cantidad: Number(cantidad),
        observaciones: observaciones.trim(),
        costoInsumos: Number(costoInsumos) || 0,
        tecnicoResponsable: tecnico.trim(),
        reiniciarHorometro,
        reiniciarDias,
      });

      if (!res.success) {
        showErrorToast(res.error || 'Error al asentar el mantenimiento.');
        return;
      }

      showSuccessToast(
        `¡Mantenimiento registrado con éxito para ${equipo.nombre}! ${cantidad} unidad(es) reintegrada(s) a Disponible.`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      showErrorToast(err.message || 'Error inesperado al registrar el mantenimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-mantenimiento-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-mantenimiento-title" className="text-base font-bold text-white tracking-tight">
                Puesta a Punto & Mantenimiento Preventivo
              </h3>
              <p className="text-xs text-slate-400">
                {equipo.codigo || equipo.sku} • <span className="text-slate-200 font-semibold">{equipo.nombre}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs text-slate-700">
          {/* Banner de Estado Técnico Actual */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Unidades en Taller / Técnica:</span>
            </div>
            <span className="font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-amber-300">
              {stockEnTaller} unids
            </span>
          </div>

          {/* Cantidad a Liberar */}
          <div>
            <label htmlFor="maint-cant" className="font-bold block mb-1 text-slate-800">
              Cantidad de Unidades a Reintegrar a Disponible:
            </label>
            <input
              id="maint-cant"
              type="number"
              min="1"
              max={stockEnTaller > 0 ? stockEnTaller : 999}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:bg-white focus:border-amber-500 focus:outline-hidden"
              required
            />
            {stockEnTaller > 0 && (
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Máximo permitido: {stockEnTaller} unidad(es) actualmente en mantenimiento.
              </span>
            )}
          </div>

          {/* Observaciones Técnicas */}
          <div>
            <label htmlFor="maint-obs" className="font-bold block mb-1 text-slate-800">
              Detalle de Tareas Técnicas / Insumos Aplicados:
            </label>
            <textarea
              id="maint-obs"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Cambio de aceite motor 10W-30, bujía nueva, calibración de balancines y prueba de compresión."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Costo Insumos y Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="maint-costo" className="font-bold block mb-1 text-slate-800">
                Costo Insumos / Repuestos ($ COP):
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  id="maint-costo"
                  type="number"
                  min="0"
                  value={costoInsumos}
                  onChange={(e) => setCostoInsumos(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maint-tecnico" className="font-bold block mb-1 text-slate-800">
                Técnico o Taller Responsable:
              </label>
              <input
                id="maint-tecnico"
                type="text"
                value={tecnico}
                onChange={(e) => setTecnico(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Opciones de Reseteo Poka-Yoke */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
            <span className="font-bold text-slate-700">Controles de Ciclo Preventivo:</span>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reiniciarHorometro}
                onChange={(e) => setReiniciarHorometro(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-slate-700">Reiniciar contador de horas de motor (Horómetro a 0)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reiniciarDias}
                onChange={(e) => setReiniciarDias(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-slate-700">Reiniciar contador de días acumulados en obra a 0</span>
            </label>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Asentando en Kardex...' : 'Certificar Puesta a Punto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
