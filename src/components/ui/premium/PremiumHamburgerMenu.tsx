'use client';

import React, { useState } from 'react';
import { Home, Layers, Mail, Calendar, ShieldCheck, Settings } from 'lucide-react';

export function PremiumHamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');

  const menuItems = [
    { label: 'Home', icon: <Home className="w-4 h-4" /> },
    { label: 'Services', icon: <Layers className="w-4 h-4" /> },
    { label: 'Operations', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Contact', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="relative w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          {/* Animated 3-bar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="relative bg-[#6366f1] hover:bg-[#4f46e5] text-white p-2.5 px-3 rounded-[10px] cursor-pointer transition-all duration-300 flex flex-col justify-center items-center gap-1 w-10 h-10 shadow-xs"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
          >
            <span
              className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                isOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 ${
                isOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block w-4 h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${
                isOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>

          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Alquileres <span className="text-[#6366f1]">System</span>
          </span>
        </div>

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
          Mobile Nav
        </span>
      </div>

      {/* Slide-Down Premium Dropdown */}
      <nav
        className={`w-full bg-white border-t border-slate-100 rounded-b-[16px] shadow-[0_15px_30px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 ${
          isOpen
            ? 'max-h-80 opacity-100 py-2.5'
            : 'max-h-0 opacity-0 py-0 pointer-events-none'
        }`}
      >
        <ul className="flex flex-col px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(item.label);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#6366f1] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
