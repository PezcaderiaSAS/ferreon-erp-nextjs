# Memoria de Sesión Persistente — Alquileres System

## Estado actual
- Plataforma: Alquileres System (Next.js 14 en Vercel + Supabase Postgres RLS).
- Catálogo UI Premium Completo (16 Patrones Certificados): Integrada la biblioteca de componentes `@/components/ui/premium` con soporte Dark Mode, Kanban avanzado (Sprint 38, rotación 2deg, físicas de arrastre), Linear Engineering System (5 pilares), Weekly Calendar con cero solapamientos, Mobile Table 360px shell, Water Ripple GPU canvas a 60 FPS, Toast con gradientes 135deg, Goal Tracker SVG radial y Success Screen (*done ≠ dead end*).
- Showcase interactivo desplegado en `/design-system` con pestaña dedicada "Catálogo Premium".
- Pruebas y validaciones: 411/411 tests pasando (100%), 0 errores de TypeScript y compilación de producción exitosa.

## Decisiones (y por qué)
- **Biblioteca `@/components/ui/premium` aislada**: Provee componentes de grado enterprise listos para producción sin acoplamiento a librerías externas pesadas.
- **Principio UX 'done ≠ dead end'**: Toda pantalla de finalización ofrece inmediatamente el siguiente paso de valor operativo (Next Step) para maximizar la retención.
- **Microinteracciones con aceleración GPU**: Uso de `transform`, `opacity` y keyframes optimizados para 60 FPS sin memory leaks ni re-renders innecesarios.

## Aprendizajes y errores a evitar
- Evitar nombres de íconos no canónicos entre versiones de `lucide-react` (usar `UploadCloud` en vez de `CloudArrowUp`, y `Layers` en vez de `LayoutKanban`).
- Diseñar siempre con adaptabilidad móvil 360px shell comprobable antes de aprobar componentes de tablas densas.

## Próximos pasos
- Siguiente hito funcional: Integración de componentes UI Premium en flujos de facturación, contratos y reportes analíticos del ERP.
