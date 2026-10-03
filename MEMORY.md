# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Módulo Dashboard (Hito 17 - Opción B Completada):
  - KPIs en vivo (`DashboardKpiGrid`): Micro-gráficos Sparkline SVG dinámicos integrados, tipografía monoespaciada tabular (`tabular-nums`) para estabilidad de montos COP y contadores, y jerarquía armónica de radios anidados ($R_{outer} = 16\text{px}$, $R_{inner} = 10\text{px}$).
  - Calendario Operativo (`CalendarioOperativoIsland`): Fechas y montos de agenda tabulares, filtros con dot badges semánticos reactivos y radios coherentes.
  - Tareas y Alertas (`ResumenTareasCard`, `RecordatorioEventosFeed`, `ActividadDrawer`): Persistencia completa en Supabase (`dashboard_tareas`), acciones atómicas, badges semánticos y soporte Dark Mode por capas tonales.
- Pruebas y validaciones: 77 suites de Vitest pasadas, 419/419 tests aprobados (100%), 0 errores TypeScript (`tsc --noEmit`), compilación de producción Next.js 32/32 rutas en verde.

## Decisiones (y por qué)
- **Sparklines SVG puros**: Implementados en ~25 líneas sin librerías pesadas de gráficos, garantizando 0 kB de sobrecarga en el bundle cliente y rendimiento de 60 fps.
- **Tipografía `tabular-nums`**: Evita saltos y temblores de alineación en números al cambiar de valor o mostrar tablas de cartera.
- **Jerarquía de Radios Anidados ($R_{outer} = R_{inner} + P$)**: Garantiza alineación visual geométrica perfecta entre contenedores y elementos hijos.
- **Persistencia en `dashboard_tareas`**: Mantiene las tareas de usuario entre recargas con RLS multitenant y soft-delete.

## Aprendizajes y errores a evitar
- No usar librerías de charting completas cuando micro-gráficos SVG resuelven con exactitud la señal visual de tendencia.
- Evitar aplicar un único `border-radius` genérico a contenedores y elementos hijos; siempre restar el padding para evitar solapamientos o esquinas desfasadas.
- En Server Actions de actualización/eliminación, filtrar tareas sintéticas de sistema antes de consultar tablas relacionales.

## Próximos pasos
- Siguiente módulo funcional: Diseñar e implementar el flujo de Cotizaciones avanzadas o Cuentas de cobro recurrentes.
- Opcional: Registrar recorrido en video interactivo con Recordly para QA y documentación.
