'use client';

import React, { useState } from 'react';
import {
  Inbox,
  CircleDot,
  Layers,
  Filter,
  Plus,
  AlertCircle,
  Clock,
  Sparkles,
  Command,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface LinearIssue {
  id: string;
  key: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'backlog';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  tag: string;
  tagColor: string;
  assignee: string;
  date: string;
}

const INITIAL_ISSUES: LinearIssue[] = [
  {
    id: '1',
    key: 'NOR-140',
    title: 'Fix focus ring on command palette and quick actions',
    status: 'in_progress',
    priority: 'high',
    tag: 'Bug',
    tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    assignee: 'SC',
    date: 'Sep 1',
  },
  {
    id: '2',
    key: 'NOR-141',
    title: 'Migrate billing webhooks to v2 endpoint schema',
    status: 'todo',
    priority: 'medium',
    tag: 'Infra',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    assignee: 'MK',
    date: 'Sep 1',
  },
  {
    id: '3',
    key: 'NOR-142',
    title: 'Optimize table row virtualization for 5,000+ rental items',
    status: 'in_progress',
    priority: 'urgent',
    tag: 'Perf',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    assignee: 'LP',
    date: 'Aug 30',
  },
  {
    id: '4',
    key: 'NOR-143',
    title: 'Export contract signing audit trail to immutable log',
    status: 'done',
    priority: 'low',
    tag: 'Security',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    assignee: 'KM',
    date: 'Aug 29',
  },
  {
    id: '5',
    key: 'NOR-144',
    title: 'Implement optimistic updates for rental check-in toggle',
    status: 'todo',
    priority: 'medium',
    tag: 'Web',
    tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    assignee: 'ID',
    date: 'Aug 28',
  },
];

const DECISION_PILLS = [
  { id: 'density', label: '1. Density', desc: 'Filas ultra compactas de 36px' },
  { id: 'borders', label: '2. Borders', desc: 'Separadores sutiles #21262d sin sombras' },
  { id: 'one_color', label: '3. One color', desc: 'Acento único monocromático #00e699' },
  { id: 'keyboard', label: '4. Keyboard', desc: 'Navegación nativa con foco y atajos' },
  { id: 'alignment', label: '5. Alignment', desc: 'Alineación tabular estricta monospace' },
];

export function PremiumLinearSystem() {
  const [issues, setIssues] = useState<LinearIssue[]>(INITIAL_ISSUES);
  const [activeMenu, setActiveMenu] = useState<'inbox' | 'my_issues' | 'views'>('my_issues');
  const [activePill, setActivePill] = useState<string>('density');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredIssues = issues.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      issue.key.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getPriorityDot = (priority: LinearIssue['priority']) => {
    switch (priority) {
      case 'urgent':
        return <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="Urgente" />;
      case 'high':
        return <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Alta" />;
      case 'medium':
        return <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" title="Media" />;
      case 'low':
        return <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" title="Baja" />;
    }
  };

  const getStatusIcon = (status: LinearIssue['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#00e699]" />;
      case 'in_progress':
        return <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin inline-block" />;
      case 'todo':
        return <CircleDot className="w-3.5 h-3.5 text-slate-400" />;
      case 'backlog':
        return <Clock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="w-full bg-[#0d1117] text-[#c9d1d9] rounded-2xl border border-[#30363d] shadow-2xl overflow-hidden font-sans">
      {/* Contenedor Principal en Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-[500px]">
        {/* Barra Lateral (Sidebar) */}
        <aside className="bg-[#161b22] border-r border-[#30363d] p-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Selector de Espacio de Trabajo */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#21262d] border border-[#30363d] hover:border-slate-500 transition-colors cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-[#00e699] text-[#0d1117] font-bold text-xs flex items-center justify-center">
                  N
                </span>
                <span className="text-xs font-semibold text-slate-100">Northstar Alquileres</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Menú de Navegación Lateral */}
            <nav className="space-y-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveMenu('inbox')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  activeMenu === 'inbox'
                    ? 'bg-[#21262d] text-white font-semibold'
                    : 'text-[#8b949e] hover:text-slate-200 hover:bg-[#21262d]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                <span className="font-mono text-[10px] text-[#8b949e]">3</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('my_issues')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  activeMenu === 'my_issues'
                    ? 'bg-[#21262d] text-white font-semibold'
                    : 'text-[#8b949e] hover:text-slate-200 hover:bg-[#21262d]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-[#00e699]" />
                  <span>My issues</span>
                </div>
                <span className="font-mono text-[10px] text-[#00e699]">14</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('views')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  activeMenu === 'views'
                    ? 'bg-[#21262d] text-white font-semibold'
                    : 'text-[#8b949e] hover:text-slate-200 hover:bg-[#21262d]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Views</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Switcher de Usuario al Pie */}
          <div className="pt-3 border-t border-[#30363d] flex items-center gap-2 text-xs">
            <span className="w-6 h-6 rounded-full bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center justify-center">
              JR
            </span>
            <div className="truncate">
              <p className="text-slate-200 font-semibold truncate leading-tight">Jordan R.</p>
              <p className="text-[#8b949e] text-[10px] truncate">Ingeniero Principal</p>
            </div>
          </div>
        </aside>

        {/* Contenido Principal (Main Area) */}
        <main className="p-4 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header del Contenido */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#21262d] mb-4">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-[#f0f6fc]">Active issues</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#8b949e]">
                  {filteredIssues.length}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <input
                    type="text"
                    placeholder="Filtrar issues..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2.5 py-1 text-xs text-slate-200 placeholder-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] hover:bg-[#00e699]/25 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>New issue</span>
                </button>
              </div>
            </header>

            {/* Dense Data Table */}
            <div className="divide-y divide-[#21262d] border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117]">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="grid grid-cols-[28px_20px_75px_1fr_70px_40px_60px] items-center px-3 py-2 text-xs hover:bg-[#161b22] transition-colors cursor-pointer group"
                >
                  {/* Status Indicator */}
                  <div className="flex items-center justify-center">
                    {getStatusIcon(issue.status)}
                  </div>

                  {/* Priority Dot */}
                  <div className="flex items-center justify-center">
                    {getPriorityDot(issue.priority)}
                  </div>

                  {/* Ticket Key */}
                  <span className="font-mono text-[#8b949e] group-hover:text-slate-300 font-medium">
                    {issue.key}
                  </span>

                  {/* Title */}
                  <span className="text-[#f0f6fc] truncate pr-2 font-medium">
                    {issue.title}
                  </span>

                  {/* Tag */}
                  <div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${issue.tagColor}`}
                    >
                      {issue.tag}
                    </span>
                  </div>

                  {/* Assignee Badge */}
                  <div>
                    <span className="w-5 h-5 rounded-full bg-[#21262d] border border-[#30363d] text-[10px] font-bold text-slate-300 flex items-center justify-center">
                      {issue.assignee}
                    </span>
                  </div>

                  {/* Date */}
                  <span className="text-right font-mono text-[11px] text-[#8b949e]">
                    {issue.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Barra Flotante de Decisiones de Diseño */}
          <div className="mt-6 pt-4 border-t border-[#21262d] flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-1.5">
              {DECISION_PILLS.map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActivePill(pill.id)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                    activePill === pill.id
                      ? 'bg-[#00e699]/15 text-[#00e699] border border-[#00e699]/40 font-semibold shadow-sm'
                      : 'bg-[#161b22] text-[#8b949e] border border-[#30363d] hover:text-slate-300'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Command className="w-3 h-3 text-[#00e699]" />
              <span>
                Linear Philosophy:{' '}
                {DECISION_PILLS.find((p) => p.id === activePill)?.desc}
              </span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
