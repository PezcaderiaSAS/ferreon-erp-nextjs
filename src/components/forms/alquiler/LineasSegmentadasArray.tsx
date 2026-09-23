'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, AlertTriangle, Loader2, CheckCircle2, Split } from 'lucide-react';
import { crearAlquilerSegmentadoAction, ActionStandardResponse } from '@/app/actions/alquiler-segmentado';
import { ModalResolucionOverbooking, OverbookingConflictInfo } from './ModalResolucionOverbooking';

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
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-2.5 w-8">#</th>
                <th className="p-2.5 w-1/4">Equipo / Maquinaria</th>
                <th className="p-2.5 w-16 text-center">Cant.</th>
                <th className="p-2.5">Desde</th>
                <th className="p-2.5">Hasta</th>
                <th className="p-2.5 w-12 text-center">Días</th>
                <th className="p-2.5 w-28 text-right">Tarifa/Día</th>
                <th className="p-2.5 w-32 text-right">Subtotal</th>
                <th className="p-2.5 w-16 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lineas.map((linea, idx) => {
                const isError = lineaConErrorIndex === idx;
                return (
                  <tr
                    key={linea.clientId}
                    className={`transition-colors ${
                      isError
                        ? 'bg-rose-50/80 border-2 border-rose-500'
                        : linea.esSubcontratado
                        ? 'bg-sky-50/50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
                    <td className="p-2.5">
                      <div className="space-y-1">
                        <select
                          value={linea.itemId}
                          onChange={(e) => handleEquipoSelect(idx, e.target.value)}
                          className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs font-medium focus:ring-1 focus:ring-slate-900"
                          required
                        >
                          <option value="">Seleccione equipo...</option>
                          {catalogoEquipos.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.nombre} (Stock actual: {eq.stock_disponible})
                            </option>
                          ))}
                        </select>
                        {linea.esSubcontratado && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                            <Split className="w-3 h-3" /> Subcontratado (Re-Rent)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <input
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
                        className="w-14 p-1.5 border border-slate-200 rounded text-center font-mono text-xs"
                        required
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="date"
                        value={linea.fechaInicio}
                        onChange={(e) => handleFechaChange(idx, 'fechaInicio', e.target.value)}
                        className="p-1 border border-slate-200 rounded text-xs w-full"
                        required
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="date"
                        value={linea.fechaFinEstimada}
                        onChange={(e) => handleFechaChange(idx, 'fechaFinEstimada', e.target.value)}
                        className="p-1 border border-slate-200 rounded text-xs w-full"
                        required
                      />
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-700">{linea.dias}</td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={linea.tarifaDiaria}
                        onChange={(e) => handleTarifaManualChange(idx, parseFloat(e.target.value) || 0)}
                        className={`w-full p-1.5 text-right font-mono text-xs border rounded ${
                          linea.tarifaPersonalizada ? 'border-sky-500 bg-sky-50 font-bold' : 'border-slate-200'
                        }`}
                      />
                    </td>
                    <td className="p-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={linea.subtotal}
                        onChange={(e) => handleSubtotalManualChange(idx, parseFloat(e.target.value) || 0)}
                        className={`w-full p-1.5 text-right font-mono text-xs font-bold border rounded ${
                          linea.subtotalPersonalizado
                            ? 'border-amber-500 bg-amber-50 text-amber-900'
                            : 'border-slate-200 text-slate-900'
                        }`}
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Dividir o continuar tramo temporal siguiente"
                          disabled={!linea.itemId}
                          onClick={() => handleContinuarTramo(idx)}
                          className="p-1 text-slate-400 hover:text-sky-600 disabled:opacity-20 transition-colors"
                        >
                          <Split className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Eliminar línea"
                          disabled={lineas.length <= 1}
                          onClick={() => handleEliminarLinea(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Barra de Acciones del Formulario */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button
              type="button"
              onClick={handleAgregarLinea}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-100 text-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Línea de Alquiler
            </button>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-2">Total Equipos:</span>
              <span className="text-sm font-bold font-mono text-slate-900">
                ${subtotalTotal.toLocaleString('es-CO')}
              </span>
            </div>
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
