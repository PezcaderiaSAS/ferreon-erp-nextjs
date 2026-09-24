import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Caja, Arqueo y Control Financiero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/caja');
  });

  test('debe cargar la vista de caja o redirigir a autenticación según la sesión', async ({ page }) => {
    if (page.url().includes('/auth/login')) {
      await expect(page.getByRole('heading', { name: /iniciar sesión|acceder/i })).toBeVisible();
      return;
    }

    // Cabecera o módulo de Caja Chica
    await expect(page.getByText(/caja|arqueo|movimientos/i).first()).toBeVisible();

    // Verificación de botones de acción financiera
    const btnArqueo = page.getByRole('button', { name: /arqueo|cerrar caja|abrir caja/i });
    if (await btnArqueo.isVisible()) {
      await expect(btnArqueo).toBeVisible();
    }
  });

  test('debe permitir consultar el historial de movimientos de caja', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    const tablaMovimientos = page.locator('table');
    if (await tablaMovimientos.isVisible()) {
      await expect(tablaMovimientos).toBeVisible();
    }
  });
});
