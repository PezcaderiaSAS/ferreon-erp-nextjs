<!-- Generated: 2026-09-09 | Files scanned: ~12 | Token estimate: ~590 -->
# Data Architecture (Supabase)

## Tables
- `empresas`: Entidad tenant principal. Almacena `nombre`, `nit` y `configuracion JSONB` (logoBase64, moneda, notas, cuentas bancarias, themeId).
- `empresa_usuarios`: Relación multi-tenant entre usuarios auth y empresas (`es_empresa_activa`, rol `ULTRAADMIN` / `ADMIN` / `CAJERO`).
- `audit_logs`: Registro inmutable (Append-Only) de eventos y mutaciones del sistema con índices en `(empresa_id, created_at DESC)` y `(modulo, accion)`.
- `equipos`: Catálogo de inventario (`stock_disponible`, `stock_en_obra`, `tarifa_diaria`, `valor_reposicion`).
- `alquileres`: Contratos cabecera con control de estados (`COTIZACION`, `ACTIVO`, `FINALIZADO`, `CANCELADO`).
- `alquiler_detalles`: Detalle de maquinaria alquilada por contrato (`fecha_inicio`, `fecha_fin`, `tarifa_aplicada`, `dias_contratados`).
- `kardex_inventario`: Registro inmutable de alteraciones de stock físico.
- `sesiones_caja`: Control de turnos de cajeros. Estado ('ABIERTA', 'CERRADA').
- `pagos`: Abonos realizados enlazados con `sesiones_caja_id`.

## Stored Procedures & Security Functions
- `public.is_ultra_admin()`: Función de seguridad para validar privilegios de auditoría y supervisión global.
- `reducir_stock_seguro(p_equipo_id, p_cantidad_requerida)`: Candado pesimista con `FOR UPDATE` contra overbooking.
- `ajustar_stock_equipo(...)`: Manejo atómico de inventario con generación de movimientos de Kardex.

## RLS & Multi-Tenancy
- Las tablas implementan Row Level Security (RLS) con aislamiento estricto por `tenant_id` y bypass autorizado para el rol `ULTRAADMIN`.
- Consultas mediante cliente autenticado SSR (`createServerSupabaseClient()`).
