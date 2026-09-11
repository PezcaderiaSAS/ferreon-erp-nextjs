<!-- Generated: 2026-09-11 | Files scanned: ~22 | Token estimate: ~740 -->
# Data Architecture (Supabase PostgreSQL)

## Tables
- `clientes`: Directorio de clientes (`id BIGSERIAL`, `nombre`, `nit_cedula`, `telefono`, `direccion`, `email`, `estado`, `empresa_id`). Relación 1:N con `alquileres` y `cotizaciones`.
- `proveedores`: Catálogo de proveedores (`id UUID`, `tenant_id`, `empresa_id`, `nombre`, `nit`, `contacto`, `telefono`, `email`, `direccion`, `ciudad`, `dias_credito`, `estado CHECK (estado IN ('ACTIVO', 'INACTIVO'))`, `created_at`). Índices en `(tenant_id)`, `(nit)` y `(nombre)`.
- `compras`: Cabecera de órdenes de compra (`id UUID`, `numero_orden`, `proveedor_id`, `proveedor_nombre`, `proveedor_nit`, `fecha_compra`, `metodo_pago`, `subtotal`, `aplica_iva`, `valor_iva`, `aplica_retefuente`, `porcentaje_retefuente`, `valor_retefuente`, `aplica_reteica`, `porcentaje_reteica`, `valor_reteica`, `neto_pagar`, `total`, `estado`, `transaction_id`).
- `compras_detalles`: Detalle de equipos ingresados por compra (`compra_id`, `equipo_id`, `cantidad`, `precio_unitario`, `subtotal`).
- `cotizaciones` & `cotizaciones_detalles`: Ofertas comerciales con consecutivo único, desglose tributario y estado `CHECK (estado IN ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'CONVERTIDA'))`.
- `financial_accounts`: Plan de cuentas contable:
  - Activo: `1520 Equipos y Maquinaria`, `1105 Caja Principal`, `1110 Bancolombia Ahorros`, `1305 Cuentas por Cobrar`, `2408 IVA Descontable en Compras`.
  - Pasivo: `2205 Cuentas por Pagar (Proveedores)`, `2365 ReteFuente por Pagar Compras`, `2368 ReteICA por Pagar Compras`.
  - Ingresos: `4155 Ingresos por Alquileres`.
- `transactions` & `journal_entries`: Libro diario contable inmutable con validación estricta de partida doble ($\sum D + \sum C = 0$).
- `kardex_inventario`: Registro inmutable de entradas y salidas (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`, `AJUSTE_MANUAL`).
- `equipos`: Inventario físico (`stock_total`, `stock_disponible`, `stock_en_obra`, `stock_mantenimiento`, `tarifa_diaria`, `valor_reposicion`).
- `alquileres`: Contratos de alquiler (`id`, `consecutivo`, `cliente_id`, `cotizacion_origen_id`, `estado`, `subtotal_equipos`, `total`, `deposito`, `saldo_pendiente`).
- `alquiler_detalles`: Líneas de contrato (`id`, `alquiler_id`, `equipo_id`, `cantidad`, `cantidad_devuelta`, `dias_contratados`, `fecha_inicio`, `fecha_fin`, `tarifa_aplicada`, `subtotal_linea`, `devuelto`, `costo_dano`).
- `pagos`: Recaudos y abonos (`id`, `alquiler_id`, `cliente_id`, `monto`, `metodo_pago`, `referencia`, `created_at`).
- `facturas`: Documentos de facturación comercial vinculados a contratos.
- `audit_logs`: Trazabilidad inmutable de operaciones y seguridad del ERP.

## Stored Procedures & RPCs Transaccionales
- `crear_alquiler_transaccional(p_payload)`: Creación atómica de contrato con verificación `FOR UPDATE` de stock disponible y bloqueo pesimista contra sobreventa.
- `procesar_devolucion_alquiler(p_payload)`: Devolución atómica de ítems con restitución automática de stock en obra a disponible y transición de estado a `FINALIZADO` al completar todos los renglones.
- `reducir_stock_seguro(p_cantidad_requerida, p_equipo_id)`: Reserva segura de inventario con control de concurrencia.
- `ajustar_stock_equipo(p_equipo_id, p_nuevo_disponible, p_motivo)`: Ajuste Poka-Yoke de bodega.

## Migrations History
- `20260910_cotizaciones_y_facturas_pdf.sql`: Tablas `cotizaciones`, campos tributarios y visor PDF.
- `20260910_modulo_compras_y_asientos_contables.sql`: Tablas base `compras` y `compras_detalles`.
- `20260910_proveedores_y_retenciones_compras.sql`: Tabla `proveedores`, desglose tributario de compras y cuentas contables auxiliares.
- `20260828_persistencia_relacional_y_transaccional.sql`: Procedimientos almacenados `crear_alquiler_transaccional` y `procesar_devolucion_alquiler`.

## RLS & Multi-Tenancy
- Todas las tablas implementan Row Level Security (RLS) con aislamiento por `tenant_id` / `empresa_id` y bypass autorizado para el rol `ULTRAADMIN`.
