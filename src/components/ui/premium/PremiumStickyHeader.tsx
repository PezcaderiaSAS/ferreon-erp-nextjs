'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function PremiumStickyHeader({
  simulateScroll = false,
}: {
  simulateScroll?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(simulateScroll);
  const [activeNav, setActiveNav] = useState('Home');

  useEffect(() => {
    if (simulateScroll) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [simulateScroll]);

  const navLinks = ['Home', 'Operations', 'Rentals', 'Fleet', 'Billing'];

  return (
    <header
      className={`w-full sticky top-0 z-40 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border-slate-200/90 py-3'
          : 'bg-white/85 backdrop-blur-xs border-slate-200/60 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand Logo Indicator */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] text-white font-extrabold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            AS
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
            Alquileres <span className="text-[#6366f1]">System</span>
          </span>
        </Link>

        {/* Pill-shaped Navigation Menu */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/70 rounded-full border border-slate-200/50">
          {navLinks.map((link) => {
            const isActive = activeNav === link;
            return (
              <button
                key={link}
                type="button"
                onClick={() => setActiveNav(link)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#6366f1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {link}
              </button>
            );
          })}
        </nav>

        {/* CTA Primary Button */}
        <Link
          href="/alquileres"
          className="bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.45)] hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
