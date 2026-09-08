<!-- Generated: 2026-09-08 | Files scanned: ~15 | Token estimate: ~450 -->
# Backend Architecture (Server Actions)

## Core Actions (`src/app/actions/`)
- `alquileres.ts`: Maneja contratos de alquiler, cotizaciones y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `aprobarCotizacionAction`, `procesarDevolucionAction`). Bloquea edición si el contrato está FINALIZADO o cuenta con devoluciones.
- `empresa.ts`: Persistencia y lectura de configuración corporativa (`obtenerConfiguracionEmpresaAction`, `guardarConfiguracionEmpresaAction`). Guarda en `empresas.configuracion JSONB` e invalida caché distribuida Redis.
- `equipos.ts`: Gestión de inventario (Kardex) y ajustes Poka-Yoke. Usa RPC `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Registro de abonos e ingresos con validación contra sesiones de caja ABIERTAS.

## Key Files
- `src/infrastructure/persistence/supabase/server.ts` (Instanciación de clientes Supabase SSR)
- `src/app/actions/empresa.ts` (Persistencia híbrida y multi-tenant caching)
- `src/app/actions/alquileres.ts` (Gestión transaccional de contratos)
- `src/app/actions/pagos.ts` (Validación de Caja Poka-Yoke)
- `src/app/actions/equipos.ts` (Manejo del Kardex Inmutable)

## Patterns
- **Poka-Yoke**: Validaciones restrictivas antes de mutación (caja abierta, stock disponible, contrato no finalizado, bloqueo de cliente en edición).
- **Idempotencia**: Uso de `idempotencyManager` en formularios para mitigar clicks duplicados.
- **Cache Invalidation**: Invalidación proactiva con `invalidateTenantCache` en Redis tras mutaciones.
