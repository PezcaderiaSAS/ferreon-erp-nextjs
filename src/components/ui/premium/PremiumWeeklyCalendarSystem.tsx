'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Briefcase,
  Users,
  User,
  Sparkles,
  Filter,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'team';
  dayIndex: number; // 0: Mon, 1: Tue, ... 6: Sun
  timeSlot: string; // '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM'
  duration?: string;
}

const SAMPLE_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Despacho Andamios', category: 'work', dayIndex: 0, timeSlot: '8 AM', duration: '1h' },
  { id: '2', title: 'Daily Standup Alquileres', category: 'team', dayIndex: 0, timeSlot: '10 AM', duration: '30m' },
  { id: '3', title: 'Revisión Contratos VIP', category: 'work', dayIndex: 1, timeSlot: '9 AM', duration: '1.5h' },
  { id: '4', title: 'Almuerzo Ejecutivo', category: 'personal', dayIndex: 1, timeSlot: '12 PM', duration: '1h' },
  { id: '5', title: 'Design Review UI/UX', category: 'team', dayIndex: 2, timeSlot: '11 AM', duration: '1h' },
  { id: '6', title: 'Devolución Maquinaria', category: 'work', dayIndex: 3, timeSlot: '8 AM', duration: '2h' },
  { id: '7', title: 'Capacitación Seguridad', category: 'team', dayIndex: 3, timeSlot: '2 PM', duration: '1.5h' },
  { id: '8', title: 'Cierre Contable Semanal', category: 'work', dayIndex: 4, timeSlot: '10 AM', duration: '2h' },
  { id: '9', title: 'Coffee Break & Planning', category: 'personal', dayIndex: 4, timeSlot: '1 PM', duration: '45m' },
  { id: '10', title: 'Mantenimiento Preventivo', category: 'work', dayIndex: 5, timeSlot: '9 AM', duration: '3h' },
];

const DAYS = [
  { key: 'MON', label: 'LUN', date: '14' },
  { key: 'TUE', label: 'MAR', date: '15', isToday: true },
  { key: 'WED', label: 'MIÉ', date: '16' },
  { key: 'THU', label: 'JUE', date: '17' },
  { key: 'FRI', label: 'VIE', date: '18' },
  { key: 'SAT', label: 'SÁB', date: '19' },
  { key: 'SUN', label: 'DOM', date: '20' },
];

const TIME_SLOTS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM'];

