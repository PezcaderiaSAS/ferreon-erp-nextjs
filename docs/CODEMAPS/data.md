<!-- Generated: 2026-09-17 | Files scanned: ~28 | Token estimate: ~920 -->
# Data Architecture (Supabase PostgreSQL)

## Tables
- `clientes`: Directorio de clientes (`id BIGSERIAL`, `nombre`, `nit_cedula`, `telefono`, `direccion`, `email`, `estado`, `empresa_id`, `saldo_a_favor BIGINT DEFAULT 0`). Relación 1:N con `alquileres`, `cotizaciones` y `cliente_movimientos_saldo`.
- `cliente_movimientos_saldo`: Historial contable inmutable de saldos a favor (`id BIGSERIAL`, `cliente_id`, `empresa_id`, `tipo CHECK IN ('ACREDITACION', 'DEBITO_PAGO', 'AJUSTE')`, `monto BIGINT`, `saldo_anterior BIGINT`, `saldo_nuevo BIGINT`, `pago_id`, `motivo`, `created_at`).
- `pago_metodos_detalle`: Desglose multilínea de pagos mixtos (`id BIGSERIAL`, `pago_id`, `metodo CHECK IN ('EFECTIVO', 'BANCO_BANCOLOMBIA', 'BANCO_DAVIVIENDA', 'NEQUI', 'DAVIPLATA', 'SALDO_FAVOR_CLIENTE')`, `monto BIGINT`, `referencia`, `efectivo_recibido BIGINT`, `cambio_devuelto BIGINT`).
- `alquileres`: Contratos de alquiler (`id BIGSERIAL`, `consecutivo`, `cliente_id`, `empresa_id`, `cotizacion_origen_id`, `estado`, `subtotal_equipos`, `total`, `deposito`, `saldo_pendiente`, `idempotency_key TEXT`). Índice único condicional `idx_alquileres_empresa_idempotency_key UNIQUE (empresa_id, idempotency_key) WHERE idempotency_key IS NOT NULL` que garantiza 0 registros duplicados.
- `alquiler_detalles`: Líneas de contrato (`id`, `alquiler_id`, `equipo_id`, `cantidad`, `cantidad_devuelta`, `dias_contratados`, `fecha_inicio`, `fecha_fin`, `tarifa_aplicada`, `subtotal_linea`, `devuelto`, `costo_dano`).
- `caja_sesiones`: Control de turnos de caja (`id UUID`, `empresa_id`, `usuario_id`, `estado CHECK (estado IN ('ABIERTA', 'CERRADA'))`, `monto_apertura`, `monto_cierre_esperado`, `monto_cierre_real`, `diferencia`, `fecha_apertura`, `fecha_cierre`, `observaciones`).
- `caja_movimientos`: Entradas y salidas operativas de efectivo (`id UUID`, `sesion_id`, `empresa_id`, `tipo CHECK (tipo IN ('INGRESO', 'EGRESO'))`, `monto`, `motivo`, `categoria`, `created_at`).
- `devoluciones`: Registro histórico de recepciones de equipos (`id UUID`, `empresa_id`, `alquiler_id`, `consecutivo`, `fecha_devolucion`, `deposito_custodiado_cop`, `alquiler_causado_cop`, `costo_reparacion_total_cop`, `saldo_neto_cop`, `tipo_resolucion`, `metodo_pago`, `sesion_caja_id`, `idempotency_key`). Índice único `idx_devoluciones_empresa_idempotency_key` contra doble recepción.
- `devolucion_detalles`: Desglose físico por ítem (`id UUID`, `devolucion_id`, `alquiler_detalle_id`, `equipo_id`, `cantidad_devuelta`, `estado_inspeccion CHECK IN ('BUENO', 'MANTENIMIENTO', 'PERDIDA_TOTAL')`, `costo_reparacion_cop`, `valor_reposicion_cop`, `descripcion_dano`).
- `subcontrataciones`: Gestión de maquinaria externa a dos tiempos (`id UUID`, `empresa_id`, `proveedor_id`, `consecutivo`, `estado CHECK IN ('BORRADOR', 'SOLICITADA', 'ORDENADA', 'RECIBIDA_EN_BODEGA', 'EN_CLIENTE', 'ACTIVA', 'DEVUELTA', 'DEVUELTA_A_PROVEEDOR', 'LIQUIDADA', 'CANCELADA')`, `costo_final_liquidado`, `retefuente_valor`, `reteica_valor`, `asiento_contable_id`).
- `bodegas`: Almacenes físicos y control WMS de inventario (`id UUID`, `empresa_id`, `nombre`, `ubicacion`, `es_principal`).
- `proveedores`: Catálogo de proveedores (`id UUID`, `tenant_id`, `empresa_id`, `nombre`, `nit`, `contacto`, `telefono`, `email`, `direccion`, `ciudad`, `dias_credito`, `estado`).
- `proveedor_cuentas_pagar`: Pasivos con proveedores generados por órdenes de compra (`id UUID`, `tenant_id`, `empresa_id`, `compra_id`, `proveedor_id`, `numero_orden`, `fecha_emision`, `fecha_vencimiento`, `monto_total`, `saldo_pendiente`, `estado CHECK IN ('PENDIENTE', 'ABONADA_PARCIAL', 'PAGADA', 'ANULADA')`, `created_at`).
- `proveedor_abonos_cxp`: Trazabilidad inmutable de egresos y abonos a proveedores (`id UUID`, `cuenta_pagar_id`, `numero_comprobante UNIQUE`, `fecha_abono`, `monto_abono`, `metodo_pago CHECK IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE')`, `sesion_caja_id`, `referencia_bancaria`, `usuario_id`).
- `compras` & `compras_detalles`: Órdenes de compra con desglose tributario (IVA 19%, ReteFuente, ReteICA), modo de ingreso (`INMEDIATO` vs `ORDEN_RECEPCION`) y detalle de maquinaria ingresada.
- `financial_accounts`: Plan de cuentas contable:
  - Activo: `1520 Equipos y Maquinaria`, `1105 Caja Principal`, `1110 Bancolombia Ahorros`, `1305 Cuentas por Cobrar`, `2408 IVA Descontable en Compras`.
  - Pasivo: `2205 Cuentas por Pagar (Proveedores)`, `2365 ReteFuente por Pagar Compras`, `2368 ReteICA por Pagar Compras`.
  - Ingresos: `4155 Ingresos por Alquileres`.
