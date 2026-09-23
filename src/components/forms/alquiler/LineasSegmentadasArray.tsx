'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, AlertTriangle, Loader2, CheckCircle2, Split, Wrench } from 'lucide-react';
import { crearAlquilerSegmentadoAction, ActionStandardResponse } from '@/app/actions/alquiler-segmentado';
import { ModalResolucionOverbooking, OverbookingConflictInfo } from './ModalResolucionOverbooking';
import { EquipoCombobox } from '../../ui/EquipoCombobox';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';

export interface FormLineaItem {
  clientId: string;
  itemId: string;
  nombreItem: string;
  cantidad: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  dias: number;
  tarifaDiaria: number;
  tarifaPersonalizada: boolean;
  subtotal: number;
  subtotalPersonalizado: boolean;
  esSubcontratado: boolean;
}

export interface LineasSegmentadasArrayProps {
  catalogoEquipos: Array<{ id: string | number; nombre: string; tarifa_dia: number; stock_disponible: number }>;
  clienteId: string | number;
  fleteEntrega?: number;
  fleteRecogida?: number;
  deposito?: number;
  garantiaMonto?: number;
  garantiaTipo?: string;
  observaciones?: string;
  detallesLogistica?: string;
  onSuccess?: (data: any) => void;
  onLineasChange?: (lineas: FormLineaItem[]) => void;
  setIsCreandoEquipo?: (val: boolean) => void;
}

