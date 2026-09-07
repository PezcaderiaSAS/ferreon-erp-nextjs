<!-- Generated: 2026-09-07 | Files scanned: 1 | Token estimate: ~200 -->
# Dependencies Architecture

## Core Framework
- **Next.js 14**: Server Actions, App Router, SSR.
- **React 18**: UI Library.
- **TailwindCSS**: Utility-first styling.

## Database & BaaS
- **Supabase**: Base de datos (PostgreSQL), Autenticación, Storage, y Funciones Edge.
  - `@supabase/ssr`: Para manejar auth en Server Components.
  - `@supabase/supabase-js`: Cliente genérico.

## State Management
- **Zustand**: Manejo de estado local en cliente (tiendas modulares).

## Integrations & Services
- **Stripe**: Pagos recurrentes y facturación multitenant.
- **Upstash Redis**: Caché distribuida y rate limiting.
- **@react-pdf/renderer**: Generación de documentos PDF (Facturas, contratos) en el frontend.
- **Zod**: Validación de esquemas y tipos estáticos de payloads (Security-First).
