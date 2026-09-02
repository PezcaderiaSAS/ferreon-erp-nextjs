#!/usr/bin/env node
/**
 * Rico UI Brands & Google Stitch - MCP Server & CLI Engine
 * Permite a los agentes de IA extraer sistemas de diseño de marcas desde design.ricoui.com/brands
 * y generar prompts estructurados para Google Stitch integrados con el Design System de FerreOn ERP.
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

// Catálogo curado de Presets de Marca extraídos de Rico UI Brands
export const RICO_BRANDS_PRESETS = {
  linear: {
    name: "Linear",
    description: "High-contrast dark mode, precise micro-borders, deep navy-black canvas and subtle electric violet/cyan highlights.",
    tokens: {
      bgBase: "hsl(240, 10%, 4%)",
      bgSurface: "hsl(240, 6%, 10%)",
      bgElevated: "hsl(240, 5%, 15%)",
      border: "hsla(0, 0%, 100%, 0.08)",
      primary: "hsl(245, 100%, 65%)",
      accent: "hsl(190, 95%, 50%)",
      fontDisplay: "Inter, -apple-system, sans-serif",
      glass: "rgba(18, 18, 24, 0.75) blur(16px)"
    }
  },
  supabase: {
    name: "Supabase",
    description: "Emerald green developer-first dark mode, slate surfaces with green accent glows and high-legibility monospace accents.",
    tokens: {
      bgBase: "hsl(200, 20%, 7%)",
      bgSurface: "hsl(200, 18%, 12%)",
      bgElevated: "hsl(200, 15%, 18%)",
      border: "hsla(0, 0%, 100%, 0.1)",
      primary: "hsl(154, 55%, 48%)",
      accent: "hsl(158, 80%, 40%)",
      fontDisplay: "Outfit, Inter, sans-serif",
      glass: "rgba(17, 24, 28, 0.7) blur(14px)"
    }
  },
  vercel: {
    name: "Vercel / Next.js",
    description: "Monochrome precision, stark black-and-white contrast, razor-sharp 1px borders and neutral gray gradient meshes.",
    tokens: {
      bgBase: "hsl(0, 0%, 0%)",
      bgSurface: "hsl(0, 0%, 7%)",
      bgElevated: "hsl(0, 0%, 12%)",
      border: "hsla(0, 0%, 100%, 0.14)",
      primary: "hsl(0, 0%, 100%)",
      accent: "hsl(212, 100%, 50%)",
      fontDisplay: "Geist, Inter, sans-serif",
      glass: "rgba(0, 0, 0, 0.8) blur(20px)"
    }
  },
  raycast: {
    name: "Raycast",
    description: "Crimson-coral glowing dark mode, tactile command palettes, heavy backdrop blur and soft red-orange ambient lighting.",
    tokens: {
      bgBase: "hsl(240, 15%, 9%)",
      bgSurface: "hsl(240, 12%, 14%)",
      bgElevated: "hsl(240, 10%, 20%)",
      border: "hsla(0, 0%, 100%, 0.09)",
      primary: "hsl(350, 100%, 65%)",
      accent: "hsl(20, 100%, 60%)",
      fontDisplay: "Inter, sans-serif",
      glass: "rgba(22, 22, 29, 0.8) blur(24px)"
    }
  },
  ferreon: {
    name: "FerreOn / AppFrios Pezca",
    description: "Industrial Steel Blue & Polar Ice Cyan Glassmorphism. Built for heavy transaction ERPs, warehouses and cold storages.",
    tokens: {
      bgBase: "hsl(222, 47%, 11%)",
      bgSurface: "hsl(217, 33%, 17%)",
      bgElevated: "hsl(215, 28%, 23%)",
      border: "hsla(0, 0%, 100%, 0.12)",
      primary: "hsl(215, 85%, 45%)",
      accent: "hsl(190, 90%, 48%)",
      fontDisplay: "Outfit, Inter, sans-serif",
      glass: "rgba(15, 23, 42, 0.7) blur(16px)"
    }
  }
};

/**
 * Genera un prompt optimizado para Google Stitch combinando los tokens de marca con los requerimientos del ERP.
 */
export function generateStitchPrompt({ componentName, brand = 'ferreon', purpose, additionalRequirements = [] }) {
  const brandData = RICO_BRANDS_PRESETS[brand.toLowerCase()] || RICO_BRANDS_PRESETS.ferreon;
  
  const stitchPrompt = `
# GOOGLE STITCH UI GENERATION SPECIFICATION
**Target Component:** ${componentName}
**Design Language Inspiration:** ${brandData.name} (Rico UI Brands)
**Theme:** Dark Mode Glassmorphism (FerreOn Standard)

## Design Tokens & Palette
- Background Canvas: ${brandData.tokens.bgBase}
- Surface/Card Background: ${brandData.tokens.bgSurface} with backdrop-filter: blur(16px)
- Elevated Surface (Modals/Popovers): ${brandData.tokens.bgElevated}
- Border: 1px solid ${brandData.tokens.border}
- Primary Accent: ${brandData.tokens.primary}
- Highlight Accent: ${brandData.tokens.accent}
- Font Family: ${brandData.tokens.fontDisplay}

## Visual Hierarchy & Aesthetics
1. **Glassmorphism Panels:** Container panels with 65% opacity and 16px background blur.
2. **Glow Ambient Lighting:** Fixed radial gradient background orbs (Cyan & Indigo) with blur-3xl.
3. **Interactive Buttons:** Gradient fill with primary accent, active:scale-95, hover:-translate-y-0.5.
4. **Data Displays:** High-contrast data metrics with right-aligned numeric tabular figures.
5. **Mobile Accessibility:** Minimum touch targets 44x44px. Collapsible card view on small viewports (<640px).

## Functional Purpose:
${purpose}

## Specific Component Requirements:
${additionalRequirements.map(req => `- ${req}`).join('\n')}
`.trim();

  return stitchPrompt;
}

/**
 * CLI runner cuando se invoca desde la terminal
 */
function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (command === 'list') {
    console.log(JSON.stringify(Object.keys(RICO_BRANDS_PRESETS).map(k => ({
      key: k,
      name: RICO_BRANDS_PRESETS[k].name,
      description: RICO_BRANDS_PRESETS[k].description
    })), null, 2));
  } else if (command === 'get') {
    const brand = args[1] || 'ferreon';
    const data = RICO_BRANDS_PRESETS[brand.toLowerCase()];
    if (!data) {
      console.error(`Marca "${brand}" no encontrada. Usa 'list' para ver marcas disponibles.`);
      process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
  } else if (command === 'stitch') {
    const componentName = args[1] || 'DashboardView';
    const brand = args[2] || 'ferreon';
    const purpose = args[3] || 'Vista principal del ERP con métricas y tablas transaccionales.';
    const prompt = generateStitchPrompt({ componentName, brand, purpose });
    console.log(prompt);
  } else {
    console.log(`
Uso de Rico UI & Google Stitch Engine:
  node ricoui-mcp.mjs list                       # Lista todas las marcas disponibles
  node ricoui-mcp.mjs get <brand>                # Muestra los tokens de una marca (linear, supabase, vercel, raycast, ferreon)
  node ricoui-mcp.mjs stitch <component> <brand> <purpose> # Genera un prompt listo para Google Stitch
`);
  }
}

// Si se ejecuta directamente
if (process.argv[1] && process.argv[1].endsWith('ricoui-mcp.mjs')) {
  runCLI();
}
