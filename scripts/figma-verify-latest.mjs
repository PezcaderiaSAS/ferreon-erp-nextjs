import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/FIGMA_ACCESS_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

const FILE_KEY = 'xQ7iOmkYpLy6F1H9QnYv5F';

async function run() {
  console.log('🔍 Consultando el nodo principal (Page 1) del archivo en Figma...');
  const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=0:1&depth=4`, {
    headers: { 'X-Figma-Token': token }
  });

  if (!res.ok) {
    console.error(`Error ${res.status}: ${await res.text()}`);
    return;
  }

  const data = await res.json();
  const page = data.nodes['0:1']?.document;
  if (!page || !page.children) {
    console.log('No se encontraron hijos en la página 1.');
    return;
  }

  console.log(`\n📋 TOTAL DE ELEMENTOS EN EL LIENZO: ${page.children.length}\n`);

  page.children.forEach((child, idx) => {
    // Extraer textos clave del elemento
    const texts = [];
    function extract(n, depth = 0) {
      if (!n || depth > 8) return;
      if (n.type === 'TEXT' && n.characters) {
        const t = n.characters.trim();
        if (t && !texts.includes(t)) texts.push(t);
      }
      if (n.children) {
        n.children.forEach(c => extract(c, depth + 1));
      }
    }
    extract(child);

    console.log(`[#${idx + 1}] [${child.type}] "${child.name}" (id: ${child.id})`);
    if (texts.length > 0) {
      console.log(`     Textos clave (${texts.length}): ${JSON.stringify(texts.slice(0, 8))}`);
    }
  });
}

run().catch(console.error);
