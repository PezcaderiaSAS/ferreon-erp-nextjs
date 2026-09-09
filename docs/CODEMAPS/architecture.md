<!-- Generated: 2026-09-09 | Files scanned: ~45 | Token estimate: ~480 -->
# FerreOn ERP - High Level Architecture

## System Type
Next.js 14 (App Router) Monolith with Supabase Backend-as-a-Service (BaaS).
Multi-tenant architecture via Supabase RLS (Row Level Security) and Upstash Redis distributed caching.

## Component Boundaries
- **Security Perimeter (`src/middleware.ts` & `src/lib/security/csp.ts`)**:
  - Content-Security-Policy (CSP 3) con soporte completo para Next.js 14 App Router streaming hydration (`self.__next_f.push`) y React 18.
  - Compatibilidad certificada con Apple iOS (WebKit / Safari): `worker-src 'self' blob:`, `child-src 'self' blob:`, `script-src-elem`, `style-src-elem` y WebSockets (`wss://*.supabase.co`).
  - Directiva booleana estricta `upgrade-insecure-requests` sin valores residuales (solo en producción HTTPS).
  - Fast-paths perimetrales para assets internos (`/_next`), APIs JSON y guard de timeout de autenticación (1200ms).
- **Frontend Layer**: React Server Components (RSC) + Client Components con Typeahead Accesible (`EquipoCombobox`), atajos globales (`F2`), rangos maestros, gobernanza de tokens `DESIGN.md` y apilamiento dinámico de capas (`zIndex: 100`).
- **State Management**: Zustand (Modular Client Stores: `alquilerStore`, `bodegaStore`, `empresaStore`, `clienteStore`, `layoutStore`) con reconciliación independiente vía `Promise.allSettled`.
- **Backend / Server Actions Layer**: Next.js Server Actions (`src/app/actions/`) y API Routes protegidas conectando a Supabase SSR con auditoría asíncrona (`AuditLogger`).
- **Database Layer**: PostgreSQL (Supabase) con RLS estricto por tenant, tabla `audit_logs` inmutable, función `is_ultra_admin()` y RPCs transaccionales (`reducir_stock_seguro`).
- **Document Generation Engines**: Dual PDF system:
  1. Vectorial: `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con logo responsivo y formatos Letter/A5.
  2. HTML/Print: `EnterprisePDFService` para impresión nativa de alta velocidad.

## Data Flow
Client UI (F2 / Combobox) → Server Action / API Route (Zod SafeParse) → Supabase RPCs / Postgres (RLS) → Redis Cache Invalidation + AuditLogger (`audit_logs`)
