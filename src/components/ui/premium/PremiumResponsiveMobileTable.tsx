'use client';

import React, { useState } from 'react';
import {
  TableCellsSplit,
  Search,
  ChevronDown,
  Bell,
  Smartphone,
  Monitor,
  Check,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface BillingRecord {
  id: string;
  avatar: string;
  name: string;
  status: 'paid' | 'open' | 'overdue';
  dueDate: string;
  amount: string;
}

const SAMPLE_BILLING: BillingRecord[] = [
  {
    id: '1',
    avatar: 'AL',
    name: 'Ada Lindqvist (Cons. Andina)',
    status: 'paid',
    dueDate: 'Vence 04 Mar',
    amount: '$1,204.00',
  },
  {
    id: '2',
    avatar: 'MO',
    name: 'Marcus Oyelaran (Obras del Sur)',
    status: 'open',
    dueDate: 'Vence 09 Mar',
    amount: '$89.50',
  },
  {
    id: '3',
    avatar: 'PN',
    name: 'Priya Natarajan (Minera Pacífico)',
    status: 'overdue',
    dueDate: 'Venció 27 Feb',
    amount: '$12,480.75',
  },
  {
    id: '4',
    avatar: 'CR',
    name: 'Carlos Ruiz (Contratistas Unidos)',
    status: 'paid',
    dueDate: 'Vence 12 Mar',
    amount: '$3,850.20',
  },
];

export function PremiumResponsiveMobileTable() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'open' | 'overdue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'mobile' | 'comparison'>('mobile');

  const filteredData = SAMPLE_BILLING.filter((item) => {
    const matchesFilter = filterStatus === 'all' ? true : item.status === filterStatus;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: BillingRecord['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-[#10b981]/20">
            • Pagado
          </span>
        );
      case 'open':
        return (
          <span className="text-[#14b8a6] bg-[#14b8a6]/10 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-[#14b8a6]/20">
            • Pendiente
          </span>
        );
      case 'overdue':
        return (
          <span className="text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-[#ef4444]/20">
            • Vencido
          </span>
        );
    }
  };

  return (
    <div className="w-full bg-[#080c0e] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#1f2937] shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>RESPONSIVE TABLE · 01</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 text-center">
        Tu tabla contable adaptada a teléfonos móviles.
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center max-w-md">
        Transforma filas rígidas de escritorio en tarjetas fluidas con alta jerarquía visual en pantallas compactas.
      </p>

      {/* Selector de Modo de Demostración */}
      <div className="flex items-center gap-2 mb-6 bg-[#111827] p-1 rounded-xl border border-[#1f2937] text-xs">
        <button
          type="button"
          onClick={() => setViewMode('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            viewMode === 'mobile'
              ? 'bg-[#1f2937] text-[#00e699] font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Vista Móvil (360px Shell)</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('comparison')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            viewMode === 'comparison'
              ? 'bg-[#1f2937] text-[#00e699] font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Comparativa Escritorio vs Móvil</span>
        </button>
      </div>

      {/* Frame Móvil / Shell */}
      <div
        className={`w-full transition-all duration-300 ${
          viewMode === 'mobile'
            ? 'max-w-[360px]'
            : 'max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6'
        }`}
      >
        {/* Frame Móvil Simulado */}
        <div className="bg-[#111827] border-2 border-[#1f2937] rounded-[32px] p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] flex flex-col justify-between">
          <div>
            {/* Header del Frame Móvil */}
            <header className="flex items-center justify-between pb-3 border-b border-[#1f2937] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00e699]/20 text-[#00e699] flex items-center justify-center">
                  <TableCellsSplit className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-100">Alquileres Billing</span>
              </div>

              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="w-6 h-6 rounded-full bg-[#1f2937] border border-slate-700 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                  JK
                </span>
              </div>
            </header>

            {/* Barra de Filtros y Búsqueda */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#080c0e] border border-[#1f2937] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e699]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                aria-label="Filtrar por estado"
                className="bg-[#080c0e] border border-[#1f2937] text-slate-300 text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#00e699]"
              >
                <option value="all">Todos</option>
                <option value="paid">Pagados</option>
                <option value="open">Abiertos</option>
                <option value="overdue">Vencidos</option>
              </select>
            </div>

            {/* Lista de Filas / Tarjetas Móviles */}
            <div className="space-y-2">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#080c0e]/60 border border-[#1f2937] hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-[#1f2937] border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {item.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getStatusBadge(item.status)}
                        <span className="text-[10px] text-slate-500">{item.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="font-mono font-bold text-slate-100 text-xs sm:text-sm">
                      {item.amount}
                    </span>
                  </div>
                </div>
              ))}

              {filteredData.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No se encontraron registros
                </div>
              )}
            </div>
          </div>

          {/* Barra de Navegación Inferior Móvil */}
          <div className="pt-3 mt-3 border-t border-[#1f2937] flex items-center justify-between text-[11px] text-slate-400">
            <span>{filteredData.length} transacciones</span>
            <span className="text-[#00e699] font-mono flex items-center gap-1">
              <span>Sincronizado</span>
              <Check className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Panel Comparativo de Escritorio (si está en modo comparación) */}
        {viewMode === 'comparison' && (
          <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2937] mb-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Vista Tradicional de Escritorio (Wide Table)
                </span>
                <span className="text-[11px] text-slate-400">4 Columnas Estáticas</span>
              </div>

              <div className="border border-[#1f2937] rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#080c0e] text-slate-400 font-mono text-[11px] border-b border-[#1f2937]">
                    <tr>
                      <th className="py-2 px-3">Cliente</th>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3">Vencimiento</th>
                      <th className="py-2 px-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-200">{item.name}</td>
                        <td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{item.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1f2937] flex items-center justify-between text-xs text-slate-400">
              <span>Alquileres System Responsive Engine</span>
              <span className="text-[#00e699] font-mono">Mobile-First Fluid Breakpoints</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
