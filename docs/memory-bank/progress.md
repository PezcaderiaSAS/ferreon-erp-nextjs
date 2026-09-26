# Progress & Technical Debt — Alquileres System (FerreOn ERP & WMS)

## 1. Estado de Módulos del Sistema

| Módulo | Estado Funcional | Estado Arquitectónico | Observaciones / Calidad Certificada |
| :--- | :---: | :---: | :--- |
| **Alquileres & Cotizaciones** | 🟢 Operativo | 🟢 Modernizado (Hito 1) | Deconstruido a RSC + Suspense + Client Island. Server Action delgada y servicio de dominio puro. |
| **Compras & Proveedores** | 🟢 Operativo | 🟢 Modernizado (Hito 2) | Deconstruido a RSC + Suspense + Client Island. `ComprasTransaccionalService`, modales diferidos y Server Actions delgadas. |
| **Caja & Arqueos** | 🟢 Operativo | 🟢 Modernizado (Hito 3) | Deconstruido a RSC + Suspense + Client Island. `CajaTransaccionalService`, balance exacto y modales lazy. |
| **Bodega & WMS** | 🟢 Operativo | 🟢 Modernizado (Hito 4) | Deconstruido a RSC + Suspense + Client Island. `BodegaTransaccionalService`, Kardex inmutable y Poka-Yoke de mantenimiento. |
| **Devoluciones & Split-Line** | 🟢 Operativo | 🟢 Modernizado (Hito 5) | Deconstruido a RSC + Suspense + Client Island. `DevolucionesTransaccionalService`, Split-Line y modales On-The-Fly diferidos. |
| **Facturación & Cartera CXC** | 🟢 Operativo | 🟢 Modernizado (Hito 6) | Deconstruido a RSC + Suspense + Client Island. `FacturacionTransaccionalService`, modales lazy y cálculo financiero puro. |
| **Subcontrataciones** | 🟢 Operativo | 🟢 Modernizado (Hito 7) | Deconstruido a RSC + Suspense + Client Island. `SubcontratacionesTransaccionalService`, consolidación de 6 modales lazy y proxies transparentes. |
| **Gobernanza UltraAdmin** | 🟢 Operativo | 🟢 Modernizado (Hito 8) | Aprobación de Tenants, eliminación condicional de marcas de agua en PDFs y gestión IAM. |
| **UI/UX Linear & CSS Moderno** | 🟢 Certificado | 🟢 Canónico (Hito 9) | `DESIGN.md` y `systemPatterns.md` actualizados. `<LinearDataTable<T>>` y `<ContratosAlquilerTable />` implementados. |
| **Blindaje Legal & AppSec** | 🟢 Certificado | 🟢 Canónico (Hito 10) | Términos blindados (As Is, Liability Cap, Human-in-the-Loop), RLS + Cookies, Modal bloqueante, anti-copyleft (`exceljs`), env Zod fail-fast y `safeServerAction`. |
| **Landing Page SaaS** | 🟢 Operativo | 🟢 Excelente | 9 secciones dinámicas, multi-moneda (COP/USD) y responsive design. |


---

## 2. Checklist de Hitos Culminados

### Hito 1: Alquileres & Resiliencia WMS (`SPEC-2026-ARCH-RESTRUCT-001`)
- [x] Memory Bank Canónico (`docs/memory-bank/`) inicializado y enlazado en `AGENTS.md`.
- [x] Migración SQL con RPCs pesimistas `alquiler_despachar_items_v1`, `alquiler_devolver_items_v1` y constraint de idempotencia.
- [x] `AlquilerTransaccionalService` en `src/core/services/`.
- [x] Server Actions de alquileres refactorizadas (< 80 líneas).
- [x] `alquileres/page.tsx` deconstruida a RSC con `<Suspense>` y virtualizador a 60 fps.
- [x] Retiro de `persist` para colecciones masivas en Zustand.

### Hito 2: Compras & Directorio de Proveedores (`SPEC-2026-ARCH-RESTRUCT-002`)
- [x] Reubicación de modales de compras y proveedores hacia `src/components/` con proxies re-export.
- [x] Creación de `ComprasTransaccionalService` en `src/core/services/` (liquidación tributaria, ledger contable, RPC de recepción).
- [x] Server Actions de compras refactorizadas (< 80 líneas) con Zod, `AuditLogger` y `safeRevalidatePath`.
- [x] `compras/page.tsx` transformada de monolito (1,234 líneas) a RSC (~45 líneas) con prefetching concurrente en servidor.
- [x] `ComprasInteractiveIsland.tsx` con lazy-loading de los 6 modales pesados.
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 272/272 tests unitarios pasando al 100%.

