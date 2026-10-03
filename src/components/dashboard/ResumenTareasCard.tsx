'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Plus,
  ExternalLink,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { type TareaOperativa } from '@/core/types/dashboard';

interface ResumenTareasCardProps {
  tareas: TareaOperativa[];
  onToggleTarea: (tareaId: string) => void;
  onCrearTareaManual: (titulo: string) => void;
}

export function ResumenTareasCard({
  tareas,
  onToggleTarea,
  onCrearTareaManual
}: ResumenTareasCardProps) {
  const [nuevoTitulo, setNuevoTitulo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) return;
    onCrearTareaManual(nuevoTitulo.trim());
    setNuevoTitulo('');
  };

  const tareasPendientes = tareas.filter((t) => !t.completada);
  const tareasCompletadas = tareas.filter((t) => t.completada);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-brand-salmon" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Tareas & Pendientes Críticos
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {tareasPendientes.length} activas
        </span>
      </div>

      {/* Lista de Tareas */}
      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
        {tareas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No tienes tareas pendientes para hoy. ¡Todo al día!
          </div>
        ) : (
          tareas.map((tarea) => {
            const esUrgente = tarea.urgencia === 'URGENTE' && !tarea.completada;

            return (
              <div
                key={tarea.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-all text-xs ${
                  tarea.completada
                    ? 'bg-slate-50/50 border-slate-100 opacity-60'
                    : esUrgente
                    ? 'bg-red-50/30 border-red-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => onToggleTarea(tarea.id)}
                  className="mt-0.5 text-slate-400 hover:text-brand-salmon transition-colors shrink-0"
                  aria-label={tarea.completada ? 'Marcar incompleta' : 'Marcar completada'}
                >
                  {tarea.completada ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {tarea.titulo}
                    </span>

                    {esUrgente && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Urgente
                      </span>
                    )}

                    {tarea.tipo === 'SISTEMA' && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-500">
                        Sistema
                      </span>
                    )}
                  </div>

                  {tarea.subtexto && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {tarea.subtexto}
                    </p>
                  )}
                </div>

                {/* Enlace al módulo si aplica */}
                {tarea.enlaceModulo && !tarea.completada && (
                  <Link
                    href={tarea.enlaceModulo}
                    className="text-slate-400 hover:text-brand-salmon p-1 rounded hover:bg-slate-100 transition-colors shrink-0"
                    title="Ir al módulo"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input de Tarea Manual Rápida */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Añadir tarea rápida (presiona Enter)..."
          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-salmon focus:border-brand-salmon text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
        />
        <button
          type="submit"
          disabled={!nuevoTitulo.trim()}
          className="p-2 bg-brand-salmon text-white rounded-lg hover:bg-brand-salmonDark disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          aria-label="Agregar tarea"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
