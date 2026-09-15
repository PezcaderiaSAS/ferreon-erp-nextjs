<!-- Generated: 2026-09-15 | Files scanned: ~68 | Token estimate: ~620 -->
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
- **Idempotency & Poka-Yoke Visual Guard (`AlquilerBlockingOverlay.tsx` & `useAlquilerForm.ts`)**:
  - Escudo visual Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner sincronizado y bloqueo físico de clics múltiples (`pointer-events-none`) y atajos de teclado (`tabIndex`, escape) durante `isSubmitting`.
  - Generación de `idempotency_key` criptográfica única (UUID v4) transmitida por formulario.
  - Deduplicación atómica en Backend (Server Action) y Base de Datos (Postgres Unique Index + RPC Transaccional) garantizando 0 duplicados y latencia cero (0 ms).
- **Frontend Layer**: React Server Components (RSC) + Client Components con Typeahead Accesible (`EquipoCombobox`, `SelectorProveedorAsistido`), atajos globales (`F2`), rangos maestros, gobernanza de tokens `DESIGN.md` y apilamiento dinámico de capas (`zIndex: 100`).
- **State Management**: Zustand (Modular Client Stores: `alquilerStore`, `bodegaStore`, `empresaStore`, `clienteStore`, `cajaStore`, `layoutStore`, `toastStore`, `ledgerStore`) con transiciones optimistas, rollback ante fallos y reconciliación independiente vía `Promise.allSettled`.
- **Backend / Server Actions Layer**: Next.js Server Actions (`src/app/actions/`):
  - Contratos, cotizaciones y devoluciones (`alquileres.ts`, `cotizaciones.ts`).
  - Turnos, movimientos, arqueos y comprobantes de caja (`caja.ts`).
  - Facturación comercial y asientos contables (`facturacion.ts`).
  - Compras y aprovisionamiento con liquidación tributaria (`compras.ts`).
  - Directorio maestro de proveedores (`proveedores.ts`).
  - Subcontrataciones de maquinaria externa (`subcontrataciones.ts`).
  - Auditoría asíncrona no bloqueante (`AuditLogger` en `audit_logs`).
- **Database Layer**: PostgreSQL (Supabase) con RLS estricto por tenant, tabla `audit_logs` inmutable, función `is_ultra_admin()` y RPCs transaccionales (`crear_alquiler_transaccional`, `reducir_stock_seguro`, `procesar_devolucion_alquiler`, `ajustar_stock_equipo`).
- **Accounting & Financial Ledger**: Motor de partida doble estricto ($\sum \text{Débitos} = \sum \text{Créditos}$) para Cuentas por Cobrar (`1305`), Cuentas por Pagar Proveedores (`2205`), Activo Fijo / Equipos (`1520`), IVA Descontable (`2408`), ReteFuente Pasivo (`2365`), ReteICA Pasivo (`2368`) y Tesorería (`1105`/`1110`).
- **Document Generation Engines**: Dual PDF system:
  1. Vectorial: `@react-pdf/renderer` (`ContratoAlquilerPDF.tsx`) con logo responsivo y formatos Letter/A5.
  2. HTML/Print: `EnterprisePDFService` y modales de impresión nativa (`VisorDocumentoPDFModal.tsx`, `ComprobanteEntradaPDFModal.tsx`, `ComprobanteArqueoModal.tsx`) para Facturas, Cotizaciones, Órdenes de Compra y Arqueos de Caja.

## Data Flow
Client UI (F2 / Combobox / Selector Asistido / AlquilerBlockingOverlay) → Server Action / API Route (Zod SafeParse + Idempotency Guard) → Domain Services (`calculo-compras-tributario.ts`, `pdf-factura-generator.service.ts`) → Supabase Postgres (RLS + RPC Transaccional con Lock Pesimista + Unique Idempotency Key) + Redis Cache Invalidation (`compras`, `proveedores`, `equipos`, `cotizaciones`) → AuditLogger (`audit_logs`)
