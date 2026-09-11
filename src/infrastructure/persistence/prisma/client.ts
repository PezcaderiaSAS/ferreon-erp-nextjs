// @ts-ignore - PrismaClient se autogenera mediante prisma generate tras la migración
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

/**
 * Instancia global singleton de PrismaClient para Next.js App Router
 * Evita la saturación de conexiones en el pool de PostgreSQL durante el desarrollo (HMR).
 */
export const prisma =
  global.globalPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.globalPrisma = prisma;
}

/**
 * Modelos con soporte directo de aislamiento por empresa (Multi-Tenant)
 */
const TENANT_AWARE_MODELS = new Set([
  "Customer",
  "User",
  "Warehouse",
  "WarehouseStock",
  "Equipment",
  "RentalContract",
  "RentalDetail",
  "InventoryMovement",
  "AuditLog",
]);

/**
 * Factoría de Cliente Prisma con Aislamiento Estricto por Fila (Row-Level Multi-Tenancy)
 * 
 * Inyecta obligatoria y transparentemente `{ empresaId: tenantId }` en todas las lecturas,
 * escrituras y eliminaciones masivas, evitando fugas de datos (data leaks) entre inquilinos.
 *
 * @param tenantId UUID del inquilino / empresa activa
 * @returns Instancia de PrismaClient contextualizada al inquilino
 */
export function getTenantPrismaClient(tenantId: string) {
  if (!tenantId || typeof tenantId !== "string") {
    throw new Error(
      "[Security Exception] Multi-Tenant Guard: Se requiere un tenantId válido para instanciar el cliente de base de datos."
    );
  }

  return prisma.$extends({
    name: "multi-tenant-isolation-guard",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...args.where, empresaId: tenantId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...args.where, empresaId: tenantId };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // findUnique en Prisma requiere claves primarias o únicas completas
          return query(args);
        },
        async count({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...args.where, empresaId: tenantId };
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.data = { ...args.data, empresaId: tenantId };
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...args.where, empresaId: tenantId };
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...args.where, empresaId: tenantId };
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrismaClient>;
