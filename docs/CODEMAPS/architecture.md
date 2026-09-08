<!-- Generated: 2026-09-08 | Files scanned: ~35 | Token estimate: ~350 -->
# FerreOn ERP - High Level Architecture

## System Type
Next.js 14 (App Router) Monolith with Supabase Backend-as-a-Service (BaaS).
Multi-tenant architecture via Supabase RLS (Row Level Security) and Upstash Redis distributed caching.

## Component Boundaries
- **Frontend Layer**: React Server Components (RSC) + Client Components. Styling with TailwindCSS & Poka-Yoke visual guards.
- **State Management**: Zustand (Modular Client Stores: `alquilerStore`, `bodegaStore`, `empresaStore`, `clienteStore`, `layoutStore`).
- **Backend / Server Actions Layer**: Next.js Server Actions (`src/app/actions/`) connecting to Supabase via `@supabase/ssr` & `@supabase/supabase-js`.
- **Database Layer**: PostgreSQL (Supabase) with RLS policies, JSONB configurations (`empresas.configuracion`), and PL/pgSQL RPCs for atomic operations (`reducir_stock_seguro`).
- **Document Generation Engines**: Dual PDF system:
  1. Vectorial: `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con renderizado de `<Image>` y guarda `tieneLogoValido`.
  2. HTML/Print: `EnterprisePDFService` para impresión nativa en formatos Carta y A5.

## Data Flow
Client UI → Server Action (`src/app/actions/*`) → Supabase API / RPCs → PostgreSQL (RLS) → Multi-Tenant Redis Cache Invalidation
