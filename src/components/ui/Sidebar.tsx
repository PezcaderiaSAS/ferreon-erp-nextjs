"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Package, ArrowLeftRight, FileText, Users, CreditCard, Sparkles, X, LogOut } from 'lucide-react';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { useTenantStore } from '../../infrastructure/state/tenantStore';
import { supabaseClient } from '../../infrastructure/persistence/supabase/client';
import { unifiedLogout } from '../../lib/auth/logout';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { config, actualizarConfig } = useEmpresaStore();
  const { isMobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
  const { tenant } = useTenantStore();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    supabaseClient.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Sincronizar el tema con el DOM (inyectar data-theme en el <html>)
  useEffect(() => {
    if (mounted && config.themeApp) {
      document.documentElement.setAttribute('data-theme', config.themeApp);
    } else if (mounted) {
      document.documentElement.removeAttribute('data-theme'); // default es salmon
    }
  }, [config.themeApp, mounted]);

  const handleLogout = async () => {
    await unifiedLogout();
    router.push('/auth/login');
  };

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/alquileres', icon: CalendarDays, label: 'Alquileres' },
    { href: '/bodega', icon: Package, label: 'Bodega' },
    { href: '/devoluciones', icon: ArrowLeftRight, label: 'Devoluciones' },
    { href: '/facturacion', icon: FileText, label: 'Facturación' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/suscripcion', icon: CreditCard, label: 'Suscripción' },
  ];

  return (
    <>
      {/* Backdrop para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav 
        id="tour-sidebar"
        className={`bg-white text-slate-900 font-sans h-[100dvh] w-64 fixed left-0 top-0 border-r border-slate-200 shadow-sm flex flex-col p-4 gap-2 z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="mb-8 flex items-center justify-between px-4 py-2 gap-3 relative">
          {mounted && config.logoBase64 ? (
            <div className="relative h-10 w-[140px]">
              <img 
                src={config.logoBase64} 
                alt="Logo Empresa" 
                loading="lazy"
                className="object-contain h-full w-full"
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-slate-900 leading-none truncate">
              {mounted && config.razonSocial ? config.razonSocial.split(' ')[0] : 'Alquileres'}
              <div className="text-xs text-slate-500 font-normal tracking-wide mt-1 truncate">
                {mounted && config.razonSocial ? config.razonSocial.split(' ').slice(1).join(' ') : 'ERP System'}
              </div>
            </div>
          )}
          {/* Botón Cerrar visible sólo en móviles */}
          <button 
            className="md:hidden text-slate-500 hover:text-slate-900 focus:outline-none"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            // Asignar IDs para el Tour Interactivo
            let tourId = undefined;
            if (link.href === '/bodega') tourId = 'tour-bodega';
            if (link.href === '/facturacion') tourId = 'tour-facturacion';

            return (
              <Link 
                key={link.href}
                id={tourId}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`rounded-lg text-base font-semibold flex items-center gap-4 px-4 py-3 transition-colors duration-200 active:scale-95 ${
                  isActive 
                    ? 'bg-brand-salmonLight text-brand-salmonDark' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Badge de Suscripción / Tenant Activo al Pie */}
        <div className="pt-3 border-t border-slate-100 mt-auto">
          <Link 
            href="/suscripcion"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span className="truncate max-w-[120px]">{mounted && tenant?.nombreEmpresa ? tenant.nombreEmpresa : 'FerreOn SaaS'}</span>
              {mounted && tenant?.subscriptionStatus === 'active' ? (
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px]">Pro</span>
              ) : (
                <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 rounded text-[10px]">Trial</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              {tenant?.subscriptionStatus === 'active' 
                ? 'Suscripción Activa' 
                : `${tenant?.daysLeftInTrial ?? 14} días de prueba`}
            </p>
          </Link>
        </div>

        {/* User Info / Logout Section */}
        <div className="pt-3 pb-1 border-t border-slate-100 mt-1">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-slate-800 truncate">
                  {user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="text-xs text-slate-500 truncate capitalize">
                  {user?.user_metadata?.rol || 'Administrador'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {/* Theme Switcher Temporal (Sólo para Admins) */}
          {mounted && user && (user.user_metadata?.rol === 'admin' || user.user_metadata?.rol === 'superadmin' || !user.user_metadata?.rol) && (
            <div className="mt-3 px-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tema UI (Admin)</label>
              <select
                className="w-full text-xs p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-salmon"
                value={config.themeApp || 'salmon'}
                onChange={(e) => actualizarConfig({ themeApp: e.target.value as any })}
              >
                <option value="salmon">Salmón Pastel (Default)</option>
                <option value="ocean">Océano (Azul Claro)</option>
                <option value="slate">Pizarra (Gris/Plata)</option>
              </select>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
