import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aprobarCotizacionAction, registrarAbonoAction } from '@/app/actions/alquileres';
import { obtenerCotizacionPorIdAction } from '@/app/actions/cotizaciones';
import { obtenerComprasAction } from '@/app/actions/compras';
import { actualizarProveedorAction } from '@/app/actions/proveedores';
import { registrarAbonoProveedorAction } from '@/app/actions/cuentas-por-pagar';
import { obtenerConfiguracionEmpresaAction } from '@/app/actions/empresa';

// ============================================================================
// CONSTANTES DE PRUEBA: DOS EMPRESAS INDEPENDIENTES (TENANT ISOLATION)
// ============================================================================
const TENANT_ALPHA = '11111111-1111-4111-8111-111111111111';
const TENANT_BETA  = '22222222-2222-4222-8222-222222222222';

const CXP_ALPHA_ID = '88888888-8888-4888-8888-888888888888';
const CXP_BETA_ID  = '99999999-9999-4999-8999-999999999999';

const CAJA_ALPHA_ID = 'aaaa1111-1111-4111-8111-111111111111';
const CAJA_BETA_ID  = 'bbbb2222-2222-4222-8222-222222222222';

let currentSessionTenant = TENANT_BETA;
let currentUser = {
  id: 'user-beta-001',
  email: 'operador@beta-corp.com'
};

// ============================================================================
// MOCKS DE INFRAESTRUCTURA NEXT.JS & CACHÉ
// ============================================================================
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

vi.mock('@/lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
  getTenantCache: vi.fn().mockResolvedValue(null),
  setTenantCache: vi.fn().mockResolvedValue(true),
  getCachedData: vi.fn().mockResolvedValue(null),
  setCachedData: vi.fn().mockResolvedValue(true),
  redis: null,
}));

vi.mock('../../lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
  getTenantCache: vi.fn().mockResolvedValue(null),
  setTenantCache: vi.fn().mockResolvedValue(true),
  getCachedData: vi.fn().mockResolvedValue(null),
  setCachedData: vi.fn().mockResolvedValue(true),
  redis: null,
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    logAsync: vi.fn().mockReturnValue(undefined),
  }
}));

// ============================================================================
// BASE DE DATOS EN MEMORIA MULTI-TENANT SIMULADA
// ============================================================================
interface DBStore {
  empresas: any[];
  cotizaciones: any[];
  alquileres: any[];
  compras: any[];
  proveedores: any[];
  proveedor_cuentas_pagar: any[];
  sesiones_caja: any[];
}

let dbStore: DBStore = {
  empresas: [
    { id: TENANT_ALPHA, nombre: 'Empresa Alpha S.A.S', nit: '900111222-1' },
    { id: TENANT_BETA, nombre: 'Empresa Beta Ltda', nit: '900333444-2' }
  ],
  cotizaciones: [
    { id: 'cot-alpha-100', consecutivo: 'COT-001', empresa_id: TENANT_ALPHA, estado: 'PENDIENTE', total: 500000 },
    { id: 'cot-beta-200', consecutivo: 'COT-002', empresa_id: TENANT_BETA, estado: 'PENDIENTE', total: 300000 }
  ],
  alquileres: [
    { id: 'alq-alpha-101', numero: 'ALQ-001', empresa_id: TENANT_ALPHA, saldo_pendiente: 200000, estado: 'ACTIVO' },
    { id: 'alq-beta-201', numero: 'ALQ-002', empresa_id: TENANT_BETA, saldo_pendiente: 150000, estado: 'ACTIVO' }
  ],
  compras: [
    { id: 'comp-alpha-501', consecutivo: 'COM-001', empresa_id: TENANT_ALPHA, total: 1000000, items_compra: [] },
    { id: 'comp-beta-502', consecutivo: 'COM-002', empresa_id: TENANT_BETA, total: 800000, items_compra: [] }
  ],
  proveedores: [
    { id: 'prov-alpha-701', nombre: 'Proveedor Alpha', empresa_id: TENANT_ALPHA, nit: '123' },
    { id: 'prov-beta-702', nombre: 'Proveedor Beta', empresa_id: TENANT_BETA, nit: '456' }
  ],
  proveedor_cuentas_pagar: [
    { id: CXP_ALPHA_ID, empresa_id: TENANT_ALPHA, saldo_pendiente: 500000, monto_total: 500000, estado: 'PENDIENTE' },
    { id: CXP_BETA_ID, empresa_id: TENANT_BETA, saldo_pendiente: 300000, monto_total: 300000, estado: 'PENDIENTE' }
  ],
  sesiones_caja: [
    { id: CAJA_ALPHA_ID, empresa_id: TENANT_ALPHA, estado: 'ABIERTA', monto_apertura: 100000 },
    { id: CAJA_BETA_ID, empresa_id: TENANT_BETA, estado: 'ABIERTA', monto_apertura: 50000 }
  ]
};

