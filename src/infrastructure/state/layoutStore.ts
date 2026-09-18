import { create } from 'zustand';

interface LayoutState {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (isCollapsed: boolean) => void;
  isTourOpen: boolean;
  setTourOpen: (isOpen: boolean) => void;
  isGuiaBotonesOpen: boolean;
  setGuiaBotonesOpen: (isOpen: boolean) => void;
}

const STORAGE_KEY = 'ferreon-sidebar-collapsed';

export const useLayoutStore = create<LayoutState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  
  // Por defecto false (expandido); si existe en localStorage se lee de forma segura
  isSidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) === 'true' : false,
  toggleSidebarCollapse: () => set((state) => {
    const nextVal = !state.isSidebarCollapsed;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, String(nextVal));
      } catch {
        // Ignorar fallos de almacenamiento en navegadores con cuotas bloqueadas
      }
    }
    return { isSidebarCollapsed: nextVal };
  }),
  setSidebarCollapsed: (isCollapsed) => set(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
      } catch {}
    }
    return { isSidebarCollapsed: isCollapsed };
  }),

  isTourOpen: false,
  setTourOpen: (isOpen) => set({ isTourOpen: isOpen }),

  isGuiaBotonesOpen: false,
  setGuiaBotonesOpen: (isOpen) => set({ isGuiaBotonesOpen: isOpen }),
}));
