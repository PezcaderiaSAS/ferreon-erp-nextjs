# SPEC-2026-COTIZACION-1CLIC-SIN-BLOQUEO-FECHAS-001: Formalización Directa 1-Clic sin Bloqueo de Fechas

## 1. Visión y Alcance
- **Módulo**: Alquileres (Gestión de Cotizaciones y Formalización de Contratos).
- **Contexto Operativo Real**: En la operativa diaria de FerreOn / Alquileres, el personal en mostrador y obra despacha equipos y realiza el registro documental en el ERP de manera **retrospectiva / diferida** (post-facto), días después de haber acordado o entregado la maquinaria. Aún no operan con captura estricta en tiempo real.
- **Problema**: El sistema imponía una barrera artificial asumiendo que cualquier fecha de inicio en el pasado era un error o inconsistencia temporal (`ERR_FECHA_INICIO_PASADA`), forzando ratificaciones y bloqueando la formalización inmediata.
- **Objetivo**: 
  1. Habilitar la digitalización diferida/retroactiva como un escenario de primera clase: permitir fechas de inicio y fin en el pasado sin advertencias ni bloqueos.
  2. Implementar la formalización directa en **1 solo clic** desde la tabla de cotizaciones: al hacer clic en el botón "Formalizar Contrato", se ejecuta inmediatamente la transacción con estado de carga (spinner), manteniendo intactas las fechas cotizadas tal como fueron digitadas.
  3. Manejo de excepciones elegante: Si existe un conflicto real de stock de inventario, se abre el modal asistido para resolver el overbooking o derivar a subcontratación.

---

## 2. Requerimientos Funcionales (El "Qué")

### RF-01: Formalización Directa 1-Clic desde Tabla
- El botón "Formalizar Contrato" en cada fila de la pestaña de cotizaciones debe disparar la Server Action de conversión de forma inmediata.
- Retroalimentación visual de baja latencia: spinner de carga en el botón específico (`isConvertingId === cot.id`), deshabilitación para evitar doble clic o condiciones de carrera y clave de idempotencia única.
- Al completarse exitosamente, emitir una notificación toast clara (ej: *"Contrato ALQ-XX formalizado con éxito"*) y actualizar el estado de la fila / transferirla a la pestaña correspondiente.

### RF-02: Eliminación Total de Bloqueo por Fechas Pasadas
- **Base de Datos (RPC)**: Retirar la excepción `ERR_FECHA_INICIO_PASADA` en `formalizar_alquiler_cotizacion_transaccional`. El procedimiento almacenado debe respetar y preservar la fecha original sin alterarla ni arrojar error de validación temporal.
- **Server Action**: Retirar el bloqueo o manejo restrictivo de fecha pasada en `convertirCotizacionAContratoAction`.
- **UI / Modal (`ConvertirCotizacionModal.tsx`)**: Eliminar el mensaje de advertencia obligatorio *"Ratificación de Fecha de Despacho Requerida"* y la validación que impedía avanzar si la fecha original estaba en el pasado.
- **Wizard (`useAlquilerForm.ts`)**: Eliminar el chequeo `esFechaInicioEnPasado` que bloqueaba el guardado o formalización en el paso de liquidación.

### RF-03: Manejo Asistido de Conflictos de Inventario
- Si la formalización directa en 1 clic detecta falta de inventario (`esErrorStock === true`), el sistema debe abrir automáticamente el modal de conversión/asistencia para que el usuario pueda visualizar el faltante, sustituir o derivar a subcontratación.

---

## 3. Requerimientos No Funcionales (Estándares Técnicos)
- **Idempotencia**: Protección absoluta contra doble clic mediante llave criptográfica `conv_1clic_${id}_${Date.now()}`.
- **Atomicidad Transaccional**: Mantener los bloqueos pesimistas ordenados (`ORDER BY id ASC FOR UPDATE`) en PostgreSQL para evitar deadlocks y sobreventas.
- **Compatibilidad Polimórfica**: Soporte tanto para cotizaciones registradas en la tabla `cotizaciones` (UUID) como en la tabla `alquileres` (ID numérico).
- **Rigor de Pruebas**: Actualizar y añadir pruebas unitarias e integración en Vitest que certifiquen la admisión de fechas pasadas y la respuesta de la formalización 1-clic.
