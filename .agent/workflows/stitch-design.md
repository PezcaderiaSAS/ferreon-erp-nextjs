---
description: Generar especificaciones y componentes visuales con Google Stitch inspirados en marcas de Rico UI y Glassmorphism.
argument-hint: "[nombre-componente] [--brand linear|supabase|vercel|raycast|ferreon] [propósito]"
---

# Stitch Design — Generación de Interfaces con Google Stitch & Rico UI

Este flujo de trabajo conecta el motor de **Google Stitch** (`stitch.json`) con los sistemas de diseño de marcas de **Rico UI** ([design.ricoui.com/brands](https://design.ricoui.com/brands)) para crear componentes y vistas completas para FerreOn ERP.

## Cuándo Usar

- Al diseñar una nueva pantalla, dashboard, modal o formulario complejo.
- Para generar el prompt oficial estructurado para la herramienta Stitch de Google.
- Al sintetizar un diseño generado en código React / Next.js con Tailwind CSS y Glassmorphism.

## Proceso de Ejecución

1. **Interpretar Argumentos:** Extraer el nombre del componente, marca de inspiración (default: `ferreon`) y objetivo funcional.
2. **Consultar Skill:** Aplicar las reglas de `.agents/skills/stitch-ricoui-design/SKILL.md`.
3. **Generar el Prompt de Stitch:**
   - Inyectar paleta cromática de la marca seleccionada.
   - Forzar tokens de `DESIGN.md` (bordes de cristal, resplandor neón, micro-animaciones).
4. **Construir el Componente:** Entregar el código TypeScript/React listo para integrarse en `src/components/`.
