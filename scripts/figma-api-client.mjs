/**
 * Cliente oficial de Figma API para Alquileres System
 * Permite consultar, inspeccionar y extraer frames, variables y tokens de cualquier archivo de Figma.
 */

import fs from 'fs';
import path from 'path';

let envToken = process.env.FIGMA_ACCESS_TOKEN;
if (!envToken) {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/FIGMA_ACCESS_TOKEN=([^\r\n]+)/);
      if (match) envToken = match[1].trim();
    }
  } catch (e) {}
}

const FIGMA_TOKEN = envToken;

export async function fetchFigma(endpoint, options = {}, retries = 3) {
  const url = endpoint.startsWith('http') ? endpoint : `https://api.figma.com/v1${endpoint}`;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (res.status === 429 && attempt < retries) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '15', 10);
      const waitTime = Math.max(retryAfter, 15) * 1000;
      console.log(`⏳ Rate limit 429 en Figma API. Esperando ${waitTime / 1000}s antes de reintentar (intento ${attempt + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, waitTime));
      continue;
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Figma API Error [${res.status} ${res.statusText}]: ${errorText}`);
    }

    return await res.json();
  }
}

export async function getFileInfo(fileKey) {
  return await fetchFigma(`/files/${fileKey}?depth=2`);
}

export async function getFileNodes(fileKey, nodeIds = []) {
  return await fetchFigma(`/files/${fileKey}/nodes?ids=${nodeIds.join(',')}`);
}

export async function getFileVariables(fileKey) {
  return await fetchFigma(`/files/${fileKey}/variables/local`);
}

export async function exportNodeImages(fileKey, nodeIds = [], format = 'png', scale = 2) {
  return await fetchFigma(`/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}&scale=${scale}`);
}

// Ejecución CLI directa
if (process.argv[1]?.endsWith('figma-api-client.mjs')) {
  const fileKeyOrUrl = process.argv[2];
  if (!fileKeyOrUrl) {
    console.log("Uso: node figma-api-client.mjs <fileKey_o_URL>");
    process.exit(0);
  }

  let fileKey = fileKeyOrUrl;
  const match = fileKeyOrUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (match) {
    fileKey = match[1];
  }

  console.log(`🔍 Inspeccionando archivo de Figma: ${fileKey}...`);
  getFileInfo(fileKey)
    .then(data => {
      console.log(`✅ Archivo encontrado: "${data.name}"`);
      console.log(`📄 Páginas encontradas (${data.document.children.length}):`);
      data.document.children.forEach(page => {
        console.log(`  - [Página] ${page.name} (${page.children?.length || 0} elementos de nivel superior)`);
        page.children?.slice(0, 5).forEach(child => {
          console.log(`      * [${child.type}] ${child.name} (id: ${child.id})`);
        });
      });
    })
    .catch(err => {
      console.error("❌ Error consultando archivo:", err.message);
    });
}
