---
description: Generar diagramas arquitectónicos C4 en Mermaid, mapas de dependencias y análisis estructural de sistemas.
argument-hint: "[ruta/al/modulo_o_servicio] [--level 1|2|3|4]"
---

# Archify — Modelado y Diagramación de Arquitectura C4

Este flujo de trabajo genera diagramas formales de arquitectura de software bajo el modelo C4 y sintaxis Mermaid, analizando dependencias y límites de dominio.

## Cuándo Usar

- **Obligatorio:** Antes de planificar migraciones o refactorizaciones estructurales de gran envergadura.
- Al documentar un nuevo microservicio, integración con Supabase, GAS o pasarelas de pago.
- Para auditar el acoplamiento y puntos únicos de falla (SPOF) del sistema.

## Proceso de Ejecución

1. **Explorar AST y Grafos:** Usar GitNexus para identificar llamadas cruzadas e importaciones.
2. **Consultar Skill:** Aplicar las directrices de `.agents/skills/archify/SKILL.md`.
3. **Generar Diagrama C4 en Mermaid:**
   - Nivel 1: Contexto del Sistema.
   - Nivel 2: Contenedores y Bases de Datos.
   - Nivel 3: Componentes y Servicios internos.
   - Nivel 4: Flujo de secuencia transaccional.
4. **Resaltar Riesgos:** Documentar cuellos de botella y límites de red en el artefacto.
