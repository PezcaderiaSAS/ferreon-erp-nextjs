'use client';

import React, { useState } from 'react';
import {
  X,
  Trophy,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGamificationStore } from '@/infrastructure/state/gamificationStore';
import { useTourStore } from '@/infrastructure/state/tourStore';
import {
  calcularProgresoSiguienteNivel,
  RANGOS_MAESTRIA_CONFIG,
  CATALOGO_INSIGNIAS,
} from '@/core/services/gamification.service';
import {
  MISIONES_APRENDIZAJE_ACADEMIA,
  MODULOS_SISTEMA_ACADEMIA,
} from '@/core/constants/academia-curriculum';

export function AcademiaModal() {
  const router = useRouter();
  const {
    isAcademiaModalOpen,
    setAcademiaModalOpen,
    setGuiaBotonesOpen,
    xpTotal,
    rangoActual,
    misionesCompletadas,
    insigniasDesbloqueadas,
    completarMision,
  } = useGamificationStore();

  const { startTour } = useTourStore();
  const [activeTab, setActiveTab] = useState<'misiones' | 'insignias' | 'niveles'>('misiones');

  if (!isAcademiaModalOpen) return null;

  const infoNivel = calcularProgresoSiguienteNivel(xpTotal);
  const totalMisiones = MISIONES_APRENDIZAJE_ACADEMIA.length;
  const completadasCount = misionesCompletadas.length;
  const pctMisiones = Math.round((completadasCount / totalMisiones) * 100);

  const handleIniciarMision = (mision: typeof MISIONES_APRENDIZAJE_ACADEMIA[0]) => {
    setAcademiaModalOpen(false);
    // Si la misión tiene ruta distinta a la actual, navegar a ella
    if (mision.ruta) {
      router.push(mision.ruta);
    }
    // Iniciar tour interactivo asociado
    setTimeout(() => {
      startTour(mision.tourId, false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Superior con Gradiente Temático */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950">
          <button
            onClick={() => setAcademiaModalOpen(false)}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-900/70 hover:bg-black/10 hover:text-slate-950 transition-colors cursor-pointer"
            title="Cerrar Academia"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white text-2xl shadow-md border border-amber-300/40">
                {infoNivel.iconoRango}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                    Nivel {infoNivel.nivelActual}
                  </span>
                  <span className="text-xs font-bold text-slate-900/80">Academia Alquileres</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  {infoNivel.nombreRango}
                </h2>
              </div>
            </div>

            {/* Puntos XP Totales */}
            <div className="bg-slate-950/90 text-white px-4 py-2 rounded-xl border border-amber-400/40 flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none">
                  Experiencia
                </span>
                <span className="text-base font-mono font-black text-amber-300">
                  {xpTotal} XP
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso hacia el Próximo Rango */}
          <div className="mt-4 pt-3 border-t border-slate-950/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1.5">
              <span>Progreso de Nivel</span>
              <span>
                {infoNivel.nivelActual === 5
                  ? '¡Maestría Máxima Alcanzada!'
                  : `${infoNivel.porcentaje}% (${infoNivel.xpParaSubir} XP para el siguiente rango)`}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-950/20 overflow-hidden p-0.5 border border-slate-950/20">
              <div
                className="h-full rounded-full bg-slate-950 transition-all duration-500 ease-out"
                style={{ width: `${infoNivel.porcentaje}%` }}
              />
            </div>
          </div>
        </div>

        {/* Barra de Navegación de Pestañas */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('misiones')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'misiones'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="h-4 w-4 text-purple-500" />
            <span>Misiones de Entrenamiento ({completadasCount}/{totalMisiones})</span>
          </button>

          <button
            onClick={() => setActiveTab('insignias')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'insignias'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>Insignias ({insigniasDesbloqueadas.length}/{CATALOGO_INSIGNIAS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('niveles')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'niveles'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span>Ruta de Maestría</span>
          </button>
        </div>

        {/* Contenido Principal con Scroll Suave */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* ── PESTAÑA 1: MISIONES DE ENTRENAMIENTO ── */}
          {activeTab === 'misiones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Completa cada misión interactiva para ganar puntos XP y subir de rango:
                </p>
                <button
                  onClick={() => {
                    setAcademiaModalOpen(false);
                    setGuiaBotonesOpen(true);
                  }}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Ver Guía de Botones & Flujos</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MISIONES_APRENDIZAJE_ACADEMIA.map((mision) => {
                  const isDone = misionesCompletadas.includes(mision.id);

                  return (
                    <div
                      key={mision.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isDone
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/10 hover:border-amber-500/50 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {mision.modulo} • ~{mision.duracionMinutos} min
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            +{mision.recompensaXP} XP
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mb-1">
                          {mision.titulo}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {mision.descripcionApta12}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        {isDone ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Misión Completada</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Pendiente por realizar</span>
                        )}

                        <button
                          onClick={() => handleIniciarMision(mision)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isDone
                              ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                          }`}
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>{isDone ? 'Repasar Tour' : 'Iniciar Misión'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PESTAÑA 2: INSIGNIAS COLECCIONABLES ── */}
          {activeTab === 'insignias' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desbloquea medallas coleccionables demostrando tu maestría en la plataforma:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {CATALOGO_INSIGNIAS.map((insignia) => {
                  const isUnlocked = insigniasDesbloqueadas.includes(insignia.id);

                  return (
                    <div
                      key={insignia.id}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-between ${
                        isUnlocked
                          ? 'bg-gradient-to-b from-amber-500/10 to-yellow-500/5 border-amber-400/50 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 opacity-60'
                      }`}
                    >
                      <div>
                        <div
                          className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner ${
                            isUnlocked
                              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 border border-amber-300'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isUnlocked ? insignia.icono : <Lock className="h-6 w-6 text-slate-400" />}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                          {insignia.titulo}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                          {insignia.descripcion}
                        </p>
                      </div>

                      <div className="w-full pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400">{insignia.modulo}</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono">
                          +{insignia.puntosXP} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PESTAÑA 3: RUTA DE MAESTRÍA (5 NIVELES) ── */}
          {activeTab === 'niveles' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                La carrera profesional en Alquileres System:
              </p>

              <div className="space-y-3">
                {RANGOS_MAESTRIA_CONFIG.map((rangoConfig) => {
                  const isCurrent = rangoActual === rangoConfig.rango;
                  const isPassed = xpTotal >= rangoConfig.xpMin;

                  return (
                    <div
                      key={rangoConfig.nivel}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 shadow-md'
                          : isPassed
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-slate-950 text-white flex items-center justify-center text-2xl shrink-0 border border-white/10">
                          {rangoConfig.icono}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-slate-500">
                              Nivel {rangoConfig.nivel}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                                Rango Actual
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {rangoConfig.nombre}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {rangoConfig.descripcion}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 block">
                          {rangoConfig.nivel === 5
                            ? '1.401+ XP'
                            : `${rangoConfig.xpMin} - ${rangoConfig.xpMax} XP`}
                        </span>
                        {isPassed ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="h-3 w-3" />
                            Alcanzado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                            <Lock className="h-3 w-3" />
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones Rápidas */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Presiona <strong>F1</strong> en cualquier momento para consultar la guía.</span>
          </div>

          <button
            onClick={() => setAcademiaModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
