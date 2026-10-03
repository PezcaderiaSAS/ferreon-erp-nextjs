# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Módulo Dashboard (Persistencia de Tareas Manuales Completada): Tabla `dashboard_tareas` desplegada y activa en PostgreSQL con RLS y aislamiento multitenant (`public.get_current_tenant_id()`).
- Server Actions operativas: `obtenerDashboardDataAction` (lectura combinada de BD), `crearTareaManualAction` (inserción con UUID canónico), `toggleTareaCompletadaAction` (conmutación en BD) y `eliminarTareaManualAction` (soft-delete seguro).
- UI Dashboard: `ResumenTareasCard` con soporte para tareas manuales/sistema, toggle de urgencia, eliminación en hover y botón de refresco en vivo (`RefreshCw`) en `DashboardInteractiveIsland`.
- Pruebas y validaciones: 77 suites de Vitest pasadas, 419/419 tests unitarios e integrados aprobados (100%), 0 errores TypeScript (`tsc --noEmit`), compilación de producción Next.js 32/32 rutas en verde.

## Decisiones (y por qué)
- **Persistencia en `dashboard_tareas`**: Garantiza que las tareas creadas por el usuario persistan tras recargas (`F5`) y se aíslen por empresa (`empresa_id`).
- **Segregación Sistema vs Manual**: Las tareas de sistema (`task-sys-*`) se calculan en vuelo a partir de contratos y devoluciones; las manuales se persisten en base de datos.
- **Soft Delete (`deleted_at`)**: Preserva el historial y la trazabilidad de tareas eliminadas sin destruir datos relacionales.

## Aprendizajes y errores a evitar
- Nunca dejar tareas críticas de usuario en estado volátil en memoria del navegador.
- En Server Actions de actualización/eliminación, aislar tareas sintéticas de sistema antes de ejecutar queries en tablas relacionales.

## Próximos pasos
- Opción B / UI: Incorporar patrones de tipografía tabular (`tabular-nums`) y sparklines en las tarjetas de KPI del Dashboard.
- Siguiente módulo funcional: Flujos de cotización y cuentas de cobro recurrentes.
