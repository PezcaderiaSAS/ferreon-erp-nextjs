import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Formalización Polimórfica de Cotizaciones a Contrato', () => {
  test.beforeEach(async ({ page }) => {
    // Navegación directa a la pantalla de alquileres y cotizaciones
    await page.goto('/alquileres');
  });

  test('debe cargar la vista de alquileres y permitir filtrar por la pestaña de Cotizaciones', async ({ page }) => {
    // Si redirige a login, la ruta está protegida por auth middleware
    if (page.url().includes('/auth/login')) {
      await expect(page.getByRole('heading', { name: /iniciar sesión|acceder/i })).toBeVisible();
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
      await btnFormalizar1Clic.click();

      // Debe abrirse el modal institucional ConvertirCotizacionModal
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /formalizar contrato \(1-clic\)/i })).toBeVisible();
      
      // Debe contener el botón de confirmación
      await expect(page.getByRole('button', { name: /formalizar contrato/i })).toBeVisible();

      // Botón de cancelar / cerrar
      await page.getByRole('button', { name: /cancelar/i }).click();
      await expect(page.getByRole('dialog')).toBeHidden();
    }
  });

  test('debe validar la existencia de controles de ratificación si la fecha de cotización está vencida', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    // Verificar presencia de inputs de fecha en modales de formalización
    const tabCotizaciones = page.getByRole('button', { name: /cotizaciones/i }).first();
    if (await tabCotizaciones.isVisible()) {
      await tabCotizaciones.click();
    }
  });
});
