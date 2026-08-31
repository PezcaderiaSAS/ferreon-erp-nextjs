"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Package, ArrowLeftRight, FileText, Users, X } from 'lucide-react';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';

export function Sidebar() {
  const pathname = usePathname();
  const { config } = useEmpresaStore();
  const { isMobileMenuOpen, setMobileMenuOpen } = useLayoutStore();

  const links = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/alquileres', icon: CalendarDays, label: 'Alquileres' },
    { href: '/bodega', icon: Package, label: 'Bodega' },
    { href: '/devoluciones', icon: ArrowLeftRight, label: 'Devoluciones' },
    { href: '/facturacion', icon: FileText, label: 'Facturación' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
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
        className={`bg-white text-slate-900 font-sans h-[100dvh] w-64 fixed left-0 top-0 border-r border-slate-200 shadow-sm flex flex-col p-4 gap-2 z-50 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="mb-8 flex items-center justify-between px-4 py-2 gap-3 relative">
          {config.logoBase64 ? (
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
              {config.razonSocial ? config.razonSocial.split(' ')[0] : 'Alquileres'}
              <div className="text-xs text-slate-500 font-normal tracking-wide mt-1 truncate">
                {config.razonSocial ? config.razonSocial.split(' ').slice(1).join(' ') : 'ERP System'}
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
            return (
              <Link 
                key={link.href}
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
      </nav>
    </>
  );
}
