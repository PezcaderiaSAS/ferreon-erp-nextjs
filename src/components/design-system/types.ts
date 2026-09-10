import React from 'react';

/**
 * Identificadores canónicos de los 6 arquetipos visuales soportados.
 */
export type ThemePresetId = 
  | 'ferreon-glass' 
  | 'corporate' 
  | 'neumorphic' 
  | 'material-you' 
  | 'flat' 
  | 'minimalist';

/**
 * Metadatos descriptivos y de gobernanza de cada arquetipo de diseño.
 */
export interface ThemePresetMeta {
  id: ThemePresetId;
  name: string;
  tagline: string;
  archetype: 'Dark Glassmorphism' | 'Enterprise SaaS' | 'Soft UI' | 'Material Design 3' | 'Poster Flat' | 'Modern Minimalist';
  fontDisplay: string;
  fontBody: string;
  radiusLabel: string;
  shadowDescription: string;
  accentColorHex: string;
  characteristics: string[];
}

/**
 * Catálogo canónico con la especificación de los 6 arquetipos de diseño.
 */
export const THEME_PRESETS_CATALOG: ThemePresetMeta[] = [
  {
    id: 'ferreon-glass',
    name: 'FerreOn Dark Glass',
    tagline: 'Identidad Corporativa Industrial y Frío Polar',
    archetype: 'Dark Glassmorphism',
    fontDisplay: 'Outfit',
    fontBody: 'Inter',
    radiusLabel: '12px (rounded-xl)',
    shadowDescription: 'Backdrop blur 16px, bordes translúcidos 12% y resplandor cian neón',
    accentColorHex: '#06b6d4',
    characteristics: ['Fondo Slate 950', 'Efecto Cristal Translúcido', 'Resplandor Neón Cian', 'Micro-animaciones GPU'],
  },
  {
    id: 'corporate',
    name: 'Corporate Trust',
    tagline: 'Enterprise SaaS de Alta Confianza & Calidez',
    archetype: 'Enterprise SaaS',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'Plus Jakarta Sans',
    radiusLabel: '12px (rounded-xl)',
    shadowDescription: 'Sombras azul-púrpura tintadas rgba(79, 70, 229, 0.12)',
    accentColorHex: '#4f46e5',
    characteristics: ['Paleta Índigo a Violeta', 'Sombras Coloreadas', 'Perspectiva Isométrica', 'Elevación Suave'],
  },
  {
    id: 'neumorphic',
    name: 'Neumorphism Soft UI',
    tagline: 'Monocromático Táctil de Relieve Físico',
    archetype: 'Soft UI',
    fontDisplay: 'Plus Jakarta Sans',
    fontBody: 'Inter',
    radiusLabel: '32px (rounded-[32px])',
    shadowDescription: 'Sombras duales opuestas RGBA (luz superior izquierda, sombra inferior derecha)',
    accentColorHex: '#6c63ff',
    characteristics: ['Gris Frío #E0E5EC', 'Pozos Inset Deep', 'Extrusión Táctil', 'Contraste AAA 7.5:1'],
  },
  {
    id: 'material-you',
    name: 'Material You (MD3)',
    tagline: 'Superficies Tonales Expresivas & Orgánicas',
    archetype: 'Material Design 3',
    fontDisplay: 'Roboto',
    fontBody: 'Roboto',
    radiusLabel: 'Píldoras 9999px / Cards 24px',
    shadowDescription: 'Elevación progresiva de baja dispersión y capas de estado por opacidad',
    accentColorHex: '#6750a4',
    characteristics: ['Paleta Tonal Seed Purple', 'Botones Píldora (rounded-full)', 'Capas de Estado /90 y /10', 'Active Scale-95'],
  },
  {
    id: 'flat',
    name: 'Flat Design Poster',
    tagline: 'Reducción Gráfica Bold & Cero Profundidad Artificial',
    archetype: 'Poster Flat',
    fontDisplay: 'Outfit',
    fontBody: 'Inter',
    radiusLabel: '8px (rounded-lg)',
    shadowDescription: 'Cero sombras (shadow-none) y bordes sólidos de alto contraste',
    accentColorHex: '#3b82f6',
    characteristics: ['Bloques de Color Puros', 'Bordes Sólidos 2px', 'Hover Scale 105%', 'Sin Gradientes en Botones'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist Modern',
    tagline: 'Claridad en Estructura, Carácter en el Detalle Bold',
    archetype: 'Modern Minimalist',
    fontDisplay: 'Calistoga (Serif)',
    fontBody: 'Inter',
    radiusLabel: '12px (rounded-xl)',
    shadowDescription: 'Sombras sutiles con realce eléctrico y textura de puntos invertida',
    accentColorHex: '#0052ff',
    characteristics: ['Gradiente Azul Eléctrico', 'Tipografía Dual Serif/Sans', 'Secciones Invertidas Slate', 'Indicadores Pulsantes'],
  },
];

/**
 * Propiedades del contenedor que inyecta el arquetipo de diseño.
 */
export interface PresetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  preset: ThemePresetId;
  children: React.ReactNode;
  isIsolated?: boolean;
}

/**
 * Propiedades del componente PresetButton.
 */
export interface PresetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Propiedades del componente PresetCard.
 */
export interface PresetCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  badge?: string;
  interactive?: boolean;
  headerAction?: React.ReactNode;
}

/**
 * Propiedades del componente PresetInput.
 */
export interface PresetInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

/**
 * Propiedades del componente PresetBadge.
 */
export interface PresetBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'accent' | 'neutral';
  pulsing?: boolean;
}

/**
 * Propiedades del componente de negocio PresetMetricWidget.
 */
export interface PresetMetricWidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  secondaryInfo?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  moduleContext: 'rentals' | 'billing' | 'inventory' | 'weighing';
  className?: string;
}

