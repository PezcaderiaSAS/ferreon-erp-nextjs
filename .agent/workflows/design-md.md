---
description: Auditar, generar o sincronizar tokens de diseño en el archivo DESIGN.md (colores HSL, tipografía, espaciados y sombras).
argument-hint: "[auditar | generar | sync] [ruta/al/componente]"
---

# Design-MD — Gobernanza de Tokens de Diseño (voltagent/awesome-design-md)

Inspirado en [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md), este flujo de trabajo gestiona el archivo raíz `DESIGN.md` del proyecto, garantizando que el diseño de interfaces se mantenga estrictamente coherente mediante tokens en texto plano.

## Cuándo Usar

- **Obligatorio:** Antes de crear nuevos componentes visuales para validar que los colores y tamaños cumplan con los tokens del sistema.
- Para inicializar o actualizar las variables CSS globales y temas claro/oscuro del ERP.
- Para auditar si un componente contiene valores mágicos de píxeles o colores hexadecimales prohibidos.

## Proceso de Ejecución

1. **Leer DESIGN.md:** Cargar los tokens vigentes desde el archivo raíz `DESIGN.md`.
2. **Consultar Skill:** Aplicar las directrices de `.agents/skills/ui-ux-ecosystem/SKILL.md`.
3. **Validación:**
   - Detectar valores CSS no estandarizados en los componentes analizados.
   - Proponer el reemplazo exacto por tokens semánticos (ej. `var(--color-primary-500)`).
4. **Sincronización:** Actualizar el archivo `DESIGN.md` si se introducen nuevos tokens justificados.
