<!-- Generated: 2026-09-15 | Files scanned: ~10 | Token estimate: ~460 -->
# Dependencies Architecture

## Core Framework
- **Next.js 14 (v14.2.5)**: Server Actions, App Router, SSR, React Server Components. Compilación limpia 23/23 rutas.
- **React 18**: UI Library, Client Components & Hooks (`useId`, `useRef`, `useMemo`, `useCallback`, `useState`, `useEffect`).
- **TailwindCSS**: Utility-first styling y Glassmorphism según tokens de `DESIGN.md`.

## ORM & Database BaaS
- **Supabase**: Base de datos (PostgreSQL), Auth, Storage y RLS.
  - `@supabase/ssr`: Manejo de auth y cookies seguras en Server Components y Server Actions.
  - `@supabase/supabase-js`: Cliente genérico para mutaciones y suscripciones WebSockets (`wss://*.supabase.co`).
  - RPCs con soporte de deduplicación atómica (`crear_alquiler_transaccional`) e índices únicos condicionales.
- **Prisma (v7.10.0)**: Generación de tipos y cliente de datos (`@prisma/client`).

## State Management
- **Zustand (v5.0.15)**: Manejo de estado local en cliente con persistencia en `localStorage`, transiciones optimistas y rollback ante errores (`alquilerStore`, `bodegaStore`, `cajaStore`, `clienteStore`, `empresaStore`, `toastStore`, `ledgerStore`).

## Distributed Caching & Performance
- **Upstash Redis**: Caché distribuida serverless con claves por tenant:
  - `cache:compras:${tenantId}`
  - `cache:proveedores:${tenantId}`
  - `cache:equipos:${tenantId}`
  - `cache:cotizaciones:${tenantId}`
  - Invalidadas atómicamente tras cada mutación.

## Integrations & Services
- **Motor de Idempotencia & Poka-Yoke**: Validación dual-layer con esquemas Zod (`idempotency_key`), overlay visual bloqueante (`AlquilerBlockingOverlay.tsx`) y deshabilitación síncrona de botones en cliente.
- **Motor Tributario & Contable**: Servicio puro `calculo-compras-tributario.ts` con redondeo estándar para Colombia (COP sin centavos).
- **Dual PDF Engines**:
  1. `@react-pdf/renderer` (v3.4.5): Generación vectorial en cliente para contratos de alquiler.
  2. `EnterprisePDFService` / Modales HTML (`VisorDocumentoPDFModal.tsx`, `ComprobanteEntradaPDFModal.tsx`, `ComprobanteArqueoModal.tsx`): Emisión de Facturas Comerciales, Cotizaciones de Obra, Órdenes de Compra y Comprobantes de Arqueo.
- **Zod (v3.23.8)**: Validación de esquemas y tipos estáticos de payloads (Security-First) en rutas API y Server Actions.
- **Stripe (v16.8.0)**: Pagos recurrentes y facturación multi-tenant (`js.stripe.com`).
- **Lucide React (v0.428.0)**: Biblioteca de iconos SVG ligeros para UI/UX de alta fidelidad.
- **Content-Security-Policy (CSP 3)**: Cabecera perimetral HTTP generada dinámicamente, optimizada para Next.js streaming hydration y Apple iOS WebKit.
