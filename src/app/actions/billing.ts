'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { stripe, STRIPE_PLANS } from '../../lib/stripe';

export interface TenantSubscriptionInfo {
  empresaId: string;
  nombreEmpresa: string;
  slug: string;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  planId: string;
  trialEndsAt: string;
  isTrialActive: boolean;
  daysLeftInTrial: number;
  isReadOnly: boolean;
  hasStripeCustomer: boolean;
}

/**
 * Consulta la información de suscripción y estado del tenant activo.
 */
export async function getTenantSubscriptionAction(): Promise<{
  success: boolean;
  data?: TenantSubscriptionInfo;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // 1. Obtener la empresa activa del usuario
    const { data: membership, error: memberError } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id, rol, empresas (*)')
      .eq('user_id', user.id)
      .eq('es_empresa_activa', true)
      .single();

    if (memberError || !membership || !membership.empresas) {
      return { success: false, error: 'No se encontró una empresa activa vinculada al usuario' };
    }

    const empresa: any = membership.empresas;
    const now = new Date();
    const trialEnds = new Date(empresa.trial_ends_at || now);
    const msDiff = trialEnds.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    
    const isTrial = empresa.subscription_status === 'trialing';
    const isTrialActive = isTrial && daysLeft > 0;
    
    // Modo Solo Lectura si está cancelado, en mora ('past_due'/'unpaid') o si el trial venció
    const isReadOnly = (isTrial && daysLeft <= 0) || ['past_due', 'canceled', 'unpaid'].includes(empresa.subscription_status);

    return {
      success: true,
      data: {
        empresaId: empresa.id,
        nombreEmpresa: empresa.nombre,
        slug: empresa.slug,
        subscriptionStatus: empresa.subscription_status,
        planId: empresa.plan_id || STRIPE_PLANS.MONTHLY_FLAT.id,
        trialEndsAt: empresa.trial_ends_at,
        isTrialActive,
        daysLeftInTrial: daysLeft,
        isReadOnly,
        hasStripeCustomer: Boolean(empresa.stripe_customer_id),
      },
    };
  } catch (error: any) {
    console.error('[Billing Action] Error al obtener suscripción:', error);
    return { success: false, error: error.message || 'Error interno al consultar suscripción' };
  }
}

/**
 * Crea una sesión de Stripe Checkout para iniciar o actualizar la suscripción mensual.
 */
export async function createCheckoutSessionAction(returnUrl?: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    if (!stripe) {
      return { success: false, error: 'Stripe no está configurado en el servidor (STRIPE_SECRET_KEY faltante).' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // 1. Obtener la empresa activa
    const { data: membership, error: memberError } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id, empresas (*)')
      .eq('user_id', user.id)
      .eq('es_empresa_activa', true)
      .single();

    if (memberError || !membership || !membership.empresas) {
      return { success: false, error: 'Empresa no encontrada' };
    }

    const empresa: any = membership.empresas;
    let stripeCustomerId = empresa.stripe_customer_id;

    // 2. Si la empresa no tiene Customer en Stripe, crearlo
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: empresa.nombre,
        metadata: {
          empresa_id: empresa.id,
          empresa_slug: empresa.slug,
          user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Actualizar en Supabase
      await supabase
        .from('empresas')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', empresa.id);
    }

    // 3. URLs de éxito y cancelación
    const baseUrl = returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/suscripcion?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = `${baseUrl}/suscripcion?status=cancelled`;

    // 4. Crear Checkout Session en modo suscripción recurrente
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PLANS.MONTHLY_FLAT.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          empresa_id: empresa.id,
          user_id: user.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: empresa.id,
      metadata: {
        empresa_id: empresa.id,
        user_id: user.id,
      },
    });

    return {
      success: true,
      url: session.url || undefined,
    };
  } catch (error: any) {
    console.error('[Billing Action] Error al crear Checkout Session:', error);
    return { success: false, error: error.message || 'Error al conectar con Stripe Checkout' };
  }
}

/**
 * Crea una sesión del Stripe Customer Portal para gestionar tarjeta, facturas y cancelaciones.
 */
export async function createCustomerPortalSessionAction(returnUrl?: string): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    if (!stripe) {
      return { success: false, error: 'Stripe no está configurado en el servidor' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data: membership, error: memberError } = await supabase
      .from('empresa_usuarios')
      .select('empresa_id, empresas (*)')
      .eq('user_id', user.id)
      .eq('es_empresa_activa', true)
      .single();

    if (memberError || !membership || !membership.empresas) {
      return { success: false, error: 'Empresa no encontrada' };
    }

    const empresa: any = membership.empresas;

    if (!empresa.stripe_customer_id) {
      return { 
        success: false, 
        error: 'Esta empresa aún no tiene un perfil de facturación en Stripe. Inicia una suscripción primero.' 
      };
    }

    const baseUrl = returnUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: empresa.stripe_customer_id,
      return_url: `${baseUrl}/suscripcion`,
    });

    return {
      success: true,
      url: portalSession.url,
    };
  } catch (error: any) {
    console.error('[Billing Action] Error al crear Portal Session:', error);
    return { success: false, error: error.message || 'Error al abrir el Portal de Facturación' };
  }
}
