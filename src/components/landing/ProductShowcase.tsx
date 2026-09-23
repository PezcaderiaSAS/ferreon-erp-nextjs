import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';
import { KanbanShowcase } from './KanbanShowcase';

export function ProductShowcase() {
  const { productShowcase } = LANDING_CONFIG;

  return (
    <section id="product" className="py-20 md:py-28 relative overflow-hidden bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Interactive Kanban Board */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <KanbanShowcase />
          </div>

          {/* Right Column: Copy & Checklist */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-xs font-semibold tracking-wider uppercase mb-4 shadow-sm">
              {productShowcase.badge}
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
              {productShowcase.title}
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              {productShowcase.description}
            </p>

            {/* Checklist of 4 advantages */}
            <div className="space-y-4 w-full">
              {productShowcase.benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm sm:text-base font-medium text-slate-700">
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
