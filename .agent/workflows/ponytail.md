---
description: Optimizar prompts, realizar tailoring dinámico y estructurar pipelines de contexto para LLMs y subagentes.
argument-hint: "[prompt crudo | ruta/a/archivo_prompt.md]"
---

# Ponytail — Optimización de Prompts y Context Tailoring

Este flujo de trabajo ejecuta la optimización, compresión y estructuración modular de instrucciones para LLMs, asegurando cero ambigüedad, tipado de variables y cumplimiento estricto de esquemas.

## Cuándo Usar

- Al redactar prompts complejos para subagentes o tareas desatendidas.
- Al optimizar instrucciones de extracción de datos o pipelines de generación de código.
- Para comprimir el contexto y eliminar tokens redundantes antes de enviar tareas masivas.

## Proceso de Ejecución

1. **Leer la entrada:** Analizar el prompt o archivo especificado por el usuario.
2. **Consultar Skill:** Aplicar las reglas de `.agents/skills/ponytail/SKILL.md`.
3. **Estructurar Bloques Canónicos:**
   - `<SYSTEM_PROMPT>` (Rol hiperespecífico + Tono).
   - `<CONTEXT>` (Reglas de dominio e invariantes).
   - `<TASK>` (Objetivo claro + Subtareas secuenciales).
   - `<CONSTRAINTS>` (Must do y Must NOT do).
   - `<OUTPUT_FORMAT>` (Esquema estricto de respuesta).
4. **Validación:** Comprobar la ausencia de contradicciones y retornar el prompt optimizado listo para producción.
