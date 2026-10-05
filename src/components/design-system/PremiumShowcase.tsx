'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Table,
  CheckCircle2,
  Calendar,
  SlidersHorizontal,
  Smartphone,
  Waves,
  Bell,
  Menu,
  Target,
  Upload,
  ChevronDown,
  ExternalLink,
  Laptop,
  Hash,
  ShieldCheck,
  User,
  Sliders,
} from 'lucide-react';
import {
  PremiumTable,
  PremiumToastShowcase,
  PremiumHamburgerMenu,
  PremiumStickyHeader,
  PremiumProfileUpload,
  PremiumUpcomingMeetings,
  PremiumKanbanBoard,
  PremiumGoalTracker,
  PremiumAccordion,
  PremiumDashboardPreview,
  PremiumWaterRipple,
  PremiumAdvancedKanban,
  PremiumSuccessDoneScreen,
  PremiumWeeklyCalendarSystem,
  PremiumLinearSystem,
  PremiumResponsiveMobileTable,
  PremiumBorderRadiusSystem,
  PremiumDarkModeDepthSystem,
  PremiumAvatarFallbackSystem,
  PremiumTabularNumbersSystem,
  PremiumStateGuardIdempotencySystem,
} from '@/components/ui/premium';

type PremiumCategory =
  | 'all'
  | 'management'
  | 'data-tables'
  | 'actions-feedback'
  | 'nav-interactions'
  | 'design-engineering';

interface ComponentItem {
  id: string;
  name: string;
  category: PremiumCategory;
  description: string;
  badge: string;
  component: React.ReactNode;
}