export const LineasSegmentadasArray: React.FC<LineasSegmentadasArrayProps> = ({
  catalogoEquipos,
  clienteId,
  fleteEntrega = 0,
  fleteRecogida = 0,
  deposito = 0,
  garantiaMonto = 0,
  garantiaTipo = 'Efectivo',
  observaciones,
  detallesLogistica,
  onSuccess,
  onLineasChange,
  setIsCreandoEquipo,
}) => {
  const hoy = new Date().toISOString().split('T')[0];

  const [lineas, setLineas] = useState<FormLineaItem[]>([
    {
      clientId: `linea_${Date.now()}_1`,
      itemId: '',
      nombreItem: '',
      cantidad: 1,
      fechaInicio: hoy,
      fechaFinEstimada: hoy,
      dias: 1,
      tarifaDiaria: 0,
      tarifaPersonalizada: false,
      subtotal: 0,
      subtotalPersonalizado: false,
      esSubcontratado: false,
    },
  ]);

  const [errorServidor, setErrorServidor] = useState<ActionStandardResponse | null>(null);
  const [lineaConErrorIndex, setLineaConErrorIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictoOverbooking, setConflictoOverbooking] = useState<OverbookingConflictInfo | null>(null);
  const [isModalOverbookingOpen, setIsModalOverbookingOpen] = useState(false);
  const [openComboboxRowId, setOpenComboboxRowId] = useState<string | null>(null);
  const [autoFocusRowId, setAutoFocusRowId] = useState<string | null>(null);

  // Recalcular diferencia en días naturales
  const calcularDias = (inicio: string, fin: string): number => {
    if (!inicio || !fin) return 1;
    const d1 = new Date(`${inicio}T00:00:00Z`).getTime();
    const d2 = new Date(`${fin}T00:00:00Z`).getTime();
    return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  };

  const handleAgregarLinea = () => {
    const nuevaLinea: FormLineaItem = {
      clientId: `linea_${Date.now()}_${lineas.length + 1}`,
      itemId: '',
      nombreItem: '',
      cantidad: 1,
      fechaInicio: hoy,
      fechaFinEstimada: hoy,
      dias: 1,
      tarifaDiaria: 0,
      tarifaPersonalizada: false,
      subtotal: 0,
      subtotalPersonalizado: false,
      esSubcontratado: false,
    };
    setLineas((prev) => {
      const next = [...prev, nuevaLinea];
      if (onLineasChange) onLineasChange(next);
      return next;
    });
    setAutoFocusRowId(nuevaLinea.clientId);
    setErrorServidor(null);
    setLineaConErrorIndex(null);
  };

  /**
   * Divide o continúa un tramo temporal contiguo para el mismo equipo
   */
  const handleContinuarTramo = (index: number) => {
    const lineaActual = lineas[index];
    if (!lineaActual || !lineaActual.itemId) return;

    let inicioSiguiente = hoy;
    try {
      const dFin = new Date(`${lineaActual.fechaFinEstimada}T00:00:00Z`);
      dFin.setDate(dFin.getDate() + 1);
      inicioSiguiente = dFin.toISOString().split('T')[0];
    } catch {
      inicioSiguiente = hoy;
    }

    const nuevaLinea: FormLineaItem = {
      clientId: `linea_${Date.now()}_seg_${lineas.length + 1}`,
      itemId: lineaActual.itemId,
      nombreItem: lineaActual.nombreItem,
      cantidad: lineaActual.cantidad,
      fechaInicio: inicioSiguiente,
      fechaFinEstimada: inicioSiguiente,
      dias: 1,
      tarifaDiaria: lineaActual.tarifaDiaria,
      tarifaPersonalizada: lineaActual.tarifaPersonalizada,
      subtotal: lineaActual.tarifaDiaria * lineaActual.cantidad * 1,
      subtotalPersonalizado: false,
      esSubcontratado: false,
    };

    const nuevasLineas = [...lineas];
    nuevasLineas.splice(index + 1, 0, nuevaLinea);
    setLineas(nuevasLineas);
    if (onLineasChange) onLineasChange(nuevasLineas);
    setErrorServidor(null);
    setLineaConErrorIndex(null);
  };

  const handleEliminarLinea = (index: number) => {
    if (lineas.length <= 1) return;
    setLineas((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (onLineasChange) onLineasChange(next);
      return next;
    });
    if (lineaConErrorIndex === index) setLineaConErrorIndex(null);
  };

  const handleEquipoSelect = (index: number, equipoId: string) => {
    const eq = catalogoEquipos.find((e) => String(e.id) === String(equipoId));
    if (!eq) return;

    setLineas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const tarifa = Number(eq.tarifa_dia) || 0;
        const subtotal = tarifa * l.cantidad * l.dias;
        return {
          ...l,
          itemId: String(eq.id),
          nombreItem: eq.nombre,
          tarifaDiaria: tarifa,
          tarifaPersonalizada: false,
          subtotal,
          subtotalPersonalizado: false,
        };
      })
    );
  };

  const handleFechaChange = (index: number, campo: 'fechaInicio' | 'fechaFinEstimada', valor: string) => {
    setLineas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const nuevaInicio = campo === 'fechaInicio' ? valor : l.fechaInicio;
        let nuevaFin = campo === 'fechaFinEstimada' ? valor : l.fechaFinEstimada;
        if (nuevaFin < nuevaInicio) nuevaFin = nuevaInicio;

        const dias = calcularDias(nuevaInicio, nuevaFin);
        const subtotal = l.subtotalPersonalizado ? l.subtotal : l.tarifaDiaria * l.cantidad * dias;

        return {
          ...l,
          fechaInicio: nuevaInicio,
          fechaFinEstimada: nuevaFin,
          dias,
          subtotal,
        };
      })
    );
  };

  const handleTarifaManualChange = (index: number, tarifa: number) => {
    setLineas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const subtotal = tarifa * l.cantidad * l.dias;
        return {
          ...l,
          tarifaDiaria: tarifa,
          tarifaPersonalizada: true,
          subtotal,
          subtotalPersonalizado: false,
        };
      })
    );
  };

  const handleSubtotalManualChange = (index: number, subtotal: number) => {
    setLineas((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const tarifaCalc = l.dias > 0 && l.cantidad > 0 ? Math.round(subtotal / (l.cantidad * l.dias)) : l.tarifaDiaria;
        return {
          ...l,
          subtotal,
          subtotalPersonalizado: true,
          tarifaDiaria: tarifaCalc,
          tarifaPersonalizada: true,
        };
      })
    );
  };

  // Resolución Asistida 1: Dividir Línea (Re-Renting)
  const handleDividirLinea = (lineaIndex: number, cantidadDisponible: number, cantidadSubcontratada: number) => {
    const lineaOriginal = lineas[lineaIndex];
    if (!lineaOriginal) return;

    const lineaAjustada: FormLineaItem = {
      ...lineaOriginal,
      cantidad: Math.max(1, cantidadDisponible),
      subtotal: lineaOriginal.tarifaDiaria * Math.max(1, cantidadDisponible) * lineaOriginal.dias,
      esSubcontratado: false,
    };

    const lineaReRent: FormLineaItem = {
      clientId: `linea_${Date.now()}_rerent`,
      itemId: lineaOriginal.itemId,
      nombreItem: `${lineaOriginal.nombreItem} (Re-Rent Aliado)`,
      cantidad: Math.max(1, cantidadSubcontratada),
      fechaInicio: lineaOriginal.fechaInicio,
      fechaFinEstimada: lineaOriginal.fechaFinEstimada,
      dias: lineaOriginal.dias,
      tarifaDiaria: lineaOriginal.tarifaDiaria,
      tarifaPersonalizada: lineaOriginal.tarifaPersonalizada,
      subtotal: lineaOriginal.tarifaDiaria * Math.max(1, cantidadSubcontratada) * lineaOriginal.dias,
      subtotalPersonalizado: false,
      esSubcontratado: true,
    };

    const nuevasLineas = [...lineas];
    nuevasLineas[lineaIndex] = lineaAjustada;
    nuevasLineas.splice(lineaIndex + 1, 0, lineaReRent);

    setLineas(nuevasLineas);
    setIsModalOverbookingOpen(false);
    setErrorServidor(null);
    setLineaConErrorIndex(null);
  };

  // Resolución Asistida 2: Ajustar Fechas
  const handleAjustarFechas = (lineaIndex: number, nuevaFechaInicio: string) => {
    const lineaOriginal = lineas[lineaIndex];
    if (!lineaOriginal || !nuevaFechaInicio) return;

    const dInicio = new Date(`${nuevaFechaInicio}T00:00:00Z`);
    const dFin = new Date(dInicio);
    dFin.setDate(dFin.getDate() + lineaOriginal.dias);
    const nuevaFin = dFin.toISOString().split('T')[0];

    setLineas((prev) =>
      prev.map((l, i) =>
        i === lineaIndex
          ? {
            ...l,
            fechaInicio: nuevaFechaInicio,
            fechaFinEstimada: nuevaFin,
          }
          : l
      )
    );

    setIsModalOverbookingOpen(false);
    setErrorServidor(null);
    setLineaConErrorIndex(null);
  };

  // Resolución Asistida 3: Ajustar Cantidad
  const handleAjustarCantidad = (lineaIndex: number, nuevaCantidad: number) => {
    const cant = Math.max(1, nuevaCantidad);
    setLineas((prev) =>
      prev.map((l, i) =>
        i === lineaIndex
          ? {
            ...l,
            cantidad: cant,
            subtotal: l.tarifaDiaria * cant * l.dias,
          }
          : l
      )
    );

    setIsModalOverbookingOpen(false);
    setErrorServidor(null);
    setLineaConErrorIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorServidor(null);
    setLineaConErrorIndex(null);

    const payload = {
      clienteId,
      fleteEntrega,
      fleteRecogida,
      deposito,
      garantiaMonto,
      garantiaTipo,
      observaciones: observaciones || null,
      detallesLogistica: detallesLogistica || null,
      items: lineas.map((l, idx) => ({
        lineaNumero: idx + 1,
        itemId: l.itemId,
        nombreItem: l.nombreItem,
        cantidad: l.cantidad,
        tarifaAplicada: l.tarifaDiaria,
        tarifaPersonalizada: l.tarifaPersonalizada,
        fechaInicio: l.fechaInicio,
        fechaFinEstimada: l.fechaFinEstimada,
        diasContratados: l.dias,
        subtotalLinea: l.subtotal,
        subtotalPersonalizado: l.subtotalPersonalizado,
        esSubcontratado: l.esSubcontratado,
      })),
    };

    const res = await crearAlquilerSegmentadoAction(payload);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorServidor(res);

      // Si el backend reporta sobreventa temporal, parsear y activar Modal Asistido
      if (res.error === 'ERR_OVERBOOKING_CONCURRENTE' && res.message) {
        const eqMatch = res.message.match(/equipo ID (\d+)/i);
        const diaMatch = res.message.match(/fecha pico (\d{4}-\d{2}-\d{2})/i);
        const stockMatch = res.message.match(/Stock Total: (\d+)/i);
        const demandaMatch = res.message.match(/Demanda Comprometida: (\d+)/i);
        const deficitMatch = res.message.match(/Déficit: (\d+)/i);

        const eqId = eqMatch ? eqMatch[1] : '';
        const foundIdx = lineas.findIndex((l) => String(l.itemId) === eqId && !l.esSubcontratado);
        const targetIdx = foundIdx !== -1 ? foundIdx : 0;

        setLineaConErrorIndex(targetIdx);

        const targetLinea = lineas[targetIdx];
        const stockTot = stockMatch ? parseInt(stockMatch[1], 10) : 0;
        const demandaTot = demandaMatch ? parseInt(demandaMatch[1], 10) : targetLinea.cantidad;
        const deficitVal = deficitMatch ? parseInt(deficitMatch[1], 10) : 1;
        const disponibleCupo = Math.max(0, targetLinea.cantidad - deficitVal);

        setConflictoOverbooking({
          lineaIndex: targetIdx,
          lineaNumero: targetIdx + 1,
          equipoId: targetLinea.itemId,
          equipoNombre: targetLinea.nombreItem || 'Equipo de Construcción',
          cantidadSolicitada: targetLinea.cantidad,
          capacidadDisponible: disponibleCupo,
          deficit: deficitVal,
          diaPico: diaMatch ? diaMatch[1] : targetLinea.fechaInicio,
        });

        setIsModalOverbookingOpen(true);
      }
    } else {
      if (onSuccess) onSuccess(res.data);
    }
  };

  const subtotalTotal = lineas.reduce((acc, l) => acc + l.subtotal, 0);

  return (
    <div className="space-y-4">
      {/* Alerta de Error del Servidor */}
      {errorServidor && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-900 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Error [{errorServidor.error}]: {errorServidor.message}</p>
            <p className="text-xs font-mono text-rose-700">Traza de backend: {errorServidor.path}</p>
            {lineaConErrorIndex !== null && (
              <p className="text-xs font-bold text-rose-800">
                Línea afectada: #{lineaConErrorIndex + 1} ({lineas[lineaConErrorIndex].nombreItem || 'Equipo'})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabla Dinámica de Líneas Segmentadas */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-200/90 rounded-xl shadow-sm mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                <span>Maquinaria y Equipos Solicitados</span>
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">Subtotal Total:</span>
              <span className="text-sm font-bold font-mono text-slate-900">
                ${subtotalTotal.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {lineas.map((linea, idx) => {
            const isError = lineaConErrorIndex === idx;
            const isComboboxOpen = openComboboxRowId === linea.clientId;

            // Dummy logic for stock verification in standalone component since we don't have the parent's full logic.
            // Ideally this would be passed down, but for now we map directly from the selected equipment in catalogoEquipos
            const eqSelected = catalogoEquipos.find((e) => String(e.id) === String(linea.itemId));
            const stockCheck = {
              disponible: eqSelected?.stock_disponible ?? 0,
              equipo: eqSelected ?? null,
            };

            return (
              <div
                key={linea.clientId}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 relative ${isError
                    ? 'border-rose-500 bg-rose-50/80'
                    : isComboboxOpen
                      ? 'bg-white border-slate-400 shadow-xl ring-2 ring-slate-400/20'
                      : linea.esSubcontratado
                        ? 'bg-sky-50/50 border-sky-200'
                        : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                style={{ zIndex: isComboboxOpen ? 100 : Math.max(1, 40 - idx) }}
              >
                {/* Header de Card */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded-sm">
                      #{idx + 1}
                    </span>
                    {linea.esSubcontratado && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                        <Split className="w-3 h-3" /> Subcontratado (Re-Rent)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Dividir o continuar tramo temporal siguiente"
                      disabled={!linea.itemId}
                      onClick={() => handleContinuarTramo(idx)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md disabled:opacity-20 transition-colors"
                    >
                      <Split className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar línea"
                      disabled={lineas.length <= 1}
                      onClick={() => handleEliminarLinea(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md disabled:opacity-20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body de Card */}
                <div className="flex flex-col gap-3">
                  {/* Sección Equipo */}
                  <div className="w-full flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`eq-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Equipo Requerido *</label>
                      {stockCheck.equipo && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold truncate ${stockCheck.disponible > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                          Stock propio: {stockCheck.disponible}
                        </span>
                      )}
                    </div>
                    <EquipoCombobox
                      equipos={catalogoEquipos}
                      value={linea.itemId}
                      placeholder="Seleccione equipo..."
                      autoFocus={autoFocusRowId === linea.clientId}
                      onCrearNuevo={() => setIsCreandoEquipo?.(true)}
                      onOpenChange={(isOpen) => {
                        setOpenComboboxRowId(isOpen ? linea.clientId : null);
                      }}
                      onChange={(eqId, equipo) => {
                        if (equipo) {
                          handleEquipoSelect(idx, String(equipo.id));
                        }
                      }}
                    />
                  </div>

                  {/* ── GRID RESPONSIVO DE VALORES ─────────────────────────────── */}
                  <div className="grid gap-x-2 gap-y-3 w-full"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
                  >
                    {/* Tarifa / Día */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`tarifa-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Tarifa / Día</label>
                      <input
                        id={`tarifa-${linea.clientId}`}
                        type="number"
                        min="0"
                        value={linea.tarifaDiaria}
                        onChange={(e) => handleTarifaManualChange(idx, parseFloat(e.target.value) || 0)}
                        className={`px-2.5 py-2 w-full border rounded-xl text-xs text-right focus:ring-2 outline-none font-mono font-semibold tabular-nums ${linea.tarifaPersonalizada
                            ? 'border-sky-500 bg-sky-50 text-sky-900 focus:ring-sky-500/20'
                            : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900/20 focus:border-slate-900'
                          }`}
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`cant-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Cant.</label>
                      <input
                        id={`cant-${linea.clientId}`}
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) => {
                          const cant = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setLineas((prev) =>
                            prev.map((l, i) =>
                              i === idx ? { ...l, cantidad: cant, subtotal: l.tarifaDiaria * cant * l.dias } : l
                            )
                          );
                        }}
                        className="px-2.5 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs text-center text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none font-mono"
                        required
                      />
                    </div>

                    {/* Fecha Inicio */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`ini-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Desde</label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id={`ini-${linea.clientId}`}
                          type="date"
                          value={linea.fechaInicio}
                          onChange={(e) => handleFechaChange(idx, 'fechaInicio', e.target.value)}
                          className="pl-8 pr-2 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Fecha Fin Estimada */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`fin-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Hasta</label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id={`fin-${linea.clientId}`}
                          type="date"
                          value={linea.fechaFinEstimada}
                          onChange={(e) => handleFechaChange(idx, 'fechaFinEstimada', e.target.value)}
                          className="pl-8 pr-2 py-2 w-full bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Días Calculados */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-700 text-center">Días</label>
                      <div className="w-full px-2 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold text-center flex items-center justify-center">
                        {linea.dias}d
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`sub-${linea.clientId}`} className="text-[11px] font-bold text-slate-700">Subtotal</label>
                      <input
                        id={`sub-${linea.clientId}`}
                        type="number"
                        min="0"
                        value={linea.subtotal}
                        onChange={(e) => handleSubtotalManualChange(idx, parseFloat(e.target.value) || 0)}
                        className={`px-2.5 py-2 w-full border rounded-xl text-xs text-right focus:ring-2 outline-none font-mono font-bold tabular-nums ${linea.subtotalPersonalizado
                            ? 'border-amber-500 bg-amber-50 text-amber-900 focus:ring-amber-500/20'
                            : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900/20 focus:border-slate-900'
                          }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Texto de cálculo */}
                <div className="mt-1 border-t border-slate-100/50 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500 font-mono">
                    ${linea.tarifaDiaria.toLocaleString('es-CO')} × {linea.cantidad} unid. × {linea.dias} día(s) = <span className="font-semibold text-slate-700 capitalize">{formatearMonedaConLetras(linea.subtotal)}</span>
                  </p>
                  {isError && conflictoOverbooking && conflictoOverbooking.lineaIndex === idx && (
                    <p className="text-[11px] font-bold text-rose-600 animate-pulse">
                      ¡Stock insuficiente para cubrir este rango de fechas!
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={handleAgregarLinea}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl shadow-sm hover:bg-slate-50 text-slate-700 transition-colors focus:ring-2 focus:ring-slate-900/20 outline-none"
            >
              <Plus className="w-4 h-4" /> Agregar Línea de Alquiler
            </button>
          </div>
        </div>

        {/* Poka-Yoke Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-xs hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-2 shadow-sm transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Validando Stock y Formalizando...</span>
              </>
            ) : (
              <span>Formalizar Contrato Segmentado</span>
            )}
          </button>
        </div>
      </form>

      {/* Modal Asistido de Resolución Rápida */}
      <ModalResolucionOverbooking
        isOpen={isModalOverbookingOpen}
        onClose={() => setIsModalOverbookingOpen(false)}
        conflicto={conflictoOverbooking}
        onDividirLinea={handleDividirLinea}
        onAjustarFechas={handleAjustarFechas}
        onAjustarCantidad={handleAjustarCantidad}
      />
    </div>
  );
};
