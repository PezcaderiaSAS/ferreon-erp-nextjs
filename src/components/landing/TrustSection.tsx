import React from 'react';
import { LANDING_CONFIG } from '../../config/landing';

export function TrustSection() {
  const { trust } = LANDING_CONFIG;

  return (
    <section className="py-12 border-y border-slate-800/80 bg-slate-950/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Headline */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-400 mb-8">
          {trust.title}
        </p>

        {/* Brand Logos Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-center">
          {trust.brands.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-200 group cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-xs font-bold font-mono text-slate-300 group-hover:bg-blue-600/30 group-hover:text-blue-300 transition-colors">
                {brand.initials}
              </div>
              <span className="text-xs sm:text-sm font-semibold tracking-tight">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
