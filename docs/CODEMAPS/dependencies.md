<!-- Generated: 2026-09-09 | Files scanned: ~5 | Token estimate: ~340 -->
# Dependencies Architecture

## Core Framework
- **Next.js 14 (v14.2.35)**: Server Actions, App Router, SSR, React Server Components. Compilación limpia 19/19 rutas.
- **React 18**: UI Library, Client Components & Hooks (`useId`, `useRef`, `useMemo`, `useCallback`).
- **TailwindCSS**: Utility-first styling y Glassmorphism según `DESIGN.md`.

## Database & BaaS
- **Supabase**: Base de datos (PostgreSQL), Auth, Storage, y Funciones Edge.
  - `@supabase/ssr`: Manejo de auth y cookies seguras en Server Components y Server Actions.
  - `@supabase/supabase-js`: Cliente genérico para mutaciones y suscripciones WebSockets (`wss://*.supabase.co`).

## State Management
- **Zustand**: Manejo de estado local en cliente con persistencia en `localStorage` y métodos de sanitización.

## Integrations & Services
- **Stripe**: Pagos recurrentes y facturación multi-tenant (`js.stripe.com`).
- **Upstash Redis**: Caché distribuida serverless e invalidación de claves por tenant.
- **@react-pdf/renderer**: Motor vectorial de generación de contratos PDF en el frontend con soporte para `<Image />` y fuentes Roboto.
- **EnterprisePDFService**: Motor nativo HTML de impresión directa con ventanas emergentes.
- **Canvas API (Navegador)**: Compresión y redimensionamiento dinámico de logos empresariales (<150KB, máx 400×120px) antes de la persistencia.
- **Zod**: Validación de esquemas y tipos estáticos de payloads (Security-First) en rutas API y Server Actions.
- **Lucide React**: Biblioteca de iconos SVG ligeros para UI/UX de alta fidelidad.
- **Content-Security-Policy (CSP 3)**: Cabecera perimetral HTTP generada dinámicamente, optimizada para Next.js streaming hydration y Apple iOS WebKit.
