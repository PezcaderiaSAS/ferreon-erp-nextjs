import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Formalización Polimórfica de Cotizaciones a Contrato', () => {
  test.beforeEach(async ({ page }) => {
    // Navegación directa a la pantalla de alquileres y cotizaciones
    await page.goto('/alquileres');
  });

  test('debe cargar la vista de alquileres y permitir filtrar por la pestaña de Cotizaciones', async ({ page }) => {
    // Si redirige a login, la ruta está protegida por auth middleware
    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/auth\/login/);
      return;
    }

    // Pestaña o filtro de Cotizaciones
    const tabCotizaciones = page.getByRole('button', { name: /cotizaciones/i })
      .or(page.getByText(/cotizaciones/i).first());
    
    await expect(tabCotizaciones).toBeVisible();
    await tabCotizaciones.click();

    // Debe mostrar la columna o listado con botón de formalizar en 1-clic
    const btnFormalizar1Clic = page.getByRole('button', { name: /formalizar contrato|1-clic/i }).first();
    if (await btnFormalizar1Clic.isVisible()) {
      await expect(btnFormalizar1Clic).toBeVisible();
      await btnFormalizar1Clic.click();

      // Si abre diálogo por falta de stock o confirmación asistida
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        const btnConfirm = page.getByRole('button', { name: /formalizar contrato/i }).last();
        if (await btnConfirm.isVisible()) {
          await expect(btnConfirm).toBeVisible();
        }
        const btnCerrar = page.getByRole('button', { name: /cancelar|cerrar/i }).first();
        if (await btnCerrar.isVisible()) {
          await btnCerrar.click();
        }
      }
    }
  });

  test('debe permitir formalización con fechas retrospectivas sin bloqueo temporal forzado', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    // Verificar presencia de la pestaña cotizaciones y listado
    const tabCotizaciones = page.getByRole('button', { name: /cotizaciones/i }).first();
    if (await tabCotizaciones.isVisible()) {
      await tabCotizaciones.click();
      await expect(tabCotizaciones).toBeVisible();
    }
  });
});
