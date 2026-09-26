# Active Context — Alquileres System (FerreOn ERP & WMS)

## 1. Estado de los Hitos Arquitectónicos Activos
- **Hito 1 (`SPEC-2026-ARCH-RESTRUCT-001`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Alquileres, Bodega RPC pesimista, Server Actions, Memory Bank Canónico).
- **Hito 2 (`SPEC-2026-ARCH-RESTRUCT-002`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Compras & Proveedores: RSC + Client Island + ComprasTransaccionalService).
- **Hito 3 (`SPEC-2026-ARCH-RESTRUCT-003`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Caja & Arqueos: RSC + Client Island + CajaTransaccionalService).
- **Hito 4 (`SPEC-2026-ARCH-RESTRUCT-004`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Bodega, Inventario & Kardex: RSC + Client Island + BodegaTransaccionalService + Poka-Yoke Mantenimiento).
- **Hito 5 (`SPEC-2026-ARCH-RESTRUCT-005`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Devoluciones & Modales On-The-Fly: RSC + Client Island + DevolucionesTransaccionalService + Split-Line + Shimmer Skeleton).
- **Hito 6 (`SPEC-2026-ARCH-RESTRUCT-006`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Facturación & Cartera CXC: RSC + Client Island + FacturacionTransaccionalService + Shimmer Skeleton + Modales Lazy).
- **Hito 7 (`SPEC-2026-ARCH-RESTRUCT-007`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Subcontrataciones & Tercerización: RSC + Client Island + SubcontratacionesTransaccionalService + SubcontratacionesSkeleton + Consolidación de 6 Modales Lazy + Proxies Retrocompatibles).
- **Hito 8 (Gobernanza UltraAdmin & Onboarding SaaS):** ✅ **100% COMPLETADO Y CERTIFICADO** (Aprobación de Tenants, eliminación condicional de marcas de agua en PDFs, estado global Zustand `useUltraAdminStore`, `<TenantListTable />` glassmorphic, `<TenantDetailDrawer />` multi-tab con autorización, extensiones de cortesía y gestión de usuarios IAM).
- **Hito 9 (UI/UX Linear High-Density & Verdad Absoluta CSS Moderno):** ✅ **100% COMPLETADO Y CERTIFICADO** (`SPEC-2026-UIUX-LINEAR-MODERN-CSS-001`: Inclusión en `DESIGN.md` y `systemPatterns.md` de las 5 decisiones de ingeniería inversa de Linear + 5 leyes inmutables de CSS moderno. Componentes `<LinearDataTable<T>>` y `<ContratosAlquilerTable />` en `src/components/ui/linear-table/` y `src/components/alquileres/`).
- **Hito 10 (Blindaje Legal, Licencias e Inmunidad AppSec - SPEC-2026-LEGAL-APPSEC-BLINDAJE-001):** ✅ **100% COMPLETADO Y CERTIFICADO** (Cláusulas 6 y 7 en `/terminos` con deslinde por cálculos algorítmicos, As Is, Liability Cap de 3 meses y Human-in-the-Loop; Aislamiento RLS y Cookies Técnicas en `/privacidad`; Componente `ConsentCheckbox` con soporte ARIA; `TermsReacceptanceModal` bloqueante en `/dashboard` con persistencia inmutable en `audit_logs`; Script `audit:licenses` anti-copyleft; Migración de `xlsx` a `exceljs` 100% MIT; Validación Zod fail-fast de entorno `src/config/env.ts`; Envoltorio `safeServerAction` y `promptSanitizer` anti-prompt injection).
- **Track WMS Concurrente (`SPEC-2026-WMS-CONCURRENT-RENTALS-001`):** ✅ **100% COMPLETADO Y CERTIFICADO** (Tareas 01 a 08 culminadas y certificadas: Migración SQL, RPC concurrente pesimista, Prisma Client v7, Zod dual-layer, Server Action delgada, TAREA-06: Motor PDF con sanitización cronológica y aislamiento try-catch por fila, TAREA-07: Formulario reactivo LineasSegmentadasArray con continuación de tramos y ModalResolucionOverbooking asistido con soporte de Escape y ARIA, Suite Vitest).

- **Estado de Pruebas:** 60 suites de pruebas / 334 tests pasando al 100%, 0 errores de TypeScript (`tsc --noEmit`), auditoría de 758 paquetes sin violaciones copyleft (`npm run audit:licenses`).

