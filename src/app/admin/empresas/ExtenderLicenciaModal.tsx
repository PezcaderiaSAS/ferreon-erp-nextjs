'use client';

import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Loader2,
  CalendarPlus
} from 'lucide-react';
import { EmpresaDirectorioItem, extenderLicenciaEmpresaAction } from '@/app/actions/ultraadmin';
import { LicenciaEstado } from '@/core/services/licencias-modulos.service';

interface ExtenderLicenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa: EmpresaDirectorioItem | null;
  onLicenciaActualizada?: (empresaId: string, nuevaFecha: string) => void;
}

const OPCIONES_RAPIDAS = [
  { dias: 15, label: '+15 Días', sublabel: 'Prueba adicional' },
  { dias: 30, label: '+30 Días', sublabel: 'Mes cortesía' },
  { dias: 90, label: '+90 Días', sublabel: 'Trimestre' },
  { dias: 365, label: '+365 Días', sublabel: 'Año completo' },
];

export function ExtenderLicenciaModal({
  isOpen,
  onClose,
  empresa,
  onLicenciaActualizada,
}: ExtenderLicenciaModalProps) {
  const [diasSeleccionados, setDiasSeleccionados] = useState<number | null>(30);
  const [modoManual, setModoManual] = useState(false);
  const [fechaManual, setFechaManual] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Extensión autorizada por UltraAdmin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (empresa) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setDiasSeleccionados(30);
      setModoManual(false);
      setMotivo('Extensión autorizada por UltraAdmin');
      
      // Fecha tentativa
      const expActual = empresa.subscription_ends_at ? new Date(empresa.subscription_ends_at) : new Date();
      const base = expActual.getTime() > Date.now() ? expActual : new Date();
      const targetDate = new Date(base.getTime() + 30 * 86_400_000);
      setFechaManual(targetDate.toISOString().split('T')[0]);
    }
  }, [empresa]);

  if (!isOpen || !empresa) return null;

  const handleSeleccionarDias = (dias: number) => {
    setDiasSeleccionados(dias);
    setModoManual(false);

    const expActual = empresa.subscription_ends_at ? new Date(empresa.subscription_ends_at) : new Date();
    const base = expActual.getTime() > Date.now() ? expActual : new Date();
    const targetDate = new Date(base.getTime() + dias * 86_400_000);
    setFechaManual(targetDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: {
        empresaId: string;
        diasExtender?: number;
        nuevaFecha?: string;
        motivo?: string;
      } = {
        empresaId: empresa.id,
        motivo,
      };

      if (modoManual && fechaManual) {
        payload.nuevaFecha = new Date(fechaManual).toISOString();
      } else if (diasSeleccionados) {
        payload.diasExtender = diasSeleccionados;
      } else {
        throw new Error('Seleccione una opción o ingrese una fecha válida.');
      }

      const res = await extenderLicenciaEmpresaAction(payload);
      if (res.success && res.nuevaFechaExpiracion) {
        setSuccessMsg(`Licencia extendida exitosamente hasta el ${res.nuevaFechaExpiracion.split('T')[0]}.`);
        if (onLicenciaActualizada) {
          onLicenciaActualizada(empresa.id, res.nuevaFechaExpiracion);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || 'No se pudo extender la licencia.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Semáforo de color
  const estadoColorMap: Record<LicenciaEstado, { badge: string; text: string }> = {
    ACTIVA: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'Activa' },
    POR_VENCER: { badge: 'bg-amber-100 text-amber-800 border-amber-200', text: 'Por Vencer' },
    EN_GRACIA: { badge: 'bg-orange-100 text-orange-800 border-orange-200', text: 'En Gracia' },
    VENCIDA: { badge: 'bg-rose-100 text-rose-800 border-rose-200', text: 'Vencida' },
  };

  const estadoInfo = estadoColorMap[empresa.estadoLicencia] || estadoColorMap.ACTIVA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-salmon/10 border border-brand-salmon/20 flex items-center justify-center text-brand-salmonDark">
              <CalendarPlus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Extender Licencia de Uso
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {empresa.nombre} • {empresa.slug}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Actual de la Licencia */}
        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Estado Actual
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${estadoInfo.badge}`}>
                  {estadoInfo.text}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {empresa.diasRestantes > 0 
                    ? `${empresa.diasRestantes} días restantes`
                    : empresa.estadoLicencia === 'EN_GRACIA'
                    ? `Período de gracia (${empresa.dias_gracia} días)`
                    : `Vencida`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Vencimiento registrado</span>
              <span className="text-xs font-semibold text-slate-700">
                {empresa.subscription_ends_at 
                  ? empresa.subscription_ends_at.split('T')[0]
                  : empresa.trial_ends_at 
                  ? `${empresa.trial_ends_at.split('T')[0]} (Trial)`
                  : 'Sin fecha'}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
              <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Opciones Rápidas */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Seleccionar Días de Cortesía / Extensión
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {OPCIONES_RAPIDAS.map((opt) => {
                const isSelected = !modoManual && diasSeleccionados === opt.dias;
                return (
                  <button
                    key={opt.dias}
                    type="button"
                    onClick={() => handleSeleccionarDias(opt.dias)}
                    className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-salmon/10 border-brand-salmon text-brand-salmonDark shadow-sm ring-1 ring-brand-salmon'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{opt.sublabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opción Manual de Fecha */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                O fijar fecha contractual exacta
              </label>
              <button
                type="button"
                onClick={() => setModoManual(!modoManual)}
                className="text-xs text-brand-salmonDark font-medium hover:underline"
              >
                {modoManual ? 'Volver a días rápidos' : 'Elegir fecha manual'}
              </button>
            </div>
            {modoManual && (
              <input
                type="date"
                value={fechaManual}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFechaManual(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-transparent bg-slate-50/50"
                required
              />
            )}
          </div>

          {/* Motivo de Extensión */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Motivo / Justificación (Auditoría inmutable)
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Renovación contrato anual, cortesía soporte..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-transparent bg-slate-50/50"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-brand-salmon hover:bg-brand-salmonDark text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-salmon/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extendiendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirmar Extensión</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
