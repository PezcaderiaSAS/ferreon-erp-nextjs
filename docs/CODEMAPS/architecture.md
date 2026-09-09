<!-- Generated: 2026-09-09 | Files scanned: ~40 | Token estimate: ~450 -->
# FerreOn ERP - High Level Architecture

## System Type
Next.js 14 (App Router) Monolith with Supabase Backend-as-a-Service (BaaS).
Multi-tenant architecture via Supabase RLS (Row Level Security) and Upstash Redis distributed caching.

## Component Boundaries
- **Security Perimeter**: Middleware Next.js con inyección de nonces dinámicos para Content-Security-Policy (CSP), cabeceras HSTS, X-Frame-Options y validación dual-layer Zod.
- **Frontend Layer**: React Server Components (RSC) + Client Components con Typeahead Accesible (`EquipoCombobox`), atajos globales (`F2`), rangos maestros y gobernanza de tokens `DESIGN.md`.
- **State Management**: Zustand (Modular Client Stores: `alquilerStore`, `bodegaStore`, `empresaStore`, `clienteStore`, `layoutStore`).
- **Backend / Server Actions Layer**: Next.js Server Actions (`src/app/actions/`) y API Routes protegidas conectando a Supabase SSR con auditoría asíncrona (`AuditLogger`).
- **Database Layer**: PostgreSQL (Supabase) con RLS estricto por tenant, tabla `audit_logs` inmutable, función `is_ultra_admin()` y RPCs transaccionales (`reducir_stock_seguro`).
- **Document Generation Engines**: Dual PDF system:
  1. Vectorial: `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con logo responsivo y formatos Letter/A5.
  2. HTML/Print: `EnterprisePDFService` para impresión nativa de alta velocidad.

## Data Flow
Client UI (F2 / Combobox) → Server Action / API Route (Zod SafeParse) → Supabase RPCs / Postgres (RLS) → Redis Cache Invalidation + AuditLogger (`audit_logs`)
