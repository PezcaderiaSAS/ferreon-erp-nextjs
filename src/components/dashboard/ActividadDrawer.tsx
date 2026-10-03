'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  PlusCircle,
  Truck,
  CornerDownLeft,
  Coins,
  Wrench,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { type EventoCalendario, type TipoEventoCalendario } from '@/core/types/dashboard';
import { formatearMonedaCOP } from '@/core/services/dashboard-transaccional.service';

interface ActividadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fechaSeleccionada: string; // YYYY-MM-DD
  eventos: EventoCalendario[];
}

export function ActividadDrawer({
  isOpen,
  onClose,
  fechaSeleccionada,
  eventos
}: ActividadDrawerProps) {
  // Manejo de tecla Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filtrar eventos del día seleccionado
  const eventosDelDia = eventos.filter((e) => e.fecha === fechaSeleccionada);

  // Formatear fecha legible
  const [year, month, day] = fechaSeleccionada.split('-').map(Number);
  const fechaObj = new Date(year, (month || 1) - 1, day || 1);
  const fechaLegible = fechaObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getIconoPorTipo = (tipo: TipoEventoCalendario) => {
    switch (tipo) {
      case 'ALQUILER_DESPACHO':
        return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'DEVOLUCION':
        return <CornerDownLeft className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'COBRANZA_VENCIMIENTO':
      case 'PAGO_RECIBIDO':
        return <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'MANTENIMIENTO':
        return <Wrench className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBadgePorTipo = (tipo: TipoEventoCalendario) => {
    switch (tipo) {
      case 'ALQUILER_DESPACHO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
            Despacho
          </span>
        );
      case 'DEVOLUCION':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
            Retorno
          </span>
        );
      case 'COBRANZA_VENCIMIENTO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
            Cobranza
          </span>
        );
      case 'MANTENIMIENTO':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40">
            Taller
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Actividad
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop transparente con click-to-close */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel con elevación armónica */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50/70 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded-md bg-orange-50 dark:bg-orange-950/40 text-brand-salmon">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                AGENDA DEL DÍA
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
              {fechaLegible}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Botón Principal Prominente (Directiva Grill-Me) */}
        <div className="p-4 bg-orange-50/40 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30">
          <Link
            href={`/alquileres?crear=true&fechaInicio=${fechaSeleccionada}`}
            className="w-full bg-brand-salmon hover:bg-brand-salmonDark text-white py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-200 group"
          >
            <PlusCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Crear Alquiler con esta fecha inicial</span>
          </Link>
        </div>

        {/* Lista de Actividades */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {eventosDelDia.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sin actividades agendadas</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                No hay despachos, devoluciones ni vencimientos programados para este día.
              </p>
            </div>
          ) : (
            eventosDelDia.map((evt) => (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-xl p-3.5 shadow-xs flex flex-col gap-2 transition-all hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getIconoPorTipo(evt.tipo)}
                    </div>
                    {getBadgePorTipo(evt.tipo)}
                  </div>
                  {evt.urgencia === 'CRITICA' && (
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                      Urgente
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{evt.titulo}</h3>
                  {evt.clienteNombre && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Cliente: <span className="font-semibold text-slate-800 dark:text-slate-200">{evt.clienteNombre}</span>
                    </p>
                  )}
                  {evt.descripcion && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {evt.descripcion}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/60 mt-1">
                  {evt.monto ? (
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatearMonedaCOP(evt.monto)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Sin importe</span>
                  )}

                  {evt.enlaceModulo && (
                    <Link
                      href={evt.enlaceModulo}
                      className="text-xs font-semibold text-brand-salmon hover:text-brand-salmonDark flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono tabular-nums">{eventosDelDia.length} eventos en total</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
