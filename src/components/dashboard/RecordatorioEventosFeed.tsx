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
        return <AlertOctagon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />;
      case 'ADVERTENCIA':
        return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />;
      case 'INFO':
      default:
        return <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />;
    }
  };

  const getEstiloBorde = (tipo: AlertaSistema['tipo']) => {
    switch (tipo) {
      case 'CRITICA':
        return 'border-l-4 border-l-red-600 bg-red-50/20 border-slate-200';
      case 'ADVERTENCIA':
        return 'border-l-4 border-l-amber-500 bg-amber-50/20 border-slate-200';
      case 'INFO':
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50/20 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-salmon" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Recordatorios & Alertas
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          En tiempo real
        </span>
      </div>

      {/* Lista de Alertas */}
      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {alertas.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Sin alertas operativas activas.
          </div>
        ) : (
          alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`p-3 rounded-lg border text-xs flex gap-2.5 transition-all ${getEstiloBorde(
                alerta.tipo
              )}`}
            >
              {getIcono(alerta.tipo)}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <h3 className="font-bold text-slate-900 leading-snug">
                    {alerta.titulo}
                  </h3>
                  {alerta.enlace && (
                    <Link
                      href={alerta.enlace}
                      className="text-brand-salmon hover:underline p-0.5 shrink-0"
                      title="Ir al detalle"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {alerta.mensaje}
                </p>

                <span className="text-[10px] font-mono text-slate-400 mt-1.5 block">
                  {alerta.fecha}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
