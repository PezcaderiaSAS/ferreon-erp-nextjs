'use client';

import React, { useState, useMemo, useTransition, useEffect } from 'react';
import {
  FileEdit,
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  RotateCcw
} from 'lucide-react';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useToastStore } from '@/infrastructure/state/toastStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { generarAdendaContratoAction, ItemAdendaInput } from '@/app/actions/alquileres';

interface EditarContratoAdendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  alquiler: any; // AlquilerUI o registro de alquiler
  onSuccess?: (adendaResult: any) => void;
}

interface ItemFormRow {
  equipoId: number;
  nombreItem: string;
  cantidad: number;
  tarifaAplicada: number;
  diasCobro: number;
  subtotalLinea: number;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  esSubcontratado?: boolean;
}

export function EditarContratoAdendaModal({
  isOpen,
  onClose,
  alquiler,
  onSuccess,
}: EditarContratoAdendaModalProps) {
  const [isPending, startTransition] = useTransition();
  const addToast = useToastStore((s) => s.addToast);
  const equiposBodega = useBodegaStore((s) => s.equipos);

  // Estados del Formulario
  const [motivo, setMotivo] = useState<string>('PRORROGA');
  const [diasAdicionales, setDiasAdicionales] = useState<number>(0);
  const [montoDepositoAdicional, setMontoDepositoAdicional] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'NEQUI' | 'DAVIPLATA'>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [items, setItems] = useState<ItemFormRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formateador monetario COP
  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  // Versión actual y versión resultante
  const { versionActual, versionSiguiente } = useMemo(() => {
    if (!alquiler) return { versionActual: 'v1.0', versionSiguiente: 'v1.1' };
    const conteo = Array.isArray(alquiler.adendas) ? alquiler.adendas.length : 0;
    const vAct = conteo === 0 ? 'v1.0' : `v1.${conteo}`;
    const vSig = `v1.${conteo + 1}`;
    return { versionActual: vAct, versionSiguiente: vSig };
  }, [alquiler]);

  // Cargar estado inicial desde el contrato al abrir
  useEffect(() => {
    if (alquiler && isOpen) {
      setMotivo('PRORROGA');
      setDiasAdicionales(0);
      setMontoDepositoAdicional(0);
      setMetodoPago('EFECTIVO');
      setObservaciones('');
      setErrorMsg(null);

      // Mapear detalles actuales del contrato
      const detallesOriginales = Array.isArray(alquiler.detalles) && alquiler.detalles.length > 0
        ? alquiler.detalles
        : (Array.isArray(alquiler.items) ? alquiler.items : []);

      const rows: ItemFormRow[] = detallesOriginales.map((d: any) => {
        const cant = Number(d.cantidad || 1);
        const tarifa = Number(d.tarifa_aplicada || d.tarifaAplicada || d.precio_unitario || 0);
        const dias = Number(d.dias_contratados || d.diasCobro || 1);
        const sub = Number(d.subtotal_linea || d.subtotalLinea || cant * tarifa * dias);

        return {
          equipoId: Number(d.equipo_id || d.equipoId || d.itemId || 0),
          nombreItem: d.nombre_item || d.nombreItem || d.equipo?.nombre || `Equipo #${d.equipo_id || d.equipoId}`,
          cantidad: cant,
          tarifaAplicada: tarifa,
          diasCobro: dias,
          subtotalLinea: sub,
          fechaInicio: d.fecha_inicio || d.fechaInicio || undefined,
          fechaFinEstimada: d.fecha_fin || d.fechaFinEstimada || undefined,
          esSubcontratado: Boolean(d.es_subcontratado || d.esSubcontratado),
        };
      });

      setItems(rows);
    }
  }, [alquiler, isOpen]);

  // Accesibilidad WCAG
  const modalContainerRef = useModalAccessibility<HTMLDivElement>({
    isOpen,
    onClose,
    isBlocked: isPending,
  });

  // Aplicar prórroga global de días
  const handleAplicarProrroga = (diasExtra: number) => {
    setDiasAdicionales(diasExtra);
    setItems((prev) =>
      prev.map((it) => {
        const nuevosDias = Math.max(1, it.diasCobro + diasExtra);
        const nuevoSub = it.cantidad * it.tarifaAplicada * nuevosDias;
        return {
          ...it,
          diasCobro: nuevosDias,
          subtotalLinea: nuevoSub,
        };
      })
    );
  };

  // Modificar línea de equipo
  const handleUpdateItem = (index: number, field: keyof ItemFormRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      if (field === 'cantidad' || field === 'tarifaAplicada' || field === 'diasCobro') {
        target.subtotalLinea = Number(target.cantidad) * Number(target.tarifaAplicada) * Number(target.diasCobro);
      }
      next[index] = target;
      return next;
    });
  };

  // Eliminar línea de equipo
  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg('El contrato debe mantener al menos un equipo en alquiler.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  // Añadir nuevo equipo desde catálogo de bodega
  const handleAddEquipo = (equipoId: number) => {
    const eq = equiposBodega.find((e) => Number(e.id) === equipoId);
    if (!eq) return;

    // Verificar si ya existe en la lista
    const yaExiste = items.some((it) => it.equipoId === equipoId);
    if (yaExiste) {
      addToast({
        title: 'Equipo ya agregado',
        message: 'Puedes modificar la cantidad directamente en la tabla.',
        type: 'warning',
      });
      return;
    }

    const tarifa = Number(eq.tarifa_diaria || eq.tarifaDiaria || 0);
    const dias = items[0]?.diasCobro || 1;
    const nuevoRow: ItemFormRow = {
      equipoId,
      nombreItem: eq.nombre || `Equipo #${equipoId}`,
      cantidad: 1,
      tarifaAplicada: tarifa,
      diasCobro: dias,
      subtotalLinea: 1 * tarifa * dias,
      esSubcontratado: false,
    };

    setItems((prev) => [...prev, nuevoRow]);
    setMotivo('ADICION_EQUIPOS');
  };

  // Cálculos Financieros en Vivo
  const totalOriginal = useMemo(() => {
    if (!alquiler) return 0;
    return Number(alquiler.total || alquiler.subtotal_general || 0);
  }, [alquiler]);

  const fleteEntrega = Number(alquiler?.flete_entrega || alquiler?.fleteEntrega || 0);
  const fleteRecogida = Number(alquiler?.flete_recogida || alquiler?.fleteRecogida || 0);

  const nuevoSubtotalEquipos = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.subtotalLinea || 0), 0);
  }, [items]);

  const nuevoTotal = nuevoSubtotalEquipos + fleteEntrega + fleteRecogida;
  const montoAdicional = nuevoTotal - totalOriginal;
  const nuevoDeposito = Number(alquiler?.deposito || 0) + Number(montoDepositoAdicional || 0);

  // Submit Handler
  const handleGuardarAdenda = () => {
    if (!alquiler?.id) return;
    if (items.length === 0) {
      setErrorMsg('Debe incluir al menos un equipo.');
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const payloadItems: ItemAdendaInput[] = items.map((it) => ({
          equipoId: it.equipoId,
          nombreItem: it.nombreItem,
          cantidad: it.cantidad,
          tarifaAplicada: it.tarifaAplicada,
          diasCobro: it.diasCobro,
          subtotalLinea: it.subtotalLinea,
          fechaInicio: it.fechaInicio,
          fechaFinEstimada: it.fechaFinEstimada,
          esSubcontratado: it.esSubcontratado,
        }));

        const res = await generarAdendaContratoAction({
          alquilerId: Number(alquiler.id),
          motivo,
          diasAdicionales,
          montoDepositoAdicional: Number(montoDepositoAdicional || 0),
          metodoPago,
          observaciones,
          items: payloadItems,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'No se pudo generar la adenda del contrato');
          addToast({
            title: 'Error al generar adenda',
            message: res.error || 'Revisa el stock disponible',
            type: 'error',
          });
          return;
        }

        addToast({
          title: `Adenda ${res.data?.numero_version || versionSiguiente} aplicada`,
          message: `El contrato #${alquiler.consecutivo || alquiler.id} fue actualizado in-place.`,
          type: 'success',
        });

        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Error inesperado al generar adenda');
      }
    });
  };

  if (!isOpen || !alquiler) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="adenda-modal-title"
    >
      <div
        ref={modalContainerRef}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="adenda-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Adenda & Modificación de Contrato
                </h2>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <span>{versionActual}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">{versionSiguiente}</span>
                </div>
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
          {/* Alertas de Error */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                <p className="font-semibold">Error al procesar adenda:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Selector de Motivo y Atajos de Prórroga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motivo Principal
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
              >
                <option value="PRORROGA">Prórroga de Días (Extensión de plazo)</option>
                <option value="ADICION_EQUIPOS">Adición de Equipos a Obra</option>
                <option value="RETIRO_EQUIPOS">Retiro Parcial de Equipos</option>
                <option value="AJUSTE_TARIFA">Ajuste de Tarifa Comercial</option>
                <option value="MODIFICACION_MIXTA">Modificación Mixta</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Atajos de Prórroga Rápida
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 7, 15, 30].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => handleAplicarProrroga(dias)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    +{dias} Días
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAplicarProrroga(0)}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Restablecer días adicionales a cero"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Equipos en el Contrato */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-500" />
                Equipos y Líneas del Contrato ({items.length})
              </h3>
              {/* Dropdown rápido para añadir equipo */}
              <div className="flex items-center gap-2">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddEquipo(Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  <option value="" disabled>
                    + Agregar equipo de catálogo...
                  </option>
                  {equiposBodega.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nombre} (Disp: {eq.stock_disponible || 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Equipo</th>
                      <th className="py-2.5 px-3 w-20 text-center">Cant.</th>
                      <th className="py-2.5 px-3 w-28 text-right">Tarifa/Día</th>
                      <th className="py-2.5 px-3 w-20 text-center">Días</th>
                      <th className="py-2.5 px-3 w-32 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {items.map((it, idx) => (
                      <tr key={it.equipoId || idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {it.nombreItem}
                          {it.esSubcontratado && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Subcontratado
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.cantidad}
                            onChange={(e) => handleUpdateItem(idx, 'cantidad', Math.max(1, Number(e.target.value)))}
                            className="w-16 text-center py-1 px-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={it.tarifaAplicada}
                            onChange={(e) => handleUpdateItem(idx, 'tarifaAplicada', Math.max(0, Number(e.target.value)))}
                            className="w-24 text-right py-1 px-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.diasCobro}
                            onChange={(e) => handleUpdateItem(idx, 'diasCobro', Math.max(1, Number(e.target.value)))}
                            className="w-16 text-center py-1 px-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-amber-600 dark:text-amber-400"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">
                          {formatearCOP(it.subtotalLinea)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                            title="Quitar línea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Parámetros Financieros & Depósito Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Depósito de Garantía Adicional ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={montoDepositoAdicional}
                  onChange={(e) => setMontoDepositoAdicional(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Si el cliente entrega dinero adicional para fianza o abono en mostrador.
              </p>
            </div>

            {montoDepositoAdicional > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Método de Recaudo en Caja
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'TARJETA'] as const).map((met) => (
                    <button
                      key={met}
                      type="button"
                      onClick={() => setMetodoPago(met)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                        metodoPago === met
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones de la Adenda
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ej: Prórroga autorizada por gerencia de obra, entrega de taladro percutor adicional..."
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Resumen de Comparación Financiera */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Liquidación de Adenda
              </span>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Original: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatearCOP(totalOriginal)}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Nuevo Total: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatearCOP(nuevoTotal)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Variación Neta:</span>
              <div
                className={`text-base font-extrabold ${
                  montoAdicional > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : montoAdicional < 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {montoAdicional > 0 ? `+${formatearCOP(montoAdicional)}` : formatearCOP(montoAdicional)}
              </div>
            </div>
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
            onClick={handleGuardarAdenda}
            disabled={isPending}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando Adenda {versionSiguiente}...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Formalizar Adenda {versionSiguiente}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
