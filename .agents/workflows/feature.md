---
description: Planifica e implementa tareas menores exigiendo validación obligatoria con DevTools MCP (Laptop y Móvil) y actualización de memoria local.
argument-hint: "<descripción de la tarea o mejora>"
---

# Workflow: /feature

**Roles**: `@planner` -> `@implementer` -> `@reviewer`  
**Objetivo**: Abordar una mejora puntual, ajuste de interfaz o corrección menor garantizando el disyuntor de artefactos y la verificación continua.

## Pasos de Ejecución

1. **Planificación Rápida (`@planner`)**:
   - Analizar el alcance y verificar dependencias en el código existente.
   - Definir un plan breve de cambios atómicos y criterios de aceptación.
   - Presentar el plan al usuario y esperar confirmación explícita (Strict Mode).
2. **Implementación TDD (`@implementer`)**:
   - Desarrollar la solución con pruebas automatizadas (`node --test` / Vitest).
   - Realizar la modificación quirúrgica en los archivos necesarios sin generar código muerto.
3. **Loop de Verificación Dual DevTools MCP (Innegociable)**:
   - Abrir la pantalla afectada con `chrome-devtools`.
   - 1. Verificar **0 errores y 0 warnings en la consola JS**.
   - 2. Validar visualmente en resolución **Laptop (1366x768 / 1440x900 px)**.
   - 3. Validar layout responsive en **Móvil (375 px)**.
   - 4. Probar la interacción del flujo modificado.
4. **Revisión y Registro (`@reviewer` / `@coordinator`)**:
   - Ejecutar `git status` y verificar que solo se tocaron los archivos esperados.
   - Actualizar `MEMORY.md` manteniendo el documento en $\le 50$ líneas.
