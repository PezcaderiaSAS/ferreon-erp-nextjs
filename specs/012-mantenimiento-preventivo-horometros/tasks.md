# Desglose de Tareas de Implementación (TDD): SPEC-012
## Módulo de Mantenimiento Preventivo, Horómetros y Alertas de Uso WMS

---

### Fase 1: Capa de Dominio Puro (TDD) [x]
- [x] **TASK-012-01 (TDD)**: Escribir suite `tests/unit/mantenimiento-preventivo.service.test.ts` con cobertura de semáforos (`OK`, `PROXIMO`, `VENCIDO`), porcentajes de vida útil, acumulación de días/horas y reseteo de ciclo.
- [x] **TASK-012-02 (Dominio)**: Implementar `src/core/services/mantenimiento-preventivo.service.ts` haciendo pasar todas las pruebas de la Fase 1 al 100% en verde.

### Fase 2: Server Action & Trazabilidad Kardex [x]
- [x] **TASK-012-03 (Server Action)**: Crear `src/app/actions/mantenimiento.ts` con validación Zod, transferencia atómica de `stock_mantenimiento` a `stock_disponible`, asiento inmutable en `kardex_inventario` e invalidación de caché.

### Fase 3: Componentes UI de Bodega [x]
- [x] **TASK-012-04 (UI)**: Construir `src/components/bodega/BarraVidaUtilEquipo.tsx` con micro-barra de progreso visual, tooltip explicativo y tokens de diseño de `DESIGN.md`.
- [x] **TASK-012-05 (UI)**: Construir `src/components/bodega/RegistrarMantenimientoModal.tsx` con formulario técnico accesible, selección de cantidad de unidades puestas a punto y notas de taller.
- [x] **TASK-012-06 (Integración Bodega)**: Integrar filtro y badges en `src/components/bodega/BodegaInteractiveIsland.tsx` permitiendo filtrar por "Requiere Mantenimiento" y ejecutar la acción en 1 clic.

### Fase 4: Poka-Yoke de Despacho & Integración [x]
- [x] **TASK-012-07 (Poka-Yoke)**: Agregar banner preventivo en `MostradorPosModal` para equipos con mantenimiento vencido.

### Fase 5: QA Integral, Verificación DevTools y Cierre [x]
- [x] **TASK-012-08 (QA DevTools)**: Inspección visual interactiva en Laptop (1366x768) y Móvil (375px) con Chrome DevTools MCP verificando 0 errores de JavaScript.
- [x] **TASK-012-09 (Build & Git)**: Ejecutar `tsc --noEmit`, `npm run build`, push a GitHub y actualizar `MEMORY.md`.
