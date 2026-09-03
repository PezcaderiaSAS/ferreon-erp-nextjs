import { create, persist, createJSONStorage } from '../../lib/zustand';
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from '../../core/domain/entities/empresa-config';
import { resolveCompanyTheme } from '../../core/domain/theme/theme-tokens';

/**
 * Inyecta los tokens de diseño en el DOM (CSS Variables & data-theme)
 * Compatible con ejecución en cliente (Navegador)
 */
export function applyThemeToDOM(config: EmpresaConfig) {
  if (typeof window === 'undefined' || !document?.documentElement) return;

  const tokens = resolveCompanyTheme(config);
  const root = document.documentElement;

  if (tokens.id === 'custom') {
    root.setAttribute('data-theme', 'custom');
    root.style.setProperty('--brand-base', tokens.base);
    root.style.setProperty('--brand-dark', tokens.dark);
    root.style.setProperty('--brand-light', tokens.light);
    root.style.setProperty('--brand-glow', tokens.glow);
    root.style.setProperty('--shadow-neu-dark', tokens.neuDark);
    root.style.setProperty('--shadow-neu-light', tokens.neuLight);
  } else {
    root.setAttribute('data-theme', tokens.id);
    // Limpiar estilos inline para que prevalezcan las variables de [data-theme="..."]
    root.style.removeProperty('--brand-base');
    root.style.removeProperty('--brand-dark');
    root.style.removeProperty('--brand-light');
    root.style.removeProperty('--brand-glow');
    root.style.removeProperty('--shadow-neu-dark');
    root.style.removeProperty('--shadow-neu-light');
  }
}

interface EmpresaState {
  config: EmpresaConfig;
  actualizarConfig: (nuevaConfig: Partial<EmpresaConfig>) => void;
}

export const useEmpresaStore = create<EmpresaState>()(
  persist(
    (set) => ({
      config: DEFAULT_EMPRESA_CONFIG,
      actualizarConfig: (nuevaConfig) => 
        set((state) => {
          const configActualizada = { ...state.config, ...nuevaConfig };
          applyThemeToDOM(configActualizada);
          return { config: configActualizada };
        }),
    }),
    {
      name: 'ferreon-empresa-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Aplicar el tema inmediatamente en el primer tick de ejecución en cliente
if (typeof window !== 'undefined') {
  try {
    const estadoActual = useEmpresaStore.getState();
    if (estadoActual?.config) {
      applyThemeToDOM(estadoActual.config);
    }
  } catch {
    // Ignorar si el DOM no está listo todavía
  }
}


