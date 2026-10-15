---
description: Inspecciona el código existente, corre Chrome DevTools en vista Laptop y Móvil, sincroniza AGENTS.md e inicia/depura MEMORY.md.
argument-hint: "[módulo o ruta a auditar]"
---

# Workflow: /audit-project

**Roles**: `@coordinator` + `@planner`  
**Objetivo**: Realizar una auditoría técnica profunda y no destructiva de la arquitectura del proyecto, validando el estado del frontend, backend, base de datos y memoria de sesión.

## Pasos de Ejecución

1. **Alineación de Memoria y Contexto**:
   - Leer `MEMORY.md` y los 5 archivos del banco canónico en `docs/memory-bank/`.
   - Verificar que `AGENTS.md` refleje las directrices del proyecto y el grafo de dependencias de GitNexus.
2. **Inspección de Estado y Git**:
   - Comprobar cambios sin confirmar o ramas activas.
   - Ejecutar análisis de impacto con GitNexus si se audita un módulo específico.
3. **Auditoría de Frontend & DevTools MCP**:
   - Levantar o verificar el entorno local (`npm run dev`).
   - Abrir la aplicación con `chrome-devtools MCP`.
   - Comprobar **0 errores y 0 advertencias** en la consola JS.
   - Capturar y evaluar el layout en resolución **Laptop (1366x768 / 1440x900 px)**.
   - Capturar y evaluar el layout responsive en **Móvil (375 px)**.
4. **Verificación de Pruebas y Tipos**:
   - Ejecutar `npm run test` (o `node --test` / `npx vitest run`) y `tsc --noEmit`.
5. **Reporte de Auditoría**:
   - Publicar el resumen estructurado en un artefacto de auditoría con los hallazgos categorizados por severidad (Crítica, Alta, Media, Baja).
