"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, Bell, Settings, LogOut, User, Building, HelpCircle } from 'lucide-react';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { useTenantStore } from '../../infrastructure/state/tenantStore';
import { supabaseClient } from '../../infrastructure/persistence/supabase/client';
import { unifiedLogout } from '../../lib/auth/logout';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { CajaStatusBadge } from '../caja/CajaStatusBadge';

export function TopNav() {
  const { toggleMobileMenu, toggleSidebarCollapse, isSidebarCollapsed, setTourOpen, setGuiaBotonesOpen } = useLayoutStore();
  const { tenant } = useTenantStore();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await unifiedLogout();
    router.push('/auth/login');
  };

  return (
    <header className="bg-white/90 dark:bg-slate-950/80 backdrop-blur-md text-slate-900 dark:text-slate-100 font-sans h-14 sm:h-16 sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/10 shadow-sm flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-3 w-full max-w-md">
        <button 
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              toggleMobileMenu();
            } else {
              toggleSidebarCollapse();
            }
          }}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none cursor-pointer"
          title={isSidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          aria-label="Alternar menú lateral"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center w-full focus-within:ring-2 focus-within:ring-brand-salmon rounded-lg overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <Search className="w-5 h-5 ml-3 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <input 
            id="global-search-input"
            name="global_search"
            aria-label="Buscar en la plataforma"
            className="w-full py-2 px-3 border-none focus:ring-0 text-slate-900 dark:text-slate-100 text-sm bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" 
            placeholder="Buscar contratos, equipos o clientes..." 
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        <CajaStatusBadge />
        
        {/* Botón Guía de Botones y Acciones */}
        <button 
          type="button"
          onClick={() => setGuiaBotonesOpen(true)}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 px-3 py-1.5 rounded-lg transition-all border border-amber-200/90 dark:border-amber-700/40 shadow-2xs cursor-pointer active:scale-95"
          title="Ver explicación de qué hace cada botón y acción"
        >
          <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Guía de Botones</span>
        </button>

        <button 
          type="button"
          onClick={() => setTourOpen(true)}
          className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800/40 cursor-pointer"
        >
          <span>Tour</span>
        </button>
        <button className="text-slate-500 dark:text-slate-400 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10">
          <Bell className="w-5 h-5" />
        </button>
        <Link href="/configuracion" className="text-slate-500 dark:text-slate-400 hover:text-brand-salmon transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 ml-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:ring-offset-2 text-slate-600 dark:text-slate-200 font-bold"
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-white/10 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-md">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 mb-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              
              <div className="px-3 py-1">
                <div className="flex items-center gap-3 px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="truncate font-medium">{tenant?.nombreEmpresa || 'Alquileres System'}</span>
                </div>
                <div className="flex items-center gap-3 px-2 py-2 text-xs text-slate-600 dark:text-slate-300">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="capitalize font-medium">{user?.user_metadata?.rol || 'Administrador'}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-white/10 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
