import { fetchFigma, getFileInfo, getFileVariables } from './figma-api-client.mjs';

const FILE_KEY = 'xQ7iOmkYpLy6F1H9QnYv5F';

async function audit() {
  console.log("=== AUDITORÍA COMPLETA DE ARCHIVO FIGMA: ALQUILERES SYSTEM ===");
  const fileData = await fetchFigma(`/files/${FILE_KEY}`);
  
  console.log(`Nombre: ${fileData.name}`);
  console.log(`Última modificación: ${fileData.lastModified}`);
  console.log(`Versión: ${fileData.version}`);
  console.log(`Thumbnail: ${fileData.thumbnailUrl}`);

  const page = fileData.document.children[0];
  console.log(`\n📄 Página: "${page.name}" con ${page.children.length} secciones/elementos:`);
  
  const sectionsSummary = [];
  const colorPalette = new Map();
  const fontStyles = new Map();
  const componentsList = [];

  function traverse(node, depth = 0) {
    if (!node) return;

    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      componentsList.push({ id: node.id, name: node.name, type: node.type });
    }

    if (node.fills && Array.isArray(node.fills)) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          const r = Math.round(fill.color.r * 255);
          const g = Math.round(fill.color.g * 255);
          const b = Math.round(fill.color.b * 255);
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          colorPalette.set(hex, (colorPalette.get(hex) || 0) + 1);
        }
      });
    }

    if (node.style && node.style.fontFamily) {
      const fontKey = `${node.style.fontFamily} ${node.style.fontWeight || 400} (${node.style.fontSize || 14}px)`;
      fontStyles.set(fontKey, (fontStyles.get(fontKey) || 0) + 1);
    }

    if (node.children) {
      node.children.forEach(c => traverse(c, depth + 1));
    }
  }

  page.children.forEach((child, idx) => {
    sectionsSummary.push({
      index: idx + 1,
      id: child.id,
      name: child.name,
      type: child.type,
      childrenCount: child.children ? child.children.length : 0
    });
    traverse(child);
  });

  console.log("\n📋 Secciones Detectadas en Figma:");
  sectionsSummary.forEach(s => {
    console.log(`  [${s.index}] ${s.name} (${s.type}, ${s.childrenCount} sub-elementos)`);
  });

  console.log(`\n🧩 Componentes Detectados: ${componentsList.length}`);
  componentsList.slice(0, 15).forEach(c => {
    console.log(`  - [${c.type}] ${c.name} (${c.id})`);
  });

  console.log(`\n🎨 Paleta de Colores Extraída (${colorPalette.size} colores únicos):`);
  const topColors = Array.from(colorPalette.entries()).sort((a, b) => b[1] - a[1]).slice(0, 15);
  topColors.forEach(([hex, count]) => {
    console.log(`  - ${hex}: usado ${count} veces`);
  });

  console.log(`\n🔤 Estilos Tipográficos Detectados (${fontStyles.size} estilos):`);
  const topFonts = Array.from(fontStyles.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  topFonts.forEach(([font, count]) => {
    console.log(`  - ${font}: usado ${count} veces`);
  });

  // Consultar Variables Locales si existen
  try {
    const varsData = await getFileVariables(FILE_KEY);
    console.log(`\n📐 Variables de Figma Locales: ${Object.keys(varsData.meta?.variables || {}).length}`);
    console.log(`📦 Colecciones de Variables: ${Object.keys(varsData.meta?.variableCollections || {}).length}`);
  } catch (err) {
    console.log("\n📐 Variables de Figma: No hay colecciones de variables aún (listo para inyectar con el plugin).");
  }
}

audit().catch(console.error);
