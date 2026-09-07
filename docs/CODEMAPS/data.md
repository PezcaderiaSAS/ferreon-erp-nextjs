<!-- Generated: 2026-09-07 | Files scanned: ~5 | Token estimate: ~500 -->
# Data Architecture (Supabase)

## Tables
- `equipos`: Catálogo de inventario. (`stock_disponible`, `stock_en_obra`)
- `alquileres`: Contratos cabecera.
- `alquiler_items`: Detalle de equipos alquilados por contrato.
- `kardex_inventario`: Registro inmutable (Append-Only) de cualquier alteración en el stock. Evita descuadres silenciosos.
- `sesiones_caja`: Control de turnos de cajeros. Estado ('ABIERTA', 'CERRADA').
- `pagos`: Abonos realizados. Enlaza con `sesiones_caja_id`. Guarda `efectivo_recibido` y `cambio_entregado`.

## Stored Procedures (RPCs)
- `reducir_stock_seguro(p_equipo_id, p_cantidad_requerida)`: Candado optimista con `FOR UPDATE`. Levanta excepción si se intenta overbooking.

## RLS & Multi-Tenancy
- Las tablas implementan Row Level Security (RLS) filtrando por `tenant_id`.
- Se requiere pasar el usuario autenticado (via `createServerSupabaseClient()`) a las consultas para no violar el aislamiento de datos.
