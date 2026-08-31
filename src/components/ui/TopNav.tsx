"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';

export function TopNav() {
  const { toggleMobileMenu } = useLayoutStore();

  return (
    <header className="bg-white text-slate-900 font-sans h-16 sticky top-0 z-30 border-b border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 w-full max-w-md">
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center w-full focus-within:ring-2 focus-within:ring-brand-salmon rounded-lg overflow-hidden bg-slate-50 border border-slate-200">
          <Search className="w-5 h-5 ml-3 text-slate-500 flex-shrink-0" />
          <input 
            className="w-full py-2 px-3 border-none focus:ring-0 text-slate-900 text-sm bg-transparent outline-none" 
            placeholder="Search..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        <button className="text-slate-500 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100">
          <Bell className="w-5 h-5" />
        </button>
        <Link href="/configuracion" className="text-slate-500 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 ml-2 cursor-pointer relative">
          <Image 
            alt="User profile photo" 
            fill
            className="object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYZXiDTt6hl5glrxJFIja-hQ01Z3wgwwasLOqJ7wMNW6Y5A_DyWQw5U-hBCkwX5LDcGVKMv31nRv7hp0DiKtdtCH4yIgLcHGL86WRh2Q4eqDo057sq-GcWKfWTIVuojIQRpPykprXkDuqfVdcUFhiXpXiqK4DoEHEfvJv4Y__ASe-cs6mMJr-vM0TXzbWlooiq6kED6y8I66lFkG0I73U2-EhcdYifPe3sCyvBpQGNdOo18aY7sPpOKld97qf4xguE_WdlKIhF1N0"
          />
        </div>
      </div>
    </header>
  );
}
