"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '../ui/Sidebar';
import { TopNav } from '../ui/TopNav';
import { useEmpresaStore, applyThemeToDOM } from '../../infrastructure/state/empresaStore';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Componente envolvente principal de la interfaz de usuario.
 * Gestiona de forma reactiva el layout según la ruta activa:
 * - En rutas administrativas: Renderiza el Sidebar, TopNav y el área con margen md:ml-64.
 * - En /design-system o /auth: Desacopla la navegación y provee un lienzo Full-Screen (100% viewport).
 * - Aplica y propaga de forma centralizada la Tríada de Diseño Institucional (data-theme).
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const config = useEmpresaStore((state) => state.config);
  const activeTheme = config?.temaColor || 'salmon-pastel';

  // Sincronizar reactivamente el DOM en el montaje e hidratación inicial
  useEffect(() => {
    if (config) {
      applyThemeToDOM(config);
    }
  }, [config]);

  const isStandaloneRoute = pathname?.startsWith('/design-system') || pathname?.startsWith('/auth');

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
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64 w-full overflow-hidden">
        <TopNav />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden safe-area-pb">
          {children}
        </main>
      </div>
    </div>
  );
}