### Hito 3: Caja, Arqueos & Movimientos POS (`SPEC-2026-ARCH-RESTRUCT-003`)
- [x] Creación de `CajaTransaccionalService` en `src/core/services/` (Poka-Yoke de sesión única, egresos menores, balance y ajuste contable por descuadre).
- [x] Server Actions de caja refactorizadas (< 80 líneas) con Zod, `AuditLogger` y `safeRevalidatePath`.
- [x] `caja/page.tsx` transformada de monolito (566 líneas) a RSC (~42 líneas) con prefetching concurrente en servidor y streaming `<Suspense>`.
- [x] `CajaSkeleton.tsx` y `CajaInteractiveIsland.tsx` con carga diferida (`next/dynamic`) de los 4 modales pesados.
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 272/272 tests unitarios pasando al 100%.

### Hito 4: Bodega, Inventario & Kardex (`SPEC-2026-ARCH-RESTRUCT-004`)
- [x] Consolidación de modales `EditarEquipoModal` y `KardexEquipoModal` en `src/components/bodega/` con proxies retrocompatibles en `src/app/components/bodega/`.
- [x] Creación de `BodegaTransaccionalService` en `src/core/services/bodega-transaccional.service.ts` con cálculo O(N) de métricas de inventario y valorización, registro con entrada inicial en Kardex y Poka-Yoke de liberación de mantenimiento.
- [x] Enriquecimiento de `src/app/actions/equipos.ts` con `obtenerEquiposAction()`, `liberarMantenimientoAction()` y `obtenerKardexEquipoAction()` con auditoría e invalidación de caché.
- [x] Creación de `BodegaSkeleton.tsx` con shimmer adaptado a tokens de diseño para streaming sin CLS.
- [x] Creación de `BodegaInteractiveIsland.tsx` con filtros reactivos Zero-Latency, lazy-loading de modales y feedback optimista.
- [x] Transformación de `src/app/bodega/page.tsx` de monolito cliente (495 líneas) a RSC conciso (~25 líneas).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 295/295 tests pasando al 100% (**57 suites en verde**).

### Hito 5: Devoluciones & Modales On-The-Fly (`SPEC-2026-ARCH-RESTRUCT-005`)
- [x] Creación de `DevolucionesTransaccionalService` en `src/core/services/devoluciones-transaccional.service.ts` con mapeo puro de contratos con maquinaria pendiente en obra, validación de Split-Line (`evaluarSplitLine`), filtrado reactivo insensible a diacríticos y adaptación estricta de actas a comprobantes PDF.
- [x] Creación de `DevolucionesSkeleton.tsx` con shimmer adaptado a tokens de diseño para streaming sin CLS.
- [x] Creación de `DevolucionesInteractiveIsland.tsx` con carga diferida (`next/dynamic`) de `InspeccionTecnicaModal` y `ComprobanteDevolucionPDFModal` acompañados de `ModalSkeleton`.
- [x] Exportación centralizada en `src/components/devoluciones/index.ts`.
- [x] Deconstrucción de `src/app/devoluciones/page.tsx` de monolito cliente (446 líneas) a React Server Component conciso (~35 líneas) con prefetch concurrente vía `Promise.all` y streaming `<Suspense>`.
- [x] Suite de pruebas unitarias dedicada en `tests/unit/devoluciones-transaccional.service.test.ts` (6/6 pruebas pasando al 100%).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 300/300 tests pasando al 100%.

