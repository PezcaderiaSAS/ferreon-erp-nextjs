"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../ui/Sidebar';
import { TopNav } from '../ui/TopNav';
import { useEmpresaStore, applyThemeToDOM } from '../../infrastructure/state/empresaStore';
import { useLayoutStore } from '../../infrastructure/state/layoutStore';
import { useTenantStore } from '../../infrastructure/state/tenantStore';
import { ShieldAlert } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Componente envolvente principal de la interfaz de usuario.
 * Gestiona de forma reactiva el layout según la ruta activa:
 * - En rutas administrativas: Renderiza el Sidebar, TopNav y el área con margen dinámico (md:ml-16 compacto vs md:ml-64 expandido).
 * - En /design-system o /auth: Desacopla la navegación y provee un lienzo Full-Screen (100% viewport).
 * - Aplica y propaga de forma centralizada la Tríada de Diseño Institucional (data-theme).
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const config = useEmpresaStore((state) => state.config);
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);
  const { tenant } = useTenantStore();
  const activeTheme = config?.temaColor || 'salmon-pastel';

  // Sincronizar reactivamente el DOM en el montaje e hidratación inicial
  useEffect(() => {
    if (config) {
      applyThemeToDOM(config);
    }
  }, [config]);

  const isStandaloneRoute = pathname === '/' || pathname?.startsWith('/design-system') || pathname?.startsWith('/auth');

  if (isStandaloneRoute) {
    return (
      <div data-theme={activeTheme} className="flex-1 w-full min-h-screen flex flex-col transition-colors duration-150">
        {children}
      </div>
    );
  }

  return (
    <div data-theme={activeTheme} className="flex-1 flex w-full min-h-screen transition-colors duration-150">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      } w-full overflow-hidden`}>
        {tenant?.isAutorizado === false && (
          <div className="bg-amber-100 text-amber-800 text-sm font-semibold text-center px-4 py-2 flex items-center justify-center gap-2 border-b border-amber-200 z-50">
            <ShieldAlert className="w-5 h-5" />
            <span>Modo Prueba — Esperando Activación Oficial. Tus datos son de demostración y no afectarán producción real.</span>
          </div>
        )}
        <TopNav />
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-y-auto overflow-x-hidden safe-area-pb custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
