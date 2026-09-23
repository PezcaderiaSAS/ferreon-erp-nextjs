<!-- Generated: 2026-09-23 | Files scanned: ~98 | Token estimate: ~820 -->
# Alquileres System - Arquitectura de Alto Nivel

## Tipo de Sistema
Monolito moderno con Next.js 14 (App Router) y Backend-as-a-Service (BaaS) en Supabase (PostgreSQL 15).
Arquitectura Multi-tenant estricta gobernada por Row Level Security (RLS) y capa de caché distribuida en Upstash Redis.

## Arquitectura Dual-Híbrida de Presentación
El sistema implementa una separación perimetral de dos mundos estéticos y funcionales:
1. **Landing Page Institucional Pública (`/`)**:
   - Tema *Dark Institutional* (`#0F172A`, `#1E293B`, `#F59E0B` Ámbar de Maquinaria).
   - Diseñado para conversión comercial, confianza y captación B2B sin requerir autenticación.
   - 12 componentes modulares en `src/components/landing/` gobernados por configuración centralizada (`src/config/landing.ts`).
2. **ERP Operativo Empresarial Autenticado (`/dashboard` & Módulos)**:
   - Tema *Crisp Corporate Light* (`#F8FAFC`, `#0284C7`, `#3B82F6`).
   - Entorno de alta densidad de datos y transacciones financieras seguras.
   - Aislado perimetralmente dentro del `AppShell.tsx`.

## Límites de Componentes y Perímetro
- **Perímetro de Seguridad y Enrutamiento (`src/middleware.ts` & `src/components/layout/AppShell.tsx`)**:
  - `isStandaloneRoute`: Rutas públicas (`/`, `/design-system`, `/auth/*`, `/unauthorized`) se renderizan de forma autónoma sin barra lateral (Sidebar) ni cabecera operativa de ERP.
  - Content-Security-Policy (CSP 3) con soporte para streaming hydration en Next.js 14 (`self.__next_f.push`) y React 18.
  - Compatibilidad certificada con Apple iOS (WebKit / Safari): `worker-src 'self' blob:`, `child-src 'self' blob:`, WebSockets (`wss://*.supabase.co`).
  - Fast-paths perimetrales para assets internos (`/_next`), APIs JSON y guard de timeout de autenticación (1200ms).
- **Idempotencia & Poka-Yoke Visual Guard (`AlquilerBlockingOverlay.tsx`, `CotizacionBlockingOverlay.tsx`, `ConvertirCotizacionModal.tsx`)**:
  - Escudos visuales Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner sincronizado y bloqueo físico de clics múltiples (`pointer-events-none`) y atajos de teclado durante `isSubmitting`.
  - Generación de `idempotency_key` criptográfica única (UUID v4) transmitida por formulario y validada en RPC atómico.
  - Conversión 1-clic de cotizaciones a contratos con bloqueo pesimista en base de datos (`ORDER BY id ASC FOR UPDATE`).
- **Gobernanza UltraAdmin, Licenciamiento y Feature Flags (`src/app/admin/empresas/`, `src/core/services/licencias-modulos.service.ts`)**:
  - Supervisión cross-tenant transversal con selector universal en `/configuracion` y panel central en `/admin/empresas`.
  - Semáforo determinístico de 4 estados (`ACTIVA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`) con soporte para extensiones 1-clic (+15d, +30d, +90d, +365d).
  - Feature flags de módulos por tenant gobernados por `empresas.modulos_activos` (JSONB) con filtrado reactivo en `Sidebar.tsx`.
  - Suspensión y activación instantánea de cuentas con revocación atómica en Upstash Redis (`session:user:{id}`) en $<1$ segundo.
- **State Management**: Zustand (Modular Client Stores: `alquilerStore`, `bodegaStore`, `empresaStore`, `clienteStore`, `cajaStore`, `layoutStore`, `toastStore`, `ledgerStore`) con transiciones optimistas y rollback ante fallos.
- **Backend / Server Actions Layer (`src/app/actions/`)**:
  - Contratos y cotizaciones (`alquileres.ts`, `cotizaciones.ts`).
  - Tesorería y Cartera: Pagos mixtos multilínea con saldo a favor de clientes y partida doble (`pagos.ts`).
  - Devoluciones avanzadas con Split-Line y clasificación de inventario (`devoluciones.ts`).
  - Subcontrataciones de maquinaria aliada a dos tiempos y retenciones tributarias (`subcontrataciones.ts`).
  - Turnos, movimientos, arqueo ciego por denominaciones y comprobantes de caja (`caja.ts`).
  - Facturación comercial y compras con liquidación tributaria (`facturacion.ts`, `compras.ts`).
  - Directorio maestro de proveedores (`proveedores.ts`).
  - Auditoría asíncrona no bloqueante (`AuditLogger` en `audit_logs`).
- **Database Layer**: PostgreSQL (Supabase) con RLS estricto por tenant, tabla `audit_logs` inmutable, función `is_ultra_admin()` y RPCs transaccionales (`procesar_devolucion_avanzada`, `crear_alquiler_transaccional`, `recibir_compra_y_actualizar_pmp_transaccional`, `convertir_cotizacion_a_alquiler_transaccional`).
- **Accounting & Financial Ledger**: Motor de partida doble estricto ($\sum \text{Débitos} = \sum \text{Créditos}$) para Cuentas por Cobrar (`1305`), Cuentas por Pagar Proveedores (`2205`), Activo Fijo / Equipos (`1520`), Costos de Subcontratación (`6135`), IVA Descontable (`2408`), ReteFuente Pasivo (`2365`), ReteICA Pasivo (`2368`) y Tesorería (`1105`/`1110`).
- **Canonical Date Neutralizer (`src/core/utils/fechas.ts`)**:
  - Fijación canónica de mediodía (`12:00:00`) en `parsearFechaLocal` y `formatearFechaLocal` para neutralizar el desfase UTC-5 Colombia en PDFs y facturas.
- **Bodega Realtime Search & Ergonomics (`src/app/bodega/page.tsx`, `src/lib/utils.ts`)**:
  - Filtrado reactivo sin latencia (0 ms) con normalización Unicode (`normalize("NFD")`) sobre Nombre, SKU y Categoría.
  - Inputs numéricos ergonómicos con placeholder `0` y supresión de rebote al borrar.

## Flujo de Datos
Público: Landing Page (`/`) → Explorador de Módulos & Precios → Auth Login (`/auth/login`)
Privado: Usuario Autenticado → ERP Dashboard (`/dashboard`) → Combobox / Selectores Asistidos / Overlays Poka-Yoke → Server Actions (Zod SafeParse + Idempotency Guard) → Servicios de Dominio Puros → Supabase Postgres (RLS + RPC Transaccional con Lock Pesimista) + Redis Cache Invalidation → AuditLogger (`audit_logs`)
