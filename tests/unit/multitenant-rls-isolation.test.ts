import { describe, it, expect } from "vitest";

export interface EmpresaTenant {
  id: string;
  nombre: string;
  slug: string;
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trialEndsAt: Date;
  planId: string;
}

export function evaluateTenantAccess(tenant: EmpresaTenant, now: Date = new Date()): {
  canRead: boolean;
  canMutate: boolean;
  isReadOnly: boolean;
  daysLeftInTrial: number;
} {
  const isTrial = tenant.subscriptionStatus === 'trialing';
  const msDiff = tenant.trialEndsAt.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  const isTrialActive = isTrial && daysLeft > 0;

  if (tenant.subscriptionStatus === 'active') {
    return { canRead: true, canMutate: true, isReadOnly: false, daysLeftInTrial: 0 };
  }

  if (isTrialActive) {
    return { canRead: true, canMutate: true, isReadOnly: false, daysLeftInTrial: daysLeft };
  }

  // Grace Period / Modo Solo Lectura (past_due, trial vencido, canceled, unpaid)
  return { canRead: true, canMutate: false, isReadOnly: true, daysLeftInTrial: 0 };
}

describe("Arquitectura Multi-Tenant: Aislamiento y Ciclo de Vida de Suscripción (Ground Truth)", () => {
  it("debe permitir lectura y mutación completa durante el periodo de prueba de 14 días", () => {
    const now = new Date("2026-09-01T12:00:00Z");
    const trialEnds = new Date("2026-09-15T12:00:00Z"); // 14 días después

    const tenant: EmpresaTenant = {
      id: "tenant-uuid-1",
      nombre: "Ferretería La Principal",
      slug: "ferreteria-la-principal",
      subscriptionStatus: "trialing",
      trialEndsAt: trialEnds,
      planId: "plan_monthly_flat",
    };

    const access = evaluateTenantAccess(tenant, now);

    expect(access.canRead).toBe(true);
    expect(access.canMutate).toBe(true);
    expect(access.isReadOnly).toBe(false);
    expect(access.daysLeftInTrial).toBe(14);
  });

  it("debe activar automáticamente el Modo Solo Lectura si el trial de 14 días expira", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    const trialEnds = new Date("2026-09-15T12:00:00Z"); // Ya expiró ayer

    const tenant: EmpresaTenant = {
      id: "tenant-uuid-2",
      nombre: "Equipos El Roble",
      slug: "equipos-el-roble",
      subscriptionStatus: "trialing",
      trialEndsAt: trialEnds,
      planId: "plan_monthly_flat",
    };

    const access = evaluateTenantAccess(tenant, now);

    expect(access.canRead).toBe(true); // Puede seguir viendo contratos e imprimiendo PDFs
    expect(access.canMutate).toBe(false); // No puede crear nuevos alquileres
    expect(access.isReadOnly).toBe(true);
    expect(access.daysLeftInTrial).toBe(0);
  });

  it("debe permitir acceso total ilimitado cuando la suscripción en Stripe esté activa ('active')", () => {
    const tenant: EmpresaTenant = {
      id: "tenant-uuid-3",
      nombre: "FerreOn Global SAS",
      slug: "ferreon-global",
      subscriptionStatus: "active",
      trialEndsAt: new Date("2026-01-01"),
      planId: "plan_monthly_flat",
    };

    const access = evaluateTenantAccess(tenant);

    expect(access.canRead).toBe(true);
    expect(access.canMutate).toBe(true);
    expect(access.isReadOnly).toBe(false);
  });

  it("debe aislar estrictamente los registros entre dos empresas distintas (Tenant A vs Tenant B)", () => {
    const mockDbClientes = [
      { id: 1, nombre: "Cliente de Empresa A", empresa_id: "tenant-uuid-A" },
      { id: 2, nombre: "Cliente de Empresa B", empresa_id: "tenant-uuid-B" },
    ];

    const currentTenantId = "tenant-uuid-A";

    // Simulación de la regla RLS: WHERE empresa_id = get_current_tenant_id()
    const rlsFiltered = mockDbClientes.filter(c => c.empresa_id === currentTenantId);

    expect(rlsFiltered).toHaveLength(1);
    expect(rlsFiltered[0].nombre).toBe("Cliente de Empresa A");
    expect(rlsFiltered.some(c => c.empresa_id === "tenant-uuid-B")).toBe(false);
  });
});
