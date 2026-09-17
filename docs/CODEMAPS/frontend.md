<!-- Generated: 2026-09-17 | Files scanned: ~56 | Token estimate: ~940 -->
# Frontend Architecture

## Page Tree (`src/app/`)
- `/alquileres`: Dashboard de contratos, wizard de nuevo alquiler con atajo F2 y rango maestro de fechas, pestaña de Cotizaciones integradas, conversión a contrato, emisión de PDFs, cálculo de colaterales y escudo de bloqueo Poka-Yoke contra doble envío.
- `/caja`: Control de turnos y tesorería. Incluye apertura de turno con base inicial, registro de ingresos/egresos, arqueo ciego con calculadora de denominaciones de billetes/monedas, determinación de sobrantes/faltantes y generación de comprobantes contables de arqueo.
- `/compras`: Módulo integral de compras con 4 pestañas operativas: `Órdenes de Compra`, `Recepción en Bodega & PMP`, `Cuentas por Pagar (CXP)` y `Directorio de Proveedores`. Incluye semáforo de morosidad, recálculo de Costo Promedio Ponderado, emisión de Comprobantes de Egreso (CE) y KPIs financieros en tiempo real.
- `/cotizaciones`: Gestión comercial de cotizaciones con KPIs (Total Cotizado, Aprobadas, Tasa de Conversión), desglose tributario y conversión 1-clic a contrato.
- `subcontrataciones`: Gestión de maquinaria externa subcontratada a aliados comerciales con ciclo a dos tiempos (`ACTIVA`, `RECIBIDA_EN_BODEGA`, `DEVUELTA_A_PROVEEDOR`, `LIQUIDADA`), alerta en bodega y liquidación contable en Ledger.
- `facturacion`: Gestión y emisión de facturas comerciales formales en PDF con asientos contables en Ledger.
- `bodega`: Panel de inventario, Kardex visual y ajustes Poka-Yoke de stock (`EditarEquipoModal.tsx`, `KardexEquipoModal.tsx`).
- `clientes`: Directorio de clientes con reconciliación estabilizada vía `useCallback([setClientes])`.
- `devoluciones`: Módulo de recepción física de maquinaria con pestañas de retorno pendiente e historial de actas, inspección técnica granular, Split-Line interactivo y compensación de garantía.
- `/admin/empresas`: Panel de control UltraAdmin multi-tenant. Incorpora semáforo de vigencia de licencias (`ACTIVA`, `POR_VENCER`, `EN_GRACIA`, `VENCIDA`), cálculo de días restantes, modal de asignación de días de cortesía (`ExtenderLicenciaModal.tsx`), modal de feature flags de módulos (`GestionModulosModal.tsx`) y visor de cuentas vinculadas.
- `/configuracion`: Datos fiscales, logo corporativo con compresión canvas (<150KB), auditoría y pestaña de usuarios (`UsuariosTab.tsx`) con **Selector Universal de Empresas para UltraAdmin** para auditar y suspender colaboradores de cualquier tenant.

## Components (`src/components/` & `src/app/components/`)
- `admin/empresas/GestionModulosModal.tsx`: Modal Glassmorphism con switches interactivos Poka-Yoke para activar/desactivar los 9 módulos canónicos de FerreOn por empresa con actualización optimista y purga de caché Redis.
- `admin/empresas/ExtenderLicenciaModal.tsx`: Modal de extensión rápida de licencias con botones 1-clic (+15d, +30d, +90d, +365d), selector manual de fecha contractual y registro de motivo para auditoría.
- `configuracion/UsuariosTab.tsx`: Gestión de usuarios con inyección reactiva del Selector Universal de Empresas, semáforo de vigencia de licencia y suspensión de cuentas con invalidación de sesión en Upstash Redis.
- `ui/Sidebar.tsx`: Navegación modular con filtrado dinámico de módulos según habilitación en el tenant y acceso directo a Gobernanza UltraAdmin.
- `compras/RecibirMercanciaModal.tsx`: Modal Poka-Yoke de conteo físico y cotejo de remisiones que ejecuta el RPC transaccional para actualizar el Costo Promedio Ponderado (PMP) de los equipos y asentar en Kardex.
- `compras/RegistrarAbonoProveedorModal.tsx`: Modal interactivo de abono a proveedores con validación de saldo adeudado, vinculación con caja física en efectivo y emisión de Comprobante de Egreso (CE).
- `compras/ComprobanteEgresoPDFModal.tsx`: Visor oficial e impresión nativa de Comprobantes de Egreso en formato Carta/A4 y Tirilla Térmica POS 80mm.
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