// Generador de Supabase Query Builder mockeado en memoria
function createMockSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({
        data: { user: currentUser },
        error: null
      })
    },
    from: (table: string) => {
      let filteredData = [...((dbStore as any)[table] || [])];
      let selectedFields = '*';

      const builder: any = {
        select: (fields = '*') => {
          selectedFields = fields;
          return builder;
        },
        eq: (col: string, val: any) => {
          filteredData = filteredData.filter((row: any) => row[col] === val);
          return builder;
        },
        neq: (col: string, val: any) => {
          filteredData = filteredData.filter((row: any) => row[col] !== val);
          return builder;
        },
        or: (conditionStr: string) => {
          const matches = conditionStr.match(/([a-z_]+)\.eq\.([^,]+)/g);
          if (matches) {
            filteredData = filteredData.filter((row: any) => {
              return matches.some(m => {
                const parts = m.split('.eq.');
                const col = parts[0];
                const v = parts[1];
                return row[col] === v;
              });
            });
          }
          return builder;
        },
        order: (col: string, options?: any) => {
          return builder;
        },
        limit: (n: number) => {
          filteredData = filteredData.slice(0, n);
          return builder;
        },
        single: async () => {
          const item = filteredData[0];
          return {
            data: item || null,
            error: item ? null : { message: 'Row not found', code: 'PGRST116' }
          };
        },
        maybeSingle: async () => {
          const item = filteredData[0];
          return { data: item || null, error: null };
        },
        update: (values: any) => {
          const updateBuilder: any = {
            eq: (col: string, val: any) => {
              filteredData = filteredData.filter((row: any) => row[col] === val);
              return updateBuilder;
            },
            or: (conditionStr: string) => {
              const matches = conditionStr.match(/([a-z_]+)\.eq\.([^,]+)/g);
              if (matches) {
                filteredData = filteredData.filter((row: any) => {
                  return matches.some(m => {
                    const parts = m.split('.eq.');
                    return row[parts[0]] === parts[1];
                  });
                });
              }
              return updateBuilder;
            },
            then: (resolve: any) => {
              filteredData.forEach(row => {
                Object.assign(row, values);
              });
              resolve({ data: filteredData, error: null });
            }
          };
          return updateBuilder;
        },
        insert: async (rows: any | any[]) => {
          const list = Array.isArray(rows) ? rows : [rows];
          if (!(dbStore as any)[table]) {
            (dbStore as any)[table] = [];
          }
          (dbStore as any)[table].push(...list);
          return { data: list, error: null };
        },
        then: (resolve: any) => {
          resolve({ data: filteredData, error: null });
        }
      };

      return builder;
    }
  };
}

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  DEFAULT_EMPRESA_ID: 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  resolveEmpresaId: async () => currentSessionTenant,
  createServerSupabaseClient: async () => createMockSupabaseClient(),
  createAdminSupabaseClient: () => createMockSupabaseClient(),
}));

vi.mock('../../infrastructure/persistence/supabase/server', () => ({
  DEFAULT_EMPRESA_ID: 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  resolveEmpresaId: async () => currentSessionTenant,
  createServerSupabaseClient: async () => createMockSupabaseClient(),
  createAdminSupabaseClient: () => createMockSupabaseClient(),
}));

vi.mock('@/infrastructure/persistence/supabase/admin', () => ({
  createAdminSupabaseClient: () => createMockSupabaseClient(),
  supabaseAdmin: createMockSupabaseClient()
}));

