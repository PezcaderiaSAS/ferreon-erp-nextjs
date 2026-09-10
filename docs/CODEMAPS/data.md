<!-- Generated: 2026-09-10 | Files scanned: ~18 | Token estimate: ~680 -->
# Data Architecture (Supabase PostgreSQL)

## Tables
- `proveedores`: Catálogo de proveedores (`id UUID`, `tenant_id`, `nombre`, `nit`, `contacto`, `telefono`, `email`, `direccion`, `ciudad`, `dias_credito`, `estado`, `created_at`). Índices en `(tenant_id)`, `(nit)` y `(nombre)`.
- `compras`: Cabecera de órdenes de compra (`id UUID`, `numero_orden`, `proveedor_id`, `proveedor_nombre`, `proveedor_nit`, `fecha_compra`, `metodo_pago`, `subtotal`, `aplica_iva`, `valor_iva`, `aplica_retefuente`, `porcentaje_retefuente`, `valor_retefuente`, `aplica_reteica`, `porcentaje_reteica`, `valor_reteica`, `neto_pagar`, `total`, `estado`, `transaction_id`).
- `compras_detalles`: Detalle de equipos ingresados por compra (`compra_id`, `equipo_id`, `cantidad`, `precio_unitario`, `subtotal`).
- `cotizaciones` & `cotizaciones_detalles`: Ofertas comerciales con consecutivo `COT-XXXX`, desglose tributario y estado (`PENDIENTE`, `APROBADA`, `RECHAZADA`, `CONVERTIDA`).
- `financial_accounts`: Plan de cuentas contable:
  - Activo: `1520 Equipos y Maquinaria`, `1105 Caja Principal`, `1110 Bancolombia Ahorros`, `1305 Cuentas por Cobrar`, `2408 IVA Descontable en Compras`.
  - Pasivo: `2205 Cuentas por Pagar (Proveedores)`, `2365 ReteFuente por Pagar Compras`, `2368 ReteICA por Pagar Compras`.
  - Ingresos: `4155 Ingresos por Alquileres`.
- `transactions` & `journal_entries`: Libro diario contable inmutable con validación estricta de partida doble ($\sum D + \sum C = 0$).
- `kardex_inventario`: Registro inmutable de entradas y salidas (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`, `AJUSTE_MANUAL`).
- `equipos`: Inventario físico (`stock_total`, `stock_disponible`, `stock_en_obra`, `valor_reposicion`).
- `alquileres` & `alquiler_detalles`: Contratos de alquiler y maquinaria contratada.
- `facturas`: Documentos de facturación comercial vinculados a contratos.
- `audit_logs`: Trazabilidad inmutable de operaciones y seguridad del ERP.

## Migrations History
- `20260910_cotizaciones_y_facturas_pdf.sql`: Tablas `cotizaciones`, campos tributarios y visor PDF.
- `20260910_modulo_compras_y_asientos_contables.sql`: Tablas base `compras` y `compras_detalles`.
- `20260910_proveedores_y_retenciones_compras.sql`: Tabla `proveedores`, desglose tributario de compras y cuentas contables auxiliares.

## RLS & Multi-Tenancy
- Todas las tablas implementan Row Level Security (RLS) con aislamiento por `tenant_id` y bypass autorizado para el rol `ULTRAADMIN`.
