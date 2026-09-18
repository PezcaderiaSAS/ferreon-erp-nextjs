"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CalendarDays, FileSpreadsheet, Package, ShoppingBag, Handshake, ArrowLeftRight, FileText, Users, CreditCard, Sparkles, X, LogOut, Palette, Wallet, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmpresaStore, applyThemeToDOM } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { useTenantStore } from '../../infrastructure/state/tenantStore';

import { supabaseClient } from '../../infrastructure/persistence/supabase/client';
import { unifiedLogout } from '../../lib/auth/logout';
import { useEffect, useState, Suspense } from 'react';

import { ModuloKey, moduloEstaHabilitado } from '@/core/services/licencias-modulos.service';

interface SidebarLinkItem {
  href: string;
  icon: any;
  label: string;
  modulo?: ModuloKey;
  requireUltraAdmin?: boolean;
}

const SIDEBAR_LINKS: SidebarLinkItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/alquileres', icon: CalendarDays, label: 'Alquileres & Cotizaciones', modulo: 'ALQUILERES' },
  { href: '/bodega', icon: Package, label: 'Bodega', modulo: 'BODEGA' },
  { href: '/compras', icon: ShoppingBag, label: 'Compras', modulo: 'COMPRAS' },
  { href: '/subcontrataciones', icon: Handshake, label: 'Subcontratación', modulo: 'SUBCONTRATACIONES' },
  { href: '/devoluciones', icon: ArrowLeftRight, label: 'Devoluciones', modulo: 'DEVOLUCIONES' },
  { href: '/facturacion', icon: FileText, label: 'Facturación', modulo: 'FACTURACION' },
  { href: '/caja', icon: Wallet, label: 'Caja & POS', modulo: 'CAJA' },
  { href: '/clientes', icon: Users, label: 'Clientes' },
  { href: '/suscripcion', icon: CreditCard, label: 'Suscripción' },
  { href: '/admin/empresas', icon: ShieldCheck, label: 'Gobernanza UltraAdmin', requireUltraAdmin: true },
];

interface SidebarNavLinksProps {
  pathname: string;
  setMobileMenuOpen: (open: boolean) => void;
  isUltraAdmin: boolean;
  modulosActivos?: Record<string, boolean> | null;
  isSidebarCollapsed?: boolean;
}

