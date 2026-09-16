<!-- Generated: 2026-09-15 | Files scanned: ~52 | Token estimate: ~880 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler con atajo F2 y rango maestro de fechas, pestaña de Cotizaciones integradas, conversión a contrato, emisión de PDFs, cálculo de colaterales y escudo de bloqueo Poka-Yoke contra doble envío.
- `/caja`: Control de turnos y tesorería. Incluye apertura de turno con base inicial, registro de ingresos/egresos, arqueo ciego con calculadora de denominaciones de billetes/monedas, determinación de sobrantes/faltantes y generación de comprobantes contables de arqueo.
- `/compras`: Módulo de compras con pestañas `Órdenes de Compra` y `Directorio de Proveedores`. Incluye KPIs de inversión facturada, neto desembolsado y retenciones practicadas, tabla con botón directo de impresión PDF y búsqueda predictiva.
- `/cotizaciones`: Gestión comercial de cotizaciones con KPIs (Total Cotizado, Aprobadas, Tasa de Conversión), desglose tributario y conversión 1-clic a contrato.
- `subcontrataciones`: Gestión de maquinaria externa subcontratada a aliados comerciales con ciclo a dos tiempos (`ACTIVA`, `RECIBIDA_EN_BODEGA`, `DEVUELTA_A_PROVEEDOR`, `LIQUIDADA`), alerta en bodega y liquidación contable en Ledger.
- `facturacion`: Gestión y emisión de facturas comerciales formales en PDF con asientos contables en Ledger.
- `bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`, `KardexEquipoModal.tsx`).
- `clientes`: Directorio de clientes con reconciliación estabilizada vía `useCallback([setClientes])`.
- `devoluciones`: Módulo de recepción física de maquinaria con pestañas de retorno pendiente e historial de actas, inspección técnica granular, Split-Line interactivo y compensación de garantía.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant para supervisión global de tenants y usuarios.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), usuarios y pestaña de Auditoría del sistema.

## Components (`src/components/` & `src/app/components/`)
- `devoluciones/InspeccionTecnicaModal.tsx`: Modal orquestador de recepción con Split-Line interactivo, clasificación por ítem (`BUENO`, `MANTENIMIENTO`, `PERDIDA_TOTAL`), tasación de daños y cálculo en vivo (0 ms).
- `devoluciones/DevolucionBlockingOverlay.tsx`: Escudo visual Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner GPU y bloqueo de puntero/teclado (`pointer-events-none`) para evitar dobles envíos.
- `devoluciones/LiquidacionGarantiaCard.tsx`: Tarjeta financiera reactiva que calcula la compensación neta entre depósito, arriendo causado y reparaciones, vinculando a caja o transferencia.
- `devoluciones/ComprobanteDevolucionPDFModal.tsx`: Acta oficial de recepción e inspección técnica con estilos `@media print` (<150 ms) y áreas de firma.
- `subcontrataciones/LiquidarSubcontratacionModal.tsx`: Modal de liquidación contable de maquinaria aliada con retenciones DIAN (ReteFuente 2.5%, ReteICA 9.66‰) y previsualización de asiento balanceado.
- `forms/alquiler/AlquilerBlockingOverlay.tsx`: Escudo visual Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner sincronizado y bloqueo físico absoluto de clics y atajos de teclado (`pointer-events-none`) durante la ejecución de la transacción para evitar doble clic o reenvíos accidentales.
- `forms/alquiler/StepResumenLiquidacion.tsx`: Panel de liquidación final con botones reactivos, estados de carga y deshabilitación inmediata durante `isSubmitting`.
- `caja/AbrirCajaModal.tsx`: Modal para iniciar turno de caja especificando el monto base inicial en efectivo.
- `forms/cotizaciones/CotizacionBlockingOverlay.tsx`: Escudo visual Poka-Yoke con Glassmorphism (`backdrop-blur-md`), spinner sincronizado y bloqueo físico absoluto de clics y atajos de teclado durante la conversión atómica a contrato en base de datos.
- `forms/cotizaciones/ConvertirCotizacionModal.tsx`: Modal interactivo de formalización 1-clic con validación de inventario en bodega en tiempo real; ante faltantes, bloquea la acción y ofrece derivar las unidades a Subcontrataciones.
- `cartera/RegistrarPagoMixtoModal.tsx`: Modal multilínea dinámico que permite combinar Efectivo, Transferencias Bancarias (Bancolombia, Davivienda), Billeteras (Nequi, Daviplata) y Saldo a Favor del Cliente, con cálculo en vivo de saldo pendiente y cambio a devolver.
- `pdf/ReciboCajaMixtoPDFModal.tsx`: Visor oficial de comprobantes de pago mixto con alternancia instantánea entre formato Carta y Térmica POS 80mm e impresión directa.
- `caja/ArqueoCierreModal.tsx`: Calculadora interactiva de arqueo de caja con desglose de denominaciones de billetes/monedas colombianas (COP), justificación obligatoria ante descuadres y asiento de ajuste en Ledger.
- `caja/ComprobanteArqueoModal.tsx`: Visor e impresión nativa del Comprobante Oficial de Arqueo y Cierre de Turno.
- `caja/MovimientoCajaModal.tsx`: Registro rápido de ingresos y egresos de efectivo con motivo y categoría.
- `caja/CajaStatusBadge.tsx`: Indicador visual en tiempo real del estado de la caja (ABIERTA / CERRADA) en el header global.
- `proveedores/SelectorProveedorAsistido.tsx`: Buscador predictivo asistido por teclado (`↑/↓/Enter/Esc`) con botón rápido `+ Nuevo` On-The-Fly para registrar proveedores al instante sin perder el borrador.
- `compras/RegistrarCompraModal.tsx`: Formulario de compra con panel tributario interactivo (IVA 19%, ReteFuente 2.5%/3.5%, ReteICA 9.66‰).
- `compras/ComprobanteEntradaPDFModal.tsx`: Visor e impresión directa (Carta/A4) de la Orden de Compra y Comprobante de Entrada de Almacén.
- `cotizaciones/CrearCotizacionModal.tsx`: Modal de cotización comercial con casillas de impuestos seleccionables y cálculo en tiempo real (0 ms).
- `pdf/VisorDocumentoPDFModal.tsx`: Visor universal de Facturas y Cotizaciones con previsualización responsive e impresión nativa.
- `ui/EquipoCombobox.tsx`: Buscador typeahead de maquinaria accesible (WAI-ARIA 1.2) con elevación dinámica `zIndex: 100`.

## State Management (`src/infrastructure/state/`)
- `alquilerStore.ts`: Estado de contratos, cotizaciones, optimismo y rollback de snapshot ante fallos.
- `cajaStore.ts`: Sesión activa de caja, historial de movimientos y arqueos.
- `bodegaStore.ts`: Inventario físico, stock disponible y ajustes Poka-Yoke.
- `clienteStore.ts`: Directorio de clientes activos con deduplicación en memoria.
- `empresaStore.ts`: Identidad corporativa, logo y temas de marca.
- `toastStore.ts`: Notificaciones globales accesibles (`showSuccessToast`, `showErrorToast`).
- `ledgerStore.ts`: Asientos contables de partida doble, pagos y cuentas financieras.
