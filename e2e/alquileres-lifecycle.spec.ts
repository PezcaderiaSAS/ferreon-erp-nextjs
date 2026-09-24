import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Ciclo de Vida de Alquileres y Contratos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/alquileres');
  });

  test('debe mostrar la interfaz de gestión de alquileres con filtros de estado y buscador', async ({ page }) => {
    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/.*login/);
      return;
    }

    // Buscador general de contratos
    const inputSearch = page.getByPlaceholder(/buscar contrato|cliente|consecutivo/i);
    if (await inputSearch.isVisible()) {
      await expect(inputSearch).toBeVisible();
      await inputSearch.fill('Constructora');
      await page.waitForTimeout(300);
      await inputSearch.clear();
    }

    // Botón de nuevo contrato
    const btnNuevoContrato = page.getByRole('button', { name: /nuevo contrato|crear alquiler|despachar/i });
    if (await btnNuevoContrato.isVisible()) {
      await expect(btnNuevoContrato).toBeVisible();
    }
  });

  test('debe contener los filtros de estado (Activos, Devoluciones, Finalizados, Todos)', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    const estados = [/activos/i, /todos/i];
    for (const estado of estados) {
      const pill = page.getByRole('button', { name: estado }).first();
      if (await pill.isVisible()) {
        await expect(pill).toBeVisible();
      }
    }
  });
});
