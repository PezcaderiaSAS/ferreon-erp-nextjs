<!-- Generated: 2026-09-08 | Files scanned: ~8 | Token estimate: ~520 -->
# Data Architecture (Supabase)

## Tables
- `empresas`: Entidad tenant principal. Almacena `nombre`, `nit` y `configuracion JSONB` (logoBase64, moneda, notas, cuentas bancarias, themeId).
- `empresa_usuarios`: Relación multi-tenant entre usuarios auth y empresas (`es_empresa_activa`).
- `equipos`: Catálogo de inventario. (`stock_disponible`, `stock_en_obra`).
- `alquileres`: Contratos cabecera con control de estados (`COTIZACION`, `ACTIVO`, `FINALIZADO`, `CANCELADO`).
- `alquiler_detalles`: Detalle de equipos alquilados por contrato.
- `kardex_inventario`: Registro inmutable (Append-Only) de cualquier alteración en el stock. Evita descuadres silenciosos.
- `sesiones_caja`: Control de turnos de cajeros. Estado ('ABIERTA', 'CERRADA').
- `pagos`: Abonos realizados. Enlaza con `sesiones_caja_id`. Guarda `efectivo_recibido` y `cambio_entregado`.

## Stored Procedures (RPCs)
- `reducir_stock_seguro(p_equipo_id, p_cantidad_requerida)`: Candado pesimista con `FOR UPDATE`. Levanta excepción si se intenta overbooking.
- `ajustar_stock_equipo(...)`: Manejo atómico de inventario con generación de movimientos de Kardex.

## RLS & Multi-Tenancy
- Las tablas implementan Row Level Security (RLS) filtrando por `tenant_id` o membresía activa en `empresa_usuarios`.
- Consultas mediante cliente autenticado SSR (`createServerSupabaseClient()`).
