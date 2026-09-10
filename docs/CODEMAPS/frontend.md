<!-- Generated: 2026-09-10 | Files scanned: ~45 | Token estimate: ~820 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/compras`: Módulo de compras con pestañas `Órdenes de Compra` y `Directorio de Proveedores`. Incluye KPIs de inversión facturada, neto desembolsado y retenciones practicadas, tabla con botón directo de impresión PDF y búsqueda predictiva.
- `/cotizaciones`: Gestión comercial de cotizaciones con KPIs (Total Cotizado, Aprobadas, Tasa de Conversión), desglose tributario y conversión 1-clic a contrato.
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler con atajo F2 y rango maestro de fechas, pestaña de Cotizaciones integradas, conversión a contrato, emisión de PDFs y cálculo de colaterales.
- `/facturacion`: Gestión y emisión de facturas comerciales formales en PDF con asientos contables en Ledger.
- `/bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`, `KardexEquipoModal.tsx`).
- `/clientes`: Directorio de clientes con reconciliación estabilizada vía `useCallback([setClientes])`.
- `/caja`: Control de turnos, apertura, cierres de caja y arqueo de efectivo.
- `/devoluciones`: Wizard Poka-Yoke interactivo para el reingreso parcial/total de equipos.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant para supervisión global de tenants y usuarios.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), usuarios y pestaña de Auditoría del sistema.

## Components (`src/components/` & `src/app/components/`)
- `proveedores/SelectorProveedorAsistido.tsx`: Buscador predictivo de proveedores asistido por teclado (`↑/↓/Enter/Esc`), búsqueda en tiempo real (NIT, nombre, ciudad) y botón rápido `+ Nuevo` On-The-Fly para registrar proveedores al instante sin perder el borrador de la compra.
- `proveedores/CrearProveedorModal.tsx`: Modal para registrar proveedores con validación de NIT, razón social, contactos y días de crédito.
- `compras/RegistrarCompraModal.tsx`: Formulario de compra con selector asistido de proveedores, tabla dinámica de equipos adquiridos y panel tributario interactivo (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰).
- `compras/ComprobanteEntradaPDFModal.tsx`: Visor e impresión directa (Carta/A4) de la Orden de Compra y Comprobante de Entrada de Almacén con formato oficial.
- `cotizaciones/CrearCotizacionModal.tsx`: Modal de cotización comercial con casillas de impuestos seleccionables y cálculo en tiempo real (0 ms).
- `pdf/VisorDocumentoPDFModal.tsx`: Visor universal de Facturas y Cotizaciones con previsualización responsive e impresión nativa.
- `ui/EquipoCombobox.tsx`: Buscador typeahead de maquinaria accesible (WAI-ARIA 1.2) con elevación dinámica `zIndex: 100`.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado local y sanitización de contratos y cotizaciones.
- `bodegaStore.ts`: Estado local de equipos y control de stock (`EquipoUI`).
- `clienteStore.ts`: Catálogo de clientes activos.
- `empresaStore.ts`: Identidad corporativa, logo y temas de marca.
- `toastStore.ts`: Notificaciones globales accesibles (`showSuccessToast`, `showErrorToast`).
- `ledgerStore.ts`: Transacciones contables, partida doble y pagos.
