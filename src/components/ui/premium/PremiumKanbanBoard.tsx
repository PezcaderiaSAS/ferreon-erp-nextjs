'use client';

import React, { useState } from 'react';
import {
  Kanban,
  Filter,
  Plus,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
} from 'lucide-react';

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  commentsCount: number;
  attachmentsCount: number;
  assignees: string[];
}

interface KanbanColumn {
  id: string;
  title: string;
  colorDot: string;
  tasks: KanbanTask[];
}

const INITIAL_COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    colorDot: 'bg-amber-500',
    tasks: [
      {
        id: 't-1',
        title: 'Inspección de Maquinaria CAT-416',
        description: 'Verificar niveles hidráulicos y reporte preoperativo de entrega.',
        priority: 'High',
        commentsCount: 3,
        attachmentsCount: 2,
        assignees: ['AS', 'ML'],
      },
      {
        id: 't-2',
        title: 'Auditoría de Cuentas de Cobro',
        description: 'Revisión cruzada con Estatuto Tributario Art. 616-1.',
        priority: 'Medium',
        commentsCount: 1,
        attachmentsCount: 1,
        assignees: ['VR'],
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    colorDot: 'bg-indigo-500',
    tasks: [
      {
        id: 't-3',
        title: 'Despacho de Andamios Tubulares',
        description: 'Lote de 20 cuerpos despachado a Constructora Bolívar.',
        priority: 'High',
        commentsCount: 4,
        attachmentsCount: 3,
        assignees: ['CM', 'FD'],
      },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    colorDot: 'bg-sky-500',
    tasks: [
      {
        id: 't-4',
        title: 'Liquidación de Subcontratación #SUB-04',
        description: 'Verificación de retenciones ICA y margen de rentabilidad.',
        priority: 'Medium',
        commentsCount: 2,
        attachmentsCount: 1,
        assignees: ['VR'],
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    colorDot: 'bg-emerald-500',
    tasks: [
      {
        id: 't-5',
        title: 'Arqueo de Caja POS Turno Mañana',
        description: 'Conciliación en cero descuadre con comprobante PDF emitido.',
        priority: 'Low',
        commentsCount: 0,
        attachmentsCount: 1,
        assignees: ['FD'],
      },
    ],
  },
];

export function PremiumKanbanBoard() {
  const [columns, setColumns] = useState<KanbanColumn[]>(INITIAL_COLUMNS);

  const getPriorityBadge = (priority: KanbanTask['priority']) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-slate-50/70 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Board Header */}
      <header className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Operational Task Flow
            </h3>
            <p className="text-xs text-slate-500">
              Seguimiento ágil de despachos, retornos y caja
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Columns Grid */}
      <main className="p-4 sm:p-5 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[900px]">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-3 min-h-[420px]"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${column.colorDot}`} />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {column.title}
                  </h4>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-600 text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {column.tasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center text-xs transition-colors"
                >
                  +
                </button>
              </div>

              {/* Task Cards List */}
              <div className="flex flex-col gap-2.5">
                {column.tasks.map((task) => (
                  <article
                    key={task.id}
                    className="bg-white/95 rounded-[12px] p-3.5 border border-slate-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      {getPriorityBadge(task.priority)}
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-snug">
                        {task.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                        {task.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center mt-1">
                      {/* Avatar Group */}
                      <div className="flex -space-x-1.5">
                        {task.assignees.map((initials, i) => (
                          <span
                            key={i}
                            className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center border border-white"
                          >
                            {initials}
                          </span>
                        ))}
                      </div>

                      {/* Meta Indicators */}
                      <div className="flex items-center gap-2.5 text-slate-400 text-[10px]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {task.commentsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {task.attachmentsCount}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
