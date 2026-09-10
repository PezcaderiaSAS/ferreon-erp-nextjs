<!-- Generated: 2026-09-10 | Files scanned: ~8 | Token estimate: ~420 -->
# Dependencies Architecture

## Core Framework
- **Next.js 14 (v14.2.35)**: Server Actions, App Router, SSR, React Server Components. Compilación limpia 22/22 rutas.
- **React 18**: UI Library, Client Components & Hooks (`useId`, `useRef`, `useMemo`, `useCallback`, `useState`, `useEffect`).
- **TailwindCSS**: Utility-first styling y Glassmorphism según tokens de `DESIGN.md`.

## Database & BaaS
- **Supabase**: Base de datos (PostgreSQL), Auth, Storage, y Funciones Edge.
  - `@supabase/ssr`: Manejo de auth y cookies seguras en Server Components y Server Actions.
  - `@supabase/supabase-js`: Cliente genérico para mutaciones y suscripciones WebSockets (`wss://*.supabase.co`).

## State Management
- **Zustand**: Manejo de estado local en cliente con persistencia en `localStorage` y métodos de sanitización (`alquilerStore`, `bodegaStore`, `clienteStore`, `empresaStore`, `toastStore`, `ledgerStore`).

## Distributed Caching & Performance
- **Upstash Redis**: Caché distribuida serverless con claves por tenant:
  - `cache:compras:${tenantId}`
  - `cache:proveedores:${tenantId}`
  - `cache:equipos:${tenantId}`
  - `cache:cotizaciones:${tenantId}`
  - Invalidadas atómicamente tras cada mutación.

## Integrations & Services
- **Motor Tributario & Contable**: Servicio puro `calculo-compras-tributario.ts` con redondeo estándar para Colombia (COP sin centavos).
- **Dual PDF Engines**:
  1. `@react-pdf/renderer`: Generación vectorial en cliente para contratos de alquiler.
  2. `EnterprisePDFService` / Modales HTML (`VisorDocumentoPDFModal.tsx`, `ComprobanteEntradaPDFModal.tsx`): Emisión de Facturas Comerciales, Cotizaciones de Obra y Órdenes de Compra.
- **Zod**: Validación de esquemas y tipos estáticos de payloads (Security-First) en rutas API y Server Actions.
- **Stripe**: Pagos recurrentes y facturación multi-tenant (`js.stripe.com`).
- **Lucide React**: Biblioteca de iconos SVG ligeros para UI/UX de alta fidelidad.
- **Content-Security-Policy (CSP 3)**: Cabecera perimetral HTTP generada dinámicamente, optimizada para Next.js streaming hydration y Apple iOS WebKit.
