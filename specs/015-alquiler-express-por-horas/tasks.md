# Tareas de Implementación (Tasks): SPEC-015
## Módulo de Alquiler Express por Horas en Mostrador POS

---

### Fase 1: Dominio Puro y TDD (AlquilerHorasService)
- [ ] **T1.1**: Escribir suite de pruebas unitarias en `ferreon-erp-nextjs/tests/unit/alquiler-horas.service.test.ts` verificando:
  - Fórmula de tarifa horaria (día / 8 + 20% de recargo express) con redondeo entero COP.
  - Proyección de hora retorno automática.
  - Cálculo de horas extras y recargos por retraso.
- [ ] **T1.2**: Implementar `AlquilerHorasService` en `ferreon-erp-nextjs/src/core/services/alquiler-horas.service.ts`.
- [ ] **T1.3**: Ejecutar Vitest y validar 100% verde en pruebas unitarias.

---

### Fase 2: Configuración del Sistema y Parámetros
- [ ] **T2.1**: Actualizar `EmpresaConfig` (`empresa-config.ts` y `empresaStore.ts`) con `alquilerHorasHabilitado`, `maxEquiposAlquilerHoras` (default 5) y `recargoHorasPorcentaje` (default 20%).
- [ ] **T2.2**: Agregar tarjeta de configuración en `src/app/configuracion/page.tsx` para permitir al administrador ajustar el límite máximo de equipos en alquiler por horas.
- [ ] **T2.3**: Sincronizar Server Action `guardarConfiguracionEmpresaAction` con invalidación de caché Redis.

---

### Fase 3: Interfaz UI Ultra-Simple en Mostrador POS
- [ ] **T3.1**: Agregar switch gigante en `MostradorPosModal.tsx`: `[Modo Días (📅)]` vs `[Modo Horas (⏱️)]`.
- [ ] **T3.2**: En modo horas, mostrar tarjeta de reloj gigante: hora de salida automática y botones táctiles rápidos (`1h`, `2h`, `4h`, `8h`) más stepper grande `[ - ]` y `[ + ]`.
- [ ] **T3.3**: Aplicar Poka-Yoke visual: Si `totalEquipos >= maxEquiposAlquilerHoras`, deshabilitar la adición de más ítems con aviso amistoso claro.
- [ ] **T3.4**: Recalcular subtotales y totales al vuelo (horas x tarifa hora calculada) en 0 ms.

---

### Fase 4: Integración en Documentos (PDF y Ticket Térmico)
- [ ] **T4.1**: Actualizar `ContratoAlquilerPDF.tsx` y `TicketAlquilerModal.tsx` imprimiendo la hora de salida y hora pactada de entrega.

---

### Fase 5: Verificación Chrome DevTools & Despliegue
- [ ] **T5.1**: Compilación `tsc --noEmit` y `npm run build` en código 0.
- [ ] **T5.2**: Prueba interactiva con Chrome DevTools en Laptop (1366x768) y Móvil (375px), 0 errores de consola.
- [ ] **T5.3**: Commit git, push a `origin/main` y actualización de `MEMORY.md`.
