"use client";

import React, { useState } from 'react';
import { Layers, ArrowRight } from 'lucide-react';
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
    { id: 'todo' as const, label: '1. Por Despachar', dotColor: 'bg-amber-500' },
    { id: 'inprogress' as const, label: '2. En Obra (Activo)', dotColor: 'bg-blue-500' },
    { id: 'done' as const, label: '3. Inspección & Liquidado', dotColor: 'bg-emerald-500' },
  ];

  const formatCOP = (val: number) =>
    `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(val)}`;

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-xl p-4 sm:p-6 text-slate-900">
      {/* Board Topbar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">Ciclo de Contratos & Devoluciones</span>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block">
            (Haz clic en una tarjeta para avanzar su estado)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono border border-slate-200 font-semibold">
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
              className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col gap-2 min-h-[300px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-bold text-slate-700 truncate">{col.label}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks in Column */}
              <div className="flex flex-col gap-2.5 pt-1 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic py-8">
                    Sin contratos en esta etapa
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
                      className="group p-3.5 rounded-xl bg-white hover:bg-orange-50/30 border border-slate-200 hover:border-orange-400/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col gap-2 select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {task.contractId}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {task.tag}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                        {task.title}
                      </h4>

                      {/* Client and Deposit Info */}
                      <div className="space-y-1 text-[11px] text-slate-500">
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[120px] font-medium text-slate-700">
                            {task.clientName}
                          </span>
                          <span className="font-mono text-emerald-600 font-bold tabular-nums">
                            {formatCOP(task.depositCOP)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                          Avanzar flujo
                        </span>
                        <span className="flex items-center gap-1 text-orange-600 group-hover:translate-x-0.5 transition-transform font-bold">
                          Siguiente <ArrowRight className="w-3 h-3" />
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