- `transactions` & `journal_entries`: Libro diario contable inmutable con validación estricta de partida doble ($\sum D + \sum C = 0$).
- `kardex_inventario`: Registro inmutable de entradas y salidas (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`, `AJUSTE_MANUAL`), valorizado con `costo_unitario_movimiento` y `costo_promedio_resultante`.
- `equipos`: Inventario físico (`stock_total`, `stock_disponible`, `stock_en_obra`, `stock_mantenimiento`, `tarifa_diaria`, `valor_reposicion`, `costo_promedio BIGINT DEFAULT 0`, `ultimo_costo_compra BIGINT DEFAULT 0`).
- `pagos`: Recaudos y abonos vinculados a contratos y turnos de caja.
- `facturas`: Documentos de facturación comercial vinculados a contratos.
- `audit_logs`: Trazabilidad inmutable de operaciones y seguridad del ERP.

## Stored Procedures & RPCs Transaccionales
- `recibir_compra_y_actualizar_pmp_transaccional(p_compra_id, p_usuario_id, p_remision_factura, p_observaciones_bodega)`: Recepción física atómica en bodega de órdenes de compra. Aplica bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) sobre los equipos para evitar deadlocks, recalcula el Costo Promedio Ponderado ($\text{PMP} = \text{ROUND}\left(\frac{S_a \cdot C_a + Q_n \cdot P_n}{S_a + Q_n}\right)$), asienta el movimiento en el Kardex valorizado, actualiza el stock físico e inserta o actualiza el pasivo en `proveedor_cuentas_pagar`.
- `convertir_cotizacion_a_alquiler_transaccional(p_payload)`: Conversión atómica 1-clic de cotización a contrato de alquiler. Verifica existencias con bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) en la tabla `equipos` para prevenir deadlocks y sobreventas concurrentes de forma absoluta. Genera el contrato, sus detalles, asienta la salida en `kardex_inventario`, transiciona el estado de la cotización a `CONVERTIDA` y garantiza idempotencia por `idempotency_key`.
- `procesar_devolucion_avanzada(p_payload)`: Devolución atómica de equipos con Split-Line inmutable, tasación de daños/pérdidas, clasificación cuatripartita de stock (`stock_disponible`, `stock_mantenimiento`, `stock_perdido`), compensación de depósito en garantía, detección de subcontratación y alerta de retorno en bodega.
- `crear_alquiler_transaccional(p_payload)`: Creación atómica de contrato. Verifica primero si `idempotency_key` ya fue procesada para el tenant; de ser así, retorna inmediatamente el contrato existente sin mutaciones. Realiza validación `FOR UPDATE` de stock disponible y bloqueo pesimista contra sobreventa.
- `procesar_devolucion_alquiler(p_payload)`: Devolución atómica de ítems con restitución automática de stock en obra a disponible y transición de estado a `FINALIZADO`.
- `reducir_stock_seguro(p_cantidad_requerida, p_equipo_id)`: Reserva segura de inventario con control de concurrencia.
- `ajustar_stock_equipo(p_equipo_id, p_nuevo_disponible, p_motivo)`: Ajuste Poka-Yoke de bodega.

## Migrations History
- `20260917_ultraadmin_licencias_modulos_y_permisos.sql`: Migración de Gobernanza UltraAdmin. Incorpora `subscription_ends_at`, `dias_gracia` y `modulos_activos` (JSONB) en `empresas` con índices B-Tree y GIN; `permisos_custom` (JSONB), `ultimo_cambio_estado_por` y `fecha_ultimo_cambio_estado` en `empresa_usuarios` con índice GIN, y políticas RLS para acceso cross-tenant de `ULTRAADMIN` y `SUPERADMIN`.
- `20260917_compras_costo_promedio_y_cxp.sql`: Migración de Costo Promedio Ponderado (PMP) en `equipos`, columnas de costeo en `kardex_inventario`, tablas `proveedor_cuentas_pagar` y `proveedor_abonos_cxp` con RLS, y función transaccional `recibir_compra_y_actualizar_pmp_transaccional`.
- `20260916_cotizaciones_pesimistas_y_pagos_mixtos.sql`: Tablas `cliente_movimientos_saldo` y `pago_metodos_detalle`, columna `clientes.saldo_a_favor`, índices de integridad y función almacenada nativa `convertir_cotizacion_a_alquiler_transaccional` con bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`).
- `20260916_devoluciones_avanzadas_y_subcontrataciones.sql`: Tablas `devoluciones` y `devolucion_detalles`, extensión de `alquiler_detalles` (Split-Line e inspección física), `equipos.stock_perdido`, estados a dos tiempos y liquidación en `subcontrataciones`, y procedimiento almacenado `procesar_devolucion_avanzada`.
- `20260915_idempotencia_alquileres.sql`: Columna `idempotency_key`, índice único condicional y reemplazo de RPC `crear_alquiler_transaccional` con detección y retorno idempotente.
- `20260914_modulo_caja_movimientos_y_arqueo.sql`: Estructura para turnos de caja, movimientos de efectivo y arqueo con desglose de denominaciones.
- `20260911_modulo_wms_bodegas_y_stocks.sql`: Soporte para bodegas múltiples y stock por ubicación física.
- `20260910_cotizaciones_y_facturas_pdf.sql`: Tablas `cotizaciones`, campos tributarios y visor PDF.
- `20260910_modulo_compras_y_asientos_contables.sql`: Tablas base `compras` y `compras_detalles`.
- `20260910_proveedores_y_retenciones_compras.sql`: Tabla `proveedores`, desglose tributario y retenciones.
- `20260828_persistencia_relacional_y_transaccional.sql`: Procedimientos almacenados base.

## RLS & Multi-Tenancy
- Todas las tablas implementan Row Level Security (RLS) con aislamiento por `tenant_id` / `empresa_id` y bypass autorizado para el rol `ULTRAADMIN`.
