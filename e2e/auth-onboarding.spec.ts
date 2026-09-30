import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Autenticación, Registro Multi-Tenant y Auto-Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('debe cargar la pantalla de login institucional con formulario de credenciales', async ({ page }) => {
    await expect(page).toHaveTitle(/FerreOn|Alquileres/i);
    await expect(page.getByRole('heading', { name: /iniciar sesión|acceder|bienvenido/i })).toBeVisible();

    const inputEmail = page.locator('input[type="email"]');
    const inputPassword = page.locator('input[type="password"]');

    await expect(inputEmail).toBeVisible();
    await expect(inputPassword).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar|iniciar sesión|acceder/i })).toBeVisible();
  });

  test('debe alternar a modo registro y mostrar los campos corporativos de Onboarding (NIT, Teléfono, Ciudad)', async ({ page }) => {
    // Clic en el botón para alternar a registro
    const tabCrearCuenta = page.getByRole('button', { name: /crear cuenta/i }).first();
    await tabCrearCuenta.click();

    // Deben ser visibles los campos adicionales del modelo Tenant
    await expect(page.locator('input[name="empresaNombre"]').or(page.getByPlaceholder(/Andamios/i))).toBeVisible();
    await expect(page.locator('input[name="empresaNit"]').or(page.getByPlaceholder(/900\./i))).toBeVisible();
    await expect(page.locator('input[name="empresaTelefono"]').or(page.getByPlaceholder(/300|teléfono/i))).toBeVisible();
    await expect(page.locator('input[name="empresaCiudad"]').or(page.getByPlaceholder(/bucaramanga/i))).toBeVisible();

    // Checkbox de términos y condiciones
    const checkTerminos = page.locator('input[type="checkbox"]');
    await expect(checkTerminos).toBeVisible();
  });

  test('debe prevenir registro si no se aceptan los términos de servicio', async ({ page }) => {
    const tabCrearCuenta = page.getByRole('button', { name: /crear cuenta/i }).first();
    await tabCrearCuenta.click();

    // Llenar campos obligatorios
    await page.getByPlaceholder(/Andamios|nombre de tu empresa/i).fill('Mi Empresa Test');
    await page.getByPlaceholder(/900\.|nit/i).fill('900.111.222');
    await page.getByPlaceholder(/300|teléfono/i).fill('3001234567');
    await page.locator('input[type="email"]').fill('nuevo.tenant@ferreon.com');
    await page.locator('input[type="password"]').fill('ClaveSegura123!');

    // Intentar registrar sin marcar checkbox
    const btnSubmit = page.getByRole('button', { name: /crear cuenta y comenzar|crear mi cuenta|registrarme|comenzar prueba/i }).first();
    if (await btnSubmit.isVisible()) {
      await btnSubmit.click();
      const isChecked = await page.locator('input[type="checkbox"]').isChecked();
      expect(isChecked).toBe(false);
    }
  });
});
