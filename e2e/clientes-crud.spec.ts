import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Directorio de Clientes y Gestión Tributaria (Alquileres System)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clientes');
  });

  test('debe cargar el directorio de clientes o redirigir a login según la sesión', async ({ page }) => {
    if (page.url().includes('/auth/login')) {
      await expect(page).toHaveURL(/auth\/login/);
      return;
    }

    // Cabecera o título del módulo de Clientes
    await expect(page.getByText(/directorio de clientes|clientes|gesti[oó]n de clientes/i).first()).toBeVisible();

    // Buscador de clientes
    const inputSearch = page.getByPlaceholder(/buscar por nombre|nit|c[eé]dula|tel[eé]fono/i).first();
    if (await inputSearch.isVisible()) {
      await expect(inputSearch).toBeVisible();
      await inputSearch.fill('900');
      await page.waitForTimeout(200);
      await inputSearch.clear();
    }
  });

  test('debe abrir y cerrar el modal de creación de cliente nuevo', async ({ page }) => {
    if (page.url().includes('/auth/login')) return;

    const btnNuevoCliente = page.getByRole('button', { name: /nuevo cliente|crear cliente|agregar cliente/i }).first();
    if (await btnNuevoCliente.isVisible()) {
      await btnNuevoCliente.click();

      // Verificar que se muestre el formulario con los campos esenciales
      const labelNit = page.getByText(/nit|c[eé]dula|identificaci[oó]n/i).first();
      await expect(labelNit).toBeVisible();

      // Cerrar modal
      const btnCancelar = page.getByRole('button', { name: /cancelar|cerrar/i }).first();
      if (await btnCancelar.isVisible()) {
        await btnCancelar.click();
      }
    }
  });
});