---

## 2. Decisiones de Arquitectura Consolidadas y Validadas

1. **Hito 1: Alquileres & Concurrencia WMS (Completado):**
   - Migración SQL `20260922_resiliencia_concurrencia_wms_y_rpc.sql` con `alquiler_despachar_items_v1` (`SELECT ... FOR UPDATE`), `alquiler_devolver_items_v1` y `editar_alquiler_transaccional_v1`.
   - `AlquilerTransaccionalService` en `src/core/services/` como dominio puro.
   - Deconstrucción de `alquileres/page.tsx` a RSC con streaming `<Suspense>` y `AlquileresInteractiveIsland.tsx` con virtualizador a 60 fps.
   - Deserialización de Zustand (`alquilerStore`, `bodegaStore`) para evitar fugas de memoria en `localStorage`.

2. **Hito 2: Compras & Directorio de Proveedores (Completado):**
   - **Capa de Dominio:** Creación de `ComprasTransaccionalService` en `src/core/services/compras-transaccional.service.ts` (liquidación tributaria, ledger contable, RPC de recepción y PMP).
   - **Server Actions Delgadas:** Refactorización de `src/app/actions/compras.ts` (< 80 líneas por acción) con Zod, `AuditLogger.logAsync`, Redis y `safeRevalidatePath`.
   - **Consolidación de Componentes:** Traslado de modales de compras y proveedores a `src/components/compras/` y `src/components/proveedores/`, manteniendo proxies re-export para compatibilidad.
   - **React Server Component (RSC):** Deconstrucción de `src/app/compras/page.tsx` (1,234 líneas) a un Server Component conciso (~45 líneas) con prefetching concurrente y streaming vía `<Suspense fallback={<ComprasSkeleton />}>`.
   - **Client Island:** Creación de `ComprasInteractiveIsland.tsx` con carga diferida (`next/dynamic`) de los 6 modales pesados.

3. **Hito 3: Caja, Arqueos & Movimientos POS (Completado):**
   - **Capa de Dominio:** Creación de `CajaTransaccionalService` en `src/core/services/caja-transaccional.service.ts` aislando Poka-Yoke de sesión activa única por cajero, balance en tiempo real, validación estricta de egresos menores y generación de asientos contables de ajuste por descuadre.
   - **Server Actions Delgadas:** Refactorización de `src/app/actions/caja.ts` a Server Actions delgadas con validación Zod, `AuditLogger.logAsync`, invalidación de caché y `safeRevalidatePath`.
   - **React Server Component (RSC):** Transformación de `src/app/caja/page.tsx` (566 líneas) a un RSC de 42 líneas con prefetching en servidor y streaming `<Suspense fallback={<CajaSkeleton />}>`.
   - **Client Island:** Creación de `CajaInteractiveIsland.tsx` con lazy-loading (`next/dynamic`) de los modales de apertura, movimiento menor, arqueo y comprobante oficial.

4. **Hito 4: Bodega, Inventario & Kardex (Completado):**
   - **Capa de Dominio Puro:** Creación de `BodegaTransaccionalService` en `src/core/services/bodega-transaccional.service.ts` con cálculo O(N) de métricas de inventario y valorización, registro con entrada inicial en Kardex, y Poka-Yoke de liberación de unidades en mantenimiento.
   - **Server Actions Delgadas:** Enriquecimiento de `src/app/actions/equipos.ts` con `obtenerEquiposAction()`, `liberarMantenimientoAction()` y `obtenerKardexEquipoAction()` integrando auditoría con nuevo evento `LIBERAR_MANTENIMIENTO` e invalidación de caché multi-tenant.
   - **Consolidación de Modales:** Reubicación de `EditarEquipoModal` y `KardexEquipoModal` a `src/components/bodega/` con re-exports duales (nombrado + default) y proxies transparentes en `src/app/components/bodega/`.
   - **React Server Component (RSC):** Deconstrucción de `src/app/bodega/page.tsx` (495 líneas) a un RSC conciso (~25 líneas) con prefetching en servidor y streaming `<Suspense fallback={<BodegaSkeleton />}>`.
   - **Client Island:** Creación de `BodegaInteractiveIsland.tsx` con carga diferida (`next/dynamic`), filtros reactivos sin latencia e interacción optimista para liberación de mantenimiento.
   - **Suite Vitest:** Pruebas unitarias en `tests/unit/bodega-transaccional-service.test.ts` pasando al 100%.

