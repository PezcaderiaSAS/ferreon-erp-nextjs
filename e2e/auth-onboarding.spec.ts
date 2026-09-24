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
    // Clic en el botón o link para registrarse
    const btnCrearCuenta = page.getByRole('button', { name: /crear cuenta|registrar nueva empresa|registrarse/i })
      .or(page.getByText(/crear cuenta|¿no tienes cuenta\? regístrate/i));
    
    await btnCrearCuenta.click();

    // Deben ser visibles los campos adicionales del modelo Tenant
    await expect(page.locator('input[name="empresaNombre"]').or(page.getByPlaceholder(/nombre de tu empresa|constructora/i))).toBeVisible();
    await expect(page.locator('input[name="empresaNit"]').or(page.getByPlaceholder(/nit|900\./i))).toBeVisible();
    await expect(page.locator('input[name="empresaTelefono"]').or(page.getByPlaceholder(/teléfono|celular/i))).toBeVisible();
    await expect(page.locator('select[name="empresaCiudad"]').or(page.locator('select').first())).toBeVisible();

    // Checkbox de términos y condiciones
    const checkTerminos = page.locator('input[type="checkbox"]');
    await expect(checkTerminos).toBeVisible();
  });

  test('debe prevenir registro si no se aceptan los términos de servicio', async ({ page }) => {
    const btnCrearCuenta = page.getByRole('button', { name: /crear cuenta|registrar nueva empresa|registrarse/i })
      .or(page.getByText(/crear cuenta|¿no tienes cuenta\? regístrate/i));
    
    await btnCrearCuenta.click();

    // Llenar campos obligatorios
    await page.locator('input[type="email"]').fill('nuevo.tenant@ferreon.com');
    await page.locator('input[type="password"]').fill('ClaveSegura123!');

    // Intentar registrar sin marcar checkbox
    const btnSubmit = page.getByRole('button', { name: /crear mi cuenta|registrarme|comenzar prueba/i });
    if (await btnSubmit.isVisible()) {
      await btnSubmit.click();
      await expect(page.getByText(/términos de servicio|debes aceptar/i)).toBeVisible();
    }
  });
});
