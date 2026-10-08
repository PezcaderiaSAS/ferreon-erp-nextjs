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
| **Dashboard & Calendario** | 🟢 Operativo | 🟢 Modernizado (Hito 17) | Deconstruido a RSC + Suspense + Client Island. 4 KPIs en vivo, layout 65/35, Calendario interactivo (Mes/Semana/Agenda), Drawer con '+ Nuevo Alquiler', Tareas y Feed de alertas. |


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
- [x] Refinamiento de UX/UI en Bodega: Inserción atómica masiva (`crearEquiposMasivoAction`), restricción de categorías a listas cerradas y blindaje inmutable (read-only) de auto-generación de SKUs en UI.
- [x] Refactorización Data-Layer en Bodega: Ejecución de purga y re-secuenciación de SKUs corruptos (timestamps largos) directamente en Supabase, reestableciendo el consecutivo estricto `EQ-XXX`.
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

### Hito 13: Certificación de Calidad End-to-End con Playwright
- [x] Instalación de infraestructura de navegadores Playwright en entorno local (Chromium v1234, FFmpeg v1011).
- [x] Configuración optimizada en `playwright.config.ts` (`webServer` en puerto 3000 con `reuseExistingServer: true` y retries configurados).
- [x] Cobertura E2E transversal en 7 suites críticas (16 escenarios automatizados):
  - `e2e/alquileres-lifecycle.spec.ts`: 2 escenarios (filtros, buscador reactivo y estados).
  - `e2e/auth-onboarding.spec.ts`: 3 escenarios (login institucional, onboarding tenant con campos corporativos y bloqueo de términos).
  - `e2e/caja-finanzas.spec.ts`: 2 escenarios (caja menor, arqueos y consulta de historial).
  - `e2e/clientes-crud.spec.ts`: 2 escenarios (búsqueda reactiva, apertura/cierre de modal de alta de cliente).
  - `e2e/cotizaciones-formalizacion.spec.ts`: 2 escenarios (filtrado de cotizaciones y ratificación ante vencimiento).
  - `e2e/subcontrataciones-lifecycle.spec.ts`: 3 escenarios (KPIs financieros, filtrado por tabs y modal con semáforo de rentabilidad).
  - `e2e/ultraadmin-governance.spec.ts`: 2 escenarios (protección de ruta /admin/empresas y drawer de gestión).
- [x] Verificación de ejecución: **16/16 tests pasando al 100% en verde** en Chromium.
- [x] Código sincronizado y certificado en `origin main` (commit `4f4aef9a`).

### Hito 15: Adaptación Legal de PDF a Cuenta de Cobro (`SPEC-2026-LEGAL-CUENTA-COBRO-001`)
- [x] Alineación interactiva `/grill-me` sobre directrices de titulación global, cláusulas del Estatuto Tributario y formato del consecutivo.
- [x] Especificación técnica y plan arquitectónico Speckit (`spec_cuenta_de_cobro.md`).
- [x] Actualización de `EnterprisePDFService` en `src/core/services/pdf-factura-generator.service.ts`: titulación oficial "CUENTA DE COBRO", prefijo "CC-", leyenda fija del Art. 616-1 y Art. 437 Par. 3 del E.T., y pie de página de cobro.
- [x] Actualización de `ContratoAlquilerPDF.tsx` en `src/components/pdf/`: sanitización de consecutivo a `CC-#00XXX`, título "CUENTA DE COBRO", valor en letras a cobrar, cláusula tributaria colombiana y firmas legales de acreedor/deudor.
- [x] Actualización de `VisorDocumentoPDFModal.tsx` con título badge `Cuenta de Cobro #${documento.consecutivo}`.
- [x] Actualización de `AlquileresInteractiveIsland.tsx` garantizando emisión bajo tipo `CUENTA_COBRO`.
- [x] Ampliación de tests en `tests/unit/contrato-pdf-cliente-real.test.ts` verificando título, consecutivo CC, leyenda legal colombiana y regeneración retrocompatible (100% en verde).
- [x] Verificación global: `tsc --noEmit` con 0 errores y 13/13 tests de motores PDF aprobados.