export function PremiumShowcase() {
  const [activeCategory, setActiveCategory] = useState<PremiumCategory>('all');
  const [activeTab, setActiveTab] = useState<string>('radius-system');

  const componentsList: ComponentItem[] = [
    // 1. INGENIERÍA DE DISEÑO & PRINCIPIOS DE SISTEMA (5 PATRONES)
    {
      id: 'radius-system',
      name: 'Border Radius System (R_outer = R_inner + P)',
      category: 'design-engineering',
      description:
        'Regla matemática de radios anidados para eliminar recortes visuales y desalineaciones. Selector de escala sm (4px), md (8px), lg (12px), xl (16px), full (9999px) con advertencia contra el uso de un solo radio universal.',
      badge: 'Radius is a System · 01',
      component: <PremiumBorderRadiusSystem />,
    },
    {
      id: 'dark-mode-depth',
      name: 'Dark Mode Surface Depth (#000 Zero Depth)',
      category: 'design-engineering',
      description:
        'Arquitectura de elevación con capas tonales (#111827, #1f2937) que erradica el anti-patrón de negro puro con blanco (#000/#FFF = zero depth), reduciendo la fatiga visual con métricas y gráficos integrados.',
      badge: 'Dark Mode is a System · 01',
      component: <PremiumDarkModeDepthSystem />,
    },
    {
      id: 'avatar-fallback',
      name: 'Avatar Resilient Fallback Chain',
      category: 'design-engineering',
      description:
        'Cadena de degradación progresiva de 3 niveles: Foto de usuario -> Iniciales extraídas -> Icono genérico predeterminado. Garantiza cero saltos de diseño (CLS) con radio 50% inmutable.',
      badge: 'The Fallback Ships Anyway',
      component: <PremiumAvatarFallbackSystem />,
    },
    {
      id: 'tabular-numbers',
      name: 'Tabular Numerals System (Watch the Right Edge)',
      category: 'design-engineering',
      description:
        'Alineación estricta a la derecha y tipografía monospaciada numérica (font-variant-numeric: tabular-nums) para evitar que los decimales bailen (dances -> lines up) en transacciones financieras.',
      badge: 'UI Numbers · 01',
      component: <PremiumTabularNumbersSystem />,
    },
    {
      id: 'state-guard',
      name: 'State Guard & Idempotency Key (UI Off Isn\'t Enough)',
      category: 'design-engineering',
      description:
        'Arquitectura dual de seguridad contra doble envío: protección de handler asíncrono en cliente (if inFlight return) combinada con cabecera de red Idempotency-Key en servidor para deduplicación atómica.',
      badge: 'State Guard · 01',
      component: <PremiumStateGuardIdempotencySystem />,
    },

    // 2. GESTIÓN Y PROYECTOS (5 PATRONES)
    {
      id: 'advanced-kanban',
      name: 'Advanced Kanban System (Sprint 38)',
      category: 'management',
      description:
        'Tablero Kanban técnico en Dark Mode con identificación de sprint, límites WIP estrictos, físicas de arrastre con rotación 2deg y marcadores de decisión de arquitectura.',
      badge: 'Dark Mode • Drag Physics',
      component: <PremiumAdvancedKanban />,
    },
    {
      id: 'linear-system',
      name: 'Linear-Style Engineering UI',
      category: 'management',
      description:
        'Filosofía de ingeniería inversa de Linear basada en 5 pilares: alta densidad de información, bordes sutiles sin sombras pesadas, paleta monocromática unificada y alineación tabular estricta.',
      badge: '5 Engineering Decisions',
      component: <PremiumLinearSystem />,
    },
    {
      id: 'weekly-calendar',
      name: 'Weekly Calendar System (Halo)',
      category: 'management',
      description:
        'Rejilla de eventos con cero solapamientos visuales (Zero-Overlaps Grid), selector de vistas (Día, Semana, Mes), día actual resaltado y codificación cromática por tipo de actividad.',
      badge: 'Calendar is a System · 01',
      component: <PremiumWeeklyCalendarSystem />,
    },
    {
      id: 'upcoming-meetings',
      name: 'Upcoming Meetings & Schedule Card',
      category: 'management',
      description:
        'Diseño de cuadrícula de dos columnas con panel lateral en gradiente índigo/púrpura, selector horizontal interactivo de fechas, grupo de avatares superpuestos y acción rápida.',
      badge: 'Dual Column Grid',
      component: <PremiumUpcomingMeetings />,
    },
    {
      id: 'kanban-board',
      name: 'Kanban Flow Board (4 Columnas)',
      category: 'management',
      description:
        'Tablero estándar de gestión con 4 columnas, etiquetas cromáticas según prioridad (High, Medium, Low), comentarios y archivos adjuntos.',
      badge: 'Task Flow UI',
      component: <PremiumKanbanBoard />,
    },

    // 3. TABLAS Y DATOS FINANCIEROS (3 PATRONES)
    {
      id: 'responsive-mobile-table',
      name: 'Responsive Table (Mobile UX Shell)',
      category: 'data-tables',
      description:
        'Adaptación móvil de alta gama en contenedor de 360px: convierte tablas complejas en tarjetas fluidas con métricas financieras destacadas y comparativa en vivo.',
      badge: 'Mobile-First · 360px Shell',
      component: <PremiumResponsiveMobileTable />,
    },
    {
      id: 'user-table',
      name: 'User Management Table UI',
      category: 'data-tables',
      description:
        'Tabla enterprise con toolbar integrada, buscador en tiempo real, filtros, estados visuales (Active, Pending, Offline), avatares con iniciales y microinteracciones de hover.',
      badge: 'Enterprise Table UI',
      component: <PremiumTable />,
    },
    {
      id: 'dashboard-preview',
      name: 'Dashboard Analytics UI (Dark Mode)',
      category: 'data-tables',
      description:
        'Panel analítico oscuro con acentos de color planos (Flat accents), barra de herramientas, banner de bienvenida, cuadrícula de KPIs y gráfico interactivo con toggles 7d/30d/90d.',
      badge: 'Flat Accents • No Gradients',
      component: <PremiumDashboardPreview />,
    },

    // 4. ACCIONES, CONFIRMACIÓN Y FEEDBACK (4 PATRONES)
    {
      id: 'success-done-screen',
      name: 'Success/Done Screen (done ≠ dead end)',
      category: 'actions-feedback',
      description:
        'Pantalla de finalización exitosa que combate el efecto "callejón sin salida" guiando al usuario hacia el siguiente paso de valor inmediato, con distintivo de neón fosforescente.',
      badge: 'done ≠ dead end',
      component: <PremiumSuccessDoneScreen />,
    },
    {
      id: 'toast-notifications',
      name: 'Toast Notifications (Gradientes 135°)',
      category: 'actions-feedback',
      description:
        'Avisos flotantes con gradientes dinámicos a 135deg según jerarquía de estado (Verde, Azul, Naranja, Rojo), formas decorativas superpuestas y animación con rebote cubic-bezier.',
      badge: 'Cubic-Bezier Bounce',
      component: <PremiumToastShowcase />,
    },
    {
      id: 'goal-tracker',
      name: 'Goal Tracker Card UI',
      category: 'actions-feedback',
      description:
        'Tarjeta de objetivos dividida en bloque superior con gradiente vibrante púrpura/cian y cuerpo blanco, con gráfico circular radial SVG interactivo y caja de deadline.',
      badge: 'SVG Radial Progress',
      component: <PremiumGoalTracker />,
    },
    {
      id: 'profile-upload',
      name: 'Profile Photo Upload Card',
      category: 'actions-feedback',
      description:
        'Componente para carga de foto de perfil con avatar circular, badge de cámara flotante con microinteracción hover, zona de dropzone y botones con gradientes.',
      badge: 'Camera Badge Overlay',
      component: <PremiumProfileUpload />,
    },

    // 5. NAVEGACIÓN Y MICROINTERACCIONES (4 PATRONES)
    {
      id: 'water-ripple',
      name: 'Interactive Water Ripple Effect',
      category: 'nav-interactions',
      description:
        'Canvas de fluido oceánico con gradiente profundo (#0f172a a #0284c7) que proyecta ondas expansivas dinámicas en las coordenadas exactas de clic a 60 FPS con GPU.',
      badge: '60 FPS GPU Canvas',
      component: <PremiumWaterRipple />,
    },
    {
      id: 'sticky-header',
      name: 'Sticky Header Glassmorphic',
      category: 'nav-interactions',
      description:
        'Barra de navegación fija con efecto backdrop blur de 12px, listener de scroll dinámico, enlaces en píldora activa y botón de llamada a la acción con gradiente elevado.',
      badge: 'Backdrop Blur 12px',
      component: <PremiumStickyHeader />,
    },
    {
      id: 'hamburger-menu',
      name: 'Animated Hamburger Menu',
      category: 'nav-interactions',
      description:
        'Menú desplegable móvil con botón animado con fondo púrpura índigo #6366f1, transformación de barras a X y panel dropdown con sombras suaves.',
      badge: 'Indigo Accent #6366f1',
      component: <PremiumHamburgerMenu />,
    },
    {
      id: 'accordion-ui',
      name: 'Accordion UI Upgrade',
      category: 'nav-interactions',
      description:
        'Acordeón de tarjetas independientes elevadas con icon badge atenuado, títulos claros y alternancia suave (+ / -) con transición de altura.',
      badge: 'Elevated Cards FAQ',
      component: <PremiumAccordion />,
    },
  ];

  const filteredComponents = componentsList.filter((item) =>
    activeCategory === 'all' ? true : item.category === activeCategory
  );

  const selectedItem =
    componentsList.find((item) => item.id === activeTab) || componentsList[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner de Presentación */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#00e699] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Alquileres System • Premium UI & Design Engineering
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">21 Componentes & Principios Certificados</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Estándares UI Modernos & Microinteracciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Catálogo completo de componentes enriquecidos con principios de diseño avanzados:
            fórmula de radios anidados (R_outer = R_inner + P), profundidad tonal en modo oscuro,
            cadena de degradación resiliente, números tabulares, prevención de doble envío y adaptabilidad 360px.
          </p>
        </div>

        {/* Resumen de Métrica */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shrink-0">
          <div>
            <div className="text-2xl font-black text-[#00e699] font-mono">21</div>
            <div className="text-[11px] text-slate-400">Patrones Certificados</div>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div>
            <div className="text-2xl font-black text-cyan-400 font-mono">100%</div>
            <div className="text-[11px] text-slate-400">React + Tailwind</div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros por Categoría */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'all'
              ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todos ({componentsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('design-engineering')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'design-engineering'
              ? 'bg-[#00e699] text-slate-950 shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Ingeniería & Principios (5)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('management')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'management'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Gestión & Proyectos (5)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('data-tables')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'data-tables'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Tablas & Datos (3)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('actions-feedback')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'actions-feedback'
              ? 'bg-amber-600 text-white shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Acciones & Feedback (4)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('nav-interactions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'nav-interactions'
              ? 'bg-cyan-600 text-white shadow-sm font-bold'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Navegación & Microinteracciones (4)</span>
        </button>
      </div>

      {/* Grid de Selector Rápido de Componentes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {filteredComponents.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between h-20 ${
              activeTab === item.id
                ? 'bg-slate-900 border-[#00e699] text-white shadow-lg shadow-[#00e699]/10 ring-1 ring-[#00e699]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-[#00e699] truncate block">
              {item.badge}
            </span>
            <span className="text-xs font-semibold truncate block leading-tight text-slate-100">
              {item.name}
            </span>
          </button>
        ))}
      </div>

      {/* Área de Visualización y Demostración en Vivo */}
      <div className="space-y-4">
        {/* Cabecera del Componente Seleccionado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {selectedItem.name}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-[#00e699] border border-slate-700 font-mono font-medium">
                {selectedItem.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {selectedItem.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-500">
              src/components/ui/premium/{selectedItem.id}
            </span>
          </div>
        </div>

        {/* Renderizado en Vivo del Componente */}
        <div className="w-full flex justify-center py-2">
          <div className="w-full">{selectedItem.component}</div>
        </div>
      </div>
    </div>
  );
}
