"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Check } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';
import { HeroMockup } from './HeroMockup';

export function HeroSection() {
  const { hero } = LANDING_CONFIG;

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-slate-950 text-white border-b border-slate-800/80">
      {/* Background Radial Glow con tokens de DESIGN.md */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[360px] bg-gradient-to-r from-[#FF8A65]/15 via-slate-900/0 to-[#0EA5E9]/15 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Top Announcement Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs sm:text-sm font-medium mb-6 shadow-sm shadow-orange-500/10 animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{hero.badge}</span>
        </div>

        {/* Main Impact Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.15] mb-6">
          {hero.headline}
        </h1>

        {/* Subtitle / Value Proposition */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-8">
          {hero.description}
        </p>

        {/* Dual Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8">
          <Link
            href={hero.primaryCta.href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-[#FF8A65] to-[#F4683E] hover:from-[#F4683E] hover:to-[#E76E4A] active:bg-orange-800 px-7 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 transform-gpu hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {hero.primaryCta.label}
          </Link>
          <a
            href={hero.secondaryCta.href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 px-6 py-3.5 rounded-xl backdrop-blur-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-orange-400">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
            {hero.secondaryCta.label}
          </a>
        </div>

        {/* Trust Credentials Micro-Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-400 font-medium">
          {hero.trustBullets.map((bullet) => (
            <div key={bullet} className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* Interactive Laptop Window Mockup */}
        <HeroMockup />
      </div>
    </section>
  );
}
