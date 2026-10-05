'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Trophy, Award, Check, X } from 'lucide-react';
import { useGamificationStore } from '@/infrastructure/state/gamificationStore';

export function CelebracionConfetti() {
  const { celebracionActiva, detalleCelebracion, cerrarCelebracion } = useGamificationStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!celebracionActiva) return;

    // Disparar animación de confeti en canvas nativo (Ultra-ligero, 0 dependencias externas)
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      d: number;
      color: string;
      tilt: number;
      tiltAngleIncremental: number;
      tiltAngle: number;
    }> = [];

    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#8b5cf6'];

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 50 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.d);
        p.tilt = Math.sin(p.tiltAngle - i / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();

        // Reposicionar si cae al fondo
        if (p.y > canvas.height) {
          particles[i] = {
            ...p,
            x: Math.random() * canvas.width,
            y: -20,
            tilt: Math.floor(Math.random() * 10) - 10,
          };
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Auto-cierre opcional o timeout tras 8 segundos
    const timer = setTimeout(() => {
      // no cerrar automáticamente para permitir que el usuario lea el mensaje
    }, 8000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer);
    };
  }, [celebracionActiva]);

  if (!celebracionActiva || !detalleCelebracion) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center text-white shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Botón cerrar */}
        <button
          onClick={cerrarCelebracion}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Cerrar celebración"
          aria-label="Cerrar celebración"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icono de Celebración */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/30 border border-amber-400/40 shadow-inner">
          <span className="text-4xl animate-bounce">{detalleCelebracion.icono}</span>
        </div>

        {/* Puntos Ganados Badge */}
        {detalleCelebracion.puntosGanados && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-xs mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>+{detalleCelebracion.puntosGanados} Puntos XP</span>
          </div>
        )}

        <h3 className="text-xl font-black text-white tracking-tight mb-2">
          {detalleCelebracion.titulo}
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          {detalleCelebracion.mensaje}
        </p>

        <button
          onClick={cerrarCelebracion}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4 stroke-[3]" />
          <span>¡Continuar Aprendiendo!</span>
        </button>
      </div>
    </div>
  );
}