5. **Hito 5: Devoluciones & Modales On-The-Fly (Completado):**
   - **Capa de Dominio Puro:** Creación de `DevolucionesTransaccionalService` en `src/core/services/devoluciones-transaccional.service.ts` con mapeo de contratos con pendientes en obra, evaluación de Split-Line (`evaluarSplitLine`), filtrado reactivo insensible a diacríticos y adaptación estricta de actas a comprobantes PDF.
   - **React Server Component (RSC):** Deconstrucción de `src/app/devoluciones/page.tsx` (446 líneas) a un RSC conciso (35 líneas) con prefetch concurrente vía `Promise.all` (`obtenerAlquileresAction()`, `obtenerHistorialDevolucionesAction()`, `obtenerSesionActivaAction()`) y streaming bajo `<Suspense fallback={<DevolucionesSkeleton />}>`.
   - **Client Island & Modales On-The-Fly:** Creación de `DevolucionesInteractiveIsland.tsx` con lazy-loading (`next/dynamic`) de `InspeccionTecnicaModal` y `ComprobanteDevolucionPDFModal` acompañados de `ModalSkeleton`.
   - **Skeleton Shimmer:** Creación de `DevolucionesSkeleton.tsx` para eliminar saltos acumulativos de layout (CLS = 0) durante el streaming.
   - **Suite Vitest:** Nueva suite de pruebas unitarias en `tests/unit/devoluciones-transaccional.service.test.ts` con 6/6 pruebas aprobadas (100%).

6. **Hito 6: Facturación & Cartera CXC (Completado):**
   - **Capa de Dominio Puro:** Creación de `FacturacionTransaccionalService` en `src/core/services/facturacion-transaccional.service.ts` con mapeo puro de alquileres a facturas comerciales (`mapearAlquileresAFacturas`), clasificación exacta de cartera (`Pagada`, `Pendiente`, `Vencida`), cálculo de KPIs matemáticos sin mutaciones (`calcularKPIsFacturacion`), filtrado insensible a diacríticos (`filtrarFacturas`) y construcción tipada del payload PDF oficial (`construirPayloadFacturaPDF`).
   - **React Server Component (RSC):** Deconstrucción de `src/app/facturacion/page.tsx` (546 líneas de cliente) a un RSC conciso (30 líneas) con prefetch en servidor vía `obtenerAlquileresAction()` y streaming declarativo bajo `<Suspense fallback={<FacturacionSkeleton />}>`.
   - **Client Island & Modales Lazy:** Creación de `FacturacionInteractiveIsland.tsx` con lazy-loading (`next/dynamic`) de `RegistrarPagoMixtoModal`, `ReciboCajaMixtoPDFModal`, `ReciboPagoModal` y `VisorDocumentoPDFModal`.
   - **Skeleton Shimmer:** Creación de `FacturacionSkeleton.tsx` con header, 3 KPI cards, filtros y tabla shimmer para CLS = 0.
   - **Consolidación de Componentes:** Reubicación de `ReciboPagoModal.tsx` en `src/components/facturacion/` con proxy re-export en `src/app/components/facturacion/`.
   - **Suite Vitest:** Nueva suite en `tests/unit/facturacion-transaccional.service.test.ts` con 5/5 pruebas aprobadas (100%).

7. **Track WMS Concurrente (Alquileres Segmentados y Concurrentes por Ítem):**
   - **TAREA-06 (Motor PDF Resiliente):** Función pura `sanitizarYOrdenarLineas` en `src/components/pdf/ContratoAlquilerPDF.tsx` con ordenamiento cronológico estricto, aislamiento por fila con `try-catch` y leyenda para tarifas pactadas por tramo.
   - **TAREA-07 (Formulario Dinámico y Modal Overbooking):** `LineasSegmentadasArray.tsx` y `ModalResolucionOverbooking.tsx` con continuación de tramos (`handleContinuarTramo`) y 4 vías asistidas de resolución con accesibilidad ARIA y Escape.

