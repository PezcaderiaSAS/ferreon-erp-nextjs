<!-- Generated: 2026-09-17 | Files scanned: ~12 | Token estimate: ~550 -->
# Dependencies Architecture

## Core Framework
- **Next.js 14 (v14.2.5)**: Server Actions, App Router, SSR, React Server Components. Compilación limpia 23/23 rutas.
- **React 18**: UI Library, Client Components & Hooks (`useId`, `useRef`, `useMemo`, `useCallback`, `useState`, `useEffect`).
- **TailwindCSS**: Utility-first styling y Glassmorphism según tokens de `DESIGN.md`.

## ORM & Database BaaS
- **Supabase**: Base de datos (PostgreSQL), Auth, Storage y RLS.
  - `@supabase/ssr`: Manejo de auth y cookies seguras en Server Components y Server Actions.
  - `@supabase/supabase-js`: Cliente genérico para mutaciones y suscripciones WebSockets (`wss://*.supabase.co`).
  - RPCs con soporte de deduplicación atómica (`crear_alquiler_transaccional`), tablas de gobernanza (`empresas`, `usuarios`, `roles`, `audit_logs`) e índices únicos condicionales.
- **Prisma (v7.10.0)**: Generación de tipos y cliente de datos (`@prisma/client`).

## State Management
- **Zustand (v5.0.15)**: Manejo de estado local en cliente con persistencia en `localStorage`, transiciones optimistas y rollback ante errores (`alquilerStore`, `bodegaStore`, `cajaStore`, `clienteStore`, `empresaStore`, `toastStore`, `ledgerStore`).

## Distributed Caching & Performance
- **Upstash Redis**: Caché distribuida serverless con claves por tenant y control de sesiones:
  - `cache:compras:${tenantId}`
  - `cache:proveedores:${tenantId}`
  - `cache:equipos:${tenantId}`
  - `cache:cotizaciones:${tenantId}`
  - `cache:tenant:${tenantId}:modulos`: Caché de módulos habilitados por empresa.
  - `session:user:${userId}`: Hash de sesión activa para invalidación atómica instantánea (<1s) ante revocación de acceso o cambio de rol por UltraAdmin.
  - Invalidadas atómicamente tras cada mutación.

## Integrations & Services
- **Motor de Idempotencia & Poka-Yoke**: Validación dual-layer con esquemas Zod (`idempotency_key`), overlays visuales bloqueantes (`AlquilerBlockingOverlay.tsx`, `DevolucionBlockingOverlay.tsx`), supresión de teclado (`Enter`/`Escape`) y deshabilitación síncrona de botones en cliente.
- **Servicios Puros de Dominio, Contabilidad & Gobernanza**:
  - `licencias-modulos.service.ts`: Cálculo determinístico de días restantes de licencia, estado operativo (`ACTIVA`, `POR_VENCER`, `VENCIDA`), resolución de módulos por plan y feature flags dinámicos.
  - `cotizacion-tributaria.service.ts`: Liquidación tributaria completa de cotizaciones (IVA 19%, Retefuente 2.5%, ReteICA 9.66‰) y fletes de obra.
  - `pago-mixto.service.ts`: Validación multilínea de recaudos, imputación de saldo a favor y balance en partida doble ($\sum D + \sum C = 0$).
  - `arqueo-caja.service.ts`: Conteo ciego por denominaciones de billetes/monedas colombianas, justificación obligatoria y asiento contable de descuadre en Ledger.
  - `liquidacion-devolucion.service.ts`: Cálculo de split-line, deducción de daños/pérdidas y balance neto de garantías.
  - `liquidacion-subcontratacion.service.ts`: Cómputo a dos tiempos con aliados, retenciones DIAN (ReteFuente 2.5%, ReteICA 9.66‰) y partida doble balanceada en Ledger.
  - `calculo-compras-tributario.ts`: Liquidación tributaria de compras e inventario.
- **Dual PDF Engines**:
  1. `@react-pdf/renderer` (v3.4.5): Generación vectorial en cliente para contratos de alquiler.
  2. `EnterprisePDFService` / Modales HTML (`ReciboCajaMixtoPDFModal.tsx`, `ComprobanteDevolucionPDFModal.tsx`, `OrdenSubcontratacionPDFModal.tsx`, `VisorDocumentoPDFModal.tsx`, `ComprobanteEntradaPDFModal.tsx`, `ComprobanteArqueoModal.tsx`): Emisión de Recibos Oficiales de Caja (Térmica POS 80mm y Carta), Actas de Devolución, Órdenes de Subcontratación, Facturas Comerciales, Cotizaciones de Obra, Órdenes de Compra y Comprobantes de Arqueo.
- **Zod (v3.23.8)**: Validación de esquemas y tipos estáticos de payloads (Security-First) en rutas API y Server Actions (`ultraadmin.ts`, etc.).
- **Stripe (v16.8.0)**: Pagos recurrentes y facturación multi-tenant (`js.stripe.com`).
- **Lucide React (v0.428.0)**: Biblioteca de iconos SVG ligeros para UI/UX de alta fidelidad.
- **Content-Security-Policy (CSP 3)**: Cabecera perimetral HTTP generada dinámicamente, optimizada para Next.js streaming hydration y Apple iOS WebKit.