### Hito 6: Facturación & Cartera CXC (`SPEC-2026-ARCH-RESTRUCT-006`)
- [x] Creación de `FacturacionTransaccionalService` en `src/core/services/facturacion-transaccional.service.ts` con mapeo puro de alquileres a facturas comerciales (`mapearAlquileresAFacturas`), clasificación exacta de cartera (`Pagada`, `Pendiente`, `Vencida`), cálculo de KPIs matemáticos sin mutaciones (`calcularKPIsFacturacion`), filtrado insensible a diacríticos (`filtrarFacturas`) y construcción tipada del payload PDF oficial (`construirPayloadFacturaPDF`).
- [x] Creación de `FacturacionSkeleton.tsx` con header, 3 KPI cards, filtros y tabla shimmer para CLS = 0.
- [x] Creación de `FacturacionInteractiveIsland.tsx` con carga diferida (`next/dynamic`) de `RegistrarPagoMixtoModal`, `ReciboCajaMixtoPDFModal`, `ReciboPagoModal` y `VisorDocumentoPDFModal`.
- [x] Consolidación de `ReciboPagoModal.tsx` en `src/components/facturacion/` y proxy retrocompatible en `src/app/components/facturacion/`.
- [x] Exportación centralizada en `src/components/facturacion/index.ts`.
- [x] Deconstrucción de `src/app/facturacion/page.tsx` de monolito cliente (546 líneas) a React Server Component conciso (~30 líneas) con prefetch en servidor y streaming `<Suspense>`.
- [x] Suite de pruebas unitarias dedicada en `tests/unit/facturacion-transaccional.service.test.ts` (5/5 pruebas pasando al 100%).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 306/306 tests pasando al 100% (**59 suites en verde**).

### Hito 7: Subcontrataciones & Tercerización (`SPEC-2026-ARCH-RESTRUCT-007`)
- [x] Consolidación y reubicación de los 6 modales pesados hacia `src/components/subcontrataciones/` con exportaciones nombradas y default (`CrearSubcontratacionModal`, `CrearProveedorModal`, `DetalleSubcontratacionModal`, `DevolucionSubcontratacionModal`, `LiquidarSubcontratacionModal`, `OrdenSubcontratacionPDFModal`).
- [x] Creación de 6 proxies transparentes en `src/app/components/subcontrataciones/` garantizando 100% de retrocompatibilidad.
- [x] Barrel export unificado en `src/components/subcontrataciones/index.ts`.
- [x] Creación de `SubcontratacionesTransaccionalService` en `src/core/services/subcontrataciones-transaccional.service.ts` con cálculo O(N) de KPIs financieros (`costoTotalActivo`, `ingresoTotalActivo`, `margenTotalActivo`, `margenPct`), enriquecimiento inmutable (`enriquecerSubcontrataciones`), detección de órdenes vencidas (`esOrdenVencida`), filtrado insensible a diacríticos (`filtrarSubcontrataciones`) y construcción de payload tipado de orden PDF (`construirPayloadOrdenPDF`).
- [x] Creación de `SubcontratacionesSkeleton.tsx` para streaming declarativo sin cambios acumulativos de layout (CLS = 0).
- [x] Creación de `SubcontratacionesInteractiveIsland.tsx` con carga diferida (`next/dynamic` + `ModalSkeleton`) para los 6 modales pesados, reduciendo drásticamente el First Load JS bundle.
- [x] Deconstrucción de `src/app/subcontrataciones/page.tsx` a un React Server Component (~45 líneas) con prefetching en servidor y streaming `<Suspense fallback={<SubcontratacionesSkeleton />}>`.
- [x] Suite de pruebas unitarias dedicada en `tests/unit/subcontrataciones-transaccional.service.test.ts` (28 pruebas pasando al 100%).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 334/334 tests pasando al 100% (**60 suites en verde**).

### Track WMS: Alquileres Segmentados y Concurrentes por Ítem (`SPEC-2026-WMS-CONCURRENT-RENTALS-001`)
- [x] TAREA-01: Migración de Base de Datos y Backfill histórico con `ROW_NUMBER()`.
- [x] TAREA-02: Función Almacenada RPC `alquiler_despachar_segmentado_concurrente_v1` con curva de concurrencia y `SELECT ... FOR UPDATE`.
- [x] TAREA-03: Esquema Prisma actualizado (`lineaNumero`, `tarifaPersonalizada`, `subtotalPersonalizado`) y regeneración de cliente.
- [x] TAREA-04: Esquema de Validación Zod (`ContratoSegmentadoZodSchema`) y método `calcularLiquidacionSegmentada`.
- [x] TAREA-05: Server Action robusta (`crearAlquilerSegmentadoAction`) con try-catch anidado y respuestas estructuradas.
- [x] TAREA-06: Motor PDF tolerante a fallos (`ContratoAlquilerPDF.tsx`) con función pura `sanitizarYOrdenarLineas`, ordenamiento cronológico estricto y leyenda condicional para personalizaciones.
- [x] TAREA-07: Formulario reactivo dinámico (`LineasSegmentadasArray.tsx`) con continuación de tramos (`handleContinuarTramo`) y Modal Asistido de Sobreventa (`ModalResolucionOverbooking.tsx`) con soporte Escape y ARIA.
- [x] TAREA-08: Suite Completa de Pruebas Unitarias e Integración con Vitest pasando al 100%.

