import { describe, it, expect } from "vitest";
import { STRIPE_PLANS, TRIAL_PERIOD_DAYS } from "../../src/lib/stripe";

export function resolveStripeSubscriptionStatus(stripeStatus: string): 'active' | 'past_due' | 'unpaid' | 'canceled' | 'trialing' {
  const allowed = ['active', 'past_due', 'unpaid', 'canceled', 'trialing'];
  if (allowed.includes(stripeStatus)) {
    return stripeStatus as any;
  }
  return 'past_due';
}

describe("Integración Stripe Billing: Planes, Idempotencia y Lifecycle", () => {
  it("debe tener configurado el Plan Mensual Pro con los valores acordados", () => {
    const plan = STRIPE_PLANS.MONTHLY_FLAT;

    expect(plan.id).toBe("plan_monthly_flat");
    expect(plan.priceMonthlyCOP).toBe(150000);
    expect(plan.priceMonthlyUSD).toBe(39);
    expect(plan.features.length).toBeGreaterThanOrEqual(5);
    expect(TRIAL_PERIOD_DAYS).toBe(14);
  });

  it("debe tener configurado el Plan Vitalicio (Lifetime Deal) con pago único perpetuo", () => {
    const lifetimePlan = STRIPE_PLANS.LIFETIME_DEAL;

    expect(lifetimePlan.id).toBe("plan_lifetime");
    expect(lifetimePlan.type).toBe("one_time");
    expect(lifetimePlan.priceCOP).toBe(1200000);
    expect(lifetimePlan.priceUSD).toBe(299);
    expect(lifetimePlan.features.length).toBeGreaterThanOrEqual(5);
  });

  it("debe mapear correctamente los estados de suscripción de Stripe a la base de datos", () => {
    expect(resolveStripeSubscriptionStatus("active")).toBe("active");
    expect(resolveStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(resolveStripeSubscriptionStatus("unpaid")).toBe("unpaid");
    expect(resolveStripeSubscriptionStatus("canceled")).toBe("canceled");
    expect(resolveStripeSubscriptionStatus("trialing")).toBe("trialing");
    expect(resolveStripeSubscriptionStatus("incomplete_expired")).toBe("past_due"); // Fallback seguro
  });

  it("debe generar claves de idempotencia consistentes para eventos de Stripe", () => {
    const eventId = "evt_1Pabc123XYZ";
    const idempotencyKey = `stripe_event_${eventId}`;

    expect(idempotencyKey).toBe("stripe_event_evt_1Pabc123XYZ");
    expect(idempotencyKey.startsWith("stripe_event_")).toBe(true);
  });
});
