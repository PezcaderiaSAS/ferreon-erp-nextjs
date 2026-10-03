'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Truck,
  CornerDownLeft,
  Coins,
  Wrench,
  Clock,
  ExternalLink
} from 'lucide-react';
import {
  type EventoCalendario,
  type VistaCalendario,
  type FiltrosCalendario,
  type TipoEventoCalendario
} from '@/core/types/dashboard';
import { formatearMonedaCOP } from '@/core/services/dashboard-transaccional.service';

interface CalendarioOperativoIslandProps {
  eventos: EventoCalendario[];
  mesInicial?: string; // YYYY-MM
  onSelectDay: (fecha: string) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function CalendarioOperativoIsland({
  eventos,
  mesInicial,
  onSelectDay
}: CalendarioOperativoIslandProps) {
  // Estado de fecha actual navegada
  const [currentYear, setCurrentYear] = useState<number>(() => {
    if (mesInicial) return parseInt(mesInicial.split('-')[0], 10);
    return new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    if (mesInicial) return parseInt(mesInicial.split('-')[1], 10) - 1;
    return new Date().getMonth();
  });

  const [vista, setVista] = useState<VistaCalendario>('MES');

  const [filtros, setFiltros] = useState<FiltrosCalendario>({
    alquileres: true,
    devoluciones: true,
    cobranzas: true,
    mantenimientos: true
  });

  const toggleFiltro = (key: keyof FiltrosCalendario) => {
    setFiltros((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Navegación de meses
  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleHoy = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  // Formato YYYY-MM
  const mesActualStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const hoyStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Nombre del mes formateado en español
  const nombreMesLegible = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Filtrar eventos según filtros activos
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (e.tipo === 'ALQUILER_DESPACHO' && !filtros.alquileres) return false;
      if (e.tipo === 'DEVOLUCION' && !filtros.devoluciones) return false;
      if ((e.tipo === 'COBRANZA_VENCIMIENTO' || e.tipo === 'PAGO_RECIBIDO') && !filtros.cobranzas) return false;
      if (e.tipo === 'MANTENIMIENTO' && !filtros.mantenimientos) return false;
      return true;
    });
  }, [eventos, filtros]);

  // Matriz del mes (cuadrícula de días)
  const matrizDiasMes = useMemo(() => {
    const primerDia = new Date(currentYear, currentMonth, 1);
    const ultimoDia = new Date(currentYear, currentMonth + 1, 0);

    // En JS 0 = Domingo, 1 = Lunes... Queremos Lunes como primer día (0)
    let offsetInicio = primerDia.getDay() - 1;
    if (offsetInicio === -1) offsetInicio = 6;

    const totalDias = ultimoDia.getDate();
    const dias = [];

    // Días vacíos previos
    for (let i = 0; i < offsetInicio; i++) {
      dias.push({ dia: null, fecha: '' });
    }

    // Días del mes
    for (let d = 1; d <= totalDias; d++) {
      const fecha = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dias.push({ dia: d, fecha });
    }

    return dias;
  }, [currentYear, currentMonth]);

  // Mapa de eventos por fecha
  const eventosPorFecha = useMemo(() => {
    const map = new Map<string, EventoCalendario[]>();
    for (const evt of eventosFiltrados) {
      const arr = map.get(evt.fecha) || [];
      arr.push(evt);
      map.set(evt.fecha, arr);
    }
    return map;
  }, [eventosFiltrados]);

