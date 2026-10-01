/**
 * Alquileres System — Figma Tokens & Variables Sync Plugin
 * 
 * Este plugin crea o actualiza automáticamente las Variables de Figma,
 * modos conmutables (Salmon Pastel y Cyber Cyan), espaciados, radios
 * y estilos tipográficos basados en figma_design_tokens.json.
 */

function hexToRgba(hexOrRgba) {
  if (!hexOrRgba) return { r: 0, g: 0, b: 0, a: 1 };
  
  const str = hexOrRgba.trim();
  if (str.startsWith('rgba') || str.startsWith('rgb')) {
    const parts = str.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      return {
        r: Math.max(0, Math.min(1, parseFloat(parts[0]) / 255)),
        g: Math.max(0, Math.min(1, parseFloat(parts[1]) / 255)),
        b: Math.max(0, Math.min(1, parseFloat(parts[2]) / 255)),
        a: parts[3] !== undefined ? Math.max(0, Math.min(1, parseFloat(parts[3]))) : 1
      };
    }
  }

  let hex = str.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const intVal = parseInt(hex, 16);
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
    a: 1
  };
}

async function run() {
  try {
    figma.notify('🚀 Sincronizando tokens de Alquileres System...');

    // 1. Obtener o crear colección de Variables
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === 'Alquileres System — Design Tokens');
    
    if (!collection) {
      collection = figma.variables.createVariableCollection('Alquileres System — Design Tokens');
    }

    // Configurar Modos de Color
    const defaultModeId = collection.modes[0].modeId;
    collection.renameMode(defaultModeId, 'Salmon Pastel (Light)');
    
    let cyberModeId = collection.modes.find(m => m.name.includes('Cyber'))?.modeId;
    if (!cyberModeId) {
      cyberModeId = collection.addMode('Cyber Cyan (Dark / Industrial)');
    }

    // Definición de Colores Semánticos Dual-Theme
    const colorTokens = [
      { name: 'color/primary/main', salmon: '#ff7a59', cyber: '#00f0ff' },
      { name: 'color/primary/hover', salmon: '#e66847', cyber: '#00d0de' },
      { name: 'color/primary/focus', salmon: '#ff9073', cyber: '#33f3ff' },
      { name: 'color/primary/light', salmon: '#fff0ec', cyber: '#061a24' },
      { name: 'color/primary/muted', salmon: 'rgba(255, 122, 89, 0.12)', cyber: 'rgba(0, 240, 255, 0.15)' },
      { name: 'color/accent/neon', salmon: '#00f0ff', cyber: '#ff7a59' },
      { name: 'color/background/page', salmon: '#f8fafc', cyber: '#030712' },
      { name: 'color/background/card', salmon: '#ffffff', cyber: '#0b1329' },
      { name: 'color/background/input', salmon: '#f1f5f9', cyber: '#111c38' },
      { name: 'color/surface/border', salmon: '#e2e8f0', cyber: '#1e293b' },
      { name: 'color/surface/borderHover', salmon: '#cbd5e1', cyber: '#334155' },
      { name: 'color/text/primary', salmon: '#0f172a', cyber: '#f8fafc' },
      { name: 'color/text/secondary', salmon: '#475569', cyber: '#94a3b8' },
      { name: 'color/text/muted', salmon: '#94a3b8', cyber: '#64748b' },
      { name: 'color/status/success', salmon: '#10b981', cyber: '#10b981' },
      { name: 'color/status/warning', salmon: '#f59e0b', cyber: '#f59e0b' },
      { name: 'color/status/danger', salmon: '#ef4444', cyber: '#ef4444' },
      { name: 'color/status/info', salmon: '#0284c7', cyber: '#38bdf8' }
    ];

    const existingVars = await figma.variables.getLocalVariablesAsync();

    for (const ct of colorTokens) {
      let variable = existingVars.find(v => v.name === ct.name && v.variableCollectionId === collection.id);
      if (!variable) {
        variable = figma.variables.createVariable(ct.name, collection.id, 'COLOR');
      }
      variable.setValueForMode(defaultModeId, hexToRgba(ct.salmon));
      variable.setValueForMode(cyberModeId, hexToRgba(ct.cyber));
    }

    // 2. Variables Numéricas: Spacing
    const spacings = [
      { name: 'spacing/1', value: 4 },
      { name: 'spacing/2', value: 8 },
      { name: 'spacing/3', value: 12 },
      { name: 'spacing/4', value: 16 },
      { name: 'spacing/5', value: 20 },
      { name: 'spacing/6', value: 24 },
      { name: 'spacing/8', value: 32 },
      { name: 'spacing/10', value: 40 },
      { name: 'spacing/12', value: 48 }
    ];

    for (const sp of spacings) {
      let v = existingVars.find(v => v.name === sp.name && v.variableCollectionId === collection.id);
      if (!v) {
        v = figma.variables.createVariable(sp.name, collection.id, 'FLOAT');
      }
      v.setValueForMode(defaultModeId, sp.value);
      v.setValueForMode(cyberModeId, sp.value);
    }

    // 3. Variables Numéricas: Border Radius
    const radiuses = [
      { name: 'radius/sm', value: 6 },
      { name: 'radius/md', value: 8 },
      { name: 'radius/lg', value: 10 },
      { name: 'radius/xl', value: 12 },
      { name: 'radius/2xl', value: 16 },
      { name: 'radius/full', value: 9999 }
    ];

    for (const rd of radiuses) {
      let v = existingVars.find(v => v.name === rd.name && v.variableCollectionId === collection.id);
      if (!v) {
        v = figma.variables.createVariable(rd.name, collection.id, 'FLOAT');
      }
      v.setValueForMode(defaultModeId, rd.value);
      v.setValueForMode(cyberModeId, rd.value);
    }

    // 4. Crear o Actualizar Text Styles (Inter & JetBrains Mono)
    try {
      await Promise.all([
        figma.loadFontAsync({ family: "Inter", style: "Regular" }),
        figma.loadFontAsync({ family: "Inter", style: "Medium" }),
        figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }).catch(() => figma.loadFontAsync({ family: "Inter", style: "Bold" })),
        figma.loadFontAsync({ family: "Inter", style: "Bold" }),
        figma.loadFontAsync({ family: "JetBrains Mono", style: "Regular" }).catch(() => null),
        figma.loadFontAsync({ family: "JetBrains Mono", style: "Bold" }).catch(() => null)
      ]);
    } catch (e) {
      console.warn("Algunas fuentes locales no están disponibles, usando sustitutos del sistema:", e);
    }

    const textStyles = [
      { name: 'Typography/UI/Body - Inter Regular', fontSize: 14, fontName: { family: "Inter", style: "Regular" } },
      { name: 'Typography/UI/Body Medium - Inter Medium', fontSize: 14, fontName: { family: "Inter", style: "Medium" } },
      { name: 'Typography/UI/Heading SM - Inter Bold', fontSize: 18, fontName: { family: "Inter", style: "Bold" } },
      { name: 'Typography/UI/Heading LG - Inter Bold', fontSize: 24, fontName: { family: "Inter", style: "Bold" } },
      { name: 'Typography/Numeric/Finanzas - JetBrains Mono', fontSize: 14, fontName: { family: "JetBrains Mono", style: "Regular" }, fallback: { family: "Inter", style: "Regular" } }
    ];

    const localTextStyles = await figma.getLocalTextStylesAsync();

    for (const ts of textStyles) {
      let style = localTextStyles.find(s => s.name === ts.name);
      if (!style) {
        style = figma.createTextStyle();
        style.name = ts.name;
      }
      try {
        style.fontSize = ts.fontSize;
        style.fontName = ts.fontName;
      } catch (err) {
        if (ts.fallback) {
          style.fontName = ts.fallback;
        }
      }
    }

    figma.notify('✅ ¡Tokens y Variables de Alquileres System importados con éxito!');
  } catch (error) {
    console.error('Error sincronizando tokens en Figma:', error);
    figma.notify('❌ Error importando tokens: ' + error.message, { error: true });
  } finally {
    figma.closePlugin();
  }
}

run();
