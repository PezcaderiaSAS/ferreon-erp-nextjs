# CHECKLIST-COTIZACION-1CLIC-SIN-BLOQUEO-FECHAS-001: Validación de Estándares

## 1. Idempotencia & Concurrencia
- [ ] La acción directa de 1-clic genera una clave única `conv_1clic_${id}_${Date.now()}`.
- [ ] El botón se desactiva físicamente (`pointer-events-none disabled:opacity-50`) mientras la mutación está en tránsito.
- [ ] No permite ejecuciones concurrentes sobre la misma cotización.

## 2. Integridad de Fechas & Datos
- [ ] Al formalizar, las fechas de inicio y fin de la cotización se mantienen exactamente iguales a las cotizadas originalmente.
- [ ] La base de datos no arroja `ERR_FECHA_INICIO_PASADA` si la fecha de inicio es anterior a `CURRENT_DATE`.
- [ ] El wizard (`useAlquilerForm.ts`) permite formalizar o guardar contratos con fecha de inicio en el pasado sin forzar retorno al paso 1.

## 3. Manejo de Conflictos de Inventario (Poka-Yoke)
- [ ] Si el stock es suficiente, la formalización se realiza en 1 clic y emite notificación toast de éxito.
- [ ] Si el stock es insuficiente (`esErrorStock === true`), no se rompe la aplicación: se abre el modal de resolución/asistencia con el detalle del faltante.

## 4. Calidad y Suite de Pruebas
- [ ] Se actualizan las pruebas unitarias en Vitest (`formalizar-cotizacion-polimorfica.test.ts`) para validar que las fechas pasadas son aceptadas exitosamente.
- [ ] Todas las pruebas unitarias pasan en verde (`npm test`).