  // Renderizador de píldora compacta de evento en celda de calendario
  const renderEventChip = (evt: EventoCalendario) => {
    let bg = 'bg-slate-100 text-slate-700 border-slate-200';
    let icon = <CalendarIcon className="w-2.5 h-2.5 shrink-0" />;

    if (evt.tipo === 'ALQUILER_DESPACHO') {
      bg = 'bg-blue-50 text-blue-800 border-blue-200';
      icon = <Truck className="w-2.5 h-2.5 text-blue-600 shrink-0" />;
    } else if (evt.tipo === 'DEVOLUCION') {
      bg = evt.urgencia === 'CRITICA' ? 'bg-red-100 text-red-800 border-red-300 font-bold' : 'bg-red-50 text-red-700 border-red-200';
      icon = <CornerDownLeft className="w-2.5 h-2.5 text-red-600 shrink-0" />;
    } else if (evt.tipo === 'COBRANZA_VENCIMIENTO') {
      bg = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = <Coins className="w-2.5 h-2.5 text-amber-600 shrink-0" />;
    } else if (evt.tipo === 'MANTENIMIENTO') {
      bg = 'bg-orange-50 text-orange-800 border-orange-200';
      icon = <Wrench className="w-2.5 h-2.5 text-orange-600 shrink-0" />;
    }

    return (
      <div
        key={evt.id}
        className={`px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1 truncate ${bg} transition-transform hover:scale-[1.02]`}
        title={`${evt.titulo} (${evt.clienteNombre || ''})`}
      >
        {icon}
        <span className="truncate">{evt.equipoNombre || evt.titulo}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-4 w-full">
      {/* 1. Barra de Control del Calendario */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
        {/* Mes y Controles de Navegación */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/50 p-0.5">
            <button
              onClick={handlePrev}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleHoy}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 capitalize ml-1 tracking-tight">
            {nombreMesLegible}
          </h2>
        </div>

        {/* Selector de Vista (Mes / Semana / Agenda) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
          {(['MES', 'SEMANA', 'AGENDA'] as VistaCalendario[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                vista === v
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {v === 'MES' ? 'Mes' : v === 'SEMANA' ? 'Semana' : 'Agenda'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Píldoras de Filtro por Tipo de Flujo */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium text-[11px] mr-1">Filtrar:</span>
        <button
          onClick={() => toggleFiltro('alquileres')}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.alquileres
              ? 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Alquileres / Despachos
        </button>

        <button
          onClick={() => toggleFiltro('devoluciones')}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.devoluciones
              ? 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          Devoluciones / Retornos
        </button>

        <button
          onClick={() => toggleFiltro('cobranzas')}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.cobranzas
              ? 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Vencimiento Cobros
        </button>

        <button
          onClick={() => toggleFiltro('mantenimientos')}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.mantenimientos
              ? 'bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-100'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
          Taller / Mantenimiento
        </button>
      </div>

      {/* 3. Render de Vistas */}

      {/* --- A. Vista Mes --- */}
      {vista === 'MES' && (
        <div className="w-full overflow-x-auto">
          {/* Cabecera Días de Semana */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 py-1.5 border-b border-slate-100">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Celdas del Mes */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 min-w-[550px]">
            {matrizDiasMes.map((item, idx) => {
              if (!item.dia) {
                return <div key={`empty-${idx}`} className="h-24 rounded-lg bg-slate-50/30" />;
              }

              const esHoy = item.fecha === hoyStr;
              const eventosDelDia = eventosPorFecha.get(item.fecha) || [];
              const maxChips = 2;
              const tieneMas = eventosDelDia.length > maxChips;

              return (
                <div
                  key={item.fecha}
                  onClick={() => onSelectDay(item.fecha)}
                  className={`h-24 p-1.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer group ${
                    esHoy
                      ? 'border-brand-salmon ring-1 ring-brand-salmon/40 bg-orange-50/20'
                      : 'border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* Número de Día y Dot Indicador */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        esHoy
                          ? 'bg-brand-salmon text-white'
                          : 'text-slate-700 group-hover:text-slate-900'
                      }`}
                    >
                      {item.dia}
                    </span>

                    {eventosDelDia.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-salmon" />
                    )}
                  </div>

                  {/* Chips de Eventos */}
                  <div className="flex flex-col gap-1 overflow-hidden my-0.5">
                    {eventosDelDia.slice(0, maxChips).map(renderEventChip)}
                    {tieneMas && (
                      <span className="text-[9px] font-semibold text-slate-500 pl-0.5">
                        +{eventosDelDia.length - maxChips} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- B. Vista Semana --- */}
      {vista === 'SEMANA' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-2">
          {matrizDiasMes
            .filter((i) => i.dia !== null)
            .slice(0, 7)
            .map((item) => {
              const eventosDelDia = eventosPorFecha.get(item.fecha) || [];
              const esHoy = item.fecha === hoyStr;

              return (
                <div
                  key={item.fecha}
                  onClick={() => onSelectDay(item.fecha)}
                  className={`border rounded-xl p-3 flex flex-col gap-2 min-h-[300px] cursor-pointer transition-all ${
                    esHoy
                      ? 'border-brand-salmon ring-1 ring-brand-salmon/40 bg-orange-50/15'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-700">Día {item.dia}</span>
                    {esHoy && <span className="text-[10px] font-bold text-brand-salmon">HOY</span>}
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                    {eventosDelDia.length === 0 ? (
                      <span className="text-[11px] text-slate-400 mt-2">Sin actividad</span>
                    ) : (
                      eventosDelDia.map(renderEventChip)
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* --- C. Vista Agenda --- */}
      {vista === 'AGENDA' && (
        <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pt-1 pr-1">
          {eventosFiltrados.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No hay actividades para los filtros seleccionados en este período.
            </div>
          ) : (
            eventosFiltrados.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectDay(evt.fecha)}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 flex justify-between items-center cursor-pointer transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border border-slate-200 text-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {evt.fecha.split('-')[1]}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 leading-none">
                      {evt.fecha.split('-')[2]}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{evt.titulo}</h3>
                    <p className="text-[11px] text-slate-500">
                      {evt.clienteNombre ? `Cliente: ${evt.clienteNombre} • ` : ''}
                      {evt.descripcion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {evt.monto && (
                    <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                      {formatearMonedaCOP(evt.monto)}
                    </span>
                  )}
                  {renderEventChip(evt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
