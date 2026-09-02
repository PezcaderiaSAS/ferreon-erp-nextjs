---
description: Generar utilidades CSS modernas (sombras difusas multinivel, efectos glassmorphism, gradientes HSL y patrones de fondo) con ui-layouts/ui-tools.
argument-hint: "[shadow | glass | gradient | layout] [parámetros]"
---

# UI Tools — Generador de Utilidades CSS y Efectos Visuales (ui-layouts/ui-tools)

Inspirado en [ui-layouts/ui-tools](https://github.com/ui-layouts/ui-tools), este flujo de trabajo asiste en la generación de estilos CSS premium, elevaciones y micro-interacciones visuales de vanguardia para el frontend.

## Cuándo Usar

- Al diseñar tarjetas, modales flotantes o paneles con sombras avanzadas y profundidad.
- Para crear barras de navegación translúcidas con efecto frosted glass / glassmorphism (`backdrop-filter`).
- Al diseñar gradientes armónicos y patrones de fondo vectoriales para dashboards.

## Proceso de Ejecución

1. **Definir el Efecto Requerido:** Identificar el tipo de utilidad visual (sombra, cristal, gradiente o grid responsivo).
2. **Consultar Skill:** Aplicar las pautas de `.agents/skills/ui-ux-ecosystem/SKILL.md`.
3. **Generar CSS Optimizado:**
   - Crear CSS puro con variables semánticas.
   - Asegurar aceleración por hardware (`will-change`, `transform`) y rendimiento en renderizado.
4. **Validar Accesibilidad:** Comprobar contraste y legibilidad del contenido sobre el fondo generado.
