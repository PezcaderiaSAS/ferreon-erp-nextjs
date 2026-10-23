# Desglose de Tareas de Implementación (TDD): SPEC-013
## Módulo de Firma Digital Touch en Pantalla para el Cliente

---

### Fase 1: Capa de Dominio Puro (TDD) [x]
- [x] **TASK-013-01 (TDD)**: Escribir suite `tests/unit/firma-digital.service.test.ts` con cobertura de validación Base64, tamaños máximos, formatos soportados (PNG/WebP), detección de canvas vacío y generación de estampa legal.
- [x] **TASK-013-02 (Dominio)**: Implementar `src/core/services/firma-digital.service.ts` haciendo pasar todas las pruebas de la Fase 1 al 100% en verde.

### Fase 2: Esquemas Zod & Server Action [x]
- [x] **TASK-013-03 (Esquemas)**: Crear `src/core/domain/schemas/firmaClienteSchemas.ts` desacoplado de directivas de servidor.
- [x] **TASK-013-04 (Server Action)**: Implementar `src/app/actions/firma-cliente.ts` con `guardarFirmaClienteAlquilerAction`, validación Zod, persistencia en Supabase, invalidación de caché Redis y auditoría inmutable.

### Fase 3: Componentes de Interfaz Touch & Modales [x]
- [x] **TASK-013-05 (Canvas Touch)**: Crear `src/components/common/FirmaTouchCanvas.tsx` con soporte PointerEvents, Retina DPR, micro-animación de borrado y exportación limpia en PNG.
- [x] **TASK-013-06 (Modal Pad)**: Crear `src/components/common/FirmaTouchPadModal.tsx` con diseño responsive adaptado a móvil (375px) y laptop (1366px), atajos y estado de confirmación.

### Fase 4: Estampado en PDF & Integración POS / Alquileres [x]
- [x] **TASK-013-07 (PDF Generator)**: Integrar soporte de firma del cliente en `ContratoAlquilerPDF.tsx` y `EnterprisePDFService` (`pdf-factura-generator.service.ts`).
- [x] **TASK-013-08 (Integración POS)**: Añadir botón de firma touch del cliente en `MostradorPosModal` y en `VisorDocumentoPDFModal`.

### Fase 5: QA Integral, DevTools y Cierre [x]
- [x] **TASK-013-09 (QA DevTools)**: Inspección visual y operativa en Laptop (1366x768) y Móvil (375px) con Chrome DevTools MCP (0 errores en consola).
- [x] **TASK-013-10 (Build & Git)**: Ejecutar `tsc --noEmit`, `npm run build`, push a GitHub y actualizar `MEMORY.md`.
