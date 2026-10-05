'use client';

import React, { useState } from 'react';
import {
  Layers,
  Filter,
  Plus,
  GripVertical,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface KanbanTask {
  id: string;
  ticketId: string;
  title: string;
  tag: 'Billing' | 'Growth' | 'Web' | 'Infra' | 'Security';
  tagColor: string;
  points: string;
  assignee: string;
  assigneeColor: string;
  decisionMarkers?: number[];
}

interface KanbanColumn {
  id: string;
  title: string;
  wipLimit?: number;
  tasks: KanbanTask[];
}

const INITIAL_COLUMNS: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    tasks: [
      {
        id: 'task-1',
        ticketId: 'TMP-208',
        title: 'Audit Redis cache eviction policies',
        tag: 'Infra',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        points: '5 pt',
        assignee: 'ID',
        assigneeColor: 'bg-purple-900/60 text-purple-200 border-purple-700/50',
      },
      {
        id: 'task-2',
        ticketId: 'TMP-209',
        title: 'Optimize CSP nonces across dynamic routes',
        tag: 'Security',
        tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
        points: '2 pt',
        assignee: 'SC',
        assigneeColor: 'bg-red-900/60 text-red-200 border-red-700/50',
      },
    ],
  },
  {
    id: 'todo',
    title: 'To do',
    tasks: [
      {
        id: 'task-3',
        ticketId: 'TMP-210',
        title: 'Fix Safari date picker on Rental Contract modal',
        tag: 'Web',
        tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        points: '1 pt',
        assignee: 'KM',
        assigneeColor: 'bg-blue-900/60 text-blue-200 border-blue-700/50',
      },
      {
        id: 'task-4',
        ticketId: 'TMP-211',
        title: 'Setup automated daily backup healthchecks',
        tag: 'Infra',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        points: '3 pt',
        assignee: 'ID',
        assigneeColor: 'bg-purple-900/60 text-purple-200 border-purple-700/50',
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In progress',
    wipLimit: 4,
    tasks: [
      {
        id: 'task-5',
        ticketId: 'TMP-214',
        title: 'Export monthly rental invoices as signed CSV/PDF',
        tag: 'Billing',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        points: '3 pt',
        assignee: 'LP',
        assigneeColor: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50',
        decisionMarkers: [1, 2],
      },
      {
        id: 'task-6',
        ticketId: 'TMP-215',
        title: 'Real-time telemetry on active equipment dispatch',
        tag: 'Growth',
        tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        points: '5 pt',
        assignee: 'KM',
        assigneeColor: 'bg-blue-900/60 text-blue-200 border-blue-700/50',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      {
        id: 'task-7',
        ticketId: 'TMP-202',
        title: 'Integrate Figma Tokens Sync bidirectional protocol',
        tag: 'Web',
        tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        points: '8 pt',
        assignee: 'LP',
        assigneeColor: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/50',
      },
    ],
  },
];

export function PremiumAdvancedKanban() {
  const [columns, setColumns] = useState<KanbanColumn[]>(INITIAL_COLUMNS);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'Billing' | 'Web'>('ALL');
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    setColumns((prev) => {
      let taskToMove: KanbanTask | null = null;
      // Remover de origen
      const next = prev.map((col) => {
        const found = col.tasks.find((t) => t.id === taskId);
        if (found) {
          taskToMove = found;
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          };
        }
        return col;
      });

      if (!taskToMove) return prev;

      // Insertar en destino
      return next.map((col) => {
        if (col.id === targetColId) {
          return {
            ...col,
            tasks: [...col.tasks, taskToMove!],
          };
        }
        return col;
      });
    });

    setDraggingTaskId(null);
  };

  return (
    <div className="w-full bg-[#0d1117] text-[#c9d1d9] rounded-2xl p-6 sm:p-8 border border-[#30363d] shadow-2xl font-sans">
      {/* Header del Tablero */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#21262d] mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs font-medium text-slate-200 shadow-inner">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono">Tempo / Sprint 38</span>
          </div>
          <span className="text-xs text-[#8b949e] font-mono hidden md:inline-block">
            Alquileres System Core • Engineering Board
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Filtros de Tag */}
          <div className="flex items-center gap-1.5 bg-[#161b22] p-1 rounded-lg border border-[#30363d] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#8b949e] ml-1.5" />
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-[#8b949e] hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter('Billing')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'Billing'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'text-[#8b949e] hover:text-slate-200'
              }`}
            >
              Billing
            </button>
            <button
              onClick={() => setActiveFilter('Web')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeFilter === 'Web'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-[#8b949e] hover:text-slate-200'
              }`}
            >
              Web
            </button>
          </div>

          {/* Grupo de Avatares del Sprint */}
          <div className="flex items-center -space-x-1.5">
            <span className="w-7 h-7 rounded-full bg-purple-900 border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-purple-200">
              ID
            </span>
            <span className="w-7 h-7 rounded-full bg-blue-900 border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-blue-200">
              KM
            </span>
            <span className="w-7 h-7 rounded-full bg-emerald-900 border-2 border-[#0d1117] flex items-center justify-center text-[10px] font-bold text-emerald-200">
              LP
            </span>
          </div>
        </div>
      </header>

      {/* Grid de 4 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const filteredTasks = column.tasks.filter((task) =>
            activeFilter === 'ALL' ? true : task.tag === activeFilter
          );

          const isOverLimit =
            column.wipLimit !== undefined && column.tasks.length > column.wipLimit;

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 flex flex-col min-h-[460px] transition-colors hover:border-slate-600/60"
            >
              {/* Encabezado de Columna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#21262d]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#f0f6fc]">
                    {column.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                      column.wipLimit
                        ? isOverLimit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-[#00e699]/15 text-[#00e699] border border-[#00e699]/30'
                        : 'bg-[#21262d] text-[#8b949e]'
                    }`}
                  >
                    {column.wipLimit
                      ? `${column.tasks.length} / ${column.wipLimit}`
                      : column.tasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
                  title="Añadir tarjeta"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Tarjetas */}
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                {filteredTasks.map((task) => {
                  const isDragging = draggingTaskId === task.id;

                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={`relative bg-[#21262d] border border-[#30363d] rounded-lg p-3 cursor-grab select-none transition-all duration-150 group ${
                        isDragging
                          ? 'opacity-70 rotate-2 scale-[1.02] shadow-[0_12px_24px_rgba(0,0,0,0.5)] border-[#38bdf8]'
                          : 'hover:border-[#58a6ff] hover:shadow-md'
                      }`}
                    >
                      {/* Marcadores de Decisión Superpuestos */}
                      {task.decisionMarkers && (
                        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">
                          {task.decisionMarkers.map((marker) => (
                            <span
                              key={marker}
                              onMouseEnter={() => setHoveredMarker(marker)}
                              onMouseLeave={() => setHoveredMarker(null)}
                              className="w-[18px] h-[18px] rounded-full bg-[#00e699] text-[#0d1117] text-[11px] font-extrabold flex items-center justify-center shadow-md cursor-pointer hover:scale-125 transition-transform"
                            >
                              {marker}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tooltip de Marcador Activo */}
                      {hoveredMarker !== null && task.decisionMarkers?.includes(hoveredMarker) && (
                        <div className="absolute top-4 right-2 z-20 bg-slate-900 text-xs px-2.5 py-1.5 rounded border border-[#00e699]/40 text-[#00e699] shadow-xl font-mono flex items-center gap-1.5 pointer-events-none">
                          <Info className="w-3 h-3 text-[#00e699]" />
                          <span>Decisión de arquitectura #{hoveredMarker}: Zero-leak pipeline</span>
                        </div>
                      )}

                      {/* Meta Superior */}
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono text-[#8b949e] font-semibold">
                          {task.ticketId}
                        </span>
                        <GripVertical className="w-3.5 h-3.5 text-[#484f58] group-hover:text-[#8b949e] transition-colors" />
                      </div>

                      {/* Título de la Tarea */}
                      <h4 className="text-xs sm:text-sm font-medium text-[#f0f6fc] leading-snug mb-3">
                        {task.title}
                      </h4>

                      {/* Footer de Tarjeta */}
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#30363d]/60">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${task.tagColor}`}
                          >
                            {task.tag}
                          </span>
                          <span className="font-mono text-[11px] text-[#8b949e]">
                            {task.points}
                          </span>
                        </div>

                        <span
                          className={`w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center ${task.assigneeColor}`}
                        >
                          {task.assignee}
                        </span>
                      </div>
                    </article>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="h-28 rounded-lg border border-dashed border-[#30363d] flex flex-col items-center justify-center text-xs text-[#8b949e] gap-1">
                    <Clock className="w-4 h-4 text-[#484f58]" />
                    <span>Sin tareas pendientes</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pie con Microinteracción e Indicaciones */}
      <footer className="mt-6 pt-4 border-t border-[#21262d] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8b949e] gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#00e699]" />
          <span>Arrastra y suelta tarjetas entre columnas para probar las físicas de arrastre.</span>
        </div>
        <div className="font-mono text-[11px] text-[#00e699]">
          WIP Limits Enforced • Zero Overlap Physics
        </div>
      </footer>
    </div>
  );
}