### Hito 7: Subcontrataciones & Tercerización (`SPEC-2026-ARCH-RESTRUCT-007`)
- [x] Revisión del servicio de dominio preexistente en `src/core/services/subcontrataciones-transaccional.service.ts` y extensión con tipos `SubcontratacionEnriquecida`, `KPIsSubcontrataciones`, `PayloadOrdenPDF` y funciones `enriquecerSubcontrataciones`, `calcularKPIsSubcontrataciones`, `construirPayloadOrdenPDF`.
- [x] Corrección de import faltante `useAlquilerStore` en `src/components/subcontrataciones/CrearSubcontratacionModal.tsx`.
- [x] Creación de `SubcontratacionesSkeleton.tsx` con shimmer 4 KPI cards + filtros + 6 filas tabla para CLS = 0.
- [x] Creación de `SubcontratacionesInteractiveIsland.tsx` con carga diferida (`next/dynamic`) de los 6 modales pesados y mapa de variantes cromáticas de estado.
- [x] Exportación centralizada en `src/components/subcontrataciones/index.ts`.
- [x] Deconstrucción de `src/app/subcontrataciones/page.tsx` de monolito cliente (502 líneas) a React Server Component conciso (~40 líneas) con prefetch en servidor y streaming `<Suspense>`.
- [x] Suite de pruebas unitarias dedicada en `tests/unit/subcontrataciones-transaccional.service.test.ts` (28/28 pruebas pasando al 100%).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y 334/334 tests pasando al 100% (**60 suites en verde**).

### Hito 8: Gobernanza UltraAdmin & Onboarding SaaS Multi-Tenant
- [x] Provisionamiento automático de datos dummy (14 días gratis) mediante trigger `on_auth_user_created_provision_tenant` y RPC `seed_dummy_tenant_data`.
- [x] Marca de agua de prueba condicional en PDFs para inquilinos no autorizados (`autorizado = false`).
- [x] Server Action `aprobarTenantAction` en `src/app/actions/ultraadmin.ts` con verificación de privilegios `ULTRAADMIN`, invalidación en Upstash Redis y auditoría inmutable.
- [x] Creación de `useUltraAdminStore` en `src/infrastructure/state/ultraAdminStore.ts` con mutaciones optimistas para experiencia Zero-Latency.
- [x] Creación del componente `<TenantListTable />` con filtrado por pills (`Todos`, `Pendientes de Aprobación`, `Activas`, `Suspendidas`, `Expiradas`) y diseño Glassmorphism dark-slate.
- [x] Creación del componente `<TenantDetailDrawer />` con pestañas de Info/Aprobación oficial, Licencias/Módulos ERP y gestión de Usuarios IAM.
- [x] Integración transversal en la ruta protegida `/admin/empresas` con conmutador de vistas (`Gobernanza & Aprobación` vs `Directorio Completo`).
- [x] Verificación completa de compilación (`npm run build` en verde, 24/24 rutas estáticas y dinámicas optimizadas).

### Hito 9: UI/UX Linear High-Density & Verdad Absoluta CSS Moderno (`SPEC-2026-UIUX-LINEAR-MODERN-CSS-001`)
- [x] Consolidación en `DESIGN.md` de las 5 decisiones de ingeniería inversa de Linear (Densidad Quirúrgica 30px, Bordes sutiles `shadow-none`, Minimalismo monocromático por opacidad, Navegación por teclado con `Ctrl+K` y cuadrícula métrica rígida).
- [x] Incorporación como Verdad Absoluta en `DESIGN.md` y `systemPatterns.md` de las 5 Leyes Inmutables de CSS Moderno (place-items/align-content centrado, stacking isolation con `isolation: isolate`, gobernanza de espaciado por contenedor con `gap`, viewports dinámicos `min-height: 100dvh` y cascada formal `@layer`).
- [x] Creación de `<LinearDataTable<T>>` en `src/components/ui/linear-table/LinearDataTable.tsx` con motor de teclado (`↑`/`↓`, `J`/`K`, `Enter`, `X`/`Espacio`, `C`, `F`, `Escape`), Command Palette contextual flotante y barra de acciones en lote.
- [x] Creación de implementación de referencia `<ContratosAlquilerTable />` en `src/components/alquileres/ContratosAlquilerTable.tsx` aplicando las 5 leyes y directrices sobre contratos de maquinaria WMS en Alquileres System.

