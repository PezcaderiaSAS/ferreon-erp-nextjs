'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Hash,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function PremiumTabularNumbersSystem() {
  const [isTabular, setIsTabular] = useState(true);
  const [isLiveCounting, setIsLiveCounting] = useState(false);

  // Valores numéricos iniciales según la especificación de referencia
  const [numbers, setNumbers] = useState<number[]>([
    4208.5, 72.0, 18940.25, 1006.75, 340.0,
  ]);

  // Simulación de fluctuación de números en vivo para demostrar el efecto "dances" vs "lines up"
  useEffect(() => {
    if (!isLiveCounting) return;

    const interval = setInterval(() => {
      setNumbers((prev) =>
        prev.map((num) => {
          const delta = (Math.random() - 0.5) * 120;
          return Math.max(10, +(num + delta).toFixed(2));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isLiveCounting]);

  return (
    <div className="w-full bg-[#080d0f] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-[#1f2937] shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>UI NUMBERS · 01</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 text-center">
        Watch the <span className="text-[#00e699]">right edge.</span>
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center max-w-md">
        Alineación estricta a la derecha y glifos numéricos de ancho uniforme garantizan que los decimales no oscilen.
      </p>

      {/* Controles Interactivos */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setIsTabular(!isTabular)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
            isTabular
              ? 'bg-[#00e699]/15 text-[#00e699] border-[#00e699]/40 font-bold shadow-sm'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold'
          }`}
        >
          {isTabular ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>font-variant-numeric: tabular-nums (Activo)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>proportional-nums (Bailando)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsLiveCounting(!isLiveCounting)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
            isLiveCounting
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
              : 'bg-[#111827] text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLiveCounting ? 'animate-spin' : ''}`} />
          <span>{isLiveCounting ? 'Detener Fluctuación' : 'Simular Datos en Vivo'}</span>
        </button>
      </div>

      {/* Tarjeta de Números */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-2xl p-6 w-full max-w-[380px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]">
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f2937] mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">
              Q3 REVENUE · ALQUILERES
            </span>
          </div>
          <span className="font-mono text-xs text-[#00e699] bg-[#00e699]/10 px-2 py-0.5 rounded-full border border-[#00e699]/20 flex items-center gap-1">
            <Hash className="w-3 h-3" />
            <span>tabular-nums</span>
          </span>
        </div>

        {/* Lista Numérica Alineada a la Derecha */}
        <div
          className={`flex flex-col items-end gap-2.5 text-2xl font-bold tracking-tight text-[#f8fafc] transition-all select-none ${
            isTabular
              ? 'tabular-nums font-mono'
              : 'font-sans'
          }`}
          style={
            isTabular
              ? {
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum" 1',
                }
              : {
                  fontVariantNumeric: 'proportional-nums',
                  fontFeatureSettings: '"tnum" 0',
                }
          }
        >
          {numbers.map((val, idx) => (
            <div
              key={idx}
              className="w-full flex justify-between items-center py-1 border-b border-slate-800/40 last:border-0 hover:bg-slate-800/30 px-1 rounded transition-colors"
            >
              <span className="text-xs font-mono text-slate-500 font-normal">
                Item 0{idx + 1}
              </span>
              <span className="text-right">
                {val.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Concepto Inferior */}
      <div className="flex items-center gap-3 mt-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            !isTabular
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-1 ring-rose-400/50'
              : 'bg-rose-500/10 text-rose-400/60 border-rose-500/20'
          }`}
        >
          dances
        </span>
        <ArrowRight className="w-4 h-4 text-slate-600" />
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isTabular
              ? 'bg-[#00e699]/20 text-[#00e699] border-[#00e699]/40 ring-1 ring-[#00e699]/50 shadow-sm'
              : 'bg-[#00e699]/10 text-[#00e699]/60 border-[#00e699]/20'
          }`}
        >
          lines up
        </span>
      </div>
    </div>
  );
}
