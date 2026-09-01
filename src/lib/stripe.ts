/**
 * Cliente de Stripe SDK para Node.js / Server Actions y Webhooks.
 * Utiliza carga dinámica para no bloquear compilaciones previas al npm install.
 */

let StripeClientClass: any = null;

try {
  // Carga dinámica segura para Next.js / Webpack
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const dynamicRequire = eval('require');
  StripeClientClass = dynamicRequire('stripe');
  if (StripeClientClass && StripeClientClass.default) {
    StripeClientClass = StripeClientClass.default;
  }
} catch {
  // Stripe aún no instalado localmente en node_modules
}

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !StripeClientClass) {
    return null;
  }

  try {
    return new StripeClientClass(secretKey, {
      apiVersion: '2024-06-20',
      appInfo: {
        name: 'FerreOn ERP SaaS',
        version: '1.0.0',
      },
    });
  } catch (err) {
    console.warn('[Stripe Init Warning]', err);
    return null;
  }
};

export const stripe: any = getStripeClient();

/**
 * Constantes de Planes y Precios de FerreOn ERP SaaS
 */
export const STRIPE_PLANS = {
  MONTHLY_FLAT: {
    id: 'plan_monthly_flat',
    name: 'Plan FerreOn Pro (Ilimitado)',
    priceMonthlyCOP: 150000,
    priceMonthlyUSD: 39,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || 'price_default_ferreon_monthly',
    features: [
      'Alquileres y contratos ilimitados',
      'Catálogo de clientes y bodega ilimitado',
      'Generación de PDFs empresariales y tickets',
      'Control de caja y cartera en tiempo real',
      'Múltiples usuarios por empresa',
      'Aislamiento estricto de datos con RLS',
      'Soporte prioritario'
    ],
  },
  LIFETIME_DEAL: {
    id: 'plan_lifetime',
    name: 'Plan FerreOn Vitalicio (Acceso de por Vida)',
    priceCOP: 1200000,
    priceUSD: 299,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIFETIME || 'price_default_ferreon_lifetime',
    type: 'one_time',
    features: [
      'Acceso total de por vida sin mensualidades ni renovaciones',
      'Alquileres y contratos ilimitados para siempre',
      'Catálogo completo de clientes y bodega ilimitado',
      'Generación de PDFs empresariales y tickets',
      'Control de caja y cartera en tiempo real',
      'Múltiples usuarios por empresa',
      'Aislamiento estricto de datos con RLS',
      'Actualizaciones futuras incluidas'
    ],
  },
} as const;

export const TRIAL_PERIOD_DAYS = 14;
