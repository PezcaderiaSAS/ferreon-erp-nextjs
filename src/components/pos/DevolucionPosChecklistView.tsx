'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import {
  ArrowLeftRight,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Wrench,
  AlertOctagon,
  ShieldAlert,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRight,
  Layers,
  FileCheck
} from 'lucide-react';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useToastStore } from '@/infrastructure/state/toastStore';
import {
  procesarDevolucionPosAction,
  obtenerCatalogoAveriasAction,
  ItemDevolucionPosInput
} from '@/app/actions/alquileres';

export type SemaforoEstado = 'VERDE_BUENO' | 'AMARILLO_SUCIO' | 'NARANJA_DANADO' | 'ROJO_PERDIDA';

interface ItemInspeccionRow {
  detalleId: number;
  equipoId: number;
  nombreItem: string;
  cantidadTotal: number;
  cantidadYaDevuelta: number;
  cantidadPendiente: number;
  cantidadDevuelta: number;
  tarifaAplicada: number;
  diasCobro: number;
  semaforo: SemaforoEstado;
  costoLimpieza: number;
  costoReparacion: number;
  valorReposicion: number;
  descripcionDano: string;
  averiasSeleccionadas: any[];
}

interface DevolucionPosChecklistViewProps {
  isOpen: boolean;
  onClose: () => void;
  alquiler: any; // AlquilerUI o registro de alquiler
  onSuccess?: (resultado: any) => void;
}

