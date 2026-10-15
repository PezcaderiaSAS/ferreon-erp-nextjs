---
description: Verifica e instala los servidores MCP requeridos para Alquileres System (chrome-devtools, context7, figma, github, supabase, stitch).
argument-hint: "[opcional: servidor específico]"
---

# Workflow: /setup-mcps

**Rol Responsable**: `@coordinator`  
**Objetivo**: Verificar el estado de conexión e instalación de los servidores MCP requeridos en el ecosistema Antigravity 2.0.

## Servidores MCP Requeridos

1. **chrome-devtools**: Inspección visual obligatoria en pantalla Laptop (1366x768 / 1440x900) y Móvil (375px), y verificación de 0 errores de consola.
2. **context7**: Consulta de documentación actualizada y snippets oficiales de frameworks.
3. **figma**: Extracción de componentes visuales, tokens y layouts de diseño.
4. **github**: Auditoría de diffs, sincronización y control de versiones.
5. **supabase**: Inspección de esquemas relacionales, políticas RLS y migraciones PostgreSQL.
6. **StitchMCP**: Generación asistida de pantallas y sistemas de diseño visual.

## Pasos de Ejecución

1. Leer el archivo global de configuración: `~/.gemini/config/mcp_config.json`.
2. Validar que cada servidor cuente con su comando o endpoint correspondiente.
3. Si algún servidor no está instalado o requiere variables de entorno (como `FIGMA_ACCESS_TOKEN` o `GITHUB_PERSONAL_ACCESS_TOKEN`), emitir un reporte claro al usuario indicando el paso de configuración.
4. Confirmar que la superficie de herramientas esté lista para operar.