// ============================================================================
// SUITE DE CERTIFICACIÓN DE AISLAMIENTO MULTI-TENANT
// ============================================================================
describe('Suite de Seguridad: Aislamiento Estricto Multi-Tenant (SPEC-009)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSessionTenant = TENANT_BETA;
    currentUser = {
      id: 'user-beta-001',
      email: 'operador@beta-corp.com'
    };

    dbStore = {
      empresas: [
        { id: TENANT_ALPHA, nombre: 'Empresa Alpha S.A.S', nit: '900111222-1' },
        { id: TENANT_BETA, nombre: 'Empresa Beta Ltda', nit: '900333444-2' }
      ],
      cotizaciones: [
        { id: 'cot-alpha-100', consecutivo: 'COT-001', empresa_id: TENANT_ALPHA, estado: 'PENDIENTE', total: 500000 },
        { id: 'cot-beta-200', consecutivo: 'COT-002', empresa_id: TENANT_BETA, estado: 'PENDIENTE', total: 300000 }
      ],
      alquileres: [
        { id: 'alq-alpha-101', numero: 'ALQ-001', empresa_id: TENANT_ALPHA, saldo_pendiente: 200000, estado: 'ACTIVO' },
        { id: 'alq-beta-201', numero: 'ALQ-002', empresa_id: TENANT_BETA, saldo_pendiente: 150000, estado: 'ACTIVO' }
      ],
      compras: [
        { id: 'comp-alpha-501', consecutivo: 'COM-001', empresa_id: TENANT_ALPHA, total: 1000000, items_compra: [] },
        { id: 'comp-beta-502', consecutivo: 'COM-002', empresa_id: TENANT_BETA, total: 800000, items_compra: [] }
      ],
      proveedores: [
        { id: 'prov-alpha-701', nombre: 'Proveedor Alpha', empresa_id: TENANT_ALPHA, nit: '123' },
        { id: 'prov-beta-702', nombre: 'Proveedor Beta', empresa_id: TENANT_BETA, nit: '456' }
      ],
      proveedor_cuentas_pagar: [
        { id: CXP_ALPHA_ID, empresa_id: TENANT_ALPHA, saldo_pendiente: 500000, monto_total: 500000, estado: 'PENDIENTE' },
        { id: CXP_BETA_ID, empresa_id: TENANT_BETA, saldo_pendiente: 300000, monto_total: 300000, estado: 'PENDIENTE' }
      ],
      sesiones_caja: [
        { id: CAJA_ALPHA_ID, empresa_id: TENANT_ALPHA, estado: 'ABIERTA', monto_apertura: 100000 },
        { id: CAJA_BETA_ID, empresa_id: TENANT_BETA, estado: 'ABIERTA', monto_apertura: 50000 }
      ]
    };
  });

  it('AISLAMIENTO-01: Usuario de Tenant Beta NO puede ver cotización de Tenant Alpha', async () => {
    const res = await obtenerCotizacionPorIdAction('cot-alpha-100');
    expect(res.success).toBe(false);
    expect(res.data).toBeUndefined();
    expect(res.error).toMatch(/no encontrada|no existe/i);
  });

  it('AISLAMIENTO-02: Usuario de Tenant Beta NO puede aprobar cotización de Tenant Alpha', async () => {
    const res = await aprobarCotizacionAction({ alquilerId: 'cot-alpha-100' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no encontrada|no tienes permiso/i);

    const cotAlpha = dbStore.cotizaciones.find(c => c.id === 'cot-alpha-100');
    expect(cotAlpha?.estado).toBe('PENDIENTE');
  });

  it('AISLAMIENTO-03: Usuario de Tenant Beta NO puede registrar abono en alquiler de Tenant Alpha', async () => {
    const res = await registrarAbonoAction({
      alquilerId: 'alq-alpha-101',
      montoAbono: 50000,
      metodoPago: 'EFECTIVO'
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no pertenece a su empresa/i);

    const alqAlpha = dbStore.alquileres.find(a => a.id === 'alq-alpha-101');
    expect(alqAlpha?.saldo_pendiente).toBe(200000);
  });

  it('AISLAMIENTO-04: obtenerComprasAction retorna estrictamente las compras de Tenant Beta', async () => {
    const res = await obtenerComprasAction();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.length).toBe(1);
    expect(res.data?.[0].id).toBe('comp-beta-502');
    expect(res.data?.find((c: any) => c.empresa_id === TENANT_ALPHA)).toBeUndefined();
  });

  it('AISLAMIENTO-05: Usuario de Tenant Beta NO puede modificar proveedores de Tenant Alpha', async () => {
    const res = await actualizarProveedorAction('prov-alpha-701', {
      nombre: 'HACKED PROVEEDOR'
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no existe o no pertenece a su empresa/i);

    const provAlpha = dbStore.proveedores.find(p => p.id === 'prov-alpha-701');
    expect(provAlpha?.nombre).toBe('Proveedor Alpha');
  });

  it('AISLAMIENTO-06: Usuario de Tenant Beta NO puede abonar a CXP de Tenant Alpha', async () => {
    const res = await registrarAbonoProveedorAction({
      cuentaPagarId: CXP_ALPHA_ID,
      montoAbono: 10000,
      metodoPago: 'EFECTIVO'
    });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/no existe, no pertenece a su empresa/i);
  });

  it('AISLAMIENTO-07: Configuración de empresa no entrega datos de otra empresa si el tenant no coincide', async () => {
    currentSessionTenant = '00000000-0000-0000-0000-000000000000';
    const res = await obtenerConfiguracionEmpresaAction();
    expect(res.success).toBe(true);
    // Debe entregar el default seguro y NUNCA los datos de Alpha ni de Beta
    expect(res.config?.razonSocial).not.toBe('Empresa Alpha S.A.S');
    expect(res.config?.razonSocial).not.toBe('Empresa Beta Ltda');
  });
});
