<!-- Generated: 2026-09-03 | Files scanned: ~40 | Token estimate: ~400 -->
# Frontend Architecture & UI Ecosystem

Este mapa detalla la capa de presentación de la aplicación, construida en React / Next.js bajo los principios estandarizados de UI/UX.

## Gobernanza Visual (Design System)
- **CSS Variables & Tailwind**: El sistema de diseño (tokens de color HSL, sombras y espaciados) está centralizado en variables de CSS (`:root` y `[data-theme="ocean"]` en `globals.css`). `tailwind.config.ts` consume exclusivamente estas variables (`var(--brand-base)`).
- **Neumorphism & Glassmorphism**: Componentes UI base definidos en `src/components/ui/neumorphism/`. Implementan sombras dinámicas y transiciones suaves (`NeuToggle`, `NeuButton`).

## Componentes Clave (App Router)
- **`src/components/ui/Sidebar.tsx`**: Contenedor principal de navegación. Incorpora el **Theme Switcher** que sincroniza el estado local de Zustand (`empresaStore.config.themeApp`) con el documento HTML de forma inmediata sin parpadeo (flicker-free).
- **`src/components/ui/InteractiveTour.tsx`**: Guía paso a paso responsiva. Usa posicionamiento híbrido: "Bottom Sheet" (anclado inferior) en móviles (`<sm`), y burbuja flotante en Desktop mediante cálculos dinámicos de DOM, sin clipping.
- **`src/components/ui/GlobalTourWrapper.tsx`**: Orquestador global del Interactive Tour con soporte de enrutamiento asíncrono multipantalla.

## State Management
- **Zustand Stores (`src/infrastructure/state/`)**:
  - `empresaStore.ts`: Gestión persistida de configuración de tenant y tema (`themeApp`).
  - `layoutStore.ts`: Control temporal (drawer abierto, tour activo).
  - `tenantStore.ts`: (Zustand client-side) Estado local de arrendatario para peticiones autenticadas.
