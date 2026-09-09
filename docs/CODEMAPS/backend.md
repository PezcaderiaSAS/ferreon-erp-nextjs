<!-- Generated: 2026-09-09 | Files scanned: ~25 | Token estimate: ~580 -->
# Backend Architecture (Server Actions & API Routes)

## Core Actions (`src/app/actions/`)
- `alquileres.ts`: Maneja contratos de alquiler, cotizaciones y devoluciones (`crearAlquilerAction`, `editarAlquilerAction`, `aprobarCotizacionAction`, `procesarDevolucionAction`). Bloquea edición si el contrato está FINALIZADO o cuenta con devoluciones.
- `ultraadmin.ts`: Supervisión global multi-tenant protegida por `is_ultra_admin()` (`listarEmpresasUltraAdminAction`, `listarUsuariosEmpresaAction`, `cambiarEstadoUsuarioAction`).
- `empresa.ts`: Persistencia y lectura de configuración corporativa (`obtenerConfiguracionEmpresaAction`, `guardarConfiguracionEmpresaAction`). Guarda en `empresas.configuracion JSONB` e invalida caché distribuida Redis.
- `equipos.ts`: Gestión de inventario (Kardex) y ajustes Poka-Yoke. Usa RPC `ajustar_stock_equipo` y `reducir_stock_seguro`.
- `pagos.ts`: Registro de abonos e ingresos con validación contra sesiones de caja ABIERTAS.

## API Endpoints (`src/app/api/`)
- `/api/alquileres`: Catálogo de contratos con lectura read-through en Upstash Redis y fallback a Supabase PostgreSQL.
- `/api/clientes`: Directorio de clientes autenticado con validación Zod.
- `/api/equipos`: Inventario de maquinaria con tarifas y stock disponible en tiempo real.
- Todas las rutas devuelven cabeceras `Cache-Control: no-store, no-cache, must-revalidate` para garantizar datos frescos.

## Key Files
- `src/middleware.ts` (Perímetro HTTP, inyección de CSP, rate limiting 15/120 reqs y timeout guard de 1200ms)
- `src/lib/security/csp.ts` (Generador CSP 3 compatible con Apple iOS Safari WebKit y Next.js 14)
- `src/infrastructure/persistence/supabase/server.ts` (Instanciación de clientes Supabase SSR con cookies seguras)
- `src/lib/security/validation.ts` (Validación dual-layer con esquemas Zod en API Routes y Actions)
- `src/lib/security/audit-logger.ts` (Servicio no bloqueante de auditoría inmutable en `audit_logs`)

## Patterns
- **Poka-Yoke**: Validaciones restrictivas antes de mutación (caja abierta, stock disponible, contrato no finalizado, bloqueo de cliente en edición).
- **Idempotencia**: Uso de `idempotencyManager` en formularios para mitigar clicks duplicados.
- **Cache Invalidation**: Invalidación proactiva con `invalidateTenantCache` en Redis tras mutaciones.
- **Auditoría Inmutable**: Registro sistemático de cada mutación financiera o de inventario en `audit_logs`.
