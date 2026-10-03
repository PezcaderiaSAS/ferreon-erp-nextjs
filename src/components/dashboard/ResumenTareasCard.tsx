'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Plus,
  ExternalLink,
  ListTodo,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { type TareaOperativa, type UrgenciaTarea } from '@/core/types/dashboard';

interface ResumenTareasCardProps {
  tareas: TareaOperativa[];
  onToggleTarea: (tareaId: string) => void;
  onCrearTareaManual: (titulo: string, urgencia?: UrgenciaTarea, fechaLimite?: string) => void;
  onEliminarTarea?: (tareaId: string) => void;
}

export function ResumenTareasCard({
  tareas,
  onToggleTarea,
  onCrearTareaManual,
  onEliminarTarea
}: ResumenTareasCardProps) {
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [urgenteSeleccionado, setUrgenteSeleccionado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    onCrearTareaManual(
      nuevoTitulo.trim(),
      urgenteSeleccionado ? 'URGENTE' : 'NORMAL'
    );
    setNuevoTitulo('');
    setUrgenteSeleccionado(false);
  };

  const tareasPendientes = tareas.filter((t) => !t.completada);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-card p-5 flex flex-col gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Cabecera */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-brand-salmon">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Tareas & Pendientes Críticos
            </h2>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <span className="tabular-nums">{tareasPendientes.length}</span> activas
        </span>
      </div>

      {/* Lista de Tareas */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {tareas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
            No tienes tareas pendientes para hoy. ¡Todo al día!
          </div>
        ) : (
          tareas.map((tarea) => {
            const esUrgente = tarea.urgencia === 'URGENTE' && !tarea.completada;
            const esManual = tarea.tipo === 'MANUAL';

            return (
              <div
                key={tarea.id}
                className={`group p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-xs ${
                  tarea.completada
                    ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60'
                    : esUrgente
                    ? 'bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/40'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTarea(tarea.id)}
                  className="mt-0.5 text-slate-400 hover:text-brand-salmon dark:hover:text-orange-400 transition-colors shrink-0"
                  aria-label={tarea.completada ? 'Marcar incompleta' : 'Marcar completada'}
                >
                  {tarea.completada ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`font-medium ${
                        tarea.completada
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {tarea.titulo}
                    </span>

                    {esUrgente && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Urgente
                      </span>
                    )}

                    {tarea.tipo === 'SISTEMA' ? (
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Sistema
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        Manual
                      </span>
                    )}
                  </div>

                  {tarea.subtexto && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {tarea.subtexto}
                    </p>
                  )}
                </div>

                {/* Acciones laterales */}
                <div className="flex items-center gap-1 shrink-0">
                  {tarea.enlaceModulo && !tarea.completada && (
                    <Link
                      href={tarea.enlaceModulo}
                      className="text-slate-400 hover:text-brand-salmon dark:hover:text-orange-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Ir al módulo"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {esManual && onEliminarTarea && (
                    <button
                      type="button"
                      onClick={() => onEliminarTarea(tarea.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                      title="Eliminar tarea manual"
                      aria-label="Eliminar tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input de Tarea Manual Rápida con toggle de urgencia */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            placeholder="Añadir tarea manual (presiona Enter)..."
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-salmon focus:border-brand-salmon text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
          />
          <button
            type="submit"
            disabled={!nuevoTitulo.trim()}
            className="p-2 bg-brand-salmon text-white rounded-xl hover:bg-brand-salmonDark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs"
            aria-label="Agregar tarea"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Opciones rápidas de la tarea */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={urgenteSeleccionado}
              onChange={(e) => setUrgenteSeleccionado(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500 h-3 w-3 bg-white dark:bg-slate-800"
            />
            <span className={urgenteSeleccionado ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
              Marcar como urgente
            </span>
          </label>
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Persistida en Supabase</span>
        </div>
      </form>
    </div>
  );
}
