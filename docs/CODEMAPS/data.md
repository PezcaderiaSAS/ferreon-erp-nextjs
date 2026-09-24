<!-- Generated: 2026-09-23 | Files scanned: ~30 | Token estimate: ~940 -->
# Alquileres System - Arquitectura de Datos (Supabase PostgreSQL)

## Tablas Principales de Gobernanza y Multitenancy
- `empresas`: Tabla maestra de tenants (`id UUID PRIMARY KEY`, `nombre`, `nit`, `slug`, `estado`, `subscription_ends_at TIMESTAMPTZ`, `dias_gracia INT DEFAULT 5`, `modulos_activos JSONB`). Tenant predeterminado del sistema: `ac8719ea-f16a-4538-b308-40d9511a14cb` (`ferreon-principal`).
- `empresa_usuarios`: Relación N:M entre usuarios de Supabase Auth y empresas (`id UUID`, `empresa_id UUID REFERENCES empresas`, `user_id UUID REFERENCES auth.users`, `rol TEXT CHECK (rol IN ('ADMIN', 'VENDEDOR', 'BODEGA', 'SUPER_ADMIN', 'ULTRAADMIN'))`, `permisos_custom JSONB`, `activo BOOLEAN DEFAULT true`).
- `audit_logs`: Trazabilidad inmutable de seguridad y operaciones (`id UUID`, `empresa_id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalles JSONB`, `ip_address`, `created_at`).

## Tablas de Dominio y Operación
- `clientes`: Directorio de clientes (`id BIGSERIAL`, `nombre`, `nit_cedula`, `telefono`, `direccion`, `email`, `estado`, `empresa_id`, `saldo_a_favor BIGINT DEFAULT 0`).
- `cliente_movimientos_saldo`: Historial inmutable de saldos a favor (`id BIGSERIAL`, `cliente_id`, `empresa_id`, `tipo`, `monto BIGINT`, `saldo_anterior BIGINT`, `saldo_nuevo BIGINT`, `pago_id`, `motivo`).
- `pago_metodos_detalle`: Desglose multilínea de pagos mixtos (`id BIGSERIAL`, `pago_id`, `metodo`, `monto BIGINT`, `referencia`, `efectivo_recibido BIGINT`, `cambio_devuelto BIGINT`).
- `alquileres`: Contratos de alquiler (`id BIGSERIAL`, `consecutivo`, `cliente_id`, `empresa_id`, `cotizacion_origen_id`, `estado`, `subtotal_equipos`, `total`, `deposito`, `saldo_pendiente`, `idempotency_key TEXT`). Índice único condicional `idx_alquileres_empresa_idempotency_key UNIQUE (empresa_id, idempotency_key) WHERE idempotency_key IS NOT NULL`.
- `alquiler_detalles`: Líneas de contrato (`id`, `alquiler_id`, `equipo_id`, `cantidad`, `cantidad_devuelta`, `dias_contratados`, `fecha_inicio`, `fecha_fin`, `tarifa_aplicada`, `subtotal_linea`, `devuelto`).
- `caja_sesiones`: Control de turnos de caja (`id UUID`, `empresa_id`, `usuario_id`, `estado CHECK IN ('ABIERTA', 'CERRADA')`, `monto_apertura`, `monto_cierre_real`, `diferencia`).
- `caja_movimientos`: Entradas y salidas operativas de efectivo (`id UUID`, `sesion_id`, `empresa_id`, `tipo CHECK IN ('INGRESO', 'EGRESO')`, `monto`, `motivo`, `categoria`).
- `devoluciones` & `devolucion_detalles`: Recepciones con Split-Line inmutable, estado de inspección (`BUENO`, `MANTENIMIENTO`, `PERDIDA_TOTAL`), tasación de daños y compensación de garantía.
- `subcontrataciones`: Maquinaria externa de aliados a dos tiempos (`id UUID`, `empresa_id`, `proveedor_id`, `consecutivo`, `estado`, `costo_final_liquidado`, `retefuente_valor`, `reteica_valor`).
- `equipos`: Inventario físico (`stock_total`, `stock_disponible`, `stock_en_obra`, `stock_mantenimiento`, `stock_perdido`, `costo_promedio BIGINT`, `ultimo_costo_compra BIGINT`).
- `kardex_inventario`: Registro inmutable de movimientos valorizados de inventario (`INGRESO_COMPRA`, `ALQUILER_SALIDA`, `DEVOLUCION_ENTRADA`, `AJUSTE_MANUAL`).
- `proveedores` & `proveedor_cuentas_pagar`: Directorio maestro de proveedores y cuentas por pagar generadas por compras, con abonos trazables en `proveedor_abonos_cxp`.
- `financial_accounts` & `journal_entries`: Plan contable y libro diario inmutable de partida doble ($\sum D + \sum C = 0$).

## Procedimientos Almacenados (RPCs) y Triggers
- `recibir_compra_y_actualizar_pmp_transaccional`: Recepción atómica en bodega con recálculo de Costo Promedio Ponderado ($\text{PMP}$) y actualización de Kardex.
- `convertir_cotizacion_a_alquiler_transaccional`: Conversión 1-clic con bloqueo pesimista ordenado (`ORDER BY id ASC FOR UPDATE`) sobre la tabla `equipos`.
- `procesar_devolucion_avanzada`: Devolución de maquinaria con Split-Line y deducción de averías de la garantía.
- `crear_alquiler_transaccional`: Creación atómica de contrato con verificación previa de `idempotency_key` y bloqueo `FOR UPDATE`.
- `reducir_stock_seguro` & `ajustar_stock_equipo`: Control de concurrencia y ajustes de bodega.
- `seed_dummy_tenant_data`: Sembrado de datos demo transaccional (bodega, clientes, equipos, stock, caja, alquiler, y kardex) para cuentas Trial.
- `handle_new_tenant_registration` (Trigger en `auth.users`): Aprovisionamiento On-The-Fly; intercepta registros desde UI, crea la empresa (`autorizado = false`), enlaza el usuario ADMIN e invoca el seeder dummy.

## RLS & Seguridad Multitenant
- Supabase Auth Hook (`custom_access_token_hook`): Inyecta `empresa_id` en `auth.jwt() -> 'app_metadata' ->> 'empresa_id'` durante el Sign-In.
- Row Level Security (RLS) habilitado en el 100% de las tablas con aislamiento estricto validando el token de sesión (ej. `empresa_id = (auth.jwt() -> 'app_metadata' ->> 'empresa_id')::uuid`).
- Claves foráneas obligatorias (`empresaId String`) en Prisma Schema para evitar inserciones huérfanas o bypass accidental.
- Políticas de bypass autorizadas exclusivamente para la función `public.is_ultra_admin()` y el rol `ULTRAADMIN`.
