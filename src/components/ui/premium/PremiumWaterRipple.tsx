'use client';

import React, { useState, useRef, MouseEvent } from 'react';
import { Sparkles, Waves, RefreshCw } from 'lucide-react';

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface PremiumWaterRippleProps {
  children?: React.ReactNode;
  className?: string;
  height?: string;
  showDemoText?: boolean;
}

/**
 * Componente: PremiumWaterRipple
 * Efecto interactivo de onda expansiva de agua (Water Ripple) con gradiente
 * moderno azul océano (#0f172a -> #1d4ed8 -> #0284c7) y microinteracciones de clic.
 */
export function PremiumWaterRipple({
  children,
  className = '',
  height = '420px',
  showDemoText = true,
}: PremiumWaterRippleProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 0.45;

    const newRipple: RippleItem = {
      id: Date.now() + Math.random(),
      x: x - size / 2,
      y: y - size / 2,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
    setClickCount((c) => c + 1);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  };

  const handleResetCount = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClickCount(0);
    setRipples([]);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300 shadow-xl border border-slate-700/50 ${className}`}
    >
      {/* Fondo con gradiente dinámico oceánico según especificación */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #0284c7 100%)',
        }}
      />

      {/* Partículas de brillo de fondo sutiles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),transparent_70%)] pointer-events-none" />

      {/* Capa de Ondas Renderizadas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 60%, transparent 80%)',
              pointerEvents: 'none',
              animation: 'premiumRippleEffect 0.6s ease-out forwards',
            }}
          />
        ))}
      </div>

      {/* Contenido Superior / UI */}
      <div className="relative z-20 h-full flex flex-col justify-between p-6 sm:p-8 text-white">
        {/* Barra superior de métricas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-blue-100">
            <Waves className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Interactive Fluid Canvas</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 font-mono text-cyan-200">
              Ondas generadas: {clickCount}
            </span>
            {clickCount > 0 && (
              <button
                type="button"
                onClick={handleResetCount}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Reiniciar contador"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Centro de la demostración */}
        {showDemoText && !children && (
          <div className="text-center my-auto space-y-3 pointer-events-none">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-1">
              <Sparkles className="w-7 h-7 text-cyan-300 animate-bounce" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              Haz clic en cualquier punto del panel
            </h3>
            <p className="text-sm sm:text-base text-blue-100/90 max-w-md mx-auto leading-relaxed">
              Disfruta del efecto de onda de agua fluido 🌊✨ proyectado con coordenadas dinámicas precisas y aceleración por GPU.
            </p>
          </div>
        )}

        {children && <div className="my-auto">{children}</div>}

        {/* Pie informativo */}
        <div className="flex items-center justify-between text-xs text-blue-200/80 pt-4 border-t border-white/10">
          <span>Alquileres System • Microinteracciones de Alta Gama</span>
          <span className="font-mono text-[11px] text-cyan-300">GPU Accelerated • 60 FPS</span>
        </div>
      </div>

      {/* Estilos de keyframe para la animación de ripple */}
      <style jsx>{`
        @keyframes premiumRippleEffect {
          0% {
            transform: scale(0);
            opacity: 0.85;
          }
          100% {
            transform: scale(2.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
