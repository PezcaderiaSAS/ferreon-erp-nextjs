const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Intercept all responses
  page.on('response', async (response) => {
    if (response.url().includes('/bodega') && response.request().method() === 'POST') {
      console.log('--- POST /bodega RESPONSE ---');
      console.log('Status:', response.status());
      try {
        const body = await response.text();
        console.log('Body:', body);
      } catch (e) {
        console.log('Could not read body');
      }
    }
  });

  page.on('pageerror', error => {
    console.log('Page Error:', error.message);
  });

  console.log('Navigating to Bodega...');
  await page.goto('https://alquileres-erp-nextjs-ruby.vercel.app/bodega');
  
  console.log('Clicking "Añadir Nuevo Equipo"...');
  await page.getByText('Añadir Nuevo Equipo').click();
  
  console.log('Filling out form...');
  await page.getByLabel('Nombre de Equipo').fill('Playwright Test');
  await page.getByLabel('Tarifa de Alquiler por Día').fill('1000');
  await page.getByLabel('Stock Físico Inicial').fill('5');
  
  console.log('Submitting form...');
  await page.getByRole('button', { name: 'Guardar Equipo en Bodega' }).click();
  
  // Wait a bit for the network request to finish
  await page.waitForTimeout(3000);
  
  await browser.close();
})();
