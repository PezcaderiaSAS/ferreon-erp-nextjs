'use client';

import React from 'react';
import { Target, Calendar, ArrowRight } from 'lucide-react';

export function PremiumGoalTracker({
  percentage = 75,
  title = 'Flota en Operación WMS',
  subtitle = 'Meta de utilización del parque de maquinaria',
  targetTasks = 120,
  completedTasks = 90,
  remainingTasks = 30,
  deadline = '31 Dic, 2026',
}: {
  percentage?: number;
  title?: string;
  subtitle?: string;
  targetTasks?: number;
  completedTasks?: number;
  remainingTasks?: number;
  deadline?: string;
}) {
  return (
    <div className="w-full max-w-sm rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden flex flex-col">
      {/* Top Vibrant Gradient Header */}
      <div className="bg-gradient-to-r from-[#a44df1] via-[#637ef8] to-[#3bc0ff] p-5 text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-xs">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white leading-tight">
            {title}
          </h3>
          <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="bg-white p-6 flex flex-col gap-5">
        {/* Circular Progress & Breakdown */}
        <div className="flex items-center justify-between gap-4">
          {/* SVG Circular Progress */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#637ef8] transition-all duration-1000 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-900 leading-none">
                {percentage}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Cumplido
              </span>
            </div>
          </div>

          {/* Goal Stats Breakdown */}
          <ul className="flex flex-col gap-2 flex-1 text-xs">
            <li className="flex justify-between items-center text-slate-500">
              <span>Meta Flota</span>
              <strong className="text-slate-900 font-mono font-bold">
                {targetTasks} un.
              </strong>
            </li>
            <li className="flex justify-between items-center text-slate-500">
              <span>En Obra</span>
              <strong className="text-indigo-600 font-mono font-bold">
                {completedTasks} un.
              </strong>
            </li>
            <li className="flex justify-between items-center text-slate-500">
              <span>Disponibles</span>
              <strong className="text-slate-700 font-mono font-bold">
                {remainingTasks} un.
              </strong>
            </li>
          </ul>
        </div>

        {/* Deadline Meta Box */}
        <div className="p-3 px-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Fecha Límite
              </span>
              <p className="text-xs font-bold text-slate-800">{deadline}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Full-Width Gradient CTA */}
        <button
          type="button"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a44df1] to-[#637ef8] text-white font-bold text-xs shadow-[0_8px_20px_rgba(164,77,241,0.3)] hover:shadow-[0_12px_24px_rgba(164,77,241,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
        >
          <span>Ver Detalles de Flota</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
