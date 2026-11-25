'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Camera,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import { actualizarEstadoParadaAction, ActualizarEstadoParadaInput } from '@/app/actions/logistica';
import { useToastStore } from '@/infrastructure/state/toastStore';

interface RegistrarEvidenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  parada: any;
  onParadaActualizada?: (parada: any) => void;
}

export function RegistrarEvidenciaModal({
  isOpen,
  onClose,
  parada,
  onParadaActualizada,
}: RegistrarEvidenciaModalProps) {
  const showSuccessToast = useToastStore((state) => state.showSuccessToast);
  const showErrorToast = useToastStore((state) => state.showErrorToast);

  const [estadoParada, setEstadoParada] = useState<'PENDIENTE' | 'EN_SITIO' | 'COMPLETADA' | 'FALLIDA'>(
    parada?.estado_parada || 'COMPLETADA'
  );
  const [receptorNombre, setReceptorNombre] = useState<string>(parada?.receptor_nombre || '');
  const [observaciones, setObservaciones] = useState<string>(parada?.observaciones || '');
  const [latitud, setLatitud] = useState<number | null>(parada?.latitud != null ? Number(parada.latitud) : null);
  const [longitud, setLongitud] = useState<number | null>(parada?.longitud != null ? Number(parada.longitud) : null);
  const [capturandoGps, setCapturandoGps] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Evidencias fotográficas (URLs)
  const [fotos, setFotos] = useState<string[]>(parada?.evidencia_fotos || []);
  const [urlFotoInput, setUrlFotoInput] = useState<string>('');

  if (!isOpen || !parada) return null;

  const handleCapturarGPS = () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocalización no soportada por el navegador');
      return;
    }

    setCapturandoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(Number(pos.coords.latitude.toFixed(6)));
        setLongitud(Number(pos.coords.longitude.toFixed(6)));
        setCapturandoGps(false);
        showSuccessToast('Coordenadas GPS capturadas con éxito');
      },
      (err) => {
        console.warn('Error GPS:', err);
        setCapturandoGps(false);
        showErrorToast('No fue posible obtener coordenadas GPS (permiso denegado o timeout)');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddFotoUrl = () => {
    if (!urlFotoInput.trim()) return;
    try {
      new URL(urlFotoInput.trim());
      setFotos((prev) => [...prev, urlFotoInput.trim()]);
      setUrlFotoInput('');
    } catch {
      showErrorToast('Ingrese una URL de imagen válida');
    }
  };

  const handleSimularFoto = () => {
    // Foto de muestra de maquinaria en obra para testeo rápido
    const mockFoto = `https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80`;
    setFotos((prev) => [...prev, mockFoto]);
  };

  const handleRemoveFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: ActualizarEstadoParadaInput = {
        paradaId: parada.id,
        estadoParada,
        evidenciaFotos: fotos,
        latitud: latitud != null ? latitud : null,
        longitud: longitud != null ? longitud : null,
        receptorNombre: receptorNombre.trim() || null,
        observaciones: observaciones.trim() || null,
      };

      const res = await actualizarEstadoParadaAction(payload);
      if (!res.success) {
        throw new Error(res.error || 'No fue posible actualizar la parada');
      }

      showSuccessToast(`Parada #${parada.orden_secuencia} actualizada a ${estadoParada}`);

      if (onParadaActualizada) onParadaActualizada(res.data);
      onClose();
    } catch (err: any) {
      console.error('[RegistrarEvidenciaModal Error]:', err);
      setErrorMsg(err.message || 'Error al actualizar parada');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Parada #{parada.orden_secuencia}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {parada.tipo_parada === 'ENTREGA_DESPACHO' ? 'Entrega' : 'Recogida'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                {parada.direccion_obra}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Estado de la Parada */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Estado de la Entrega / Recogida
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEstadoParada('COMPLETADA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  estadoParada === 'COMPLETADA'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Completada
              </button>
              <button
                type="button"
                onClick={() => setEstadoParada('EN_SITIO')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  estadoParada === 'EN_SITIO'
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                En Sitio
              </button>
              <button
                type="button"
                onClick={() => setEstadoParada('FALLIDA')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  estadoParada === 'FALLIDA'
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Novedad / Fallida
              </button>
            </div>
          </div>

          {/* Nombre y Contacto del Receptor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" />
              Receptor en Obra (Firma / Nombre)
            </label>
            <input
              type="text"
              placeholder="Ej: Ing. Carlos Rangel"
              value={receptorNombre}
              onChange={(e) => setReceptorNombre(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Observaciones de Entrega
            </label>
            <textarea
              rows={2}
              placeholder="Detalles de entrega, estado de la maquinaria, firmas recibidas..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all resize-none"
            />
          </div>

          {/* Geolocalización GPS */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Georreferenciación GPS
                </span>
              </div>
              <button
                type="button"
                onClick={handleCapturarGPS}
                disabled={capturandoGps}
                className="px-3 py-1 rounded-xl bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {capturandoGps ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Obteniendo GPS...
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    Capturar GPS
                  </>
                )}
              </button>
            </div>
            {latitud != null && longitud != null ? (
              <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Lat: {latitud}, Lon: {longitud}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Sin coordenadas registradas aún
              </div>
            )}
          </div>

          {/* Fotos de Evidencia */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-teal-600" />
                Evidencias Fotográficas ({fotos.length})
              </label>
              <button
                type="button"
                onClick={handleSimularFoto}
                className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                + Foto de Prueba
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://..."
                value={urlFotoInput}
                onChange={(e) => setUrlFotoInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none"
              />
              <button
                type="button"
                onClick={handleAddFotoUrl}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300 transition-colors"
              >
                Añadir
              </button>
            </div>

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {fotos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100">
                    <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Actualizar Parada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
