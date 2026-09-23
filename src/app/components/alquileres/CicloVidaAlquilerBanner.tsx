"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  HardHat, 
  ArrowLeftRight, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useLayoutStore } from '../../../infrastructure/state/layoutStore';

const STORAGE_KEY = 'ferreon-ciclo-vida-collapsed';

export function CicloVidaAlquilerBanner() {
  const { setGuiaBotonesOpen } = useLayoutStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Only collapse if user explicitly collapsed it before (default: expanded)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Default is expanded (false). Only collapse if explicitly saved as 'true'.
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
    }
  };

  const pasos = [
    {
      numero: '1',
      titulo: 'Cotizar',
      subtitulo: 'Propuesta Comercial',
      descripcion: 'Crea propuestas económicas para clientes sin descontar unidades de bodega.',
      icono: FileSpreadsheet,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-100 text-blue-600',
      bordeHover: 'hover:border-blue-300',
    },
    {
      numero: '2',
      titulo: 'Formalizar',
      subtitulo: '1-Clic Poka-Yoke',
      descripcion: 'Convierte la cotización en contrato activo y reserva stock de inmediato.',
      icono: CheckCircle2,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-600',
      bordeHover: 'hover:border-emerald-300',
    },
    {
      numero: '3',
      titulo: 'En Obra',
      subtitulo: 'Contrato Activo',
      descripcion: 'Maquinaria en poder del cliente. Controla fletes, abonos y causación diaria.',
      icono: HardHat,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-600',
      bordeHover: 'hover:border-amber-300',
    },
    {
      numero: '4',
      titulo: 'Devolución',
      subtitulo: 'Recepción & Split',
      descripcion: 'Recibe equipos, clasifica buenos/dañados, restituye stock y concilia depósitos.',
      icono: ArrowLeftRight,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-600',
      bordeHover: 'hover:border-purple-300',
    },
  ];

  if (!mounted) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-sm border border-slate-700/60 transition-all duration-300">
      {/* Header del Banner */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-700/50 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black tracking-wide text-white">
                Flujo del Ciclo de Vida: Cotización ➔ Contrato ➔ Devolución
              </h3>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Guía Operativa
              </span>
            </div>
            {!isCollapsed && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Conoce las 4 etapas para gestionar maquinaria con máxima velocidad y cero errores de stock.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGuiaBotonesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-600/80 text-xs font-bold transition-colors cursor-pointer"
            title="Ver qué hace cada botón en detalle"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guía de Botones</span>
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expandir guía del ciclo de vida" : "Contraer guía"}
            aria-label={isCollapsed ? "Expandir guía" : "Contraer guía"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contenido de las 4 Fases (Colapsable) */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed
            ? 'max-h-0 overflow-hidden opacity-0'
            : 'max-h-[600px] overflow-visible opacity-100'
        }`}
      >
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/40">
          {pasos.map((paso, idx) => {
            const Icon = paso.icono;
            return (
              <div
                key={paso.numero}
                className={`bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col gap-2.5 h-auto transition-colors ${paso.bordeHover} relative group`}
              >
                {/* Cabecera: número + título + icono */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-black text-white shrink-0">
                      {paso.numero}
                    </span>
                    <span className="text-xs font-black text-white">
                      {paso.titulo}
                    </span>
                  </div>
                  <div className={`p-1.5 rounded-lg shrink-0 ${paso.iconBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Badge + descripción — sin truncamiento, altura auto */}
                <div className="flex flex-col gap-1">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border self-start whitespace-normal ${paso.badgeColor}`}>
                    {paso.subtitulo}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-normal break-words">
                    {paso.descripcion}
                  </p>
                </div>

                {idx < 3 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none z-10">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
