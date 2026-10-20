# Desglose de Tareas Atómicas (TDD): SPEC-001 Modernización UI/UX Enterprise

## Matriz de Tareas Atómicas para `@implementer`
Cada tarea debe ser ejecutada de manera independiente bajo el ciclo Red-Green-Refactor, garantizando la preservación de la suite de pruebas.

---

### [x] Tarea 1: Sincronización de Tokens Dark Glassmorphism en Tokens y Tailwind
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/figma_design_tokens.json`
  - `ferreon-erp-nextjs/tailwind.config.ts`
- **Criterio de Aceptación**:
  - Inyectar la colección `theme-dark-glassmorphism` en `figma_design_tokens.json` con fondos `hsl(222, 47%, 11%)`, superficies translúcidas `rgba(15, 23, 42, 0.75)` y bordes `rgba(255, 255, 255, 0.10)`.
  - Configurar en `tailwind.config.ts` las clases semánticas de `sidebar` para que admitan variables adaptativas de modo oscuro.
- **Estado**: COMPLETADA

---

### [x] Tarea 2: Modernización de Layout Shell (Sidebar y TopNav)
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/src/components/ui/Sidebar.tsx`
  - `ferreon-erp-nextjs/src/components/ui/TopNav.tsx`
- **Criterio de Aceptación**:
  - Reemplazar las clases fijas `bg-white border-slate-200 text-slate-900` por clases reactivas al tema con translucidez (`bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100`).
  - Añadir microinteracciones suaves de 150ms en estados hover de los enlaces de navegación.
- **Estado**: COMPLETADA

---

### [x] Tarea 2B: Remediación de Contraste y Legibilidad en UltraAdmin (/admin/empresas)
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/src/app/admin/empresas/page.tsx`
  - `ferreon-erp-nextjs/src/components/ultraadmin/TenantListTable.tsx`
- **Criterio de Aceptación**:
  - Aplicar `bg-slate-950 min-h-screen text-slate-100` en el contenedor raíz de `page.tsx` para garantizar el fondo oscuro.
  - Corregir el banner DMCA con fondo `bg-amber-950/50 border-amber-500/40` y textos `text-amber-200` y `text-amber-100` legibles.
  - Mejorar contraste en las 4 tarjetas de métricas con títulos `text-slate-300 font-bold uppercase` y subtítulos vibrantes.
  - Asegurar que la tabla `TenantListTable.tsx` aplique el tema oscuro con filas de alto contraste, bordes definidos y badges legibles.
- **Estado**: COMPLETADA

---

### [x] Tarea 3: Prueba TDD para Renderizado Móvil de Grilla de Datos
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/src/components/ui/linear-table/__tests__/LinearDataTable.responsive.test.tsx` (Nuevo)
- **Criterio de Aceptación**:
  - Escribir pruebas unitarias con Vitest y React Testing Library que verifiquen:
    1. La presencia de la clase `hidden md:table` en el elemento `<table>`.
    2. La presencia del contenedor de tarjetas móviles con clase `block md:hidden`.
  - La prueba DEBE fallar (RED) antes de modificar `LinearDataTable.tsx`.
- **Estado**: COMPLETADA

---

### [x] Tarea 4: Implementación de Transformación Líquida a Tarjetas en LinearDataTable
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/src/components/ui/linear-table/LinearDataTable.tsx`
  - `ferreon-erp-nextjs/src/components/ui/linear-table/types.ts`
- **Criterio de Aceptación**:
  - Añadir la prop `renderMobileCard?: (item: T, isSelected: boolean) => React.ReactNode` a `LinearDataTableProps<T>`.
  - Renderizar el bloque `block md:hidden` con tarjetas apiladas fluidas y fallback automático para cualquier tabla que no defina plantilla personalizada.
  - Pasar a verde (GREEN) la prueba de la Tarea 3.
- **Estado**: COMPLETADA

---

### [x] Tarea 5: Enriquecimiento de Tarjeta Móvil en ContratosAlquilerTable
- **Archivos Afectados**:
  - `ferreon-erp-nextjs/src/components/alquileres/ContratosAlquilerTable.tsx`
- **Criterio de Aceptación**:
  - Proveer a `LinearDataTable` una función `renderMobileCard` especializada para contratos de alquiler.
  - La tarjeta móvil debe mostrar: consecutivo y cliente, badges semánticos de estado (ACTIVO, VENCIDO, etc.), subtotal estimado en tipografía `JetBrains Mono` ($ COP) y botón de acciones contextuales sin provocar scroll horizontal.
- **Estado**: COMPLETADA

---

### [x] Tarea 6: Verificación Global de No Regresión y Compilación
- **Comandos de Verificación**:
  - `npm test` o `pnpm test` (Suite completa de Vitest).
  - Verificación de tipos TypeScript (`npm run build` o `npx tsc --noEmit`).
- **Criterio de Aceptación**:
  - Mantener 396/396 pruebas pasando al 100% (o 397+ con el nuevo test responsivo).
  - Cero errores de compilación o linter.
- **Estado**: COMPLETADA (404/404 pruebas aprobadas en 75 suites, tsc --noEmit con 0 errores)
