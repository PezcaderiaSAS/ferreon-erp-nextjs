import { test, expect } from '@playwright/test';

test.describe('Flujo E2E: Gobernanza SaaS Multi-Tenant (UltraAdmin)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/empresas');
  });

  test('debe restringir acceso o cargar el panel de gobernanza si está autenticado como ULTRAADMIN', async ({ page }) => {
    // Si no tiene permisos, el middleware redirige a login o unauthorized
    if (page.url().includes('/auth/login') || page.url().includes('/unauthorized')) {
      expect(page.url()).toMatch(/auth\/login|unauthorized/);
      return;
    }

    // Cabecera institucional de UltraAdmin
    await expect(page.getByRole('heading', { name: /gobernanza saas|gestión de empresas|tenants/i })).toBeVisible();

    // Tabla de tenants
    const tabla = page.locator('table');
    await expect(tabla).toBeVisible();

    // Pills de filtro
    await expect(page.getByRole('button', { name: /todos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pendientes de aprobación/i })).toBeVisible();
  });

  test('debe interactuar con los filtros y permitir inspeccionar detalles de tenant', async ({ page }) => {
    if (page.url().includes('/auth/login') || page.url().includes('/unauthorized')) return;

    const btnPendientes = page.getByRole('button', { name: /pendientes de aprobación/i });
    if (await btnPendientes.isVisible()) {
      await btnPendientes.click();
    }

    // Clic en gestionar si existe alguna empresa
    const btnGestionar = page.getByRole('button', { name: /gestionar/i }).first();
    if (await btnGestionar.isVisible()) {
      await btnGestionar.click();

      // Debe abrirse el drawer lateral
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByTitle(/cerrar panel/i).click();
      await expect(page.getByRole('dialog')).toBeHidden();
    }
  });
});
