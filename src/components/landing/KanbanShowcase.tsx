"use client";

import React, { useState } from 'react';
import { Layers, MoreHorizontal, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react';
import { LANDING_CONFIG, KanbanCard } from '../../config/landing';

export function KanbanShowcase() {
  const [tasks, setTasks] = useState<KanbanCard[]>(LANDING_CONFIG.productShowcase.initialKanbanTasks);

  const moveTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const nextStatus: Record<KanbanCard['status'], KanbanCard['status']> = {
            todo: 'inprogress',
            inprogress: 'done',
            done: 'todo',
          };
          return { ...task, status: nextStatus[task.status] };
        }
        return task;
      })
    );
  };

  const columns = [
    { id: 'todo' as const, label: 'Por Despachar', dotColor: 'bg-amber-400' },
    { id: 'inprogress' as const, label: 'En Alquiler', dotColor: 'bg-blue-400' },
    { id: 'done' as const, label: 'Liquidado', dotColor: 'bg-emerald-400' },
  ];

  return (
    <div className="w-full rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl p-4 sm:p-6 text-slate-100">
      {/* Board Topbar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white">Tablero de Operaciones</span>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline-block">
            (Haz clic en cualquier tarjeta para moverla)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
            {tasks.length} contratos
          </span>
        </div>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2 min-h-[260px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-semibold text-slate-300">{col.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks in Column */}
              <div className="flex flex-col gap-2 pt-1 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic py-8">
                    Columna vacía
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => moveTask(task.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          moveTask(task.id);
                        }
                      }}
                      className="group p-3 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 transition-all duration-200 cursor-pointer shadow-sm flex flex-col gap-2 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {task.contractId}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${task.tagColor}`}
                        >
                          {task.tag}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                        {task.title}
                      </h4>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[11px] text-slate-400">
                        <span className="truncate max-w-[110px]">{task.avatarName}</span>
                        <span className="flex items-center gap-1 text-blue-400 text-[10px] group-hover:translate-x-0.5 transition-transform">
                          Mover <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
