---
description: Reafirma los requisitos, evalúa riesgos y crea un plan de implementación paso a paso. ESPERA la confirmación del usuario antes de tocar código.
argument-hint: "[descripción de la función | ruta/a/*.prd.md]"
---

# Comando Plan

Este comando crea un plan de implementación exhaustivo antes de escribir cualquier código. Acepta requisitos en texto libre o un archivo PRD en markdown.

Se ejecuta en línea por defecto. No llama a la herramienta Task ni a ningún subagente por defecto. Esto mantiene `/plan` utilizable desde instalaciones de plugins que envían comandos sin archivos de agente.

## Qué Hace Este Comando

1. **Reafirma Requisitos** - Aclara qué necesita construirse.
2. **Identifica Riesgos** - Saca a la luz problemas potenciales y bloqueos.
3. **Crea un Plan de Pasos** - Desglosa la implementación en fases.
4. **Espera Confirmación** - DEBE recibir aprobación del usuario antes de continuar.

## Cuándo Usarlo

Usa `/plan` cuando:
- Comienzas una nueva funcionalidad.
- Realizas cambios arquitectónicos significativos.
- Trabajas en una refactorización compleja.
- Múltiples archivos/componentes se verán afectados.
- Los requisitos son vagos o ambiguos.

## Cómo Funciona

El asistente va a:

1. **Analizar la solicitud** y reafirmar los requisitos en términos claros.
2. **Basar el plan** en patrones relevantes del código fuente (cuando el repositorio esté disponible).
3. **Desglosar en fases** con pasos específicos y accionables.
4. **Identificar dependencias** entre componentes.
5. **Evaluar riesgos** y posibles bloqueadores.
6. **Estimar la complejidad** (Alta/Media/Baja).
7. **Presentar el plan** y ESPERAR tu confirmación explícita.

## Modos de Entrada

| Entrada | Modo | Comportamiento |
|---|---|---|
| `ruta/a/nombre.prd.md` | Modo artefacto PRD | Lee el PRD, elige el siguiente hito o fase, y escribe `.claude/plans/{nombre}.plan.md` |
| Cualquier ruta markdown | Modo referencia | Lee el archivo como contexto y produce un plan en línea |
| Texto libre | Modo conversacional | Produce un plan en línea |
| Entrada vacía | Modo aclaración | Pregunta qué se debe planificar |

En el modo PRD, crea `.claude/plans/` si es necesario. Actualiza la tabla de hitos (de 'pending' a 'in-progress') y asigna la ruta del plan. 

## Base de Patrones

Antes de escribir el plan, busca en el código convenciones que la implementación debe reflejar. Captura el mejor ejemplo para cada categoría:
- Naming
- Manejo de Errores
- Logs
- Acceso a Datos
- Pruebas

## Salida (Artefacto PRD)

Cuando se llama con un archivo `.prd.md`, escribe el plan en `.claude/plans/{nombre}.plan.md`.
Espera tu confirmación (yes/proceed) antes de escribir código.

## Notas Importantes

**CRÍTICO**: Este comando **NO** escribirá ningún código hasta que confirmes explícitamente el plan con "sí", "proceder" o una respuesta afirmativa similar.

Si quieres cambios, responde con:
- "modifica: [tus cambios]"
- "salta la fase 2 y haz la 3 primero"

## Opcional: Agente Planner
ECC también proporciona un agente `planner` (en `agents/planner.md`). Úsalo solo cuando se delegue explícitamente.