export function DevolucionPosChecklistView({
  isOpen,
  onClose,
  alquiler,
  onSuccess,
}: DevolucionPosChecklistViewProps) {
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);

  const [items, setItems] = useState<ItemInspeccionRow[]>([]);
  const [catalogoAverias, setCatalogoAverias] = useState<any[]>([]);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'NEQUI' | 'DAVIPLATA'>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formateador monetario COP
  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  // Cargar catálogo de averías al abrir
  useEffect(() => {
    if (isOpen) {
      obtenerCatalogoAveriasAction().then((res) => {
        if (res.success && res.data) {
          setCatalogoAverias(res.data);
        }
      });
    }
  }, [isOpen]);

  // Inicializar ítems de inspección
  useEffect(() => {
    if (alquiler && isOpen) {
      setErrorMsg(null);
      setMetodoPago('EFECTIVO');
      setObservaciones(`Devolución de equipos contrato #${alquiler.consecutivo || alquiler.id}`);

      const detalles = Array.isArray(alquiler.detalles) && alquiler.detalles.length > 0
        ? alquiler.detalles
        : (Array.isArray(alquiler.items) ? alquiler.items : []);

      const rows: ItemInspeccionRow[] = detalles
        .map((d: any) => {
          const totalCant = Number(d.cantidad || 1);
          const devuelta = Number(d.cantidad_devuelta || d.cantidadDevuelta || 0);
          const pendiente = Math.max(0, totalCant - devuelta);

          return {
            detalleId: Number(d.id || d.detalleId || 0),
            equipoId: Number(d.equipo_id || d.equipoId || d.itemId || 0),
            nombreItem: d.nombre_item || d.nombreItem || d.equipo?.nombre || `Equipo #${d.equipo_id || d.equipoId}`,
            cantidadTotal: totalCant,
            cantidadYaDevuelta: devuelta,
            cantidadPendiente: pendiente,
            cantidadDevuelta: pendiente, // Por defecto devolver todos los pendientes
            tarifaAplicada: Number(d.tarifa_aplicada || d.tarifaAplicada || 0),
            diasCobro: Number(d.dias_contratados || d.diasCobro || 1),
            semaforo: 'VERDE_BUENO' as SemaforoEstado,
            costoLimpieza: 0,
            costoReparacion: 0,
            valorReposicion: 0,
            descripcionDano: '',
            averiasSeleccionadas: [],
          };
        })
        .filter((r: ItemInspeccionRow) => r.cantidadPendiente > 0);

      setItems(rows);
    }
  }, [alquiler, isOpen]);

  // Accesibilidad WCAG
  const modalContainerRef = useModalAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
    isBlocked: isPending,
  });

  // Atajo: Marcar todos como buenos
  const handleMarcarTodosBuenos = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        semaforo: 'VERDE_BUENO',
        costoLimpieza: 0,
        costoReparacion: 0,
        valorReposicion: 0,
        descripcionDano: '',
        averiasSeleccionadas: [],
      }))
    );
  };

  // Cambiar semáforo de un ítem
  const handleSetSemaforo = (index: number, nuevoSemaforo: SemaforoEstado) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], semaforo: nuevoSemaforo };

      if (nuevoSemaforo === 'VERDE_BUENO') {
        target.costoLimpieza = 0;
        target.costoReparacion = 0;
        target.valorReposicion = 0;
        target.descripcionDano = '';
        target.averiasSeleccionadas = [];
      } else if (nuevoSemaforo === 'AMARILLO_SUCIO') {
        const averiaSugerida = catalogoAverias.find((a) => a.categoria === 'LIMPIEZA') || { costo_sugerido: 15000 };
        target.costoLimpieza = Number(averiaSugerida.costo_sugerido || 15000);
        target.costoReparacion = 0;
        target.valorReposicion = 0;
        target.descripcionDano = 'Limpieza y retiro de suciedad en obra';
      } else if (nuevoSemaforo === 'NARANJA_DANADO') {
        const averiaSugerida = catalogoAverias.find((a) => a.categoria === 'DANOS_MENORES') || { costo_sugerido: 45000 };
        target.costoLimpieza = 0;
        target.costoReparacion = Number(averiaSugerida.costo_sugerido || 45000);
        target.valorReposicion = 0;
        target.descripcionDano = 'Daño mecánico / eléctrico en equipo';
      } else if (nuevoSemaforo === 'ROJO_PERDIDA') {
        target.costoLimpieza = 0;
        target.costoReparacion = 0;
        // Valor reposición sugerido: 30 días de alquiler como base estimada si no hay costo repo
        target.valorReposicion = target.tarifaAplicada * 30;
        target.descripcionDano = 'Equipo no retornado o pérdida total';
      }

      next[index] = target;
      return next;
    });
  };

  // Modificar cantidad a devolver
  const handleUpdateCantidad = (index: number, cant: number) => {
    setItems((prev) => {
      const next = [...prev];
      const max = next[index].cantidadPendiente;
      next[index] = {
        ...next[index],
        cantidadDevuelta: Math.min(max, Math.max(0, cant)),
      };
      return next;
    });
  };

  // Modificar costo manual de avería
  const handleUpdateCosto = (index: number, field: 'costoLimpieza' | 'costoReparacion' | 'valorReposicion', val: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: Math.max(0, val),
      };
      return next;
    });
  };

  // Modificar descripción del daño
  const handleUpdateDescripcion = (index: number, desc: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], descripcionDano: desc };
      return next;
    });
  };

  // Totales Financieros
  const depositoOriginal = useMemo(() => {
    return Number(alquiler?.deposito || 0);
  }, [alquiler]);

  const totalDanos = useMemo(() => {
    return items.reduce((acc, it) => acc + it.costoLimpieza + it.costoReparacion, 0);
  }, [items]);

  const totalReposiciones = useMemo(() => {
    return items.reduce((acc, it) => acc + it.valorReposicion, 0);
  }, [items]);

  const totalCargosAverias = totalDanos + totalReposiciones;

  // saldo_neto = deposito - (daños + reposiciones)
  const saldoNeto = depositoOriginal - totalCargosAverias;

  // Submit Handler
  const handleProcesarDevolucion = () => {
    const itemsADevolver = items.filter((it) => it.cantidadDevuelta > 0);
    if (itemsADevolver.length === 0) {
      setErrorMsg('Debe seleccionar al menos un equipo con cantidad mayor a cero para devolver.');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const payloadItems: ItemDevolucionPosInput[] = itemsADevolver.map((it) => ({
          detalleId: it.detalleId,
          cantidadDevuelta: it.cantidadDevuelta,
          semaforo: it.semaforo,
          costoLimpieza: it.costoLimpieza,
          costoReparacion: it.costoReparacion,
          valorReposicion: it.valorReposicion,
          descripcionDano: it.descripcionDano,
          desgloseAverias: it.averiasSeleccionadas,
        }));

        const res = await procesarDevolucionPosAction({
          alquilerId: Number(alquiler.id),
          metodoPago,
          observaciones,
          items: payloadItems,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'No se pudo procesar la devolución');
          addToast({
            title: 'Error en devolución',
            message: res.error || 'Verifica los datos de recepción',
            type: 'error',
          });
          return;
        }

        const msgExito = res.data?.contrato_cerrado
          ? `Devolución ${res.data?.consecutivo} formalizada. Contrato cerrado exitosamente.`
          : `Devolución parcial ${res.data?.consecutivo} formalizada.`;

        addToast({
          title: 'Recepción Completada',
          message: msgExito,
          type: 'success',
        });

        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inesperado al registrar devolución');
      }
    });
  };

  if (!isOpen || !alquiler) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="devolucion-pos-title"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="devolucion-pos-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Devolución POS & Checklist de Averías
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                  Mostrador Rápido
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Contrato #{alquiler.consecutivo || alquiler.id} • Cliente:{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {alquiler.cliente?.nombre || alquiler.cliente_nombre || 'Cliente General'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                <p className="font-semibold">Error al registrar devolución:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Atajo rápido superior */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <FileCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Semáforo de Recepción Táctil por Cada Equipo:</span>
            </div>
            <button
              type="button"
              onClick={handleMarcarTodosBuenos}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar Todos Buenos (🟢)
            </button>
          </div>

          {/* Lista de Equipos con Semáforo Táctil */}
          <div className="space-y-4">
            {items.map((it, idx) => (
              <div
                key={it.detalleId || idx}
                className={`p-4 rounded-xl border transition-all ${
                  it.semaforo === 'VERDE_BUENO'
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : it.semaforo === 'AMARILLO_SUCIO'
                    ? 'border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20'
                    : it.semaforo === 'NARANJA_DANADO'
                    ? 'border-orange-300 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20'
                    : 'border-red-300 dark:border-red-800/60 bg-red-50/40 dark:bg-red-950/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {it.nombreItem}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pendientes en obra: <span className="font-semibold text-slate-700 dark:text-slate-300">{it.cantidadPendiente}</span> • Tarifa: {formatearCOP(it.tarifaAplicada)}/día
                    </p>
                  </div>

                  {/* Cantidad a Devolver */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Cant. a Recibir:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={it.cantidadPendiente}
                      value={it.cantidadDevuelta}
                      onChange={(e) => handleUpdateCantidad(idx, Number(e.target.value))}
                      className="w-16 py-1 px-2 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Semáforo Táctil de Botones */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleSetSemaforo(idx, 'VERDE_BUENO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      it.semaforo === 'VERDE_BUENO'
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    🟢 Bueno (OK)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSemaforo(idx, 'AMARILLO_SUCIO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      it.semaforo === 'AMARILLO_SUCIO'
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    🟡 Sucio (Lavado)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSemaforo(idx, 'NARANJA_DANADO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      it.semaforo === 'NARANJA_DANADO'
                        ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    🟠 Dañado (Rep.)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSemaforo(idx, 'ROJO_PERDIDA')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      it.semaforo === 'ROJO_PERDIDA'
                        ? 'border-red-500 bg-red-600 text-white shadow-md shadow-red-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    🔴 Pérdida Total
                  </button>
                </div>

                {/* Desglose de Costos de Avería si no es Verde */}
                {it.semaforo !== 'VERDE_BUENO' && (
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {it.semaforo === 'AMARILLO_SUCIO' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Costo de Limpieza ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={it.costoLimpieza}
                            onChange={(e) => handleUpdateCosto(idx, 'costoLimpieza', Number(e.target.value))}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-amber-600 dark:text-amber-400"
                          />
                        </div>
                      )}

                      {it.semaforo === 'NARANJA_DANADO' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Costo de Reparación ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5000"
                            value={it.costoReparacion}
                            onChange={(e) => handleUpdateCosto(idx, 'costoReparacion', Number(e.target.value))}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-orange-600 dark:text-orange-400"
                          />
                        </div>
                      )}

                      {it.semaforo === 'ROJO_PERDIDA' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Valor de Reposición ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={it.valorReposicion}
                            onChange={(e) => handleUpdateCosto(idx, 'valorReposicion', Number(e.target.value))}
                            className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-red-600 dark:text-red-400"
                          />
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Detalle / Observación Técnica
                        </label>
                        <input
                          type="text"
                          value={it.descripcionDano}
                          onChange={(e) => handleUpdateDescripcion(idx, e.target.value)}
                          placeholder="Ej: Cable raspado, requiere cambio de conector..."
                          className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Liquidación de Depósito en Garantía & Saldo Neto */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Liquidación de Garantía en Mostrador
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Depósito en Garantía:</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatearCOP(depositoOriginal)}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Cargos Averías/Pérdidas:</span>
                <span className="text-base font-extrabold text-red-600 dark:text-red-400">
                  {formatearCOP(totalCargosAverias)}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                saldoNeto > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : saldoNeto < 0
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-700 dark:text-slate-300'
              }`}>
                <span className="block text-[11px] font-semibold">
                  {saldoNeto > 0 ? '🟢 Reembolso al Cliente:' : saldoNeto < 0 ? '🔴 Saldo a Cobrar:' : '⚪ Sin Saldo Pendiente:'}
                </span>
                <span className="text-base font-extrabold">
                  {formatearCOP(Math.abs(saldoNeto))}
                </span>
              </div>
            </div>

            {/* Método de pago de resolución */}
            {saldoNeto !== 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Método para {saldoNeto > 0 ? 'Devolver Garantía' : 'Cobrar Excedente'} en Caja:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'TARJETA'] as const).map((met) => (
                    <button
                      key={met}
                      type="button"
                      onClick={() => setMetodoPago(met)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        metodoPago === met
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {met === 'EFECTIVO' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                      {met}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleProcesarDevolucion}
            disabled={isPending}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-lg shadow-teal-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando Devolución...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Devolución ({saldoNeto > 0 ? `Reembolsar ${formatearCOP(saldoNeto)}` : saldoNeto < 0 ? `Cobrar ${formatearCOP(Math.abs(saldoNeto))}` : 'Sin Saldo'})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
