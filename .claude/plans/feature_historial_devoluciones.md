# Plan de Implementación: Historial de Devoluciones y Registro de Pagos

Este documento sirve como Runbook para el loop automatizado encargado de construir el módulo de historial de devoluciones con trazabilidad de pagos.

## 1. Definición del Dominio y Esquema de Datos
El objetivo es registrar un rastro auditable (Audit Trail) cada vez que se realice la acción "Registrar Retorno / Inspección". 

**Entidades afectadas:**
1. `DevolucionEntity`: Debe incluir `fecha`, `usuarioId` (o `usuarioNombre`), y relacionarse con los ítems devueltos.
2. `PagoEntity` (Recibo de Caja): Si durante la devolución se cobra dinero (ej. penalidad por daños o limpieza), se debe registrar un `PagoEntity` ligado al mismo `alquilerId` y marcar el origen como `DEVOLUCION`.

## 2. Flujo de Trabajo (UI/UX)
1. **Modal de Inspección**: Al hacer clic en "Registrar Retorno / Inspección", se presenta un modal.
2. **Registro de Novedades**: El usuario indica qué ítems se devuelven en buen estado y cuáles tienen daños.
3. **Cobro Adicional**: Si hay daños, el modal debe mostrar una sección opcional "Generar Factura/Recibo de Cobro Adicional". 
   - El usuario ingresa el monto, método de pago y referencia.
4. **Historial Visual**: En la vista de detalles del contrato (o en una nueva pestaña de "Historial de Devoluciones"), debe aparecer un timeline o tabla mostrando:
   - Fecha de la devolución.
   - Usuario que recepcionó.
   - Ítems devueltos.
   - Pago asociado (si aplica).

## 3. Tareas Técnicas a Ejecutar en el Loop
- [ ] Analizar el estado actual de `src/core/domain/entities/devolucion.ts` (si existe, o crearlo).
- [ ] Analizar `src/core/application/use-cases/devolver-equipo.use-case.ts` para inyectar la lógica de creación simultánea del `PagoEntity`.
- [ ] Actualizar el componente React que maneja el modal de devoluciones en el módulo de Inventario/Devoluciones (basado en la captura de pantalla).
- [ ] Desarrollar un nuevo componente de UI `HistorialDevoluciones.tsx` que consuma este estado y lo renderice (similar al `HistorialPagosModal`).
