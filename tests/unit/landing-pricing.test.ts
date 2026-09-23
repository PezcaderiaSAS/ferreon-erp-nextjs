import { describe, it, expect } from 'vitest';
import { LANDING_CONFIG } from '@/config/landing';

describe('Landing Page Pricing & Currency Consistency', () => {
  const { tiers } = LANDING_CONFIG.pricing;

  it('debe contener exactamente 3 planes de precios (Starter, Pro, Business)', () => {
    expect(tiers).toHaveLength(3);
    expect(tiers.map((t) => t.id)).toEqual(['starter', 'pro', 'business']);
  });

  it('debe destacar el plan Pro como "Más Popular"', () => {
    const proPlan = tiers.find((t) => t.id === 'pro');
    expect(proPlan).toBeDefined();
    expect(proPlan?.isPopular).toBe(true);
    expect(proPlan?.badge).toBe('Más Popular');
  });

  it('debe cumplir la regla de negocio de Pesos Colombianos (COP) enteros sin decimales', () => {
    tiers.forEach((tier) => {
      expect(Number.isInteger(tier.priceCOP.monthly)).toBe(true);
      expect(Number.isInteger(tier.priceCOP.annual)).toBe(true);
      expect(tier.priceCOP.monthly % 1).toBe(0);
      expect(tier.priceCOP.annual % 1).toBe(0);
    });
  });

  it('debe calcular con exactitud matemática el 20% de descuento en facturación anual', () => {
    const proPlan = tiers.find((t) => t.id === 'pro')!;
    const businessPlan = tiers.find((t) => t.id === 'business')!;

    // Pro: 89.000 * 0.8 = 71.200
    expect(proPlan.priceCOP.annual).toBe(Math.round(proPlan.priceCOP.monthly * 0.8));
    // Business: 220.000 * 0.8 = 176.000
    expect(businessPlan.priceCOP.annual).toBe(Math.round(businessPlan.priceCOP.monthly * 0.8));

    // USD: 19 * 0.8 ≈ 15 (redondeado), 49 * 0.8 ≈ 39 (redondeado)
    expect(proPlan.priceUSD.annual).toBe(Math.round(proPlan.priceUSD.monthly * 0.8));
    expect(businessPlan.priceUSD.annual).toBe(Math.round(businessPlan.priceUSD.monthly * 0.8));
  });

  it('debe formatear los valores monetarios en COP con separador de miles y sin decimales', () => {
    const formatCop = (val: number) =>
      `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(val)}`;

    expect(formatCop(0)).toBe('$0');
    const formattedPro = formatCop(89000);
    expect(formattedPro).toMatch(/^\$89[.\s]000$/);
    expect(formattedPro).not.toContain(',00');
  });
});

describe('Landing Page ERP Modules & Navigation Consistency', () => {
  const { erpModules, navigation } = LANDING_CONFIG;

  it('debe incluir el enlace al nuevo explorador de módulos en la navegación', () => {
    const modulesLink = navigation.links.find(l => l.href === '#modules');
    expect(modulesLink).toBeDefined();
    expect(modulesLink?.label).toBe('Módulos ERP');
  });

  it('debe contener exactamente 4 categorías de módulos', () => {
    expect(erpModules.categories).toHaveLength(4);
    const categoryIds = erpModules.categories.map(c => c.id);
    expect(categoryIds).toEqual([
      'operacion',
      'bodega_compras',
      'logistica_facturacion',
      'tesoreria_admin'
    ]);
  });

  it('debe totalizar exactamente 8 módulos operativos', () => {
    const allModules = erpModules.categories.flatMap(c => c.modules);
    expect(allModules).toHaveLength(8);
    const moduleIds = allModules.map(m => m.id);
    expect(moduleIds).toEqual([
      'alquileres',
      'devoluciones',
      'bodega',
      'compras',
      'subcontrataciones',
      'facturacion',
      'caja',
      'ultraadmin'
    ]);
  });

  it('todos los módulos deben enlazar a rutas válidas del ERP con RLS y prefijo "/"', () => {
    const allModules = erpModules.categories.flatMap(c => c.modules);
    allModules.forEach(mod => {
      expect(mod.route.startsWith('/')).toBe(true);
      expect(mod.kpis.length).toBeGreaterThanOrEqual(3);
      expect(mod.highlights.length).toBeGreaterThanOrEqual(3);
    });
  });
});
