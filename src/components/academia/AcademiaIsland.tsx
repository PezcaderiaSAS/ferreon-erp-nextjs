'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Trophy,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react';
import { useGamificationStore } from '@/infrastructure/state/gamificationStore';
import {
  calcularProgresoSiguienteNivel,
  RANGOS_MAESTRIA_CONFIG,
} from '@/core/services/gamification.service';

/**
 * AcademiaIsland: Widget flotante no bloqueante que acompaña al usuario
 * en todos los módulos de Alquileres System.
 * Muestra el rango actual, nivel de maestría, barra de XP y accesos directos
 * a la Academia interactiva y a la Guía de Botones y Flujos 360°.
 */
export function AcademiaIsland() {
  const {
    xpTotal,
    rangoActual,
    setAcademiaModalOpen,
    setGuiaBotonesOpen,
  } = useGamificationStore();

  const [isMinimized, setIsMinimized] = useState(false);

  const progresoNivel = calcularProgresoSiguienteNivel(xpTotal);
  const configRango = RANGOS_MAESTRIA_CONFIG.find((r) => r.rango === rangoActual) || RANGOS_MAESTRIA_CONFIG[0];

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ease-out select-none print:hidden ${
        isMinimized ? 'scale-90 hover:scale-95' : 'scale-100'
      }`}
      aria-label="Widget flotante de Academia Alquileres System"
    >
      {isMinimized ? (
        /* Vista Minimizada (Pill Compacto) */
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsMinimized(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMinimized(false);
            }
          }}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl border border-amber-200 dark:border-amber-700/50 cursor-pointer transition-all hover:border-amber-400"
          title="Click para expandir la Academia de Alquileres System"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-lg shadow-xs group-hover:rotate-12 transition-transform">
            {configRango.icono}
          </div>
          <div className="flex flex-col text-left pr-1">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {configRango.nombre}
            </span>
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
              {xpTotal} XP
            </span>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
        </div>
      ) : (
        /* Vista Expandida (Isla Completa con Progreso y Botones Rápidos) */
        <div className="w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800/80 p-3.5 space-y-3 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Cabecera de la Isla */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-xl shadow-xs">
                {configRango.icono}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 dark:text-amber-400">
                    Rango {configRango.nivel} de 5
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {xpTotal} XP
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {configRango.nombre}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Minimizar widget"
              aria-label="Minimizar widget de academia"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de Progreso hacia el siguiente nivel */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Progreso de Maestría</span>
              <span>
                {progresoNivel.nivelActual < 5
                  ? `${progresoNivel.porcentaje}% (${progresoNivel.xpParaSubir} XP para siguiente nivel)`
                  : '¡Nivel Máximo Alcanzado! 👑'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progresoNivel.porcentaje}%` }}
              />
            </div>
          </div>

          {/* Botonera de Acciones Didácticas */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAcademiaModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 shadow-xs shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Academia</span>
            </button>

            <button
              type="button"
              onClick={() => setGuiaBotonesOpen(true, 'Todos')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Guía 360°</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
