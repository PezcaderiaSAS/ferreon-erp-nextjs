import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminSupabaseClient } from '@/infrastructure/persistence/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado en el servidor' },
        { status: 500 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('❌ [Stripe Webhook] STRIPE_WEBHOOK_SECRET no está definida en las variables de entorno.');
      return NextResponse.json(
        { error: 'Webhook secret no configurado' },
        { status: 500 }
      );
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Cabecera stripe-signature faltante' },
        { status: 400 }
      );
    }

    // 1. Obtener el cuerpo de la petición en raw text para validar la firma criptográfica
    const body = await req.text();
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ [Stripe Webhook] Fallo en la verificación de firma: ${err.message}`);
      return NextResponse.json(
        { error: `Firma inválida: ${err.message}` },
        { status: 400 }
      );
    }

    // 2. Control de Idempotencia para evitar procesar eventos duplicados
    const supabaseAdmin = createAdminSupabaseClient();
    const eventId = event.id;

    const { data: existingLog } = await supabaseAdmin
      .from('idempotency_logs')
      .select('id')
      .eq('key', `stripe_event_${eventId}`)
      .single();

    if (existingLog) {
      console.log(`ℹ️ [Stripe Webhook] Evento ya procesado previamente: ${eventId}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.log(`🔔 [Stripe Webhook] Procesando evento: ${event.type} (${eventId})`);

    // 3. Procesar eventos del ciclo de vida de la suscripción
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const empresaId = session.metadata?.empresa_id || session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const isLifetime = session.mode === 'payment' || session.metadata?.plan_id === 'plan_lifetime';

        if (empresaId) {
          const updateData: any = {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || (isLifetime ? 'lifetime_access' : null),
            subscription_status: 'active',
            plan_id: isLifetime ? 'plan_lifetime' : 'plan_monthly_flat',
            updated_at: new Date().toISOString(),
          };

          if (isLifetime) {
            updateData.trial_ends_at = null;
          }

          await supabaseAdmin
            .from('empresas')
            .update(updateData)
            .eq('id', empresaId);

          console.log(`✅ [Stripe Webhook] Empresa ${empresaId} activada exitosamente (${isLifetime ? 'Plan Vitalicio Perpetuo' : 'Suscripción Mensual'}).`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status; // 'active', 'past_due', 'unpaid', 'canceled', etc.

        // Mapear status seguro a nuestra base de datos
        const mappedStatus = ['active', 'past_due', 'unpaid', 'canceled', 'trialing'].includes(status)
          ? status
          : 'past_due';

        await supabaseAdmin
          .from('empresas')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`🔄 [Stripe Webhook] Suscripción actualizada a '${mappedStatus}' para customer ${customerId}.`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from('empresas')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`🛑 [Stripe Webhook] Suscripción cancelada para customer ${customerId}.`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        await supabaseAdmin
          .from('empresas')
          .update({
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.log(`💰 [Stripe Webhook] Pago recurrente exitoso para customer ${customerId}.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        await supabaseAdmin
          .from('empresas')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        console.warn(`⚠️ [Stripe Webhook] Fallo en el cobro de factura para customer ${customerId}.`);
        break;
      }

      default:
        console.log(`ℹ️ [Stripe Webhook] Evento no manejado: ${event.type}`);
    }

    // 4. Guardar registro de idempotencia
    await supabaseAdmin.from('idempotency_logs').insert([
      {
        key: `stripe_event_${eventId}`,
        response: { event_type: event.type, timestamp: new Date().toISOString() },
      },
    ]);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Error]', error);
    return NextResponse.json(
      { error: 'Error interno en el procesamiento del webhook' },
      { status: 500 }
    );
  }
}
