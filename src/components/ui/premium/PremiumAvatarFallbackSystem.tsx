'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  User,
  ArrowRight,
  RefreshCw,
  ImageOff,
  ShieldCheck,
} from 'lucide-react';

export function PremiumAvatarFallbackSystem() {
  // Estado para simular la degradación de carga
  const [fallbackState, setFallbackState] = useState<'image' | 'initials' | 'icon'>('initials');

  return (
    <div className="w-full bg-[#080d0f] text-[#f8fafc] rounded-2xl p-4 sm:p-8 border border-slate-800 shadow-2xl flex flex-col items-center justify-center font-sans">
      {/* Insignia Superior de Sistema */}
      <div className="mb-3 px-3 py-1 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>AVATAR · COMPONENT SYSTEM</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-1 text-center">
        Resilient Degradation Chain
      </h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">
        Cero layout shifts: tamaño exacto, ratio 1:1 y radio 50% garantizados ante fallos de red.
      </p>

      {/* Contenedor de Demostración del Avatar Activo */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-[#111827] border border-[#1f2937] shadow-xl max-w-sm w-full">
        {/* Avatar Circular Principal (96px) */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl transition-all duration-300 shadow-2xl select-none"
            style={{
              backgroundColor: '#0284c7',
              border: '3px solid #0ea5e9',
              boxShadow: '0 0 25px rgba(14, 165, 233, 0.35)',
            }}
          >
            {fallbackState === 'image' ? (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Sarah Connor"
                className="w-full h-full rounded-full object-cover"
                onError={() => setFallbackState('initials')}
              />
            ) : fallbackState === 'initials' ? (
              <span>SC</span>
            ) : (
              <User className="w-12 h-12 text-slate-200 stroke-[2]" />
            )}
          </div>

          {/* Indicador de Estado Activo */}
          <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#10b981] border-2 border-[#111827] shadow-sm" />
        </div>

        {/* Badge de Estado del Fallback */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-xs font-semibold shadow-xs">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>
            {fallbackState === 'image'
              ? 'primary -> image loaded'
              : fallbackState === 'initials'
              ? 'fallback -> initials'
              : 'fallback -> generic icon'}
          </span>
        </div>

        {/* Diagrama de Flujo de Degradación */}
        <div className="w-full mt-4 pt-4 border-t border-[#1f2937] text-center">
          <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mb-3">
            ONE FAILS &rarr; USE THE NEXT
          </p>

          <div className="flex items-center justify-center gap-2.5">
            {/* Paso 1: Imagen */}
            <button
              type="button"
              onClick={() => setFallbackState('image')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                fallbackState === 'image'
                  ? 'bg-[#0284c7] text-white border-2 border-[#38bdf8] ring-2 ring-cyan-500/40'
                  : 'bg-[#1e293b] text-slate-400 hover:text-white border border-slate-700'
              }`}
              title="Probar estado Imagen"
            >
              <ImageOff className="w-4 h-4" />
            </button>

            <span className="text-slate-600 font-bold">&rarr;</span>

            {/* Paso 2: Iniciales */}
            <button
              type="button"
              onClick={() => setFallbackState('initials')}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                fallbackState === 'initials'
                  ? 'bg-[#0284c7] text-white border-2 border-[#38bdf8] ring-2 ring-cyan-500/40'
                  : 'bg-[#1e293b] text-slate-400 hover:text-white border border-slate-700'
              }`}
              title="Probar estado Iniciales"
            >
              SC
            </button>

            <span className="text-slate-600 font-bold">&rarr;</span>

            {/* Paso 3: Icono Genérico */}
            <button
              type="button"
              onClick={() => setFallbackState('icon')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                fallbackState === 'icon'
                  ? 'bg-[#0284c7] text-white border-2 border-[#38bdf8] ring-2 ring-cyan-500/40'
                  : 'bg-[#1e293b] text-slate-400 hover:text-white border border-slate-700'
              }`}
              title="Probar estado Icono Genérico"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Distintivo de Despliegue Seguro */}
        <div className="mt-2 px-4 py-1 rounded-full bg-[#0d9488]/20 text-[#2dd4bf] border border-[#0d9488]/40 text-xs font-medium font-mono">
          the fallback ships anyway
        </div>
      </div>
    </div>
  );
}
