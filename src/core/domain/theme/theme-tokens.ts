/**
 * Módulo de Dominio de Tokens Cromáticos y Algoritmo de Derivación HSL
 * Fuente única de verdad (SSOT) para el diseño corporativo de FerreOn ERP (Web UI + PDFs).
 * 
 * 100% Isomórfico (compatible con Server Components, Node.js, Web Workers y React-PDF).
 */

export type ThemePresetId = 'salmon' | 'ocean' | 'teal' | 'slate' | 'indigo' | 'amber' | 'custom';

export interface ThemeTokens {
  id: ThemePresetId;
  name: string;
  light: string;       // Fondos sutiles, badges, hover tenue (ej. #FFDBCF)
  base: string;        // Color primario de marca (ej. #FF8A65)
  dark: string;        // Estados hover activos, bordes destacados (ej. #E76E4A)
  accent: string;      // Color complementario de resalte (ej. #F97316)
  glow: string;        // RGBA para resplandor neon y luz ambiental Glassmorphic
  badgeBg: string;     // Fondo de etiquetas de estado
  badgeText: string;   // Texto accesible de etiquetas
  textOnBase: string;  // Contraste WCAG 2.1 AA sobre color base (#FFFFFF o #0F172A)
  neuLight: string;    // Sombra clara neumórfica
  neuDark: string;     // Sombra oscura neumórfica adaptada
}

export const THEME_PRESETS: Record<Exclude<ThemePresetId, 'custom'>, ThemeTokens> = {
  salmon: {
    id: 'salmon',
    name: 'Salmón Pastel (Default)',
    light: '#FFDBCF',
    base: '#FF8A65',
    dark: '#E76E4A',
    accent: '#F97316',
    glow: 'rgba(255, 138, 101, 0.35)',
    badgeBg: '#FFF7ED',
    badgeText: '#EA580C',
    textOnBase: '#FFFFFF',
    neuLight: '#FFFFFF',
    neuDark: '#D9BABA',
  },
  ocean: {
    id: 'ocean',
    name: 'Azul Océano Corporativo',
    light: '#E0F2FE',
    base: '#38BDF8',
    dark: '#0284C7',
    accent: '#0369A1',
    glow: 'rgba(56, 189, 248, 0.35)',
    badgeBg: '#F0F9FF',
    badgeText: '#0284C7',
    textOnBase: '#0F172A',
    neuLight: '#FFFFFF',
    neuDark: '#BEDAEA',
  },
  teal: {
    id: 'teal',
    name: 'Esmeralda & Teal',
    light: '#CCFBF1',
    base: '#14B8A6',
    dark: '#0F766E',
    accent: '#0D9488',
    glow: 'rgba(20, 184, 166, 0.35)',
    badgeBg: '#F0FDF4',
    badgeText: '#0F766E',
    textOnBase: '#FFFFFF',
    neuLight: '#FFFFFF',
    neuDark: '#B2DFDB',
  },
  slate: {
    id: 'slate',
    name: 'Pizarra Industrial',
    light: '#F1F5F9',
    base: '#94A3B8',
    dark: '#475569',
    accent: '#334155',
    glow: 'rgba(148, 163, 184, 0.35)',
    badgeBg: '#F8FAFC',
    badgeText: '#475569',
    textOnBase: '#FFFFFF',
    neuLight: '#FFFFFF',
    neuDark: '#CCD4DC',
  },
  indigo: {
    id: 'indigo',
    name: 'Índigo Elegante',
    light: '#E0E7FF',
    base: '#6366F1',
    dark: '#4338CA',
    accent: '#4F46E5',
    glow: 'rgba(99, 102, 241, 0.35)',
    badgeBg: '#EEF2FF',
    badgeText: '#4338CA',
    textOnBase: '#FFFFFF',
    neuLight: '#FFFFFF',
    neuDark: '#C7D2FE',
  },
  amber: {
    id: 'amber',
    name: 'Ámbar Maquinaria',
    light: '#FEF3C7',
    base: '#F59E0B',
    dark: '#D97706',
    accent: '#B45309',
    glow: 'rgba(245, 158, 11, 0.35)',
    badgeBg: '#FFFBEB',
    badgeText: '#B45309',
    textOnBase: '#0F172A',
    neuLight: '#FFFFFF',
    neuDark: '#FDE68A',
  },
};

/**
 * Expresión regular para validar formato Hexadecimal (#RGB o #RRGGBB)
 */
export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHex(hex?: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return HEX_COLOR_REGEX.test(hex.trim());
}

/**
 * Convierte color HEX a componentes RGB numéricos
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convierte RGB (0-255) a espacio de color HSL (h: 0-360, s: 0-100, l: 0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convierte HSL a código HEX (#RRGGBB)
 */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Deriva algorítmicamente una paleta armónica completa a partir de un código HEX libre
 */
export function deriveThemeFromHex(hex: string): ThemeTokens {
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
  if (!isValidHex(normalizedHex)) {
    return THEME_PRESETS.salmon;
  }

  const rgb = hexToRgb(normalizedHex);
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // 1. Derivación de tonos con límites armónicos
  const baseHex = normalizedHex.toUpperCase();
  const darkHex = hslToHex(h, Math.min(s + 5, 100), Math.max(l - 18, 15));
  const lightHex = hslToHex(h, Math.max(s - 15, 15), Math.min(94, Math.max(l + 35, 88)));
  const accentHex = hslToHex((h + 20) % 360, Math.min(s + 10, 100), Math.max(l - 5, 20));

  // 2. Luz ambiental Glassmorphism (RGBA con opacidad al 35%)
  const glow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;

  // 3. Sombras Neumórficas adaptadas al matiz
  const neuDark = hslToHex(h, Math.max(s - 25, 10), Math.min(l - 12, 80));
  const neuLight = '#FFFFFF';

  // 4. Cálculo de Luminancia Relativa (WCAG 2.1 Formula para contraste de texto)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const textOnBase = luminance > 0.58 ? '#0F172A' : '#FFFFFF';

  return {
    id: 'custom',
    name: `Personalizado (${baseHex})`,
    base: baseHex,
    dark: darkHex,
    light: lightHex,
    accent: accentHex,
    glow,
    badgeBg: lightHex,
    badgeText: darkHex,
    textOnBase,
    neuLight,
    neuDark,
  };
}

/**
 * Resuelve los tokens definitivos para una empresa con soporte retrocompatible para esquemas legados
 */
export function resolveCompanyTheme(config?: {
  themeId?: ThemePresetId | string;
  customBrandHex?: string;
  paletaPDF?: string;
  themeApp?: string;
}): ThemeTokens {
  if (!config) return THEME_PRESETS.salmon;

  // 1. Si está explícitamente en modo custom y el HEX es válido
  if (config.themeId === 'custom' && config.customBrandHex && isValidHex(config.customBrandHex)) {
    return deriveThemeFromHex(config.customBrandHex);
  }

  // 2. Si tiene un themeId de preset conocido
  const targetId = (config.themeId || config.themeApp || '').toLowerCase();
  if (targetId in THEME_PRESETS) {
    return THEME_PRESETS[targetId as keyof typeof THEME_PRESETS];
  }

  // 3. Mapeo de retrocompatibilidad con paletaPDF legacy
  if (config.paletaPDF === 'TEAL') return THEME_PRESETS.teal;
  if (config.paletaPDF === 'AZUL') return THEME_PRESETS.ocean;
  if (config.paletaPDF === 'SALMON') return THEME_PRESETS.salmon;

  // Fallback por defecto
  return THEME_PRESETS.salmon;
}
