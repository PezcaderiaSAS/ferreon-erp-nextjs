'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  TrendingUp,
  Lock,
  Search,
  Terminal,
  SunMedium,
  Moon,
  Layers,
  Check,
} from 'lucide-react';

export function PremiumDarkModeDepthSystem() {
  // Estado para alternar entre el anti-patrón (Pure Black #000) y la arquitectura correcta (Surface Depth #111827)
  const [usePureBlack, setUsePureBlack] = useState(false);

  return (
    <div className="w-full bg-[#090c0e] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#1f2937] shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>DARK MODE · 01</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 text-center">
        Black background. <span className="text-slate-400">White text.</span>
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center max-w-md">
        El contraste crudo sin capas destruye la jerarquía visual y provoca fatiga ocular.
      </p>

      {/* Selector Interactivo: Anti-patrón vs Arquitectura de Profundidad */}
      <div className="flex items-center gap-2 mb-6 bg-[#111827] p-1 rounded-xl border border-[#1f2937] text-xs">
        <button
          type="button"
          onClick={() => setUsePureBlack(false)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            !usePureBlack
              ? 'bg-[#1f2937] text-[#00e699] font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Surface Depth (Capas Tonalidades)</span>
        </button>
        <button
          type="button"
          onClick={() => setUsePureBlack(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            usePureBlack
              ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Anti-patrón (#000 Zero Depth)</span>
        </button>
      </div>

      {/* Tarjeta de Demostración */}
      <div
        className={`w-full max-w-[400px] rounded-2xl p-5 relative transition-all duration-300 ${
          usePureBlack
            ? 'bg-[#000000] border-0 text-white shadow-none'
            : 'bg-[#111827] border border-[#1f2937] text-[#f8fafc] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]'
        }`}
      >
        {/* Hex Badge Superior de Advertencia */}
        <div
          className={`absolute -top-3 right-5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-colors ${
            usePureBlack
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
              : 'bg-emerald-500/15 text-[#00e699] border-[#00e699]/30'
          }`}
        >
          {usePureBlack ? '#000 / #FFF = zero depth' : 'Layered Grays = Visual Depth'}
        </div>

        {/* Hero Media / Superficie Gráfica */}
        <div
          className={`h-24 rounded-xl mb-4 p-3 flex items-end justify-between transition-colors ${
            usePureBlack
              ? 'bg-[#000000] border border-white'
              : 'bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-700/50'
          }`}
        >
          <span className="text-[11px] font-mono text-cyan-300">
            {usePureBlack ? 'Flat Canvas (Sin sombras)' : 'Elevated Surface #1f2937'}
          </span>
          <span className="text-[10px] font-mono text-slate-400">Alquileres Analytics</span>
        </div>

        {/* Barra de Usuario y Acción */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50 mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                usePureBlack
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1f2937] border border-slate-600 text-cyan-300 shadow-sm'
              }`}
            >
              MT
            </span>
            <div>
              <p
                className={`text-xs font-bold leading-tight ${
                  usePureBlack ? 'text-white' : 'text-slate-100'
                }`}
              >
                Maya Torres
              </p>
              <p
                className={`text-[11px] ${
                  usePureBlack ? 'text-white' : 'text-slate-400'
                }`}
              >
                Acme Analytics & Obra
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              usePureBlack
                ? 'bg-white text-black border border-white'
                : 'bg-[#1f2937] hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export report</span>
          </button>
        </div>

        {/* Sección de Métrica Financiera */}
        <div className="space-y-2 mb-3">
          <div className="flex items-baseline justify-between">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                usePureBlack ? 'text-white' : 'text-slate-100'
              }`}
            >
              $48,250
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              +12.4% vs last month
            </span>
          </div>

          {/* Mini Bar Chart de Visualización */}
          <div className="flex items-end gap-1.5 h-10 pt-2">
            {[40, 65, 50, 85, 100].map((height, idx) => (
              <span
                key={idx}
                className={`flex-1 rounded-t transition-all ${
                  usePureBlack
                    ? 'bg-white'
                    : 'bg-gradient-to-t from-cyan-600 to-[#00e699]'
                }`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        {/* Subtexto y Feature Pill */}
        <p
          className={`text-[11px] mb-3 leading-relaxed ${
            usePureBlack ? 'text-white' : 'text-slate-400'
          }`}
        >
          Net revenue after refunds and machinery maintenance fees.
          <br />
          <span className="text-[10px] text-slate-500 font-mono">Updated 4 minutes ago.</span>
        </p>

        <div
          className={`p-2 rounded-lg text-xs flex items-center gap-2 mb-3 ${
            usePureBlack
              ? 'bg-white text-black border border-white font-bold'
              : 'bg-[#1f2937] text-slate-300 border border-slate-700/60'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Forecast available on Pro SaaS Tier</span>
        </div>

        {/* Search Box */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-3 ${
            usePureBlack
              ? 'bg-black border-white text-white'
              : 'bg-[#090c0e] border-[#1f2937] text-slate-300'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions"
            readOnly
            className="bg-transparent text-xs w-full focus:outline-none"
          />
        </div>

        {/* Pie de Terminal Footnote */}
        <div
          className={`rounded-lg p-2 font-mono text-[11px] flex items-center gap-2 ${
            usePureBlack
              ? 'bg-white text-black'
              : 'bg-[#030712] border border-slate-800 text-slate-400'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <code>maya@acme ~ % dark-mode --invert</code>
        </div>
      </div>
    </div>
  );
}
