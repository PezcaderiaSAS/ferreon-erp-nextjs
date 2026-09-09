<!-- Generated: 2026-09-09 | Files scanned: ~22 | Token estimate: ~550 -->
# Backend Architecture (Server Actions & API Routes)

## Core Actions (`src/app/actions/`)
- `alquileres.ts`: Maneja contratos de alquiler, cotizaciones y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `aprobarCotizacionAction`, `procesarDevolucionAction`). Bloquea edición si el contrato está FINALIZADO o cuenta con devoluciones.
- `ultraadmin.ts`: Supervisión global multi-tenant protegida por `is_ultra_admin()` (`listarEmpresasUltraAdminAction`, `listarUsuariosEmpresaAction`, `cambiarEstadoUsuarioAction`).
- `empresa.ts`: Persistencia y lectura de configuración corporativa (`obtenerConfiguracionEmpresaAction`, `guardarConfiguracionEmpresaAction`). Guarda en `empresas.configuracion JSONB` e invalida caché distribuida Redis.
- `equipos.ts`: Gestión de inventario (Kardex) y ajustes Poka-Yoke. Usa RPC `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Registro de abonos e ingresos con validación contra sesiones de caja ABIERTAS.

## Key Files
- `src/infrastructure/persistence/supabase/server.ts` (Instanciación de clientes Supabase SSR con cookies seguras)
- `src/lib/security/validation.ts` (Validación dual-layer con esquemas Zod en API Routes y Actions)
- `src/lib/security/audit-logger.ts` (Servicio no bloqueante de auditoría inmutable en `audit_logs`)
- `src/app/actions/ultraadmin.ts` (Gobernanza UltraAdmin multi-tenant)
- `src/app/actions/alquileres.ts` (Gestión transaccional de contratos)

## Patterns
- **Poka-Yoke**: Validaciones restrictivas antes de mutación (caja abierta, stock disponible, contrato no finalizado, bloqueo de cliente en edición).
- **Idempotencia**: Uso de `idempotencyManager` en formularios para mitigar clicks duplicados.
- **Cache Invalidation**: Invalidación proactiva con `invalidateTenantCache` en Redis tras mutaciones.
- **Auditoría Inmutable**: Registro sistemático de cada mutación financiera o de inventario en `audit_logs`.
