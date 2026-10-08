import fs from 'fs';
import path from 'path';

// Este script está diseñado para recorrer los archivos SKILL.md y workflows (.md)
// y traducir su frontmatter y descripciones usando una API de LLM.
// Requiere configuración de API_KEY para Gemini o el LLM de tu preferencia.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const dirsToProcess = [
  path.join(process.cwd(), '.agents', 'skills'),
  path.join(process.cwd(), '.agent', 'workflows')
];

async function translateText(text) {
  if (!GEMINI_API_KEY) {
    console.warn("⚠️ No se encontró GEMINI_API_KEY. Saltando traducción real.");
    return text; 
  }
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Traduce al español profesional el siguiente metadato o descripción técnica, manteniendo el formato YAML/Markdown intacto:\n\n${text}` }] }]
      })
    });
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.error("Error en la traducción:", err);
    return text;
  }
}

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extraer el frontmatter YAML
  const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const frontmatter = yamlMatch[1];
    console.log(`Traduciendo metadatos de: ${path.basename(filePath)}...`);
    
    // Traducir solo si tenemos API key para evitar romperlo
    if (GEMINI_API_KEY) {
      const translatedFrontmatter = await translateText(frontmatter);
      content = content.replace(yamlMatch[0], `---\n${translatedFrontmatter}\n---`);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Traducido: ${filePath}`);
    }
  }
}

async function run() {
  console.log("Iniciando script de traducción en lote...");
  for (const dir of dirsToProcess) {
    if (!fs.existsSync(dir)) continue;
    
    if (dir.includes('skills')) {
      const skills = fs.readdirSync(dir);
      for (const skill of skills) {
        const skillPath = path.join(dir, skill, 'SKILL.md');
        if (fs.existsSync(skillPath)) await processFile(skillPath);
      }
    } else {
      const workflows = fs.readdirSync(dir);
      for (const wf of workflows) {
        const wfPath = path.join(dir, wf);
        if (wfPath.endsWith('.md')) await processFile(wfPath);
      }
    }
  }
  console.log("🎉 Proceso de traducción finalizado.");
}

run();
