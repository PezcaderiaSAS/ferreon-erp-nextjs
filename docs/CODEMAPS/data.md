<!-- Generated: 2026-09-15 | Files scanned: ~25 | Token estimate: ~850 -->
# Data Architecture (Supabase PostgreSQL)

## Tables
- `clientes`: Directorio de clientes (`id BIGSERIAL`, `nombre`, `nit_cedula`, `telefono`, `direccion`, `email`, `estado`, `empresa_id`). Relación 1:N con `alquileres` y `cotizaciones`.
- `alquileres`: Contratos de alquiler (`id BIGSERIAL`, `consecutivo`, `cliente_id`, `empresa_id`, `cotizacion_origen_id`, `estado`, `subtotal_equipos`, `total`, `deposito`, `saldo_pendiente`, `idempotency_key TEXT`). Índice único condicional `idx_alquileres_empresa_idempotency_key UNIQUE (empresa_id, idempotency_key) WHERE idempotency_key IS NOT NULL` que garantiza 0 registros duplicados.
- `alquiler_detalles`: Líneas de contrato (`id`, `alquiler_id`, `equipo_id`, `cantidad`, `cantidad_devuelta`, `dias_contratados`, `fecha_inicio`, `fecha_fin`, `tarifa_aplicada`, `subtotal_linea`, `devuelto`, `costo_dano`).
- `caja_sesiones`: Control de turnos de caja (`id UUID`, `empresa_id`, `usuario_id`, `estado CHECK (estado IN ('ABIERTA', 'CERRADA'))`, `monto_apertura`, `monto_cierre_esperado`, `monto_cierre_real`, `diferencia`, `fecha_apertura`, `fecha_cierre`, `observaciones`).
- `caja_movimientos`: Entradas y salidas operativas de efectivo (`id UUID`, `sesion_id`, `empresa_id`, `tipo CHECK (tipo IN ('INGRESO', 'EGRESO'))`, `monto`, `motivo`, `categoria`, `created_at`).
- `subcontrataciones`: Gestión de maquinaria externa (`id UUID`, `empresa_id`, `proveedor_id`, `equipo_id`, `alquiler_id`, `costo_subcontratacion`, `tarifa_cliente`, `fecha_inicio`, `fecha_fin`, `estado`).
- `bodegas`: Almacenes físicos y control WMS de inventario (`id UUID`, `empresa_id`, `nombre`, `ubicacion`, `es_principal`).
- `proveedores`: Catálogo de proveedores (`id UUID`, `tenant_id`, `empresa_id`, `nombre`, `nit`, `contacto`, `telefono`, `email`, `direccion`, `ciudad`, `dias_credito`, `estado`).
- `compras` & `compras_detalles`: Órdenes de compra con desglose tributario (IVA 19%, ReteFuente, ReteICA) y detalle de maquinaria ingresada.
- `cotizaciones` & `cotizaciones_detalles`: Ofertas comerciales con consecutivo único y conversión 1-clic a contrato.
- `financial_accounts`: Plan de cuentas contable:
  - Activo: `1520 Equipos y Maquinaria`, `1105 Caja Principal`, `1110 Bancolombia Ahorros`, `1305 Cuentas por Cobrar`, `2408 IVA Descontable en Compras`.
  - Pasivo: `2205 Cuentas por Pagar (Proveedores)`, `2365 ReteFuente por Pagar Compras`, `2368 ReteICA por Pagar Compras`.
  - Ingresos: `4155 Ingresos por Alquileres`.
- `transactions` & `journal_entries`: Libro diario contable inmutable con validación estricta de partida doble ($\sum D + \sum C = 0$).
- `kardex_inventario`: Registro inmutable de entradas y salidas (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`, `AJUSTE_MANUAL`).
- `equipos`: Inventario físico (`stock_total`, `stock_disponible`, `stock_en_obra`, `stock_mantenimiento`, `tarifa_diaria`, `valor_reposicion`).
- `pagos`: Recaudos y abonos vinculados a contratos y turnos de caja.
- `facturas`: Documentos de facturación comercial vinculados a contratos.
- `audit_logs`: Trazabilidad inmutable de operaciones y seguridad del ERP.

## Stored Procedures & RPCs Transaccionales
- `crear_alquiler_transaccional(p_payload)`: Creación atómica de contrato. Verifica primero si `idempotency_key` ya fue procesada para el tenant; de ser así, retorna inmediatamente el contrato existente sin mutaciones. Realiza validación `FOR UPDATE` de stock disponible y bloqueo pesimista contra sobreventa.
- `procesar_devolucion_alquiler(p_payload)`: Devolución atómica de ítems con restitución automática de stock en obra a disponible y transición de estado a `FINALIZADO`.
- `reducir_stock_seguro(p_cantidad_requerida, p_equipo_id)`: Reserva segura de inventario con control de concurrencia.
- `ajustar_stock_equipo(p_equipo_id, p_nuevo_disponible, p_motivo)`: Ajuste Poka-Yoke de bodega.

## Migrations History
- `20260915_idempotencia_alquileres.sql`: Columna `idempotency_key`, índice único condicional y reemplazo de RPC `crear_alquiler_transaccional` con detección y retorno idempotente.
- `20260914_modulo_caja_movimientos_y_arqueo.sql`: Estructura para turnos de caja, movimientos de efectivo y arqueo con desglose de denominaciones.
- `20260911_modulo_wms_bodegas_y_stocks.sql`: Soporte para bodegas múltiples y stock por ubicación física.
- `20260910_cotizaciones_y_facturas_pdf.sql`: Tablas `cotizaciones`, campos tributarios y visor PDF.
- `20260910_modulo_compras_y_asientos_contables.sql`: Tablas base `compras` y `compras_detalles`.
- `20260910_proveedores_y_retenciones_compras.sql`: Tabla `proveedores`, desglose tributario y retenciones.
- `20260828_persistencia_relacional_y_transaccional.sql`: Procedimientos almacenados base.

## RLS & Multi-Tenancy
- Todas las tablas implementan Row Level Security (RLS) con aislamiento por `tenant_id` / `empresa_id` y bypass autorizado para el rol `ULTRAADMIN`.
