# Tareas Atómicas de Implementación: SPEC-007

- [x] **Tarea 1**: Actualizar `src/core/utils/fechas.ts`
  - Implementar `formatearHoraLocal` respetando zona horaria `America/Bogota`.
  - Implementar `resolverFechaYHoraEmision` para resolver fecha y hora tolerante a strings ISO, `created_at` o cadenas sin hora.
- [x] **Tarea 2**: Actualizar `src/core/services/pdf-factura-generator.service.ts`
  - Extender `DocumentoPDFPayload` con campo opcional `horaEmision`.
  - Integrar `Fecha:` y `Hora:` en el `.doc-badge`.
  - Integrar fecha y hora en el pie de página (`.footer`).
- [x] **Tarea 3**: Sincronizar generadores de payload en UI
  - Revisar y garantizar envío de timestamp en `AlquileresInteractiveIsland.tsx`.
  - Revisar y garantizar envío de timestamp en `useAlquilerForm.ts`.
- [x] **Tarea 4**: Verificación End-to-End con Chrome DevTools MCP
  - Generar PDF en vivo para Contrato #42 en Page 1 / Page 2.
  - Verificar visualmente el badge con `Fecha: DD/MM/YYYY` y `Hora: hh:mm AM/PM`.
  - Verificar formato A5 y Carta sin desbordamientos.
  - Verificar 0 errores en consola.
- [x] **Tarea 5**: Cierre y Gobernanza
  - Registrar memoria en Hindsight MCP con `retain`.
  - Actualizar `MEMORY.md` respetando el límite estricto de ~50 líneas.
