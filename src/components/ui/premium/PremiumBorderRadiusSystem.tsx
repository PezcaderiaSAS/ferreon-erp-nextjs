'use client';

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Share2,
  Copy,
  FolderArchive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export function PremiumBorderRadiusSystem() {
  const [selectedScale, setSelectedScale] = useState<'sm' | 'md' | 'lg' | 'xl' | 'full'>('lg');
  const [applyFormula, setApplyFormula] = useState(true);

  // Cálculos de radio según la escala seleccionada y si se aplica la fórmula
  const scaleRadii = {
    sm: { outer: 8, padding: 4, inner: 4, button: 4 },
    md: { outer: 12, padding: 8, inner: 8, button: 6 },
    lg: { outer: 16, padding: 12, inner: 12, button: 8 },
    xl: { outer: 24, padding: 16, inner: 16, button: 10 },
    full: { outer: 32, padding: 16, inner: 20, button: 9999 },
  };

  const current = scaleRadii[selectedScale];

  // Si la fórmula está desactivada, se fuerza el mismo radio en todo ("One radius everywhere")
  const activeOuterRadius = current.outer;
  const activeInnerRadius = applyFormula ? current.inner : current.outer;
  const activeBtnRadius = applyFormula ? current.button : current.outer;

  return (
    <div className="w-full bg-[#090c0e] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#222b30] shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>RADIUS · 01</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 text-center">
        Every corner rounded.
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">
        <span className="text-slate-300 font-semibold">Still nothing lines up</span> si no se respeta la jerarquía geométrica.
      </p>

      {/* Contenedor de la Tarjeta Interactiva */}
      <div
        className="w-full max-w-[420px] bg-[#12171a] border border-[#222b30] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300"
        style={{ borderRadius: `${activeOuterRadius}px` }}
      >
        {/* Media Box Interno con radio anidado */}
        <div
          className="relative h-[130px] p-3 flex flex-col justify-between overflow-hidden transition-all duration-300 border border-slate-700/40"
          style={{
            borderRadius: `${activeInnerRadius}px`,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-cyan-500/20">
              <Layers className="w-3 h-3" />
              <span>12 frames</span>
            </span>

            <span className="text-[10px] font-mono text-slate-400 bg-black/30 px-2 py-0.5 rounded">
              R_inner: {activeInnerRadius}px
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400/90">
              {applyFormula
                ? `R_outer (${activeOuterRadius}px) - P (${current.padding}px) = ${activeInnerRadius}px`
                : `Violación: Mismo radio (${activeOuterRadius}px)`}
            </span>
          </div>
        </div>

        {/* Contenido de la Tarjeta */}
        <div className="pt-4 space-y-4">
          {/* Header de Usuario */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-[#0284c7] border border-cyan-400/40 text-white font-bold text-xs flex items-center justify-center shadow-md">
                JR
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-tight">
                  Aurora Handoff
                </h4>
                <p className="text-[11px] text-slate-400">Lumen Labs • Jonah Reyes</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              • In review
            </span>
          </div>

          {/* Grupo de Etiquetas */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span
              className="px-2 py-0.5 bg-[#182025] text-slate-300 border border-slate-700/50"
              style={{ borderRadius: `${Math.max(4, activeBtnRadius / 2)}px` }}
            >
              Design
            </span>
            <span
              className="px-2 py-0.5 bg-[#182025] text-slate-300 border border-slate-700/50"
              style={{ borderRadius: `${Math.max(4, activeBtnRadius / 2)}px` }}
            >
              Handoff
            </span>
            <span
              className="px-2 py-0.5 bg-[#182025] text-slate-300 border border-slate-700/50"
              style={{ borderRadius: `${Math.max(4, activeBtnRadius / 2)}px` }}
            >
              Q3
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 ml-auto font-mono">
              <Clock className="w-3 h-3" /> Updated 2 hours ago
            </span>
          </div>

          {/* Sección de Invitación */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              INVITE BY EMAIL
            </label>
            <div
              className="bg-[#182025] border border-slate-800 p-1 flex items-center justify-between"
              style={{ borderRadius: `${Math.max(6, activeInnerRadius - 2)}px` }}
            >
              <input
                type="email"
                value="dana@lumenlabs.io"
                readOnly
                className="bg-transparent text-xs text-slate-200 px-2.5 py-1 focus:outline-none w-full"
              />
              <button
                type="button"
                className="bg-[#00e699] hover:bg-[#00f7a5] text-[#090c0e] font-bold text-xs px-3.5 py-1.5 transition-all shadow-sm shrink-0"
                style={{ borderRadius: `${activeBtnRadius}px` }}
              >
                Invite
              </button>
            </div>
          </div>

          {/* Fila de Botones Outline */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              className="py-1.5 px-2 bg-[#182025] hover:bg-[#202930] text-slate-300 border border-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{ borderRadius: `${activeBtnRadius}px` }}
            >
              <Share2 className="w-3 h-3 text-slate-400" />
              <span>Share</span>
            </button>
            <button
              type="button"
              className="py-1.5 px-2 bg-[#182025] hover:bg-[#202930] text-slate-300 border border-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{ borderRadius: `${activeBtnRadius}px` }}
            >
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              className="py-1.5 px-2 bg-[#182025] hover:bg-[#202930] text-slate-300 border border-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{ borderRadius: `${activeBtnRadius}px` }}
            >
              <FolderArchive className="w-3 h-3 text-slate-400" />
              <span>Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Escala de Radio */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 bg-[#12171a] p-3 rounded-2xl border border-[#222b30]">
        {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((scale) => {
          const pixels = { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' }[scale];
          const isSelected = selectedScale === scale;

          return (
            <button
              key={scale}
              type="button"
              onClick={() => setSelectedScale(scale)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-sm font-bold'
                  : 'bg-[#182025] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <span
                className="w-3.5 h-3.5 border-2 border-current inline-block"
                style={{
                  borderRadius: scale === 'full' ? '9999px' : `${scaleRadii[scale].outer / 2}px`,
                }}
              />
              <span className="font-mono">{scale}</span>
              <strong className="font-mono text-white text-[11px]">{pixels}</strong>
            </button>
          );
        })}
      </div>

      {/* Control Toggle de la Fórmula Matemática */}
      <div className="mt-4 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setApplyFormula(!applyFormula)}
          className={`px-3 py-1 rounded-lg border font-mono text-[11px] transition-colors flex items-center gap-1.5 ${
            applyFormula
              ? 'bg-emerald-500/15 text-[#00e699] border-[#00e699]/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {applyFormula ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-[#00e699]" />
              <span>Fórmula Activa: R_outer = R_inner + P</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Violación Activa: Mismo radio en todo</span>
            </>
          )}
        </button>
      </div>

      {/* Advertencia Conceptual de Principio */}
      <div className="mt-4 px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>One radius everywhere is not a system</span>
      </div>
    </div>
  );
}
