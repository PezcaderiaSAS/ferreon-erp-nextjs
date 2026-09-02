---
description: Diseñar y estructurar componentes bajo estándares de diseño web abierto y prototipado colaborativo (penpot/penpot).
argument-hint: "[componente o vista a estructurar]"
---

# Penpot — Prototipado y Diseño Abierto (penpot/penpot)

Inspirado en [penpot/penpot](https://github.com/penpot/penpot), este flujo de trabajo permite alinear el diseño de interfaces con los estándares nativos de la web (SVG, CSS Flexbox/Grid) y prototipado abierto.

## Cuándo Usar

- Al conceptualizar wireframes o flujos de usuario antes de codificar la vista.
- Al definir estructuras vectoriales complejas (iconos, diagramas, esquemas interactivos de planta o inventario).
- Para asegurar que el prototipo y el código compartan la misma semántica de capas y layouts.

## Proceso de Ejecución

1. **Definir la Estructura Visual:** Establecer la jerarquía de capas, contenedores y elementos de entrada.
2. **Consultar Skill:** Aplicar las directrices de `.agents/skills/ui-ux-ecosystem/SKILL.md`.
3. **Traducir a Estándares Web Nativos:**
   - Usar cajas Flexbox/Grid con espaciado consistente (`gap`).
   - Exportar o incrustar SVGs optimizados y accesibles.
4. **Verificar Interacción:** Comprobar estados interactivos y flujos de navegación.
