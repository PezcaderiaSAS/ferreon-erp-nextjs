# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Calendario del Dashboard y Centro de Control (Hito 17/19 - Enriquecido y Verificado en Prod):
  - Corrección de esquema: Eliminadas columnas inexistentes `numero_contrato`, `fecha_inicio` y `fecha_fin` del select de `alquileres`. Las fechas se extraen dinámicamente de `alquiler_detalles` (min/max por contrato).
  - Integración multi-flujo: Añadidas consultas concurrentes a `cotizaciones`, `facturas` (cuentas de cobro) y `pagos` en `obtenerDashboardDataAction`.
  - UI/UX en `CalendarioOperativoIsland.tsx` y `ActividadDrawer.tsx`: Píldoras de filtro dedicadas para *Cotizaciones* (púrpura) y *Cobros / Facturación* (esmeralda), con badges y chips contextuales.
- Pruebas y validaciones: 79 suites de Vitest pasadas (439 tests aprobados al 100%), 0 errores TypeScript (`tsc --noEmit`), `npm run build` en verde (32/32 páginas generadas), desplegado en `origin main` (commit `1d991117`).

## Decisiones (y por qué)
- **Extracción de Fechas por Agregación de Detalles**: Como en el modelo relacional de Supabase las fechas de vigencia pertenecen a cada línea de equipo (`alquiler_detalles`), el rango de un contrato se computa con `min(fecha_inicio)` y `max(fecha_fin)` de sus ítems.
- **Unificación de Cotizaciones y Cobros en el Calendario**: Permite a la gerencia y comerciales supervisar en una sola pantalla los despachos de maquinaria, retornos pactados, cobros/recaudos y vencimientos de cotizaciones.

## Aprendizajes y errores a evitar
- Nunca asumir que `alquileres` tiene columnas `fecha_inicio` o `numero_contrato`; siempre verificar el esquema de la tabla con Supabase MCP antes de estructurar consultas Server Actions.
- En mocks de Vitest para Supabase, usar un helper encadenable (`createChainableQuery`) para evitar errores de tipo cuando se agregan llamadas a `.limit()`, `.is()` u `.order()`.

## Próximos pasos
- Verificar visualmente la visualización de los eventos de cotizaciones y cobros en el dashboard de producción en Vercel.
- Opcional: Grabar demostración interactiva con Recordly para QA visual.
