"use client";

import React from "react";

interface ModalSkeletonProps {
  message?: string;
}

/**
 * Esqueleto de carga con micro-animación conforme al estándar DESIGN.md
 * para transiciones de apertura en componentes cargados dinámicamente.
 */
export function ModalSkeleton({ message = "Cargando módulo..." }: ModalSkeletonProps) {
  return (
    <div className="p-8 sm:p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[220px] w-full">
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Glow de fondo */}
        <div className="absolute inset-0 rounded-full bg-brand-salmon/20 blur-md animate-pulse" />
        {/* Spinner animado con tokens de marca */}
        <div className="w-10 h-10 border-3 border-slate-200 dark:border-slate-800 border-t-brand-salmon rounded-full animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
          {message}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Preparando interfaz interactiva...
        </p>
      </div>
    </div>
  );
}
