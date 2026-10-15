# Regla: Gobernanza Enterprise Antigravity 2.0 (v5.0)

## 1. Disyuntor Semántico de Artefactos (Strict Mode vs Turbo Mode)
- **Fase de Auditoría y Diseño (Strict Mode)**: Queda terminantemente prohibido modificar código fuente sin antes presentar en la superficie de gestión (*Manager Surface*) los artefactos de especificación (`spec.md`), plan técnico (`plan.md`) y lista de tareas (`tasks.md`), esperando la aprobación explícita del usuario.
- **Fase de Construcción (Turbo Mode)**: Habilitada tras la aprobación del plan. Los agentes implementadores operan en ciclo TDD autónomo, ejecutando pruebas automatizadas e inspecciones visuales.

## 2. Bucle Obligatorio de Verificación Dual (DevTools MCP)
- Tras CADA modificación o actualización de código realizada en el proyecto, es OBLIGATORIO validar:
  1. **Consola Limpia**: 0 errores y 0 advertencias en la consola JavaScript.
  2. **Resolución Laptop**: Inspección visual en pantallas tipo laptop (1366x768 px o 1440x900 px), garantizando que no existan desbordamientos horizontales ni colisiones de UI.
  3. **Resolución Móvil**: Inspección responsive en viewport estándar móvil (375 px), garantizando navegación táctil, menús colapsables y legibilidad de tablas.
  4. **Prueba Funcional Interactiva**: Validación manual/automática del flujo modificado.

## 3. Mantenimiento de Memoria Viva (MEMORY.md)
- [MEMORY.md](file:///c:/Users/USUARIO/Documents/Aplicaciones/FerreOn/Alquileres_erp/MEMORY.md) debe mantenerse en un límite estricto de **$\le 50$ líneas**.
- Toda documentación arquitectónica de largo plazo debe consolidarse en `docs/memory-bank/` o en `docs/constitution.md`.

## 4. Gobernanza Temporal y Datos de Tipo Fecha (Colombia UTC-5)
- **Prohibición Estricta:** Ningún agente o desarrollador puede invocar `new Date("YYYY-MM-DD").toISOString()` o `new Date("YYYY-MM-DD").toLocaleDateString()` para parsear o mostrar fechas de negocio. Esto provoca desfasajes de 1 día (19:00:00 del día anterior en UTC-5).
- **Módulo Obligatorio:** Todo cálculo, parseo o serialización debe utilizar `src/core/utils/fechas.ts`:
  - `parsearFechaLocal` (anclaje a 12:00:00).
  - `formatearFechaISO` (string `YYYY-MM-DD` invariable).
  - `formatearFechaLocal` (visualización `DD/MM/YYYY`).
  - `calcularDiasEntreFechas` (mínimo 1 día).
  - `resolverFechaYHoraDocumento` (fecha y hora en `America/Bogota`).
- **Integridad de Formularios:** Al cambiar fechas maestras en encabezados, las fechas de ítems individuales ya configurados deben ser respetadas sin sobreescrituras en cascada destructivas.
- **Datos para PDFs:** Todo generador o comprobante de impresión debe consumir fechas sanitizadas sin excepción.
