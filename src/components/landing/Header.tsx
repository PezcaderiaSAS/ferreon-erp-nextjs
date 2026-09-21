"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, Menu, X, ArrowRight } from 'lucide-react';
import { LANDING_CONFIG } from '../../config/landing';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { brand, navigation } = LANDING_CONFIG;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={brand.logoHref} className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">
            {brand.name}
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
          {navigation.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md py-1 px-1.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Auth & Primary CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href={navigation.signIn.href}
            className="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-2 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            {navigation.signIn.label}
          </Link>
          <Link
            href={navigation.getStarted.href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 py-2 rounded-lg shadow-sm shadow-blue-500/30 transition-all duration-150 transform-gpu hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            {navigation.getStarted.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Abrir menú de navegación"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navigation.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white px-3 py-2 rounded-md hover:bg-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
            <Link
              href={navigation.signIn.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-center text-sm font-medium text-slate-300 hover:text-white py-2.5 rounded-lg hover:bg-slate-900 transition-colors"
            >
              {navigation.signIn.label}
            </Link>
            <Link
              href={navigation.getStarted.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg shadow-sm shadow-blue-500/25 transition-colors"
            >
              {navigation.getStarted.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