8. **Hito 7: Subcontrataciones & Tercerización (Completado):**
   - **Capa de Dominio Puro:** Creación de `SubcontratacionesTransaccionalService` en `src/core/services/subcontrataciones-transaccional.service.ts` con cálculo O(N) de KPIs financieros (`costoTotalActivo`, `ingresoTotalActivo`, `margenTotalActivo`, `margenPct`), enriquecimiento inmutable (`enriquecerSubcontrataciones`), detección de órdenes vencidas (`esOrdenVencida`), filtrado insensible a diacríticos (`filtrarSubcontrataciones`) y construcción de payload tipado de orden PDF (`construirPayloadOrdenPDF`).
   - **Consolidación de Modales:** Reubicación de los 6 modales (`CrearSubcontratacionModal`, `CrearProveedorModal`, `DetalleSubcontratacionModal`, `DevolucionSubcontratacionModal`, `LiquidarSubcontratacionModal`, `OrdenSubcontratacionPDFModal`) en `src/components/subcontrataciones/` con exportaciones nombradas y default, y proxies transparentes en `src/app/components/subcontrataciones/` garantizando 100% de retrocompatibilidad.
   - **React Server Component (RSC):** Transformación de `src/app/subcontrataciones/page.tsx` a un Server Component conciso (~45 líneas) con prefetching en servidor (`obtenerSubcontratacionesAction()`) y streaming bajo `<Suspense fallback={<SubcontratacionesSkeleton />}>`.
   - **Client Island:** Creación de `SubcontratacionesInteractiveIsland.tsx` con carga perezosa (`next/dynamic` + `ModalSkeleton`) para los 6 modales pesados, reduciendo drásticamente el First Load JS.
   - **Skeleton Shimmer:** Creación de `SubcontratacionesSkeleton.tsx` para eliminar saltos acumulativos de layout (CLS = 0).
   - **Suite Vitest:** 28 pruebas unitarias en `tests/unit/subcontrataciones-transaccional.service.test.ts` pasando al 100% (total global de 334 tests en 60 suites).

9. **Hito 9: UI/UX Linear High-Density & Verdad Absoluta CSS Moderno (`SPEC-2026-UIUX-LINEAR-MODERN-CSS-001`):**
   - **Consolidación Canónica:** Incorporación en `DESIGN.md` y `systemPatterns.md` de las 5 decisiones de ingeniería inversa de Linear (Densidad quirúrgica de 30px, bordes sutiles sin sombras estáticas, minimalismo monocromático con opacidad, navegación por teclado con `Ctrl+K` y cuadrícula métrica rígida).
   - **Leyes Inmutables de CSS Moderno:** Mandato absoluto para desterrar patrones obsoletos: `grid place-items-center` / `align-content: center` (en vez de `absolute + transform`), `isolation: isolate` (en vez de `z-index: 9999`), `gap` en contenedor (en vez de `margin-bottom` + `:last-child`), `min-height: 100dvh` (en vez de `height: 100%`) y cascada por `@layer` (en vez de `!important`).
   - **Estándar Universal en `globals.css`:** Enforce de `min-height: 100dvh` en `body` y declaración de primitivas utilitarias (`.place-center`, `.content-center-modern`, `.stack-isolate`, `.min-h-dvh`, `.linear-row`, `.linear-card`, `.linear-dot`) dentro de `@layer utilities`.
   - **Componente Reutilizable Universal:** Implementación de `<LinearDataTable<T>>` en `src/components/ui/linear-table/` e implementación de referencia `<ContratosAlquilerTable />` en `src/components/alquileres/ContratosAlquilerTable.tsx`.
   - **Refactorización Activa en Pantallas de Producción:**
     - `AlquileresInteractiveIsland.tsx`: Tablas de cotizaciones y contratos convertidas a filas compactas de 30px (`h-7.5`), `table-fixed`, dot status badges sutiles, micro-acciones y aislamiento de apilamiento (`isolate`).
     - `SubcontratacionesInteractiveIsland.tsx`: Refactorización de cabecera, KPIs con densidad quirúrgica y cero sombras, barra de pestañas compactas y tabla de órdenes con dot badges y `tabular-nums font-mono`.
     - `TenantListTable.tsx`: Pestañas compactas de gobernanza SaaS, tabla de 30px por fila con `shadow-none` y badges circulares de estado de suscripción.
     - `DevolucionesInteractiveIsland.tsx`: Pestañas compactas, buscador ergonómico con shortcut `/`, y tablas de contratos pendientes e histórico de actas con filas de 30px y centrado moderno en estados vacíos.

---

## 3. Próximos Pasos en el Roadmap
- **Hito 8 / Auditoría Integral:** Revisión de performance web, Core Web Vitals y verificación E2E de flujos integrados en Alquileres System.
