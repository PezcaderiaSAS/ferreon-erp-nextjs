"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: 'dashboard', label: 'Dashboard' },
    { href: '/alquileres', icon: 'calendar_today', label: 'Alquileres' },
    { href: '/bodega', icon: 'inventory_2', label: 'Bodega' },
    { href: '/devoluciones', icon: 'assignment_return', label: 'Devoluciones' },
    { href: '/facturacion', icon: 'receipt_long', label: 'Facturación' },
    { href: '/clientes', icon: 'group', label: 'Clientes' },
    { href: '/configuracion', icon: 'settings', label: 'Configuración' },
  ];

  return (
    <nav className="bg-white text-slate-900 font-sans h-screen w-64 fixed left-0 top-0 border-r border-slate-200 shadow-sm flex flex-col p-4 gap-2 z-50">
      <div className="mb-8 flex items-center px-4 py-2">
        <div className="text-2xl font-bold text-slate-900">
          FerreOn
          <div className="text-xs text-slate-500 font-normal tracking-wide mt-1">ERP System</div>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-grow">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`rounded-lg text-base font-semibold flex items-center gap-4 px-4 py-3 transition-colors duration-200 active:scale-95 ${
                isActive 
                  ? 'bg-brand-salmonLight text-brand-salmonDark' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span 
                className="material-symbols-outlined" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
