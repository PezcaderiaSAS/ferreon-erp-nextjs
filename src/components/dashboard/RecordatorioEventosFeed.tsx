'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  AlertOctagon,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { type AlertaSistema } from '@/core/types/dashboard';

interface RecordatorioEventosFeedProps {
  alertas: AlertaSistema[];
}

export function RecordatorioEventosFeed({ alertas }: RecordatorioEventosFeedProps) {
  const getIcono = (tipo: AlertaSistema['tipo']) => {
    switch (tipo) {
      case 'CRITICA':
        return <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />;
      case 'ADVERTENCIA':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const getEstilosItem = (tipo: AlertaSistema['tipo']) => {
    switch (tipo) {
      case 'CRITICA':
        return 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20 border-slate-200/90 dark:border-slate-800';
      case 'ADVERTENCIA':
        return 'border-l-4 border-l-amber-500 bg-amber-50/30 dark:bg-amber-950/20 border-slate-200/90 dark:border-slate-800';
      case 'INFO':
      default:
        return 'border-l-4 border-l-sky-500 bg-sky-50/30 dark:bg-sky-950/20 border-slate-200/90 dark:border-slate-800';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-card p-5 flex flex-col gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Cabecera */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-brand-salmon">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Recordatorios & Alertas
            </h2>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          En vivo
        </span>
      </div>

      {/* Lista de Alertas */}
      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {alertas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
            Sin alertas operativas activas. ¡Todo al día!
          </div>
        ) : (
          alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`p-3 rounded-xl border text-xs flex gap-2.5 transition-all hover:shadow-xs ${getEstilosItem(
                alerta.tipo
              )}`}
            >
              {getIcono(alerta.tipo)}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {alerta.titulo}
                  </h3>
                  {alerta.enlace && (
                    <Link
                      href={alerta.enlace}
                      className="text-brand-salmon hover:text-brand-salmonDark p-0.5 shrink-0 transition-colors"
                      title="Ir al detalle"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {alerta.mensaje}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                  <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
                    {alerta.fecha}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {alerta.tipo}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
