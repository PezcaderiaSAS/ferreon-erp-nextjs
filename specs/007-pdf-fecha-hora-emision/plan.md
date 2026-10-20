# Plan de Arquitectura e Implementación: Evidencia de Fecha y Hora en PDF

## Contexto Técnico
- **Objetivo**: Extender `EnterprisePDFService` y las utilidades canónicas de fecha en `src/core/utils/fechas.ts` para resolver e inyectar determinísticamente la fecha (`DD/MM/YYYY`) y la hora (`hh:mm AM/PM`) en el badge superior derecho y el pie de página de los PDFs generados.
- **Marco de Referencia**: 
  - `system-design-ground-truth`: Inmutabilidad, Single Source of Truth para tiempo y zona horaria (`America/Bogota`).
  - `ui-ux-ecosystem`: Cumplimiento de jerarquía visual en `DESIGN.md`, legibilidad tipográfica en Letter y A5 sin desbordamientos.
  - `agency-sdd-orchestrator`: TDD, verificación con Chrome DevTools MCP y 0 errores en consola.

---

## Componentes a Modificar

1. **`src/core/utils/fechas.ts`**:
   - Crear función canónica `formatearHoraLocal(fechaInput: string | Date | null | undefined, opciones?: { incluirSegundos?: boolean }): string`.
   - Utilizar `Intl.DateTimeFormat` con `timeZone: 'America/Bogota'`, `hour12: true` y sanitización de espaciados / AM-PM.
   - Crear función `resolverFechaYHoraDocumento(payload: any): { fecha: string; hora: string }` que analice `fechaEmision`, `horaEmision`, `created_at` y `horaInicioContrato` de forma resiliente.

2. **`src/core/services/pdf-factura-generator.service.ts`**:
   - Actualizar `DocumentoPDFPayload` para admitir explícitamente `horaEmision?: string`.
   - Modificar la renderización del encabezado `.doc-badge`:
     ```html
     <div class="doc-badge">
       <h2>${tituloDoc}</h2>
       <p><strong>N°: ${consecutivoDisplay}</strong></p>
       <p>Fecha: ${fechaDoc}</p>
       <p>Hora: ${horaDoc}</p>
     </div>
     ```
   - Modificar el `.footer` para agregar la leyenda de expedición con fecha y hora:
     ```html
     <div class="footer">
       ${tituloDoc} oficial expedida por ${emp.razonSocial} el ${fechaDoc} a las ${horaDoc}. Horario de corte: ${emp.notasFacturaPDF}
     </div>
     ```

3. **`src/components/alquileres/AlquileresInteractiveIsland.tsx`**:
   - Asegurar que al llamar a `handleGenerarPDF` y `handleVerPDFCotizacion`, se transmita tanto `fechaEmision` como `created_at` o la hora actual en formato ISO completo.

4. **`src/components/forms/alquiler/useAlquilerForm.ts`**:
   - Asegurar que `construirPayloadDocumento` pase `created_at` con estampa temporal completa o la hora de creación.

---

## Criterios de Aceptación y QA
1. **Visual en Badge**: El badge muestra de manera ordenada `Fecha: DD/MM/YYYY` y `Hora: hh:mm AM/PM`.
2. **Sin Desbordamiento**: Probado en tamaños Letter y A5.
3. **Zona Horaria de Colombia**: Probado contra desfase UTC (UTC-5), reflejando la hora local correcta.
4. **DevTools**: Cero errores en consola al abrir e imprimir el PDF.
