---
description: Registra modificaciones en specs existentes generando el diff correspondiente antes de programar cualquier cambio.
argument-hint: "<ruta-a-spec-o-nombre-funcionalidad>"
---

# Workflow: /sdd-change

**Roles**: `@planner` -> `@coordinator`  
**Objetivo**: Gestionar cambios de alcance o refactorizaciones sobre especificaciones ya establecidas, evitando desviaciones arquitectónicas no autorizadas.

## Pasos de Ejecución

1. **Localizar la Especificación**:
   - Abrir `specs/NNN-<nombre-funcionalidad>/spec.md` y `plan.md`.
2. **Generar Diff de Requisitos**:
   - Redactar los cambios propuestos en notación EARS.
   - Detallar qué requisitos cambian, cuáles se descartan y cuáles se agregan.
   - Evaluar el impacto en la base de datos (migraciones Supabase), Server Actions y componentes UI.
3. **Actualización de Tareas**:
   - Ajustar `tasks.md` añadiendo las nuevas tareas con sus criterios de verificación DevTools.
4. **Presentación de Artefactos**:
   - Publicar el diff de especificación al usuario y esperar confirmación formal antes de habilitar al `@implementer`.
