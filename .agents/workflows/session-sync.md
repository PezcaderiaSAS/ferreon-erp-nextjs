---
description: Sintetiza, consolida y condensa MEMORY.md a un máximo estricto de ~50 líneas al finalizar la jornada o sesión de trabajo.
argument-hint: "[resumen opcional de jornada]"
---

# Workflow: /session-sync

**Rol Responsable**: `@coordinator`  
**Objetivo**: Consolidar los avances, decisiones técnicas, lecciones aprendidas y pendientes inmediatos en `MEMORY.md` respetando el límite estricto de 50 líneas.

## Pasos de Ejecución

1. **Revisión de Avances**:
   - Inspeccionar los commits recientes (`git log -n 5`) y cambios en el código.
   - Revisar el estado actual de las suites de pruebas (`npm run test` / `vitest`).
2. **Actualización de MEMORY.md**:
   - Reducir el contenido para que contenga exclusivamente 4 secciones:
     - `## Estado actual` (Hitos alcanzados, páginas y estado de compilación).
     - `## Decisiones (y por qué)` (Decisiones técnicas y arquitectónicas tomadas).
     - `## Aprendizajes y errores a evitar` (Gotchas o restricciones descubiertas).
     - `## Próximos pasos` (1 a 3 tareas inmediatas priorizadas).
3. **Verificación de Límite de Líneas**:
   - Medir la longitud total del archivo. Si excede 50 líneas, compactar redacción y trasladar contexto histórico detallado a `docs/memory-bank/`.
4. **Confirmación**:
   - Notificar al usuario la sincronización de la memoria viva del proyecto.
