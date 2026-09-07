<!-- Generated: 2026-09-07 | Files scanned: ~25 | Token estimate: ~300 -->
# FerreOn ERP - High Level Architecture

## System Type
Next.js 14 (App Router) Monolith with Supabase Backend-as-a-Service (BaaS).
Multi-tenant architecture via Supabase RLS (Row Level Security).

## Component Boundaries
- **Frontend Layer**: React Server Components (RSC) + Client Components. Styling with TailwindCSS.
- **State Management**: Zustand (Client State) + React Hooks.
- **Backend / Data Layer**: Next.js Server Actions connecting to Supabase via `@supabase/ssr` & `@supabase/supabase-js`.
- **Database**: PostgreSQL (Supabase) with strict RLS policies and PL/pgSQL RPCs for transactional integrity (candados optimistas).

## Data Flow
Client UI → Server Action (src/app/actions/*) → Supabase PostgREST API → PostgreSQL
