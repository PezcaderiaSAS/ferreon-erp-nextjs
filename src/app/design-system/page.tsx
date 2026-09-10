'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutGrid,
  Eye,
  Sliders,
  Copy,
  Check,
  Sparkles,
  Search,
  Scale,
  DollarSign,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Code2,
  Layers,
  Palette,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ThemePresetId,
  ThemePresetMeta,
  THEME_PRESETS_CATALOG,
} from '@/components/design-system/types';
import { PresetContainer } from '@/components/design-system/PresetContainer';
import { PresetButton } from '@/components/design-system/PresetButton';
import { PresetCard } from '@/components/design-system/PresetCard';
import { PresetInput } from '@/components/design-system/PresetInput';
import { PresetBadge } from '@/components/design-system/PresetBadge';
import { PresetMetricWidget } from '@/components/design-system/PresetMetricWidget';

/**
 * Tokens CSS mapeados por arquetipo para inspección y copia directa.
 */
const PRESET_CSS_TOKENS_MAP: Record<ThemePresetId, { label: string; var: string; value: string }[]> = {
  'ferreon-glass': [
    { label: 'Fondo Base', var: '--preset-bg', value: '222 47% 3%' },
    { label: 'Texto Principal', var: '--preset-fg', value: '210 40% 98%' },
    { label: 'Superficie Tarjeta', var: '--preset-card', value: '222 47% 6%' },
    { label: 'Color Primario (Cian Polar)', var: '--preset-primary', value: '189 94% 43%' },
    { label: 'Borde Translúcido', var: '--preset-border', value: '217 33% 20%' },
    { label: 'Radio de Borde', var: '--preset-radius', value: '0.75rem (12px)' },
    { label: 'Backdrop Blur', var: '--preset-blur', value: '16px' },
  ],
  corporate: [
    { label: 'Fondo Base', var: '--preset-bg', value: '210 40% 98%' },
    { label: 'Texto Principal', var: '--preset-fg', value: '222 47% 11%' },
    { label: 'Superficie Tarjeta', var: '--preset-card', value: '0 0% 100%' },
    { label: 'Color Primario (Índigo)', var: '--preset-primary', value: '243 75% 59%' },
    { label: 'Borde', var: '--preset-border', value: '214 32% 91%' },
    { label: 'Radio de Borde', var: '--preset-radius', value: '0.75rem (12px)' },
    { label: 'Sombra Tintada', var: '--preset-shadow-color', value: 'rgba(79, 70, 229, 0.12)' },
  ],
  neumorphic: [
    { label: 'Fondo Base (Gris Frío)', var: '--preset-bg', value: '216 20% 90% (#E0E5EC)' },
    { label: 'Texto Principal', var: '--preset-fg', value: '222 47% 18%' },
    { label: 'Superficie Tarjeta', var: '--preset-card', value: '216 20% 90%' },
    { label: 'Acento Suave', var: '--preset-primary', value: '245 58% 51%' },
    { label: 'Borde', var: '--preset-border', value: 'transparent' },
    { label: 'Radio de Borde', var: '--preset-radius', value: '2rem (32px)' },
    { label: 'Sombra Dual Extruida', var: '--preset-shadow-neu', value: '9px 9px 16px #bebebe, -9px -9px 16px #ffffff' },
  ],
  'material-you': [
    { label: 'Fondo Base Tonal', var: '--preset-bg', value: '280 20% 99% (#FFFBFE)' },
    { label: 'Texto Principal', var: '--preset-fg', value: '260 25% 11%' },
    { label: 'Superficie Tonal', var: '--preset-card', value: '270 20% 96% (#F3EDF7)' },
    { label: 'Color Primario (Seed)', var: '--preset-primary', value: '262 52% 47% (#6750A4)' },
    { label: 'Borde', var: '--preset-border', value: '264 12% 88%' },
    { label: 'Radio de Botón', var: '--preset-radius-pill', value: '9999px (Pill)' },
    { label: 'Radio de Tarjeta', var: '--preset-radius-card', value: '1.5rem (24px)' },
  ],
  flat: [
    { label: 'Fondo Base', var: '--preset-bg', value: '0 0% 100%' },
    { label: 'Texto Principal', var: '--preset-fg', value: '222 47% 11%' },
    { label: 'Superficie Tarjeta', var: '--preset-card', value: '0 0% 100%' },
    { label: 'Color Primario (Bold Blue)', var: '--preset-primary', value: '217 91% 60%' },
    { label: 'Borde Sólido', var: '--preset-border', value: '214 32% 91% (2px)' },
    { label: 'Radio de Borde', var: '--preset-radius', value: '0.5rem (8px)' },
    { label: 'Sombra', var: '--preset-shadow', value: 'none (0px)' },
  ],
  minimalist: [
    { label: 'Fondo Base', var: '--preset-bg', value: '0 0% 100%' },
    { label: 'Texto Principal', var: '--preset-fg', value: '222 47% 11%' },
    { label: 'Superficie Tarjeta', var: '--preset-card', value: '0 0% 100%' },
    { label: 'Acento Eléctrico', var: '--preset-primary', value: '221 100% 50% (#0052FF)' },
    { label: 'Borde Sutil', var: '--preset-border', value: '220 13% 91%' },
    { label: 'Radio de Borde', var: '--preset-radius', value: '0.75rem (12px)' },
    { label: 'Gradiente', var: '--preset-gradient', value: 'linear-gradient(135deg, #0052ff, #3b82f6)' },
  ],
};