### Hito 16: Auditoría de Producción, Tokens W3C, Marca Canónica y Figma en Vivo (`SPEC-2026-FIGMA-DEVTOOLS-001`)
- [x] Auditoría integral de las 8 rutas de producción en Vercel con Chrome DevTools MCP.
- [x] Homologación de marca canónica obligatoria "Alquileres System SaaS" en Sidebar, TopNav y metadata.
- [x] Corrección de CSP para carga de avatares Dicebear en `/configuracion` y timeout de middleware elevado a 2500ms.
- [x] Favicon dinámico en `icon.tsx` y atributos a11y (`id`, `name`, `htmlFor`, `aria-label`) en formularios.
- [x] Catálogo W3C Design Tokens JSON (`figma_design_tokens.json`) con modos duales (*Salmón Pastel* y *Cyber Cyan*).
- [x] Blueprint de Componentes para Figma (`figma_components_blueprint.md`).
- [x] Plugin nativo interactivo y bidireccional Sync Studio v2.0 (`figma-tokens-sync/` con `manifest.json`, `code.js`, `ui.html` y `inject-tokens-console.js`) para sincronización código ⇄ Figma sin dependencias SaaS.
- [x] Cobertura visual del 100% de las 14 pantallas canónicas importadas y auditadas en Figma (`xQ7iOmkYpLy6F1H9QnYv5F`).
- [x] Inyección de 33 variables oficiales con soporte dual adaptado a Figma Free (*Salmon Pastel* y *Cyber Cyan*), 9 espaciados y 6 radios.
- [x] Vinculación nativa certificada de **6,389 capas y nodos vectoriales** a las Variables de diseño de Alquileres System.
- [x] Purgado de frames duplicados y huérfanos.
- [x] Reportes generados: `figma_live_audit_report.md` y `figma_verification_complete_report.md`.

### Hito 17: Centro de Control Operativo y Calendario Multi-Flujo (`SPEC-2026-DASHBOARD-CALENDAR-001`)
- [x] Especificación formal `OptimizedPrompt` JSON y resolución completa del árbol de diseño vía `/grill-me`.
- [x] Tipado estricto en `src/core/types/dashboard.ts` y re-export en `src/types/dashboard.ts` (`DashboardKPIs`, `EventoCalendario`, `TareaOperativa`, `AlertaSistema`).
- [x] Dominio transaccional puro en `src/core/services/dashboard-transaccional.service.ts` con cálculo O(N) de utilización de flota, contratos activos, devoluciones hoy y cartera en mora.
- [x] Suite de pruebas unitarias Vitest en `tests/unit/dashboard-transaccional.service.test.ts` pasando al 100% (7/7 tests).
- [x] Server Actions `obtenerDashboardDataAction` y `crearTareaManualAction` en `src/app/actions/dashboard.ts` con consultas concurrentes `Promise.all` en Supabase.
- [x] `DashboardSkeleton.tsx` shimmer para CLS = 0 con diseño asimétrico 65/35.
- [x] `DashboardKpiGrid.tsx` con los 4 KPIs en vivo (Utilización de Flota, Contratos Activos, Devoluciones Críticas, Cartera COP).
- [x] `CalendarioOperativoIsland.tsx` nativo con vistas Mes, Semana y Agenda, filtrado dinámico por píldoras semánticas y navegación libre a 60 fps.
- [x] `ActividadDrawer.tsx` accesible (Escape, click outside) con botón prioritario '+ Crear Nuevo Alquiler para esta fecha inicial' y acciones contextuales.
- [x] `ResumenTareasCard.tsx` híbrido (tareas del sistema + manuales rápidas) y `RecordatorioEventosFeed.tsx` clasificado por severidad.
- [x] Deconstrucción de `src/app/dashboard/page.tsx` de HTML hardcodeado a Server Component conciso con streaming `<Suspense>` y First Load JS de 109 kB.
- [x] Persistencia de Tareas Manuales en Supabase: Tabla `dashboard_tareas` con RLS, Server Actions `crearTareaManualAction`, `toggleTareaCompletadaAction`, `eliminarTareaManualAction` (soft-delete), actualización optimista en UI y suite de pruebas `dashboard-tareas-actions.test.ts` (419 tests en verde en 77 suites).
- [x] Opción B: Elevación UI Premium del Dashboard — Micro-gráficos Sparkline SVG dinámicos en KPIs, tipografía tabular (`font-mono tabular-nums`) para estabilidad de dígitos en montos de cartera y calendarios, jerarquía armónica de radios anidados ($R_{outer} = 16\text{px}$, $R_{inner} = 10\text{px}$), micro-interacciones hover sutiles y elevación Dark Mode por capas tonales.
- [x] Verificación completa: `tsc --noEmit` (0 errores) y `npm run build` exitoso (32/32 rutas compiladas en verde).

