<!-- Generated: 2026-09-03 | Files scanned: ~45 | Token estimate: ~430 -->
# Frontend Architecture & UI Ecosystem

Este mapa detalla la capa de presentación de la aplicación, construida en React / Next.js bajo los principios de consistencia en tiempo real, latencia mínima y gobernanza visual.

## Gobernanza Visual (Design System)
- **CSS Variables & Tailwind**: El sistema de diseño (tokens de color HSL, sombras y espaciados) está centralizado en variables de CSS (`:root` y `[data-theme="ocean"]` en `globals.css`). `tailwind.config.ts` consume exclusivamente estas variables (`var(--brand-base)`).
- **Neumorphism & Glassmorphism**: Componentes UI base definidos en `src/components/ui/neumorphism/`. Implementan sombras dinámicas y transiciones suaves (`NeuToggle`, `NeuButton`).

## Componentes Clave & Páginas
- **`src/components/ui/Sidebar.tsx`**: Contenedor principal de navegación. Incorpora el **Theme Switcher** que sincroniza el estado local de Zustand (`empresaStore.config.themeApp`) con el DOM sin parpadeos.
- **`src/app/clientes/page.tsx`, `src/app/bodega/page.tsx`, `src/app/alquileres/page.tsx`**:
  - Consumo directo de stores reactivos de Zustand.
  - Carga de catálogos mediante `fetch(..., { cache: 'no-store' })` para invalidar el almacenamiento en disco de Safari/WebKit.
  - Escuchadores de eventos de visibilidad (`visibilitychange` / `window.onfocus`) para revalidar datos automáticamente cuando una ventana inactiva recupera el foco en macOS.

## Sincronización en Tiempo Real & Estado
- **`src/infrastructure/state/realtimeSync.ts`**:
  - `setupRealtimeSubscriptions()`: Escucha eventos `postgres_changes` (`INSERT`, `UPDATE`, `DELETE`) en las tablas `equipos`, `alquileres` y `clientes`.
  - `useRealtimeSync()`: Hook de ciclo de vida con auto-reconexión de WebSockets ante la reactivación de pestañas suspendidas por App Nap en Safari.
- **Zustand Stores (`src/infrastructure/state/`)**:
  - `alquilerStore.ts`, `clienteStore.ts`, `bodegaStore.ts`: Stores con persistencia local y soporte para Rollback Optimista.
  - `empresaStore.ts`: Configuración persistida de tenant y temas.
  - `layoutStore.ts`: Control temporal de modales, tours y drawers.
