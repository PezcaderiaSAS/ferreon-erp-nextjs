# Plan de Arquitectura y Diseño: SPEC-005 Ajuste de Terminología y Blindaje Anti-Desbordamiento UI/UX

## 1. Alcance y Arquitectura de Cambios

### Capa 1: Dominio y Tipos
- `src/core/services/dashboard-transaccional.service.ts`: Mantener la clave de cálculo o agregar alias `utilizacionInventarioPct` conservando compatibilidad para no romper consumidores existentes.
- `src/core/constants/academia-curriculum.ts`: Renombrar la insignia a `Explorador de Inventario` con id `explorador-inventario` (con fallback de ID para progreso existente).
- `src/core/services/gamification.service.ts`: Sincronizar insignia y descripción del tour.

### Capa 2: Componentes UI
- `src/components/dashboard/DashboardKpiGrid.tsx`:
  - `FLOTA · 01` -> `INVENTARIO · 01`
  - `Utilización de Flota` -> `Utilización de Inventario`
  - Gradiente y Sparkline: `sparklineInventario`, `gradientId="spark-inventario"`
  - Tipografía responsiva en Card 4 para valores monetarios grandes: `text-xl sm:text-2xl` dinámico o condicional.
- `src/components/ui/TopNav.tsx`:
  - Badge de Academia:
    - En pantallas `< 2xl`: Mostrar `{configRango.icono} Nivel {rangoActual} · {xpTotal} XP` (o badge compacto) con font-bold nítido, sin elipsis.
    - En pantallas `>= 2xl`: Mostrar `{configRango.icono} {configRango.nombre} · {xpTotal} XP`.
    - Barra de búsqueda: `flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md` para permitir respiración a los botones de navegación.
- `src/components/layout/AppShell.tsx`:
  - Contenedor principal: Reemplazar el `w-full` en conflicto con `md:ml-56 lg:ml-60 xl:ml-64` por `w-full md:w-[calc(100%-14rem)] lg:w-[calc(100%-15rem)] xl:w-[calc(100%-16rem)]` o `min-w-0 flex-1 w-auto`, evitando desbordamientos que empujen elementos fuera del viewport.
- `src/components/academia/AcademiaIsland.tsx` y `src/components/dashboard/DashboardInteractiveIsland.tsx`:
  - Garantizar `pb-20` / `safe-area-pb` en la vista de Dashboard para que la interacción con tareas inferiores quede completamente libre de obstáculos visuales.

### Capa 3: Pruebas Unitarias
- `tests/unit/dashboard-transaccional.service.test.ts`: Actualizar comentarios y pruebas.
- `tests/unit/gamification.service.test.ts`: Actualizar pruebas de la insignia `explorador-inventario`.

---

## 2. Estrategia de Verificación y Rollout
1. Compilación TypeScript: `tsc --noEmit`.
2. Pruebas automatizadas: `npm test` o `pnpm test`.
3. Verificación en vivo con Chrome DevTools MCP:
   - Navegar a `http://localhost:3000/dashboard`.
   - Tomar captura del viewport.
   - Confirmar visualmente: ausencia de "Flota", badge "📦 Nivel 2 · 250 XP" sin corte, visualización completa de "$ 11.734.500", y botón "+ Nuevo Alquiler" totalmente visible.
