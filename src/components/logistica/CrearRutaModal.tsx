'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Truck,
  Plus,
  Trash2,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { crearRutaDespachoAction, CrearRutaInput } from '@/app/actions/logistica';
import { useToastStore } from '@/infrastructure/state/toastStore';
import { TipoVehiculoTransporte } from '@/core/services/logistica-rutas.service';

interface CrearRutaModalProps {
  isOpen: boolean;
  onClose: () => void;
  zonas: any[];
  onRutaCreada?: (ruta: any) => void;
}

interface ParadaRowState {
  id: string;
  tipoParada: 'ENTREGA_DESPACHO' | 'RECOGIDA_DEVOLUCION';
  direccionObra: string;
  zonaId: string;
  horaEstimada: string;
  receptorNombre: string;
  receptorTelefono: string;
  observaciones: string;
}

export function CrearRutaModal({ isOpen, onClose, zonas, onRutaCreada }: CrearRutaModalProps) {
  const showSuccessToast = useToastStore((state) => state.showSuccessToast);
  const showErrorToast = useToastStore((state) => state.showErrorToast);

  const hoyISO = new Date().toISOString().split('T')[0];

  const [fechaProgramada, setFechaProgramada] = useState<string>(hoyISO);
  const [vehiculoPlaca, setVehiculoPlaca] = useState<string>('');
  const [vehiculoTipo, setVehiculoTipo] = useState<TipoVehiculoTransporte>(TipoVehiculoTransporte.CAMIONETA);
  const [conductorNombre, setConductorNombre] = useState<string>('');
  const [conductorTelefono, setConductorTelefono] = useState<string>('');
  const [kilometrosEstimados, setKilometrosEstimados] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [paradas, setParadas] = useState<ParadaRowState[]>([
    {
      id: crypto.randomUUID(),
      tipoParada: 'ENTREGA_DESPACHO',
      direccionObra: '',
      zonaId: '',
      horaEstimada: '08:30',
      receptorNombre: '',
      receptorTelefono: '',
      observaciones: '',
    },
  ]);

  // Mapa de zonas indexado para cálculo ágil
  const zonasMap = useMemo(() => {
    const map = new Map<string, any>();
    zonas.forEach((z) => map.set(z.id, z));
    return map;
  }, [zonas]);

  // Cálculo dinámico de fletes sugeridos acumulados
  const totalFletesEstimado = useMemo(() => {
    let total = 0;
    for (const p of paradas) {
      if (!p.zonaId) continue;
      const zona = zonasMap.get(p.zonaId);
      if (!zona) continue;

      if (vehiculoTipo === 'MOTOCARRO') {
        total += Number(zona.tarifa_base_motocarro) || 0;
      } else if (vehiculoTipo === 'TURBO_NPR') {
        total += Number(zona.tarifa_base_turbo) || 0;
      } else {
        total += Number(zona.tarifa_base_camioneta) || 0;
      }
    }
    return Math.trunc(total);
  }, [paradas, vehiculoTipo, zonasMap]);

  if (!isOpen) return null;

  const handleAddParada = () => {
    setParadas((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipoParada: 'ENTREGA_DESPACHO',
        direccionObra: '',
        zonaId: '',
        horaEstimada: '',
        receptorNombre: '',
        receptorTelefono: '',
        observaciones: '',
      },
    ]);
  };

  const handleRemoveParada = (id: string) => {
    if (paradas.length <= 1) {
      showErrorToast('La ruta debe contener al menos una parada');
      return;
    }
    setParadas((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateParada = (id: string, field: keyof ParadaRowState, value: string) => {
    setParadas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehiculoPlaca.trim() || vehiculoPlaca.trim().length < 5) {
      setErrorMsg('Ingrese una placa de vehículo válida (mínimo 5 caracteres)');
      return;
    }
    if (!conductorNombre.trim() || conductorNombre.trim().length < 3) {
      setErrorMsg('Ingrese el nombre del conductor asignado');
      return;
    }

    // Validar paradas
    for (let i = 0; i < paradas.length; i++) {
      if (!paradas[i].direccionObra.trim() || paradas[i].direccionObra.trim().length < 5) {
        setErrorMsg(`La parada #${i + 1} requiere una dirección de obra válida`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: CrearRutaInput = {
        fechaProgramada,
        vehiculoPlaca: vehiculoPlaca.trim().toUpperCase(),
        vehiculoTipo,
        conductorNombre: conductorNombre.trim(),
        conductorTelefono: conductorTelefono.trim() || null,
        kilometrosEstimados: Number(kilometrosEstimados) || 0,
        totalFletes: totalFletesEstimado,
        observaciones: observaciones.trim() || null,
        paradas: paradas.map((p, idx) => ({
          tipoParada: p.tipoParada,
          direccionObra: p.direccionObra.trim(),
          zonaId: p.zonaId || null,
          ordenSecuencia: idx + 1,
          horaEstimada: p.horaEstimada || null,
          receptorNombre: p.receptorNombre.trim() || null,
          receptorTelefono: p.receptorTelefono.trim() || null,
          observaciones: p.observaciones.trim() || null,
        })),
      };

      const res = await crearRutaDespachoAction(payload);

      if (!res.success) {
        throw new Error(res.error || 'No fue posible crear la ruta de despacho');
      }

      showSuccessToast(`Ruta ${res.data?.codigo_ruta || ''} programada exitosamente`);

      if (onRutaCreada) onRutaCreada(res.data);
      onClose();
    } catch (err: any) {
      console.error('[CrearRutaModal Error]:', err);
      setErrorMsg(err.message || 'Error inesperado al registrar la ruta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Programar Hoja de Ruta de Despacho
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                  Bucaramanga WMS
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planificación de fletes, flota de transporte y paradas de entrega/recogida
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

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sección 1: Información del Vehículo y Conductor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Fecha Programada
              </label>
              <input
                type="date"
                required
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                Placa del Vehículo
              </label>
              <input
                type="text"
                required
                placeholder="Ej: WNZ-452"
                value={vehiculoPlaca}
                onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tipo de Vehículo
              </label>
              <select
                value={vehiculoTipo}
                onChange={(e) => setVehiculoTipo(e.target.value as TipoVehiculoTransporte)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              >
                <option value="MOTOCARRO">Motocarro (Hasta 350 Kg)</option>
                <option value="CAMIONETA">Camioneta Platón (Hasta 1,200 Kg)</option>
                <option value="TURBO_NPR">Camión Turbo NPR (Hasta 4,500 Kg)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                Nombre Conductor
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Pedro Martínez"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Teléfono Conductor
              </label>
              <input
                type="tel"
                placeholder="Ej: 315 888 9900"
                value={conductorTelefono}
                onChange={(e) => setConductorTelefono(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kilómetros Estimados
              </label>
              <input
                type="number"
                min={0}
                placeholder="0 km"
                value={kilometrosEstimados || ''}
                onChange={(e) => setKilometrosEstimados(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Observaciones Generales de la Ruta
              </label>
              <input
                type="text"
                placeholder="Notas de cargue, restricciones de horario o equipo especial..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* Sección 2: Lista Dinámica de Paradas */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Secuencia de Paradas ({paradas.length})
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defina el recorrido por obras y la zona de flete correspondiente
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddParada}
                className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1.5 hover:bg-teal-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Parada
              </button>
            </div>

            <div className="space-y-3">
              {paradas.map((parada, index) => (
                <div
                  key={parada.id}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <select
                        value={parada.tipoParada}
                        onChange={(e) =>
                          handleUpdateParada(
                            parada.id,
                            'tipoParada',
                            e.target.value as 'ENTREGA_DESPACHO' | 'RECOGIDA_DEVOLUCION'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="ENTREGA_DESPACHO">Entrega (Despacho)</option>
                        <option value="RECOGIDA_DEVOLUCION">Recogida (Retorno)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveParada(parada.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Eliminar parada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Dirección de Obra *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Calle 35 # 24-10, Obra Altos del Jardín"
                        value={parada.direccionObra}
                        onChange={(e) => handleUpdateParada(parada.id, 'direccionObra', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Zona de Flete Bucaramanga
                      </label>
                      <select
                        value={parada.zonaId}
                        onChange={(e) => handleUpdateParada(parada.id, 'zonaId', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      >
                        <option value="">Seleccione Zona...</option>
                        {zonas.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.municipio} - {z.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Hora Estimada
                      </label>
                      <input
                        type="time"
                        value={parada.horaEstimada}
                        onChange={(e) => handleUpdateParada(parada.id, 'horaEstimada', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Receptor en Obra
                      </label>
                      <input
                        type="text"
                        placeholder="Nombre de contacto"
                        value={parada.receptorNombre}
                        onChange={(e) => handleUpdateParada(parada.id, 'receptorNombre', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Teléfono Receptor
                      </label>
                      <input
                        type="tel"
                        placeholder="315..."
                        value={parada.receptorTelefono}
                        onChange={(e) => handleUpdateParada(parada.id, 'receptorTelefono', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Observaciones de Parada
                      </label>
                      <input
                        type="text"
                        placeholder="Instrucciones para entrega o recepción..."
                        value={parada.observaciones}
                        onChange={(e) => handleUpdateParada(parada.id, 'observaciones', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen de Fletes Sugeridos */}
          <div className="p-4 rounded-2xl bg-teal-500/10 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Total Fletes Calculado (COP Enteros)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Calculado automáticamente según la matriz tarifaria metropolitana ({vehiculoTipo})
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold text-teal-700 dark:text-teal-300 font-mono">
                ${totalFletesEstimado.toLocaleString('es-CO')} COP
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Programando Ruta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Crear Hoja de Ruta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