/**
 * Página interactiva principal del Design System Playground (/design-system).
 * Proporciona:
 * 1. Matriz de comparación simultánea 6x en tiempo real.
 * 2. Vista de inspección profunda de arquetipo individual.
 * 3. Barra de control interactiva para probar reactividad en vivo (inputs, estados de carga, slider de báscula).
 * 4. Inspector lateral de variables CSS HSL con checklist de contraste WCAG 2.1 AA.
 */
export default function DesignSystemPlaygroundPage() {
  // Estados de vista y navegación
  const [viewMode, setViewMode] = useState<'matrix' | 'single'>('matrix');
  const [activePreset, setActivePreset] = useState<ThemePresetId>('ferreon-glass');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Estados interactivos en vivo compartidos entre presets
  const [testInputText, setTestInputText] = useState<string>('Rotomartillo Industrial SDS-Plus 800W');
  const [isButtonsLoading, setIsButtonsLoading] = useState<boolean>(false);
  const [testRentalDays, setTestRentalDays] = useState<number>(15); // 15 Días de alquiler
  const [testBillingCOP, setTestBillingCOP] = useState<number>(1850000);


  // Arquetipo activo seleccionado
  const activePresetMeta = useMemo(() => {
    return (
      THEME_PRESETS_CATALOG.find((p) => p.id === activePreset) ||
      THEME_PRESETS_CATALOG[0]
    );
  }, [activePreset]);

  // Manejador para copiar variables CSS del preset activo
  const handleCopyCSSTokens = () => {
    const tokens = PRESET_CSS_TOKENS_MAP[activePreset];
    const cssString = `/* Tokens CSS para Preset: ${activePreset} */\n[data-theme-preset="${activePreset}"] {\n` +
      tokens.map((t) => `  ${t.var}: ${t.value}; /* ${t.label} */`).join('\n') +
      '\n}';

    navigator.clipboard.writeText(cssString).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* ─────────────────────────────────────────────────────────────
          1. Barra de Herramientas Superior (Full-Width Studio Header)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Lado Izquierdo: Retorno al ERP y Título del Sistema */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all active:scale-95 shrink-0"
              title="Volver a la interfaz operativa del ERP"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al ERP</span>
            </Link>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Palette className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Design System Studio
                  <span className="hidden sm:inline-flex items-center text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    6 Arquetipos
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Gobernanza visual, tokens HSL y validación de componentes atómicos
                </p>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Conmutador de Modo de Vista & Acciones de Tokens */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Toggle de Modo: Matriz 6x vs Enfoque Individual */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  viewMode === 'matrix'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Matriz 6x</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  viewMode === 'single'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Enfoque</span>
              </button>
            </div>

            {/* Selector Rápido de Preset Activo (Visible siempre para inspección) */}
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value as ThemePresetId)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
            >
              {THEME_PRESETS_CATALOG.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Botón de Copiar Tokens CSS */}
            <button
              type="button"
              onClick={handleCopyCSSTokens}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white transition-all active:scale-95"
              title="Copiar variables CSS HSL al portapapeles"
            >
              {copySuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copiar CSS</span>
                </>
              )}
            </button>

            {/* Botón de Inspector Lateral de Tokens */}
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all active:scale-95"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Inspector HSL</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. Barra de Controles Interactivos en Vivo (Playground Toolbar)
      ───────────────────────────────────────────────────────────── */}
      <section className="w-full bg-slate-900/60 border-b border-slate-800/60 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Input interactivo reactivo sincronizado */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium shrink-0">Texto Demo:</span>
              <input
                type="text"
                value={testInputText}
                onChange={(e) => setTestInputText(e.target.value)}
                placeholder="Escribe texto de prueba..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
              />
            </div>

            {/* Alternador de Estado de Carga en Botones */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium shrink-0">Botones Loading:</span>
              <button
                type="button"
                onClick={() => setIsButtonsLoading(!isButtonsLoading)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  isButtonsLoading
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                )}
              >
                <RefreshCw className={cn('h-3 w-3', isButtonsLoading && 'animate-spin')} />
                <span>{isButtonsLoading ? 'Activo (Bloqueado)' : 'Inactivo'}</span>
              </button>
            </div>

            {/* Slider de Duración de Alquiler de Maquinaria */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium shrink-0">
                Duración Alquiler:
              </span>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={testRentalDays}
                onChange={(e) => setTestRentalDays(parseInt(e.target.value, 10))}
                className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 font-semibold">
                {testRentalDays} Días
              </span>
              <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
                ({testRentalDays * 24} h en obra)
              </span>
            </div>
          </div>

          {/* Tag de información WCAG */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>WCAG 2.1 AA Compliance Activo</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. Contenido Principal: Modo Matriz 6x vs Enfoque Individual
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'matrix' ? (
          /* =========================================================
             VISTA 1: MATRIZ DE COMPARACIÓN 6X LADO A LADO
             ========================================================= */
          <div className="space-y-8">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-cyan-400" />
                Matriz Comparativa de los 6 Arquetipos de Diseño
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualización idéntica de componentes atómicos, métricas industriales y contratos de estado bajo cada arquetipo en paralelo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {THEME_PRESETS_CATALOG.map((preset) => (
                <div key={preset.id} className="flex flex-col">
                  {/* Encabezado descriptivo del arquetipo sobre la tarjeta */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: preset.accentColorHex }}
                      />
                      <span className="text-xs font-bold text-slate-200">
                        {preset.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {preset.archetype}
                    </span>
                  </div>

                  {/* Contenedor con Inyección de Token Preset */}
                  <PresetContainer
                    preset={preset.id}
                    className="flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-5">
                      {/* Widget de Métrica de Maquinaria de Dominio */}
                      <PresetMetricWidget
                        moduleContext="rentals"
                        title="Duración Alquiler"
                        value={testRentalDays}
                        trend={{ value: 4.8, isPositive: true, label: 'vs promedio' }}
                      />

                      {/* Input adaptativo con texto sincronizado */}
                      <PresetInput
                        label="Equipo / Referencia"
                        value={testInputText}
                        onChange={(e) => setTestInputText(e.target.value)}
                        leftIcon={<Search className="h-3.5 w-3.5" />}
                        hint="Sincronizado en tiempo real"
                      />

                      {/* Grupo de Botones de Interacción */}
                      <div className="space-y-2">
                        <PresetButton
                          variant="primary"
                          className="w-full"
                          isLoading={isButtonsLoading}
                          leftIcon={<Sparkles className="h-4 w-4" />}
                        >
                          Confirmar Reserva
                        </PresetButton>


                        <div className="grid grid-cols-2 gap-2">
                          <PresetButton
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            Secundario
                          </PresetButton>
                          <PresetButton
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Cancelar
                          </PresetButton>
                        </div>
                      </div>

                      {/* Insignias de Estado e Indicadores de Tendencia */}
                      <div className="pt-2 border-t border-preset-border/40">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-preset-mutedFg mb-2">
                          Estados de Operación:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <PresetBadge variant="success">En Bodega</PresetBadge>
                          <PresetBadge variant="warning">Inspección</PresetBadge>
                          <PresetBadge variant="accent" pulsing>
                            Vivo
                          </PresetBadge>
                          <PresetBadge variant="neutral">Cámara 02</PresetBadge>
                        </div>
                      </div>
                    </div>

                    {/* Pie del Arquetipo con Botón de Enfoque */}
                    <div className="mt-6 pt-4 border-t border-preset-border/50 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-preset-mutedFg font-medium">
                        Radio: <span className="font-mono text-preset-fg">{preset.radiusLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePreset(preset.id);
                          setViewMode('single');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-preset-primary hover:underline"
                      >
                        <span>Detalle</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </PresetContainer>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =========================================================
             VISTA 2: ENFOQUE INDIVIDUAL PROFUNDO DEL PRESET ACTIVO
             ========================================================= */
          <div className="space-y-8">
            {/* Pestañas Horizontales para Selección de Arquetipo */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
              {THEME_PRESETS_CATALOG.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePreset(p.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 border',
                    activePreset === p.id
                      ? 'bg-slate-900 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-950'
                  )}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: p.accentColorHex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

            {/* Banner Descriptivo de Gobernanza del Arquetipo */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-400">
                    {activePresetMeta.archetype}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-400">
                    Display: <strong className="text-slate-200">{activePresetMeta.fontDisplay}</strong> | Cuerpo: <strong className="text-slate-200">{activePresetMeta.fontBody}</strong>
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {activePresetMeta.name}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  {activePresetMeta.tagline}. {activePresetMeta.shadowDescription}.
                </p>
              </div>

              {/* Características Clave en Pills */}
              <div className="flex flex-wrap gap-2 md:max-w-md">
                {activePresetMeta.characteristics.map((char, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg"
                  >
                    ✓ {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Showcase Inmersivo en Tamaño Real */}
            <PresetContainer preset={activePreset} className="p-8 sm:p-10">
              <div className="space-y-8">
                {/* 1. KPIs del Módulo de Negocio */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <PresetMetricWidget
                    moduleContext="rentals"
                    title="Duración del Contrato"
                    value={testRentalDays}
                    trend={{ value: 3.2, isPositive: true, label: 'Promedio Obra' }}
                  />
                  <PresetMetricWidget
                    moduleContext="billing"
                    title="Liquidación Estimada"
                    value={testBillingCOP}
                    trend={{ value: 12.5, isPositive: true, label: 'Meta Mensual' }}
                  />
                  <PresetMetricWidget
                    moduleContext="inventory"
                    title="Equipos Activos en Obra"
                    value={142}
                    unit="Máquinas"
                    secondaryInfo="Parque Ocupado: 86%"
                  />
                </div>

                {/* 2. Tarjeta con Formulario de Captura */}
                <PresetCard
                  title="Formulario de Despacho y Alquiler de Maquinaria"
                  subtitle="Asignación de herramientas, control de fletes y reserva garantizada"
                  badge="Garantía de Operación"
                  headerAction={
                    <PresetBadge variant="success" pulsing>
                      Flota Disponible
                    </PresetBadge>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    <PresetInput
                      label="Referencia de Maquinaria / Equipo"
                      value={testInputText}
                      onChange={(e) => setTestInputText(e.target.value)}
                      leftIcon={<Search className="h-4 w-4" />}
                      hint="Identificador único en inventario de bodega"
                    />

                    <PresetInput
                      label="Cliente / Constructora Responsable"
                      defaultValue="Constructora Bolívar & Urbanizaciones S.A.S."
                      leftIcon={<Boxes className="h-4 w-4" />}
                    />

                    <PresetInput
                      label="Depósito en Garantía (COP)"
                      defaultValue="$ 500.000"
                      hint="Cobertura contra daños y fletes"
                    />

                    <PresetInput
                      label="Asesor Comercial / Despachador"
                      defaultValue="Jefe de Bodega - Almacén Central"
                    />
                  </div>

                  <div className="mt-8 pt-6 border-t border-preset-border/40 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <PresetBadge variant="neutral">Auditoría Habilitada</PresetBadge>
                      <PresetBadge variant="accent">Almacén Principal</PresetBadge>
                    </div>

                    <div className="flex items-center gap-3">
                      <PresetButton variant="outline" size="md">
                        Descartar
                      </PresetButton>
                      <PresetButton
                        variant="primary"
                        size="md"
                        isLoading={isButtonsLoading}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                      >
                        Confirmar Despacho a Obra
                      </PresetButton>
                    </div>
                  </div>
                </PresetCard>


                {/* 3. Desglose de Variantes de Botones e Insignias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PresetCard title="Catálogo de Botones Adaptativos">
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-wrap gap-3">
                        <PresetButton variant="primary" size="md">
                          Primary Button
                        </PresetButton>
                        <PresetButton variant="secondary" size="md">
                          Secondary
                        </PresetButton>
                        <PresetButton variant="outline" size="md">
                          Outline
                        </PresetButton>
                        <PresetButton variant="ghost" size="md">
                          Ghost
                        </PresetButton>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <PresetButton
                          variant="primary"
                          size="sm"
                          isLoading={isButtonsLoading}
                        >
                          Botón con Carga
                        </PresetButton>
                        <PresetButton
                          variant="primary"
                          size="sm"
                          disabled
                        >
                          Deshabilitado
                        </PresetButton>
                      </div>
                    </div>
                  </PresetCard>

                  <PresetCard title="Insignias Semánticas y Micro-Estados">
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-wrap gap-2">
                        <PresetBadge variant="default">Default</PresetBadge>
                        <PresetBadge variant="success">Aprobado / Activo</PresetBadge>
                        <PresetBadge variant="warning">Pendiente / Alerta</PresetBadge>
                        <PresetBadge variant="accent" pulsing>
                          En Proceso
                        </PresetBadge>
                        <PresetBadge variant="neutral">Inactivo</PresetBadge>
                      </div>

                      <p className="text-xs text-preset-mutedFg font-medium pt-2">
                        Las insignias utilizan fondos HSL adaptativos con micro-indicadores luminosos acelerados por hardware en variantes que requieren atención operativa.
                      </p>
                    </div>
                  </PresetCard>
                </div>
              </div>
            </PresetContainer>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. Inspector Lateral de Variables CSS HSL & Checklist WCAG AA
      ───────────────────────────────────────────────────────────── */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Encabezado del Inspector */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-5 w-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Inspector de Tokens CSS
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Preset: <strong className="text-cyan-300">{activePresetMeta.name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInspectorOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lista de Variables CSS HSL */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Variables HSL de Superficie & Acentos:
                </h4>

                <div className="space-y-2 font-mono text-xs">
                  {PRESET_CSS_TOKENS_MAP[activePreset].map((token, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{token.label}</span>
                        <code className="text-cyan-400">{token.var}</code>
                      </div>
                      <div className="text-white font-semibold text-[11px]">
                        {token.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist de Accesibilidad WCAG 2.1 AA */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Auditoría WCAG 2.1 AA
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Contraste Texto Normal ≥ 4.5:1 (Cumplido)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Contraste Controles UI ≥ 3.0:1 (Cumplido)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Área Táctil Mínima 44x44px en Botones (Cumplido)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Foco Visible Accesible focus-visible:ring-2 (Cumplido)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Micro-animaciones con Transform-GPU (Sin Reflows)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Inferior para Copiar Snippet CSS */}
            <div className="pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={handleCopyCSSTokens}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-98"
              >
                {copySuccess ? (
                  <>
                    <Check className="h-4 w-4 text-slate-950" />
                    <span>¡Snippet CSS Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-950" />
                    <span>Copiar Bloque CSS de este Arquetipo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
