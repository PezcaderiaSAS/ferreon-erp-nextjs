import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '../../src/infrastructure/state/layoutStore';

describe('LayoutStore - Estado de Navegación y Mini-Sidebar', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      isMobileMenuOpen: false,
      isSidebarCollapsed: false,
      isTourOpen: false,
      isGuiaBotonesOpen: false,
    });
  });

  it('debe iniciar con el sidebar expandido (isSidebarCollapsed = false) por defecto', () => {
    const { isSidebarCollapsed } = useLayoutStore.getState();
    expect(isSidebarCollapsed).toBe(false);
  });

  it('toggleSidebarCollapse debe alternar el estado de colapso', () => {
    useLayoutStore.getState().toggleSidebarCollapse();
    expect(useLayoutStore.getState().isSidebarCollapsed).toBe(true);

    useLayoutStore.getState().toggleSidebarCollapse();
    expect(useLayoutStore.getState().isSidebarCollapsed).toBe(false);
  });

  it('setSidebarCollapsed debe forzar el estado deseado', () => {
    useLayoutStore.getState().setSidebarCollapsed(true);
    expect(useLayoutStore.getState().isSidebarCollapsed).toBe(true);

    useLayoutStore.getState().setSidebarCollapsed(false);
    expect(useLayoutStore.getState().isSidebarCollapsed).toBe(false);
  });

  it('setGuiaBotonesOpen debe abrir y cerrar el modal de guía de botones', () => {
    expect(useLayoutStore.getState().isGuiaBotonesOpen).toBe(false);
    useLayoutStore.getState().setGuiaBotonesOpen(true);
    expect(useLayoutStore.getState().isGuiaBotonesOpen).toBe(true);
    useLayoutStore.getState().setGuiaBotonesOpen(false);
    expect(useLayoutStore.getState().isGuiaBotonesOpen).toBe(false);
  });

  it('toggleMobileMenu debe alternar el menú móvil', () => {
    useLayoutStore.getState().toggleMobileMenu();
    expect(useLayoutStore.getState().isMobileMenuOpen).toBe(true);
    useLayoutStore.getState().toggleMobileMenu();
    expect(useLayoutStore.getState().isMobileMenuOpen).toBe(false);
  });
});
