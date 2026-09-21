import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';
import { KanbanShowcase } from './KanbanShowcase';

export function ProductShowcase() {
  const { productShowcase } = LANDING_CONFIG;

  return (
    <section id="product" className="py-20 md:py-28 relative overflow-hidden bg-slate-950/80 border-t border-slate-800/80">
      {/* Background Lighting */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Interactive Kanban Board */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <KanbanShowcase />
          </div>

          {/* Right Column: Copy & Checklist */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-4">
              {productShowcase.badge}
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-5">
              {productShowcase.title}
            </h2>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8">
              {productShowcase.description}
            </p>

            {/* Checklist of 4 advantages */}
            <div className="space-y-4 w-full">
              {productShowcase.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-slate-200">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
