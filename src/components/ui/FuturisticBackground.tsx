"use client";

import React, { useState, useEffect } from 'react';

interface FuturisticBackgroundProps {
  interactive?: boolean;
  className?: string;
}

export function FuturisticBackground({ 
  interactive = true, 
  className = "" 
}: FuturisticBackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalizar coordenadas a porcentaje para rendimiento óptimo
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      
      {/* 1. Cyber Grid Matrix */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30"></div>
      <div className="absolute inset-0 bg-cyber-dots opacity-20"></div>

      {/* 2. Interactive Spotlight Glow (React Mouse Tracking) */}
      {interactive && (
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] transition-transform duration-700 ease-out will-change-transform opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, rgba(6,182,212,0.15) 50%, transparent 70%)',
            transform: `translate3d(${mousePos.x * 0.8}vw, ${mousePos.y * 0.8}vh, 0) translate(-50%, -50%)`,
          }}
        />
      )}

      {/* 3. Floating Neon Energy Orbs (GPU Accelerated Blobs) */}
      {/* Orb 1: Orange/Amber Core */}
      <div className="absolute top-[-10%] right-[-5%] w-[480px] h-[480px] bg-gradient-to-br from-orange-500/25 via-amber-500/20 to-transparent rounded-full blur-3xl animate-blob will-change-transform"></div>

      {/* Orb 2: Polar Cyan / Ice Electric */}
      <div className="absolute bottom-[-10%] left-[-5%] w-[420px] h-[420px] bg-gradient-to-tr from-cyan-500/20 via-teal-500/15 to-transparent rounded-full blur-3xl animate-blob will-change-transform [animation-delay:4s]"></div>

      {/* Orb 3: Deep Steel Violet */}
      <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] bg-gradient-to-r from-purple-500/15 to-orange-500/10 rounded-full blur-3xl animate-pulse-glow will-change-transform"></div>

      {/* 4. Futuristic Laser Energy Beams (SVG Horizontal/Vertical Light Pulses) */}
      <div className="absolute top-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-orange-400/40 to-transparent overflow-hidden opacity-60">
        <div className="w-48 h-full bg-gradient-to-r from-transparent via-amber-200 to-transparent animate-beam"></div>
      </div>

      <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent overflow-hidden opacity-50">
        <div className="w-56 h-full bg-gradient-to-r from-transparent via-cyan-200 to-transparent animate-beam [animation-delay:2.5s]"></div>
      </div>

      {/* 5. Ambient Vignette Filter */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20 pointer-events-none"></div>

    </div>
  );
}
