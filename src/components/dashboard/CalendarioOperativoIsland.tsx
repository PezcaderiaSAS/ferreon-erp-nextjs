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
  ExternalLink,
  FileText,
  Receipt
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
    mantenimientos: true,
    cotizaciones: true,
    cobros: true
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
      if (e.tipo === 'COBRANZA_VENCIMIENTO' && !filtros.cobranzas) return false;
      if (e.tipo === 'MANTENIMIENTO' && !filtros.mantenimientos) return false;
      if (e.tipo === 'COTIZACION' && filtros.cotizaciones === false) return false;
      if ((e.tipo === 'FACTURA_COBRO' || e.tipo === 'PAGO_RECIBIDO') && filtros.cobros === false) return false;
      return true;
    });
  }, [eventos, filtros]);

  // Construcción de la matriz de días para el mes visible
  const matrizDiasMes = useMemo(() => {
    const primerDiaMes = new Date(currentYear, currentMonth, 1);
    const ultimoDiaMes = new Date(currentYear, currentMonth + 1, 0);

    // Ajuste a Lunes = 0, Domingo = 6
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const totalDias = ultimoDiaMes.getDate();
    const dias: { dia: number | null; fecha: string }[] = [];

    // Días vacíos previos
    for (let i = 0; i < diaSemanaInicio; i++) {
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
    let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    let icon = <CalendarIcon className="w-2.5 h-2.5 shrink-0" />;

    if (evt.tipo === 'ALQUILER_DESPACHO') {
      bg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40';
      icon = <Truck className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400 shrink-0" />;
    } else if (evt.tipo === 'DEVOLUCION') {
      bg = evt.urgencia === 'CRITICA'
        ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800 font-bold'
        : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40';
      icon = <CornerDownLeft className="w-2.5 h-2.5 text-red-600 dark:text-red-400 shrink-0" />;
    } else if (evt.tipo === 'COBRANZA_VENCIMIENTO') {
      bg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      icon = <Coins className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />;
    } else if (evt.tipo === 'MANTENIMIENTO') {
      bg = 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/40';
      icon = <Wrench className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400 shrink-0" />;
    } else if (evt.tipo === 'COTIZACION') {
      bg = 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40';
      icon = <FileText className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400 shrink-0" />;
    } else if (evt.tipo === 'FACTURA_COBRO') {
      bg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      icon = <Receipt className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    } else if (evt.tipo === 'PAGO_RECIBIDO') {
      bg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      icon = <Coins className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }

    return (
      <div
        key={evt.id}
        className={`px-1.5 py-0.5 rounded-md text-[10px] border flex items-center gap-1 truncate ${bg} transition-transform hover:scale-[1.02]`}
        title={`${evt.titulo} (${evt.clienteNombre || ''})`}
      >
        {icon}
        <span className="truncate">{evt.equipoNombre || evt.titulo}</span>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-card p-5 flex flex-col gap-4 w-full transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* 1. Barra de Control del Calendario */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        {/* Mes y Controles de Navegación */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleHoy}
              className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize ml-1 tracking-tight">
            {nombreMesLegible}
          </h2>
        </div>

        {/* Selector de Vista (Mes / Semana / Agenda) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          {(['MES', 'SEMANA', 'AGENDA'] as VistaCalendario[]).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                vista === v
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {v === 'MES' ? 'Mes' : v === 'SEMANA' ? 'Semana' : 'Agenda'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Píldoras de Filtro por Tipo de Flujo */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px] mr-1">
          FILTRAR:
        </span>
        <button
          onClick={() => toggleFiltro('alquileres')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.alquileres
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40 ring-1 ring-blue-100 dark:ring-blue-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          Alquileres / Despachos
        </button>

        <button
          onClick={() => toggleFiltro('devoluciones')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.devoluciones
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/40 ring-1 ring-red-100 dark:ring-red-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
          Devoluciones / Retornos
        </button>

        <button
          onClick={() => toggleFiltro('cobranzas')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.cobranzas
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 ring-1 ring-amber-100 dark:ring-amber-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
          Vencimiento Cobros
        </button>

        <button
          onClick={() => toggleFiltro('mantenimientos')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.mantenimientos
              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/40 ring-1 ring-orange-100 dark:ring-orange-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-400" />
          Taller / Mantenimiento
        </button>

        <button
          onClick={() => toggleFiltro('cotizaciones')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.cotizaciones
              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 ring-1 ring-purple-100 dark:ring-purple-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400" />
          Cotizaciones
        </button>

        <button
          onClick={() => toggleFiltro('cobros')}
          className={`px-3 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
            filtros.cobros
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30'
              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Cobros / Facturación
        </button>
      </div>

      {/* 3. Render de Vistas */}

      {/* --- A. Vista Mes --- */}
      {vista === 'MES' && (
        <div className="w-full overflow-x-auto">
          {/* Cabecera Días de Semana */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-400 dark:text-slate-500 py-1.5 border-b border-slate-100 dark:border-slate-800">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Celdas del Mes con Radios Anidados Armónicos */}
          <div className="grid grid-cols-7 gap-1.5 pt-2 min-w-[550px]">
            {matrizDiasMes.map((item, idx) => {
              if (!item.dia) {
                return <div key={`empty-${idx}`} className="h-24 rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />;
              }

              const esHoy = item.fecha === hoyStr;
              const eventosDelDia = eventosPorFecha.get(item.fecha) || [];
              const maxChips = 2;
              const tieneMas = eventosDelDia.length > maxChips;

              return (
                <div
                  key={item.fecha}
                  onClick={() => onSelectDay(item.fecha)}
                  className={`h-24 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                    esHoy
                      ? 'border-brand-salmon ring-1 ring-brand-salmon/40 bg-orange-50/20 dark:bg-orange-950/20'
                      : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Número de Día y Dot Indicador con Tabular Nums */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums w-5 h-5 flex items-center justify-center rounded-full ${
                        esHoy
                          ? 'bg-brand-salmon text-white'
                          : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
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
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 pl-0.5 font-mono tabular-nums">
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
                      ? 'border-brand-salmon ring-1 ring-brand-salmon/40 bg-orange-50/15 dark:bg-orange-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-xs font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      Día {item.dia}
                    </span>
                    {esHoy && <span className="text-[10px] font-bold text-brand-salmon">HOY</span>}
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
                    {eventosDelDia.length === 0 ? (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">Sin actividad</span>
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
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
              No hay actividades para los filtros seleccionados en este período.
            </div>
          ) : (
            eventosFiltrados.map((evt) => (
              <div
                key={evt.id}
                onClick={() => onSelectDay(evt.fecha)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex justify-between items-center cursor-pointer transition-all gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                      {evt.fecha.split('-')[1]}
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums leading-none">
                      {evt.fecha.split('-')[2]}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{evt.titulo}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {evt.clienteNombre ? `Cliente: ${evt.clienteNombre} • ` : ''}
                      {evt.descripcion}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {evt.monto && (
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
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
