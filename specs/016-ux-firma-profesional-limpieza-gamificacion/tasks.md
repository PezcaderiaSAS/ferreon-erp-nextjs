# Tareas de Implementación (Tasks): SPEC-016
## Eliminación de Widgets Flotantes y Reingeniería de Bloque de Firmas

---

### Fase 1: Limpieza del Layout y Desacoplamiento de Widgets Flotantes
- [x] **T1.1**: Remover `<AcademiaIsland />` de `src/components/layout/AppShell.tsx` y limpiar imports.
- [x] **T1.2**: Normalizar el padding inferior de `<main>` en `AppShell.tsx` de `pb-24 sm:pb-28` a `pb-6 sm:pb-8 md:pb-10`.
- [x] **T1.3**: Verificar que los accesos fijos a la Academia permanezcan en `TopNav.tsx` y no se rompa la apertura voluntaria de `AcademiaModal` ni `GuiaBotonesFlujosModal`.

---

### Fase 2: Reingeniería del Bloque de Firmas en Generador HTML (`pdf-factura-generator.service.ts`)
- [x] **T2.1**: Rediseñar las clases CSS `.signatures`, `.sig-column`, `.sig-image-box`, `.sig-line-rule` y `.sig-meta` en `src/core/services/pdf-factura-generator.service.ts`.
- [x] **T2.2**: Reestructurar el marcado HTML para ubicar la imagen de rúbrica en la caja superior, la línea horizontal continua en el centro, y los datos del firmante (Razón Social / Nombre, NIT / C.C., rol) en la sección inferior.
- [x] **T2.3**: Asegurar que tanto en formato Carta como en formato Media Carta (A5) la zona de firmas escale armoniosamente sin provocar saltos de página huérfanos.

---

### Fase 3: Reingeniería del Bloque de Firmas en React-PDF (`ContratoAlquilerPDF.tsx`)
- [x] **T3.1**: Actualizar los estilos en `ContratoAlquilerPDF.tsx` (`sigImageBox`, `sigLineRule`, `sigMetaBox`, etc.).
- [x] **T3.2**: Reorganizar el JSX del bloque de firmas para posicionar la rúbrica sobre la línea divisoria y la metadata bajo la línea.

---

### Fase 4: Pruebas Unitarias y TDD
- [x] **T4.1**: Ajustar y ejecutar la suite `tests/unit/pdf-firma-emisor.test.ts` con Vitest y certificar 100% verde (12/12 tests pasando, cubriendo HTML y React-PDF).
- [x] **T4.2**: Ejecutar chequeo de tipos TypeScript (`npx tsc --noEmit` - 0 errores).

---

### Fase 5: Verificación Visual con Chrome DevTools MCP & Entrega
- [x] **T5.1**: Inspeccionar la ausencia del widget flotante y la correcta diagramación de las firmas en `VisorDocumentoPDFModal`.
- [x] **T5.2**: Inspeccionar el layout responsive sin paddings artificiales.
- [x] **T5.3**: Actualizar `MEMORY.md` y preparar reporte final.
