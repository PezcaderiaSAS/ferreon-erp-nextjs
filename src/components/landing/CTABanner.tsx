import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function CTABanner() {
  const { ctaBanner } = LANDING_CONFIG;

  return (
    <section className="py-16 md:py-24 bg-slate-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-900/70 via-indigo-900/60 to-blue-950/80 border border-blue-500/40 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-blue-950/60 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Subtle Glow Overlay */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/20 blur-[90px] rounded-full pointer-events-none" />

          {/* Left Text */}
          <div className="relative z-10 text-center md:text-left max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Despliegue Rápido en la Nube</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {ctaBanner.headline}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 font-normal">
              {ctaBanner.description}
            </p>
          </div>

          {/* Right Action Button */}
          <div className="relative z-10 flex-shrink-0 w-full sm:w-auto">
            <Link
              href={ctaBanner.ctaHref}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-8 py-4 rounded-xl shadow-xl shadow-blue-600/40 transition-all duration-200 transform-gpu hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {ctaBanner.ctaLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
