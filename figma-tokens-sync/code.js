/**
 * Alquileres System — Figma Tokens, Variables Sync & Bidirectional Studio
 * 
 * Controlador con soporte resiliente para cuentas Figma Free y Pro:
 * En cuentas Free (limitadas a 1 modo por colección), crea automáticamente
 * colecciones hermanas para preservar ambos temas sin requerir plan de pago.
 */

figma.showUI(__html__, { width: 440, height: 600, themeColors: true });

function hexToRgba(hexOrRgba) {
  if (!hexOrRgba) return { r: 0, g: 0, b: 0, a: 1 };
  
  const str = String(hexOrRgba).trim();
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

function rgbaToHex(color, opacity = 1) {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

const CANONICAL_ROUTES = [
  { path: '/', name: 'Landing Page' },
  { path: '/auth/login', name: 'Login & Onboarding' },
  { path: '/dashboard', name: 'Dashboard Principal' },
  { path: '/alquileres', name: 'Alquileres & Cotizaciones' },
  { path: '/bodega', name: 'Bodega & Kardex' },
  { path: '/compras', name: 'Compras & Proveedores' },
  { path: '/subcontrataciones', name: 'Subcontrataciones' },
  { path: '/devoluciones', name: 'Devoluciones & Split-Line' },
  { path: '/facturacion', name: 'Facturación & Cartera' },
  { path: '/caja', name: 'Caja & Arqueos' },
  { path: '/clientes', name: 'Directorio de Clientes' },
  { path: '/suscripcion', name: 'Planes B2B' },
  { path: '/configuracion', name: 'Configuración' },
  { path: '/admin/empresas', name: 'Gobernanza UltraAdmin' }
];

const OFFICIAL_COLORS = [
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

figma.ui.onmessage = async (msg) => {
  try {
    // ----------------------------------------------------
    // ACCIÓN 1: IMPORTAR TOKENS AL ARCHIVO DE FIGMA
    // ----------------------------------------------------
    if (msg.type === 'import-tokens') {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      // Colección Principal (Salmon Pastel)
      let collection = collections.find(c => c.name === 'Alquileres System — Design Tokens');
      if (!collection) {
        collection = figma.variables.createVariableCollection('Alquileres System — Design Tokens');
      }

      const defaultModeId = collection.modes[0].modeId;
      collection.renameMode(defaultModeId, 'Salmon Pastel (Light)');
      
      let cyberModeId = null;
      let isFreePlan = false;
      let cyberCollection = null;

      // Intentar agregar segundo modo (válido en Figma Pro/Org)
      try {
        cyberModeId = collection.modes.find(m => m.name.includes('Cyber'))?.modeId;
        if (!cyberModeId) {
          cyberModeId = collection.addMode('Cyber Cyan (Dark)');
        }
      } catch (modeErr) {
        // En cuentas Figma Free: límite de 1 modo por colección.
        // Fallback arquitectónico: crear colección hermana para modo Cyber Cyan sin error.
        isFreePlan = true;
        cyberCollection = collections.find(c => c.name === 'Alquileres System — Cyber Cyan (Dark)');
        if (!cyberCollection) {
          cyberCollection = figma.variables.createVariableCollection('Alquileres System — Cyber Cyan (Dark)');
        }
        cyberModeId = cyberCollection.modes[0].modeId;
        cyberCollection.renameMode(cyberModeId, 'Cyber Cyan (Dark)');
      }

      const existingVars = await figma.variables.getLocalVariablesAsync();
      let count = 0;

      // Importar Colores en Colección Principal (Salmon Pastel)
      for (const ct of OFFICIAL_COLORS) {
        let variable = existingVars.find(v => v.name === ct.name && v.variableCollectionId === collection.id);
        if (!variable) {
          variable = figma.variables.createVariable(ct.name, collection.id, 'COLOR');
        }
        variable.setValueForMode(defaultModeId, hexToRgba(ct.salmon));

        if (!isFreePlan && cyberModeId) {
          variable.setValueForMode(cyberModeId, hexToRgba(ct.cyber));
        }
        count++;

        // Si es cuenta Free, poblar también en la colección hermana Cyber
        if (isFreePlan && cyberCollection) {
          let cyberVar = existingVars.find(v => v.name === ct.name && v.variableCollectionId === cyberCollection.id);
          if (!cyberVar) {
            cyberVar = figma.variables.createVariable(ct.name, cyberCollection.id, 'COLOR');
          }
          cyberVar.setValueForMode(cyberModeId, hexToRgba(ct.cyber));
        }
      }

      // Importar Espaciados
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
        if (!isFreePlan && cyberModeId) {
          v.setValueForMode(cyberModeId, sp.value);
        }
        count++;
      }

      // Importar Radios
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
        if (!isFreePlan && cyberModeId) {
          v.setValueForMode(cyberModeId, rd.value);
        }
        count++;
      }

      const planNotice = isFreePlan 
        ? ' (Compatible con Figma Free: Colecciones duales Salmon Pastel y Cyber Cyan creadas).'
        : ' (Modos duales en colección unificada).';

      figma.ui.postMessage({ type: 'import-success', count, isFreePlan });
      figma.notify(`✅ ¡${count} variables de Alquileres System sincronizadas!${planNotice}`);
    }

    // ----------------------------------------------------
    // ACCIÓN 2: EXPORTAR VARIABLES DE FIGMA A JSON W3C
    // ----------------------------------------------------
    if (msg.type === 'export-tokens') {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();

      const exported = {
        $schema: "https://design-tokens.github.io/community-group/format/v2023-04-18/",
        name: "Alquileres System Design Tokens (Exported from Figma)",
        version: "2.0.0",
        exportedAt: new Date().toISOString(),
        collections: []
      };

      for (const coll of collections) {
        const collData = {
          name: coll.name,
          modes: coll.modes,
          variables: {}
        };

        const collVars = variables.filter(v => v.variableCollectionId === coll.id);
        for (const v of collVars) {
          const valuesByMode = {};
          for (const mode of coll.modes) {
            const rawVal = v.valuesByMode[mode.modeId];
            if (v.resolvedType === 'COLOR' && rawVal && typeof rawVal === 'object') {
              valuesByMode[mode.name] = rgbaToHex(rawVal);
            } else {
              valuesByMode[mode.name] = rawVal;
            }
          }

          collData.variables[v.name] = {
            $type: v.resolvedType.toLowerCase(),
            $values: valuesByMode
          };
        }

        exported.collections.push(collData);
      }

      figma.ui.postMessage({
        type: 'export-success',
        count: variables.length,
        data: exported
      });
      figma.notify(`📤 ¡${variables.length} variables exportadas a formato W3C!`);
    }

    // ----------------------------------------------------
    // ACCIÓN 3: VINCULAR VARIABLES AL LIENZO
    // ----------------------------------------------------
    if (msg.type === 'bind-variables') {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.name.includes('Alquileres System'));
      if (!collection) {
        throw new Error('Primero debes importar las variables en la pestaña "Importar".');
      }

      const variables = await figma.variables.getLocalVariablesAsync();
      const colorMap = new Map();

      // Mapear colores de variables a hex
      for (const v of variables) {
        if (v.resolvedType === 'COLOR') {
          const val = v.valuesByMode[collection.modes[0].modeId];
          if (val && typeof val === 'object') {
            colorMap.set(rgbaToHex(val), v);
          }
        }
      }

      let boundCount = 0;
      function traverseAndBind(node) {
        if ('fills' in node && Array.isArray(node.fills)) {
          const newFills = [];
          let modified = false;

          for (const fill of node.fills) {
            if (fill.type === 'SOLID' && fill.color) {
              const hex = rgbaToHex(fill.color);
              const matchedVar = colorMap.get(hex);
              if (matchedVar) {
                try {
                  const boundFill = figma.variables.setBoundVariableForPaint(fill, 'color', matchedVar);
                  newFills.push(boundFill);
                  modified = true;
                  boundCount++;
                  continue;
                } catch (e) {}
              }
            }
            newFills.push(fill);
          }

          if (modified) {
            node.fills = newFills;
          }
        }

        if ('children' in node) {
          for (const child of node.children) {
            traverseAndBind(child);
          }
        }
      }

      const nodesToScan = figma.currentPage.selection.length > 0
        ? figma.currentPage.selection
        : figma.currentPage.children;

      nodesToScan.forEach(traverseAndBind);

      figma.ui.postMessage({ type: 'bind-success', count: boundCount });
      figma.notify(`🎨 Se vincularon ${boundCount} capas a variables de color.`);
    }

    // ----------------------------------------------------
    // ACCIÓN 4: LIMPIAR DUPLICADOS Y FRAMES HUÉRFANOS
    // ----------------------------------------------------
    if (msg.type === 'clean-duplicates') {
      let removedCount = 0;
      const currentNodes = [...figma.currentPage.children];

      for (const node of currentNodes) {
        if (node.name === 'Generated Design') {
          node.remove();
          removedCount++;
        }
      }

      // Remover subcontrataciones duplicada si existe
      const remaining = [...figma.currentPage.children];
      const subcontrataciones = remaining.filter(n => n.name.toLowerCase().includes('subcontrataciones'));
      if (subcontrataciones.length > 2) {
        for (let i = 2; i < subcontrataciones.length; i++) {
          subcontrataciones[i].remove();
          removedCount++;
        }
      }

      figma.ui.postMessage({ type: 'clean-success', count: removedCount });
      figma.notify(`🧹 Se eliminaron ${removedCount} elementos duplicados.`);
    }

    // ----------------------------------------------------
    // ACCIÓN 5: AUDITAR COBERTURA DE PANTALLAS
    // ----------------------------------------------------
    if (msg.type === 'audit-screens') {
      const auditedNodes = [...figma.currentPage.children];
      let missingCount = 0;

      const report = CANONICAL_ROUTES.map(route => {
        const isPresent = auditedNodes.some(node => {
          const lower = node.name.toLowerCase();
          if (route.path === '/') {
            return lower.includes('alquileres-erp-nextjs-ruby') && 
                   !lower.includes('dashboard') && !lower.includes('configuracion') && 
                   !lower.includes('admin') && !lower.includes('clientes') &&
                   !lower.includes('caja') && !lower.includes('facturacion');
          }
          return lower.includes(route.path.toLowerCase());
        });

        if (!isPresent) missingCount++;
        return {
          ...route,
          present: isPresent
        };
      });

      figma.ui.postMessage({
        type: 'audit-result',
        missingCount,
        report
      });
    }

  } catch (err) {
    console.error('Error en controlador de Figma:', err);
    figma.ui.postMessage({ type: 'error', message: err.message });
  }
};
