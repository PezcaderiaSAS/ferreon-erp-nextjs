<!-- Generated: 2026-09-22 | Files scanned: ~86 | Token estimate: ~980 -->
# Alquileres System - Arquitectura Frontend

## Árbol de Rutas (`src/app/`)
- `/`: Landing Page pública institucional con tema Dark Industrial (`#0F172A`), selector de periodos de suscripción (Mensual / Anual 20% OFF), comparador interactivo de 8 módulos operativos, demo interactiva de tablero Kanban y CTA dual.
- `/dashboard`: Panel de control principal autenticado del ERP Alquileres System. Métricas clave (Contratos activos, Equipos en obra, Facturación, Alertas de devolución), accesos rápidos y estado del turno de caja.
- `/alquileres`: Gestión de contratos de alquiler, wizard de nuevo alquiler con atajo F2 y selector maestro de fechas, pestaña de Cotizaciones integradas, conversión 1-clic a contrato, emisión vectorial de PDFs y escudo Poka-Yoke contra doble envío.
- `/caja`: Control de turnos y tesorería. Apertura con monto base inicial, ingresos/egresos, arqueo ciego con calculadora de denominaciones COP, determinación de sobrantes/faltantes y generación de comprobantes contables.
- `/compras`: Módulo de compras con 4 pestañas: `Órdenes de Compra`, `Recepción en Bodega & PMP`, `Cuentas por Pagar (CXP)` y `Directorio de Proveedores`. Semáforo de morosidad, recálculo de Costo Promedio Ponderado y comprobantes de egreso.
- `/cotizaciones`: Gestión comercial de cotizaciones con KPIs, desglose tributario y conversión 1-clic a contrato con bloqueo pesimista.
- `/subcontrataciones`: Gestión de maquinaria externa de aliados comerciales a dos tiempos (`ACTIVA`, `RECIBIDA_EN_BODEGA`, `DEVUELTA_A_PROVEEDOR`, `LIQUIDADA`), alerta en bodega y liquidación contable en Ledger.
- `/facturacion`: Emisión y administración de facturas comerciales en PDF con asientos contables en Ledger.
- `/bodega`: Panel de inventario físico con buscador reactivo zero-latency (Nombre, SKU, Categoría) insensible a acentos (`normalize("NFD")`), pestañas por estado (`Todos`, `Disponibles`, `En Obra`, `Mantenimiento`), KPIs $O(N)$ y Kardex inmutable.
- `/clientes`: Directorio de clientes con reconciliación estabilizada vía `useCallback([setClientes])` y control de saldos a favor.
- `/devoluciones`: Recepción física de maquinaria con Split-Line interactivo, inspección técnica granular (`BUENO`, `MANTENIMIENTO`, `PERDIDA_TOTAL`) y compensación automática de garantía.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant con semáforo de licencias (`ACTIVA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`), extensiones rápidas (+15d, +30d, +90d, +365d) y feature flags de módulos.
- `/configuracion`: Datos fiscales de empresa, logo corporativo con compresión canvas (<150KB) y pestaña de usuarios (`UsuariosTab.tsx`) con Selector Universal de Empresas para UltraAdmin.
- `/auth/login`: Autenticación con email/password, redirección automática a `/dashboard` y soporte para credenciales demo.
- `/design-system`: Catálogo de componentes visuales, tokens de color y tipografía de Alquileres System.

## Componentes de la Landing Page (`src/components/landing/`)
- `Header.tsx`: Barra de navegación fija con backdrop blur, enlaces a secciones (`#modulos`, `#funcionalidades`, `#precios`, `#testimonios`), botón de acceso al ERP (`/auth/login`) y botón CTA "Comenzar Gratis".
- `HeroSection.tsx`: Titular de alto impacto con gradientes, insignias de confianza y botones de llamada a la acción.
- `HeroMockup.tsx`: Maqueta interactiva de alta fidelidad del dashboard operativo de Alquileres System en modo flotante con animaciones CSS.
- `TrustSection.tsx`: Cintillo con métricas de validación comercial (+250 empresas de alquiler, +45,000 contratos, 99.9% disponibilidad).
- `FeaturesSection.tsx`: Rejilla de 6 tarjetas de pilares de valor: Control Total de Inventario, Gestión de Alquileres, Facturación y Caja, Multitenancy, Poka-Yoke y Reportes.
- `ModulesExplorerSection.tsx`: Explorador interactivo de 8 pestañas con previsualizaciones funcionales completas de cada módulo (Alquileres, Cotizaciones, Bodega, Caja, Devoluciones, Compras, Subcontrataciones, Gobernanza).
- `ProductShowcase.tsx`: Destacado de alta tecnología con indicadores de precisión financiera, trazabilidad y control de obras.
- `KanbanShowcase.tsx`: Tablero Kanban interactivo representativo del flujo de contratos (Cotización → Activo → En Obra → Retorno Pendiente → Liquidado).
- `PricingSection.tsx`: Tabla de precios con conmutador Mensual/Anual (-20%), tarjetas para planes Starter, Pro y Enterprise con desglose de módulos y beneficios.
- `TestimonialsSection.tsx`: Reseñas de gerentes y directores de empresas de alquiler y maquinaria de construcción.
- `CTABanner.tsx`: Banner de cierre de alta conversión con llamado directo al registro o prueba de la plataforma.
- `Footer.tsx`: Pie de página corporativo con enlaces de navegación, contacto, copyright de Alquileres System y políticas.
- `src/config/landing.ts`: Fuente única de verdad para navegación, textos de módulos, planes de precios y testimonios.

## Componentes del ERP (`src/components/` & `src/app/components/`)
- `layout/AppShell.tsx`: Envoltorio perimetral con discriminación de rutas públicas (`isStandaloneRoute`) y renderizado del shell empresarial.
- `ui/Sidebar.tsx`: Barra lateral operativa con filtrado dinámico de módulos por tenant y acceso directo a Gobernanza UltraAdmin.
- `forms/alquiler/AlquilerBlockingOverlay.tsx`: Escudo visual Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner GPU y bloqueo de puntero/teclado.
- `devoluciones/InspeccionTecnicaModal.tsx`: Modal orquestador de recepción con Split-Line interactivo y tasación de reparaciones en tiempo real (0 ms).
- `cartera/RegistrarPagoMixtoModal.tsx`: Recaudos combinados (Efectivo, Bancolombia, Davivienda, Nequi, Daviplata, Saldo a Favor).
- `caja/ArqueoCierreModal.tsx`: Calculadora de arqueo con desglose de billetes y monedas colombianas (COP) y cálculo de diferencias.
- `admin/empresas/GestionModulosModal.tsx`: Switches Poka-Yoke para habilitar/deshabilitar los 9 módulos canónicos por empresa.
- `admin/empresas/ExtenderLicenciaModal.tsx`: Extensión rápida de suscripciones con botones de 1-clic y auditoría.
- `ui/EquipoCombobox.tsx`: Buscador typeahead accesible (WAI-ARIA 1.2) con elevación dinámica `zIndex: 100`.

## Gestión de Estado (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado de contratos, cotizaciones, optimismo y rollback de snapshot ante fallos.
- `cajaStore.ts`: Sesión activa de caja, historial de movimientos y arqueos.
- `bodegaStore.ts`: Inventario físico, stock disponible y ajustes Poka-Yoke.
- `clienteStore.ts`: Directorio de clientes activos con deduplicación en memoria.
- `empresaStore.ts`: Identidad corporativa, logo y temas de marca.
- `toastStore.ts`: Notificaciones globales accesibles.
- `ledgerStore.ts`: Asientos contables de partida doble y balances de cuentas.
