'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Trophy,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Zap,
  BookOpen,
  X,
} from 'lucide-react';
import { useGamificationStore } from '@/infrastructure/state/gamificationStore';
import {
  calcularProgresoSiguienteNivel,
  RANGOS_MAESTRIA_CONFIG,
} from '@/core/services/gamification.service';

/**
 * AcademiaIsland: Widget flotante no bloqueante que acompaña al usuario
 * en todos los módulos de Alquileres System.
 * Inicia minimizado por defecto para no obstruir tablas ni botones de acción.
 */
export function AcademiaIsland() {
  const {
    xpTotal,
    rangoActual,
    setAcademiaModalOpen,
    setGuiaBotonesOpen,
  } = useGamificationStore();

  const [isMinimized, setIsMinimized] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMin = localStorage.getItem('alquileres_academia_minimized');
    if (savedMin !== null) {
      setIsMinimized(savedMin === 'true');
    }
    const savedHidden = sessionStorage.getItem('alquileres_academia_hidden');
    if (savedHidden === 'true') {
      setIsHidden(true);
    }
  }, []);

  const toggleMinimized = (val: boolean) => {
    setIsMinimized(val);
    try {
      localStorage.setItem('alquileres_academia_minimized', String(val));
    } catch {
      // Ignorar en entornos restrictivos
    }
  };

  const toggleHidden = (val: boolean) => {
    setIsHidden(val);
    try {
      sessionStorage.setItem('alquileres_academia_hidden', String(val));
    } catch {
      // Ignorar en entornos restrictivos
    }
  };

  const progresoNivel = calcularProgresoSiguienteNivel(xpTotal);
  const configRango = RANGOS_MAESTRIA_CONFIG.find((r) => r.rango === rangoActual) || RANGOS_MAESTRIA_CONFIG[0];

  // Si está temporalmente oculto, mostrar un disparador ultra-discreto en la esquina
  if (isHidden) {
    return (
      <div className="fixed bottom-3 right-3 z-30 select-none print:hidden">
        <button
          type="button"
          onClick={() => toggleHidden(false)}
          className="w-8 h-8 rounded-full bg-amber-500/90 hover:bg-amber-500 text-white flex items-center justify-center text-sm shadow-md hover:scale-105 transition-all cursor-pointer border border-amber-300 opacity-70 hover:opacity-100"
          title="Abrir Academia Alquileres System"
          aria-label="Abrir Academia"
        >
          {configRango.icono}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-3 right-3 z-30 transition-all duration-300 ease-out select-none print:hidden ${
        isMinimized ? 'scale-90 hover:scale-95' : 'scale-100'
      }`}
      aria-label="Widget flotante de Academia Alquileres System"
    >
      {isMinimized ? (
        /* Vista Minimizada (Pill Compacto No Obstructivo) */
        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl border border-amber-200 dark:border-amber-700/50 p-1 pl-1.5 transition-all hover:border-amber-400">
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleMinimized(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMinimized(false);
              }
            }}
            className="group flex items-center gap-2 cursor-pointer pr-1"
            title="Click para expandir la Academia de Alquileres System"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-sm shadow-xs group-hover:rotate-12 transition-transform">
              {configRango.icono}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                {configRango.nombre}
              </span>
              <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400">
                {xpTotal} XP
              </span>
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleHidden(true);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Ocultar widget"
            aria-label="Ocultar widget de academia"
          >
            <X className="w-3 h-3" />
          </button>
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

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleMinimized(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimizar widget"
                aria-label="Minimizar widget de academia"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => toggleHidden(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar widget"
                aria-label="Cerrar widget de academia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
