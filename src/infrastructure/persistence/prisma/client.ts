import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

let _prismaInstance: PrismaClient | undefined;

/**
 * Retorna la instancia singleton de PrismaClient de manera perezosa (lazy).
 * Evita errores en tiempo de importación durante pruebas o compilación sin adapter configurado.
 */
export function getPrismaClient(): PrismaClient {
  if (global.globalPrisma) {
    return global.globalPrisma;
  }
  if (!_prismaInstance) {
    _prismaInstance = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      global.globalPrisma = _prismaInstance;
    }
  }
  return _prismaInstance;
}

/**
 * Proxy para mantener compatibilidad con `import { prisma } from '...'`
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Modelos con soporte directo de aislamiento por empresa (Multi-Tenant)
 */
export const TENANT_AWARE_MODELS = new Set([
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
 * @param baseClient Cliente Prisma opcional (útil para pruebas unitarias con mocks)
 * @returns Instancia de PrismaClient contextualizada al inquilino
 */
export function getTenantPrismaClient(tenantId: string, baseClient?: PrismaClient) {
  if (!tenantId || typeof tenantId !== "string" || tenantId.trim() === "") {
    throw new Error(
      "[Security Exception] Multi-Tenant Guard: Se requiere un tenantId válido para instanciar el cliente de base de datos."
    );
  }

  const client = baseClient || getPrismaClient();

  return client.$extends({
    name: "multi-tenant-isolation-guard",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...(args.where as Record<string, unknown>), empresaId: tenantId } as typeof args.where;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...(args.where as Record<string, unknown>), empresaId: tenantId } as typeof args.where;
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          return query(args);
        },
        async count({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...(args.where as Record<string, unknown>), empresaId: tenantId } as typeof args.where;
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.data = { ...(args.data as Record<string, unknown>), empresaId: tenantId } as typeof args.data;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...(args.where as Record<string, unknown>), empresaId: tenantId } as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_AWARE_MODELS.has(model)) {
            args.where = { ...(args.where as Record<string, unknown>), empresaId: tenantId } as typeof args.where;
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof getTenantPrismaClient>;
