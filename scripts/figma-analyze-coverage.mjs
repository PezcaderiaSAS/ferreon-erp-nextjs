import { fetchFigma } from './figma-api-client.mjs';

const FILE_KEY = 'xQ7iOmkYpLy6F1H9QnYv5F';

// Catálogo maestro de rutas y vistas de Alquileres System
const MASTER_ROUTES = [
  { path: '/', name: 'Landing Page SaaS', priority: 'Media', category: 'Público / Marketing' },
  { path: '/auth/login', name: 'Login & Onboarding Tenant', priority: 'Alta', category: 'Autenticación' },
  { path: '/dashboard', name: 'Dashboard Principal', priority: 'Crítica', category: 'Operaciones' },
  { path: '/alquileres', name: 'Alquileres & Cotizaciones', priority: 'Crítica', category: 'Operaciones' },
  { path: '/bodega', name: 'Bodega, Inventario & Kardex', priority: 'Crítica', category: 'Operaciones' },
  { path: '/compras', name: 'Compras & Proveedores', priority: 'Alta', category: 'Operaciones' },
  { path: '/subcontrataciones', name: 'Subcontrataciones & Tercerización', priority: 'Alta', category: 'Operaciones' },
  { path: '/devoluciones', name: 'Devoluciones & Split-Line', priority: 'Crítica', category: 'Operaciones' },
  { path: '/facturacion', name: 'Facturación & Cartera CXC', priority: 'Alta', category: 'Finanzas' },
  { path: '/caja', name: 'Caja & Arqueos POS', priority: 'Alta', category: 'Finanzas' },
  { path: '/clientes', name: 'Directorio de Clientes', priority: 'Alta', category: 'Directorio' },
  { path: '/suscripcion', name: 'Planes & Suscripción B2B', priority: 'Media', category: 'Facturación SaaS' },
  { path: '/configuracion', name: 'Configuración de Empresa', priority: 'Media', category: 'Ajustes' },
  { path: '/admin/empresas', name: 'Gobernanza UltraAdmin SaaS', priority: 'Media', category: 'Administración' }
];

async function run() {
  const data = await fetchFigma(`/files/${FILE_KEY}?depth=2`);
  const page = data.document.children[0];

  console.log(`=== ANÁLISIS DE COBERTURA: FIGMA vs ALQUILERES SYSTEM ===\n`);
  console.log(`Archivo: "${data.name}" (${FILE_KEY})`);
  console.log(`Total secciones en Figma: ${page.children.length}\n`);

  const importedSections = page.children.map(c => c.name);

  // Mapear qué rutas están ya en Figma
  const coverageMap = MASTER_ROUTES.map(route => {
    let matched = false;
    let matchingSections = [];

    importedSections.forEach(secName => {
      const lower = secName.toLowerCase();
      if (route.path === '/' && (lower.includes('alquileres-erp-nextjs-ruby.vercel.app') && !lower.includes('/') && !lower.includes('configuracion') && !lower.includes('admin') && !lower.includes('suscripcion') && !lower.includes('clientes') && !lower.includes('caja') && !lower.includes('facturacion'))) {
        matched = true;
        matchingSections.push(secName);
      } else if (route.path !== '/' && lower.includes(route.path.toLowerCase())) {
        matched = true;
        matchingSections.push(secName);
      }
    });

    return {
      ...route,
      isImported: matched,
      sections: matchingSections
    };
  });

  const present = coverageMap.filter(c => c.isImported);
  const missing = coverageMap.filter(c => !c.isImported);

  console.log(`✅ SECCIONES YA PRESENTES EN FIGMA (${present.length} de ${MASTER_ROUTES.length}):`);
  present.forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.category}] ${p.name} (${p.path})`);
    p.sections.forEach(s => console.log(`      ↳ ${s}`));
  });

  console.log(`\n❌ SECCIONES QUE FALTAN POR IMPORTAR (${missing.length} pendientes):`);
  missing.forEach((m, idx) => {
    console.log(`  ${idx + 1}. [Prioridad: ${m.priority}] [${m.category}] ${m.name}`);
    console.log(`      URL directa: https://alquileres-erp-nextjs-ruby.vercel.app${m.path}`);
  });

  console.log(`\n📊 Porcentaje de Cobertura actual: ${Math.round((present.length / MASTER_ROUTES.length) * 100)}%`);
}

run().catch(console.error);