function SidebarNavLinks({ 
  pathname, 
  setMobileMenuOpen,
  isUltraAdmin,
  modulosActivos,
  isSidebarCollapsed = false,
}: SidebarNavLinksProps) {
  const visibleLinks = SIDEBAR_LINKS.filter((link) => {
    // Si requiere UltraAdmin, solo mostrar si el usuario tiene ese rol
    if (link.requireUltraAdmin) {
      return isUltraAdmin;
    }

    // UltraAdmin ve todos los módulos para auditoría
    if (isUltraAdmin) {
      return true;
    }

    // Si tiene un módulo asociado y la empresa tiene configuración de módulos
    if (link.modulo && modulosActivos) {
      return moduloEstaHabilitado(modulosActivos, link.modulo);
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-1.5 flex-grow overflow-y-auto">
      {visibleLinks.map((link) => {
        const isActive = link.href === '/alquileres' 
          ? pathname.startsWith('/alquileres') 
          : pathname === link.href;

        const Icon = link.icon;
        
        let tourId = undefined;
        if (link.href === '/bodega') tourId = 'tour-bodega';
        if (link.href === '/facturacion') tourId = 'tour-facturacion';

        return (
          <Link 
            key={link.href}
            id={tourId}
            href={link.href}
            title={isSidebarCollapsed ? link.label : undefined}
            onClick={() => setMobileMenuOpen(false)}
            className={`rounded-xl text-sm font-bold flex items-center transition-all duration-200 active:scale-95 group relative ${
              isSidebarCollapsed 
                ? 'justify-center p-3' 
                : 'gap-3.5 px-3.5 py-2.5'
            } ${
              isActive 
                ? 'bg-brand-salmonLight text-brand-salmonDark shadow-2xs' 
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            
            {!isSidebarCollapsed && (
              <span className="truncate">{link.label}</span>
            )}

            {/* Tooltip flotante al estar colapsado */}
            {isSidebarCollapsed && (
              <span className="absolute left-full ml-3.5 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden md:block">
                {link.label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { config, actualizarConfig } = useEmpresaStore();
  const { isMobileMenuOpen, setMobileMenuOpen, isSidebarCollapsed, toggleSidebarCollapse } = useLayoutStore();
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

  // Sincronizar el tema con el DOM
  useEffect(() => {
    if (mounted && config) {
      applyThemeToDOM(config);
    }
  }, [config, mounted]);

  const handleLogout = async () => {
    await unifiedLogout();
    router.push('/auth/login');
  };

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
        className={`bg-white text-slate-900 font-sans h-[100dvh] fixed left-0 top-0 border-r border-slate-200 shadow-sm flex flex-col gap-2 z-50 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0 w-64 p-4' : '-translate-x-full'
        } md:translate-x-0 ${isSidebarCollapsed ? 'md:w-16 md:p-2' : 'md:w-64 md:p-4'}`}
      >
        {/* Header con Logo / Isotipo */}
        <div className={`mb-6 flex items-center justify-between relative ${isSidebarCollapsed ? 'px-1 py-1' : 'px-4 py-2 gap-3'}`}>
          {isSidebarCollapsed ? (
            <button
              onClick={toggleSidebarCollapse}
              className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-tr from-brand-salmon to-amber-500 flex items-center justify-center text-white font-black text-base shadow-sm hover:scale-105 transition-transform cursor-pointer"
              title="Expandir menú lateral"
              aria-label="Expandir menú lateral"
            >
              {mounted && config.razonSocial ? config.razonSocial.charAt(0).toUpperCase() : 'F'}
            </button>
          ) : mounted && config.logoBase64 ? (
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
            className="md:hidden text-slate-500 hover:text-slate-900 focus:outline-none cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navegación Modular */}
        <Suspense fallback={
          <div className="flex flex-col gap-2 flex-grow overflow-y-auto">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <div key={link.href} className="rounded-lg text-base font-semibold flex items-center gap-4 px-4 py-3 text-slate-400">
                  <Icon className="w-5 h-5 stroke-2" />
                  {!isSidebarCollapsed && link.label}
                </div>
              );
            })}
          </div>
        }>
          <SidebarNavLinks 
            pathname={pathname} 
            setMobileMenuOpen={setMobileMenuOpen} 
            isUltraAdmin={
              user?.user_metadata?.rol === 'ULTRAADMIN' || 
              user?.user_metadata?.rol === 'SUPERADMIN' ||
              user?.user_metadata?.rol === 'ultraadmin' ||
              user?.user_metadata?.rol === 'superadmin'
            }
            modulosActivos={(config as any)?.modulos_activos}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        </Suspense>

        {/* Badge de Suscripción / Tenant Activo al Pie */}
        <div className="pt-2 border-t border-slate-100 mt-auto">
          {isSidebarCollapsed ? (
            <Link 
              href="/suscripcion"
              title={tenant?.subscriptionStatus === 'active' ? 'Suscripción Activa (Pro)' : 'Modo Prueba Activo'}
              className="w-10 h-10 mx-auto rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center transition-colors group relative"
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[11px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden md:block">
                Suscripción
              </span>
            </Link>
          ) : (
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
          )}
        </div>

        {/* User Info / Logout Section */}
        <div className="pt-2 pb-1 border-t border-slate-100">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0"
                title={user?.email || 'Usuario'}
              >
                {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
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
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Theme Switcher Rápido (Sólo para Admins cuando está expandido) */}
          {!isSidebarCollapsed && mounted && user && (user.user_metadata?.rol === 'admin' || user.user_metadata?.rol === 'superadmin' || !user.user_metadata?.rol) && (
            <div className="mt-2 px-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Palette className="w-3 h-3 text-slate-400" />
                Tema UI (Admin)
              </label>
              <select
                className="w-full text-xs p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-salmon cursor-pointer"
                value={config.themeId || config.themeApp || 'salmon'}
                onChange={(e) => actualizarConfig({ themeId: e.target.value as any, themeApp: e.target.value as any })}
              >
                <option value="salmon">Salmón Pastel (Default)</option>
                <option value="ocean">Azul Océano Corporativo</option>
                <option value="teal">Esmeralda & Teal</option>
                <option value="slate">Pizarra Industrial</option>
                <option value="indigo">Índigo Elegante</option>
                <option value="amber">Ámbar Maquinaria</option>
                {config.themeId === 'custom' && (
                  <option value="custom">Personalizado ({config.customBrandHex || 'HEX'})</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* Botón Inferior para Contraer / Expandir Sidebar en Escritorio */}
        <div className="hidden md:flex items-center justify-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="w-full flex items-center justify-center gap-2 py-2 px-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer"
            title={isSidebarCollapsed ? "Expandir menú lateral (256px)" : "Contraer a modo compacto de iconos (64px)"}
            aria-label={isSidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 text-slate-500" />
                <span>Contraer Menú</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
