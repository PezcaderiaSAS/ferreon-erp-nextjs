/**
 * Alquileres System — Inyector Rápido de Variables para Consola Web de Figma
 * 
 * Copia y pega este script directamente en la consola (F12) de Figma en el navegador web
 * para crear la colección completa de Variables nativas con modos duales.
 */
(async function() {
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
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const intVal = parseInt(hex, 16);
    return {
      r: ((intVal >> 16) & 255) / 255,
      g: ((intVal >> 8) & 255) / 255,
      b: (intVal & 255) / 255,
      a: 1
    };
  }

  figma.notify('🚀 Creando colección oficial de Variables de Alquileres System...');

  // 1. Colección de Variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = collections.find(c => c.name === 'Alquileres System — Design Tokens');
  if (!collection) {
    collection = figma.variables.createVariableCollection('Alquileres System — Design Tokens');
  }

  const defaultModeId = collection.modes[0].modeId;
  collection.renameMode(defaultModeId, 'Salmon Pastel (Light)');
  
  let cyberModeId = collection.modes.find(m => m.name.includes('Cyber'))?.modeId;
  if (!cyberModeId) {
    cyberModeId = collection.addMode('Cyber Cyan (Dark / Industrial)');
  }

  const existingVars = await figma.variables.getLocalVariablesAsync();

  // 2. Colores Oficiales (Modos Duales)
  const colors = [
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

  for (const c of colors) {
    let v = existingVars.find(x => x.name === c.name && x.variableCollectionId === collection.id);
    if (!v) v = figma.variables.createVariable(c.name, collection.id, 'COLOR');
    v.setValueForMode(defaultModeId, hexToRgba(c.salmon));
    v.setValueForMode(cyberModeId, hexToRgba(c.cyber));
  }

  // 3. Espaciados
  const spacings = [
    { name: 'spacing/1', val: 4 }, { name: 'spacing/2', val: 8 }, { name: 'spacing/3', val: 12 },
    { name: 'spacing/4', val: 16 }, { name: 'spacing/5', val: 20 }, { name: 'spacing/6', val: 24 },
    { name: 'spacing/8', val: 32 }, { name: 'spacing/10', val: 40 }, { name: 'spacing/12', val: 48 }
  ];
  for (const s of spacings) {
    let v = existingVars.find(x => x.name === s.name && x.variableCollectionId === collection.id);
    if (!v) v = figma.variables.createVariable(s.name, collection.id, 'FLOAT');
    v.setValueForMode(defaultModeId, s.val);
    v.setValueForMode(cyberModeId, s.val);
  }

  // 4. Radios
  const radiuses = [
    { name: 'radius/sm', val: 6 }, { name: 'radius/md', val: 8 }, { name: 'radius/lg', val: 10 },
    { name: 'radius/xl', val: 12 }, { name: 'radius/2xl', val: 16 }, { name: 'radius/full', val: 9999 }
  ];
  for (const r of radiuses) {
    let v = existingVars.find(x => x.name === r.name && x.variableCollectionId === collection.id);
    if (!v) v = figma.variables.createVariable(r.name, collection.id, 'FLOAT');
    v.setValueForMode(defaultModeId, r.val);
    v.setValueForMode(cyberModeId, r.val);
  }

  figma.notify('🎉 ¡Colección "Alquileres System — Design Tokens" creada con éxito en Figma!');
  console.log('✅ Variables inyectadas: 18 colores duales, 9 espaciados y 6 radios.');
})();
