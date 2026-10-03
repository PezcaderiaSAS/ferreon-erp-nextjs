# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Catálogo UI Premium & Design Engineering (21 Patrones Certificados): Integrada la biblioteca completa `@/components/ui/premium` con soporte Dark Mode, Kanban avanzado (Sprint 38, rotación 2deg, físicas de arrastre), Linear Engineering System (5 pilares), Weekly Calendar sin solapamientos, Mobile Table 360px shell, Water Ripple GPU canvas a 60 FPS, Toast con gradientes 135deg, Goal Tracker SVG radial, Success Screen (*done ≠ dead end*), Border Radius Hierarchy (`R_outer = R_inner + P`), Dark Mode Surface Depth (`#000/#FFF = zero depth`), Resilient Avatar Fallback (`Image -> Initials -> Icon`), Tabular Numerals (`font-variant-numeric: tabular-nums`) y State Guard & Idempotency Key (`UI off isn't enough`).
- Showcase interactivo desplegado en `/design-system` con pestaña dedicada "Catálogo Premium" y 5 filtros de categoría.
- Pruebas y validaciones: 411/411 tests pasando (100%), 0 errores de TypeScript y compilación de producción exitosa.

## Decisiones (y por qué)
- **Biblioteca `@/components/ui/premium` modular (21 componentes)**: Provee componentes de grado enterprise listos para producción sin dependencias externas pesadas.
- **Fórmula de radios anidados (`R_outer = R_inner + P`)**: Elimina el anti-patrón de un solo radio universal que causa cortes visuales y desalineación en contenedores.
- **Surface Depth vs Pure Black**: Capas tonales (`#111827`, `#1f2937`) para eliminar la fatiga visual de `#000 / #FFF`.
- **Doble blindaje de estado (Handler + Idempotency-Key)**: Mitigación integral contra doble envío por latencia de red o clicks rápidos.

## Aprendizajes y errores a evitar
- Usar siempre `tabular-nums` y alineación a la derecha en métricas y tablas contables para evitar que los decimales bailen.
- No depender exclusivamente de deshabilitar botones en frontend para operaciones transaccionales.

## Próximos pasos
- Siguiente hito funcional: Integración de componentes UI Premium en flujos de facturación, contratos y reportes analíticos del ERP.
