# Tareas de Implementación (Tasks): SPEC-014
## Motor de Tarifas Dinámicas por Días Hábiles vs Calendario con Exclusión de Domingos y Festivos de Colombia

---

### Fase 1: Dominio Puro y TDD (CalendarioLaboralService)
- [ ] **T1.1**: Escribir pruebas unitarias exhaustivas en `ferreon-erp-nextjs/tests/unit/calendario-laboral.service.test.ts` cubriendo Computus, festivos de Colombia, traslados Ley Emiliani y cálculo de días cobrables.
- [ ] **T1.2**: Implementar `CalendarioLaboralService` en `ferreon-erp-nextjs/src/core/services/calendario-laboral.service.ts` con todos los métodos puros y tipos TypeScript.
- [ ] **T1.3**: Ejecutar y validar que la suite TDD pase al 100% en verde con Vitest.

---

### Fase 2: Schemas Zod y Server Actions
- [ ] **T2.1**: Actualizar esquemas de validación Zod (`alquilerSchemas.ts` o módulo de alquileres) admitiendo `modo_cobro_dias: z.enum(['CALENDARIO', 'HABILES_LUNES_VIERNES', 'HABILES_LUNES_SABADO']).default('CALENDARIO')` y `dias_cobrables: z.number().positive().optional()`.
- [ ] **T2.2**: Adaptar las Server Actions de creación y actualización de alquileres para calcular y registrar de forma coherente los días facturables.

---

### Fase 3: Integración UI en Mostrador POS y Formularios
- [ ] **T3.1**: Crear componente o selector interactivo de `ModoCobroSelector` con badges de días cobrables y excluidos.
- [ ] **T3.2**: Integrar el cálculo dinámico en `MostradorPosModal.tsx` recalculando subtotales y días en vivo al cambiar fechas o modo.
- [ ] **T3.3**: Garantizar experiencia responsive fluida en 1366x768 (Laptop) y 375px (Móvil) sin desbordamiento.

---

### Fase 4: Integración en Contrato PDF
- [ ] **T4.1**: Actualizar `ContratoAlquilerPDF.tsx` y `EnterprisePDFService` para imprimir la modalidad de cobro pactada y los días cobrables (ej: "Días cobrables: 5 (Hábiles L-V, excl. domingos y festivos)").

---

### Fase 5: Verificación Chrome DevTools y Despliegue
- [ ] **T5.1**: Ejecutar `tsc --noEmit` y `npm run build` sin errores.
- [ ] **T5.2**: Auditar con Chrome DevTools MCP en Laptop (1366x768) y Móvil (375px), verificando 0 errores de consola y funcionalidad interactiva.
- [ ] **T5.3**: Commit git, push a `origin/main` y actualizar `MEMORY.md`.
