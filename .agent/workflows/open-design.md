---
description: Extraer, normalizar y transformar árboles de diseño o mockups en componentes web limpios, accesibles y modulares.
argument-hint: "[especificación visual | mockup | HTML crudo]"
---

# Open Design — Extracción y Transformación de Diseño a Código

Este flujo de trabajo implementa el motor de diseño abierto para transformar árboles de diseño, mockups o estructuras visuales en componentes web de producción.

## Cuándo Usar

- Al implementar una nueva vista o componente a partir de un diseño de Penpot o Figma.
- Para extraer tokens semánticos de un fragmento de HTML/CSS.
- Al desacoplar estilos duros y convertirlos a Atomic Design y variables CSS.

## Proceso de Ejecución

1. **Analizar la Entrada:** Leer la especificación de diseño visual o mockup provisto.
2. **Consultar Skill:** Aplicar las pautas de `.agents/skills/open-design/SKILL.md`.
3. **Extraer Tokens:** Mapear colores, espaciados y tipografías a variables CSS de `DESIGN.md`.
4. **Construir Componente:**
   - HTML5 semántico y accesible (ARIA).
   - Layout fluido con Flexbox / CSS Grid.
   - Breakpoints Mobile-First estandarizados.
5. **Retornar Código Limpio:** Entregar el componente listo para integrarse en el proyecto.
