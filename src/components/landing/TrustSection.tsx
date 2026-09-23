import React from 'react';
import { LANDING_CONFIG } from '../../config/landing';

export function TrustSection() {
  const { trust } = LANDING_CONFIG;

  return (
    <section className="py-12 border-y border-slate-200/80 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Headline */}
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-slate-500 mb-8">
          {trust.title}
        </p>

        {/* Brand Logos Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 items-center justify-center">
          {trust.brands.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow transition-all duration-200 group cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold font-mono text-slate-700 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
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
