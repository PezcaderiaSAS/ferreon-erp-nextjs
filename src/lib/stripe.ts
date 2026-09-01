import Stripe from 'stripe';

/**
 * Cliente de Stripe SDK para Node.js / Server Actions y Webhooks.
 * Utiliza variables de entorno con fallback seguro para no romper builds de CI/CD.
 */

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.warn('⚠️ [Stripe] STRIPE_SECRET_KEY no está configurada en las variables de entorno.');
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
    appInfo: {
      name: 'FerreOn ERP SaaS',
      version: '1.0.0',
    },
    typescript: true,
  });
};

export const stripe = getStripeClient();

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
} as const;

export const TRIAL_PERIOD_DAYS = 14;
