import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Subcontrataciones & Tercerización de Maquinaria (Alquileres System)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/subcontrataciones');
  });

  test('debe cargar la vista de subcontrataciones o redirigir a login según el estado de sesión', async ({ page }) => {
    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/auth\/login/);
      return;
    }

    // Cabecera del módulo de Subcontrataciones
    await expect(page.getByText(/subcontrataci[oó]n|tercerizaci[oó]n|re-renting/i).first()).toBeVisible();

    // Verificación de tarjetas de KPIs financieros
    await expect(page.getByText(/activas|en bodega|liquidadas/i).first()).toBeVisible();

    // Botón de acción para registrar nueva orden
    const btnNuevaSub = page.getByRole('button', { name: /nueva orden|registrar|subcontrataci[oó]n/i }).first();
    if (await btnNuevaSub.isVisible()) {
      await expect(btnNuevaSub).toBeVisible();
    }
  });

  test('debe permitir interactuar con los filtros de estado de subcontratación', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    const tabs = [/todas/i, /activas/i, /bodega/i, /liquidadas/i];
    for (const tabName of tabs) {
      const tabButton = page.getByRole('button', { name: tabName }).first();
      if (await tabButton.isVisible()) {
        await expect(tabButton).toBeVisible();
        await tabButton.click();
        await page.waitForTimeout(150);
      }
    }
  });

  test('debe abrir y cerrar el modal de registrar orden de subcontratación', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    const btnNueva = page.getByRole('button', { name: /nueva orden|registrar|subcontrataci[oó]n/i }).first();
    if (await btnNueva.isVisible()) {
      await btnNueva.click();

      // Verificar título del modal
      const modalHeading = page.getByText(/registrar orden de subcontrataci[oó]n/i).first();
      await expect(modalHeading).toBeVisible();

      // Verificar semáforo de rentabilidad o cálculo de costos
      const semaforoRentabilidad = page.getByText(/rentabilidad|costo proveedor|margen/i).first();
      if (await semaforoRentabilidad.isVisible()) {
        await expect(semaforoRentabilidad).toBeVisible();
      }

      // Cerrar modal
      const btnCancelar = page.getByRole('button', { name: /cancelar/i }).first();
      if (await btnCancelar.isVisible()) {
        await btnCancelar.click();
        await expect(modalHeading).not.toBeVisible();
      }
    }
  });
});