export function PremiumWeeklyCalendarSystem() {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [activeCategory, setActiveCategory] = useState<'all' | 'work' | 'personal' | 'team'>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const filteredEvents = SAMPLE_EVENTS.filter((e) =>
    activeCategory === 'all' ? true : e.category === activeCategory
  );

  const getCategoryStyles = (category: 'work' | 'personal' | 'team') => {
    switch (category) {
      case 'work':
        return 'bg-[#0d9488] hover:bg-[#0f766e] text-white border border-[#14b8a6]/40 shadow-sm';
      case 'personal':
        return 'bg-[#d97706] hover:bg-[#b45309] text-white border border-[#f59e0b]/40 shadow-sm';
      case 'team':
        return 'bg-[#6d28d9] hover:bg-[#5b21b6] text-white border border-[#8b5cf6]/40 shadow-sm';
    }
  };

  return (
    <div className="w-full bg-[#080c0e] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#1f2937] shadow-2xl font-sans">
      {/* Insignia Superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CALENDAR IS A SYSTEM · 01</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Una semana. Cuarenta eventos operativos.
          </h2>
        </div>

        {/* Selector de Vistas */}
        <div className="flex items-center bg-[#111827] p-1 rounded-xl border border-[#1f2937] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'day'
                ? 'bg-[#1f2937] text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Día
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'week'
                ? 'bg-[#1f2937] text-[#00e699] font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'month'
                ? 'bg-[#1f2937] text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Tarjeta Contenedora Principal */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-4 sm:p-6 shadow-xl">
        {/* Cabecera de Calendario */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f2937] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1f2937] border border-slate-700 flex items-center justify-center text-[#00e699]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-100">Alquileres System Chrono</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-[#00e699] border border-[#00e699]/30 font-mono">
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-slate-400">Semana del 14 al 20 de Septiembre, 2026</p>
            </div>
          </div>

          {/* Navegación y Filtros */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1f2937] p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">Sem 38</span>
              <button
                type="button"
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Encabezado de Días */}
        <div className="grid grid-cols-8 gap-2 pb-3 border-b border-[#1f2937] text-center text-xs font-semibold">
          <div className="text-slate-500 font-mono text-[11px] flex items-center justify-center">
            GMT-5
          </div>
          {DAYS.map((day) => (
            <div
              key={day.key}
              className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
                day.isToday
                  ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-[10px] tracking-wider text-slate-400">{day.label}</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold">{day.date}</span>
                {day.isToday && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Grid (Slots Horarios y Eventos) */}
        <div className="divide-y divide-[#1f2937]/50 max-h-[380px] overflow-y-auto pr-1 mt-1">
          {TIME_SLOTS.map((slot) => (
            <div key={slot} className="grid grid-cols-8 gap-2 py-2 min-h-[52px] items-center">
              {/* Hora a la izquierda */}
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-600" />
                <span>{slot}</span>
              </div>

              {/* 7 Columnas de días */}
              {DAYS.map((_, dayIdx) => {
                const event = filteredEvents.find(
                  (e) => e.dayIndex === dayIdx && e.timeSlot === slot
                );

                return (
                  <div
                    key={dayIdx}
                    className="h-full flex items-center justify-center min-h-[36px]"
                  >
                    {event ? (
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className={`w-full text-left p-1.5 rounded-lg text-[11px] font-medium transition-all transform hover:scale-[1.02] truncate ${getCategoryStyles(
                          event.category
                        )}`}
                      >
                        <div className="truncate font-semibold">{event.title}</div>
                        <span className="text-[9px] opacity-80 font-mono block">
                          {event.duration}
                        </span>
                      </button>
                    ) : (
                      <div className="w-full h-full rounded hover:bg-slate-800/30 transition-colors cursor-pointer" />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Modal / Toast Informativo de Evento Seleccionado */}
        {selectedEvent && (
          <div className="mt-4 p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">
                Evento: {selectedEvent.title}
              </span>
              <span className="text-slate-400 font-mono">
                ({selectedEvent.timeSlot} • {selectedEvent.category.toUpperCase()})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Pie con Leyenda y Contadores */}
        <footer className="mt-5 pt-4 border-t border-[#1f2937] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === 'work' ? 'all' : 'work')}
              className={`flex items-center gap-1.5 transition-opacity ${
                activeCategory !== 'all' && activeCategory !== 'work' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#0d9488]" />
              <span className="text-slate-300">Operaciones (Work)</span>
              <strong className="font-mono text-white ml-1">15</strong>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === 'personal' ? 'all' : 'personal')}
              className={`flex items-center gap-1.5 transition-opacity ${
                activeCategory !== 'all' && activeCategory !== 'personal' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#d97706]" />
              <span className="text-slate-300">Personal</span>
              <strong className="font-mono text-white ml-1">15</strong>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === 'team' ? 'all' : 'team')}
              className={`flex items-center gap-1.5 transition-opacity ${
                activeCategory !== 'all' && activeCategory !== 'team' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#6d28d9]" />
              <span className="text-slate-300">Equipo (Team)</span>
              <strong className="font-mono text-white ml-1">10</strong>
            </button>
          </div>

          <div className="font-mono text-[11px] text-[#00e699]">
            Zero-Overlaps Grid • Total: 40 Eventos
          </div>
        </footer>
      </div>
    </div>
  );
}
