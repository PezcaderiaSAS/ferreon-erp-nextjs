import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\USUARIO\\.gemini\\antigravity-ide\\brain\\418d3555-c76c-4b7b-8ecb-6af9e4615ea0';
const PROD_URL = 'https://alquileres-erp-nextjs-ruby.vercel.app';

const DEMO_EMAIL = 'demo@alquileres-system.com';
const DEMO_PASS = 'Alquileres2026*';

async function run() {
  console.log('🚀 Iniciando verificación visual en producción con Playwright...');
  console.log(`🌐 URL base: ${PROD_URL}`);
  console.log(`📁 Directorio de artefactos: ${ARTIFACTS_DIR}`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    // 1. LOGIN
    console.log('\n[1/4] Navegando a Login...');
    await page.goto(`${PROD_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const loginScreenshotPath = path.join(ARTIFACTS_DIR, 'prod_login_view.png');
    await page.screenshot({ path: loginScreenshotPath, fullPage: false });
    console.log(`  📸 Captura login guardada en: ${loginScreenshotPath}`);

    console.log('  Rellenando credenciales institucionales...');
    const emailInput = page.locator('input[type="email"]');
    const passInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(DEMO_EMAIL);
      await passInput.fill(DEMO_PASS);
      
      const submitBtn = page.locator('button[type="submit"]');
      console.log('  Enviando formulario de autenticación con button[type="submit"]...');
      await submitBtn.click();
      
      // Esperar navegación fuera de /auth/login
      try {
        await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 10000 });
        console.log(`  ✅ Sesión iniciada con éxito. URL actual: ${page.url()}`);
      } catch {
        console.log(`  ⚠️ No cambió la URL de login tras 10s. Verificando alertas...`);
        const alertMsg = await page.locator('.text-red-600, .bg-red-50, role=alert').textContent().catch(() => null);
        if (alertMsg) {
          console.log(`  Mensaje en login: ${alertMsg.trim()}`);
        }
      }
    }

    // 2. COTIZACIONES
    console.log('\n[2/4] Navegando a Módulo de Cotizaciones (/cotizaciones)...');
    await page.goto(`${PROD_URL}/cotizaciones`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // estabilización de layout y streaming

    const cotizacionesDesktopPath = path.join(ARTIFACTS_DIR, 'prod_cotizaciones_desktop.png');
    await page.screenshot({ path: cotizacionesDesktopPath, fullPage: false });
    console.log(`  📸 Captura cotizaciones desktop: ${cotizacionesDesktopPath}`);

    // Intentar abrir modal de conversión si hay botón "Convertir"
    const btnConvertir = page.getByRole('button', { name: /convertir/i }).first();
    let modalOpened = false;
    if (await btnConvertir.isVisible()) {
      console.log('  Abriendo ConvertirCotizacionModal...');
      await btnConvertir.click();
      await page.waitForTimeout(1500);

      const modalScreenshotPath = path.join(ARTIFACTS_DIR, 'prod_convertir_cotizacion_modal.png');
      await page.screenshot({ path: modalScreenshotPath, fullPage: false });
      console.log(`  📸 Captura ConvertirCotizacionModal: ${modalScreenshotPath}`);
      modalOpened = true;

      // Cerrar modal
      const btnCerrar = page.getByRole('button', { name: /cancelar|cerrar/i }).or(page.locator('button:has(svg.lucide-x)')).first();
      if (await btnCerrar.isVisible()) {
        await btnCerrar.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('  No se encontraron botones activos de Convertir en el primer lote (lista vacía o todas convertidas).');
    }

    // 3. ALQUILERES
    console.log('\n[3/4] Navegando a Módulo de Alquileres (/alquileres)...');
    await page.goto(`${PROD_URL}/alquileres`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const alquileresDesktopPath = path.join(ARTIFACTS_DIR, 'prod_alquileres_desktop.png');
    await page.screenshot({ path: alquileresDesktopPath, fullPage: false });
    console.log(`  📸 Captura alquileres desktop: ${alquileresDesktopPath}`);

    // 4. MÓVIL
    console.log('\n[4/4] Verificando vista Móvil (/cotizaciones a 390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${PROD_URL}/cotizaciones`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const cotizacionesMobilePath = path.join(ARTIFACTS_DIR, 'prod_cotizaciones_mobile.png');
    await page.screenshot({ path: cotizacionesMobilePath, fullPage: false });
    console.log(`  📸 Captura móvil: ${cotizacionesMobilePath}`);

    console.log('\n======================================================');
    console.log('✨ VERIFICACIÓN VISUAL EN PRODUCCIÓN COMPLETADA');
    console.log(`Errores de consola detectados: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      consoleErrors.slice(0, 5).forEach((e, idx) => console.log(`  [${idx + 1}] ${e}`));
    }
    console.log('======================================================');

  } catch (err) {
    console.error('❌ Error durante la verificación en producción:', err);
  } finally {
    await browser.close();
  }
}

run();