### Hito 18: Módulo de Cotizaciones Rápidas, Pipeline Comercial y WhatsApp (`SPEC-002`)
- [x] Especificación formal EARS en `specs/002-cotizaciones-rapidas/spec.md`, plan técnico (`plan.md`) y desglose de tareas (`tasks.md`).
- [x] Servicio de dominio puro `src/core/services/cotizacion-rapida.service.ts` con Integer Math para COP, IVA 19%, retenciones, cálculo de KPIs comerciales y constructor de enlace WhatsApp (`wa.me`).
- [x] Suite de pruebas TDD en `tests/unit/cotizaciones-rapidas.service.test.ts` (9 tests pasando al 100%). Total de pruebas elevadas a 428 en 78 suites.
- [x] Enlace de primer nivel `/cotizaciones` en `src/components/ui/Sidebar.tsx` con icono `FileSpreadsheet`.
- [x] Server Action `obtenerClientesAction` en `src/app/actions/clientes.ts` para carga de clientes en RSC.
- [x] Componente esqueleto `CotizacionesSkeleton.tsx` para streaming con cero CLS.
- [x] Modal express de 30 segundos `CotizacionRapidaModal.tsx` con soporte para creación de prospectos on-the-fly, verificación de stock en vivo, recálculo reactivo y envío directo por WhatsApp.
- [x] Isla interactiva `CotizacionesInteractiveIsland.tsx` con 4 KPIs de pipeline comercial, filtros de estado, tabla tabular en desktop y tarjetas móviles líquidas con conversión poka-yoke a contratos.
- [x] Server Component `src/app/cotizaciones/page.tsx` con carga paralela de cotizaciones, clientes y equipos (`First Load JS` 95.5 kB).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y `npm run build` exitoso (33 rutas compiladas en verde).
### Hito 19: Facturación Recurrente y Cuentas de Cobro Periódicas (`SPEC-003`)
- [x] Especificación formal EARS en `specs/003-facturacion-recurrente/spec.md`, plan técnico (`plan.md`) y desglose de tareas (`tasks.md`).
- [x] Servicio de dominio puro `src/core/services/facturacion-recurrente.service.ts`:
  - `calcularDiasFacturablesEnPeriodo`: Intersección estricta de rangos temporales $(\max(inicioCorte, inicioContrato)$ y $\min(finCorte, finContrato))$.
  - `calcularCortePeriodicoAlquiler`: Liquidación pro-rata por ítem con tarifas diarias, IVA (19%), Retefuente (2.5%) y ReteICA (0.966%) con Integer Math en COP.
  - `previsualizarLoteCortesPeriodicos`: Consolidación de KPIs del lote proyectado.
  - `construirMensajeWhatsAppCuentaCobro`: Generador de mensajes con URL codificada `https://wa.me/...`.
- [x] Suite de pruebas TDD en `tests/unit/facturacion-recurrente.service.test.ts` con 10/10 pruebas unitarias aprobadas al 100%. Total global: 438 tests en 79 suites.
- [x] Server Action `emitirCuentaCobroPeriodicaAction` y `obtenerHistorialCuentasCobroAction` en `src/app/actions/facturacion-recurrente.ts`:
  - Asignación de consecutivo correlativo (`CC-PER-XXXX` o `FAC-REC-XXXX`), persistencia en tabla `facturas`, registro de auditoría inmutable en `AuditLogger` e invalidación de caché Redis.
- [x] Modal de emisión `EmitirCuentaCobroModal.tsx` con opciones de documento (*Cuenta de Cobro* vs *Factura con IVA*), desglose de equipos, días en obra y envío inmediato por WhatsApp.
- [x] Panel de cortes periódicos `CortesPeriodicosPanel.tsx` con presets rápidos (1ra Quincena, 2da Quincena, Mes, Mes Anterior, Rango Libre), 3 KPIs de corte y tabla tabular con checkboxes para emisión en lote.
- [x] Integración en `FacturacionInteractiveIsland.tsx` con conmutador de pestañas (`Facturación Global & Cartera CXC` vs `Cortes & Cuentas de Cobro Periódicas`).
- [x] Verificación completa: `tsc --noEmit` (0 errores) y `npm run build` en verde.
