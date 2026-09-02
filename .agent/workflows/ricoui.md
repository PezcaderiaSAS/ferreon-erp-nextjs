---
description: Consultar y extraer sistemas de diseño, paletas cromáticas y tokens de marcas desde Rico UI (design.ricoui.com/brands).
argument-hint: "[list | get <brand> | tokens <brand>]"
---

# Rico UI Brands — Extractor de Sistemas de Diseño de Marcas

Inspirado en [design.ricoui.com/brands](https://design.ricoui.com/brands), este flujo de trabajo permite al agente consultar y adaptar paletas de colores, tipografías y tokens de marcas líderes (Linear, Supabase, Vercel, Raycast, Airbnb, Apple, Stripe) al formato canónico `DESIGN.md`.

## Cuándo Usar

- Al buscar inspiración visual para nuevas características del ERP.
- Para extraer tokens de color HSL y contrastes de marcas consolidadas en la industria.
- Para comparar combinaciones de estilos antes de maquetar con Tailwind CSS.

## Proceso de Ejecución

1. **Ejecutar Consulta:**
   - Listar marcas: `node scripts/ricoui-mcp.mjs list`
   - Obtener tokens: `node scripts/ricoui-mcp.mjs get <brand>`
2. **Mapear a Tokens Semánticos:**
   - Adaptar los valores extraídos a las variables CSS de `DESIGN.md`.
   - Preservar la armonía visual y contrastes WCAG 2.1 AA.
