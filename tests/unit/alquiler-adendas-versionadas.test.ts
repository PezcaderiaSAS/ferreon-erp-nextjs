import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generarAdendaContratoAction,
  GenerarAdendaContratoZodSchema,
  GenerarAdendaContratoInput,
} from '../../src/app/actions/alquileres';
import { AuditLogger } from '@/lib/security/audit-logger';

// Mock de resultado RPC
let mockRpcResult: { data: any; error: any } = {
  data: {
    success: true,
    adenda_id: 'adenda-uuid-001',
    numero_version: 'v1.1',
    alquiler_id: 880,
    consecutivo: 215,
    monto_adicional: 120000,
    nuevo_total: 620000,
    nuevo_saldo_pendiente: 320000,
    movimiento_caja_id: 'mov-caja-adenda-001',
    sesion_caja_id: 'sesion-caja-activa-01',
    mensaje: 'Adenda v1.1 generada exitosamente in-place.',
  },
  error: null,
};

let mockCurrentUser: any = { id: 'usr-admin-pos', email: 'admin@ferreon.com' };

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: mockCurrentUser },
    })),
  },
  rpc: vi.fn(async (fnName: string, args: any) => mockRpcResult),
};

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  createAdminSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-adendas-empresa-123'),
}));

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  createAdminSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-adendas-empresa-123'),
}));

vi.mock('../../src/lib/redis', () => ({
  invalidateTenantCache: vi.fn(async () => true),
}));

vi.spyOn(AuditLogger, 'logAsync').mockImplementation(() => {});

describe('Suite TDD: TASK-010-12 — Edición In-Place y Control de Adendas Versionadas (v1.0 -> v1.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { id: 'usr-admin-pos', email: 'admin@ferreon.com' };
    mockRpcResult = {
      data: {
        success: true,
        adenda_id: 'adenda-uuid-001',
        numero_version: 'v1.1',
        alquiler_id: 880,
        consecutivo: 215,
        monto_adicional: 120000,
        nuevo_total: 620000,
        nuevo_saldo_pendiente: 320000,
        movimiento_caja_id: 'mov-caja-adenda-001',
        sesion_caja_id: 'sesion-caja-activa-01',
        mensaje: 'Adenda v1.1 generada exitosamente in-place.',
      },
      error: null,
    };
  });

  describe('1. Validación Zod de Entrada (GenerarAdendaContratoZodSchema)', () => {
    it('debe validar y normalizar una adenda con prórroga y adición de equipos', () => {
      const input = {
        alquilerId: '880',
        motivo: 'PRORROGA',
        diasAdicionales: '7',
        montoDepositoAdicional: '50000',
        metodoPago: 'EFECTIVO',
        observaciones: 'Prórroga de obra sector Norte',
        items: [
          {
            equipoId: '101',
            cantidad: '2',
            tarifaAplicada: '40000',
            diasCobro: '12',
          },
        ],
      };

      const result = GenerarAdendaContratoZodSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alquilerId).toBe(880);
        expect(result.data.diasAdicionales).toBe(7);
        expect(result.data.montoDepositoAdicional).toBe(50000);
        expect(result.data.metodoPago).toBe('EFECTIVO');
        expect(result.data.items[0].equipoId).toBe(101);
        expect(result.data.items[0].cantidad).toBe(2);
      }
    });

    it('debe rechazar si la lista de items está vacía', () => {
      const input = {
        alquilerId: 880,
        motivo: 'PRORROGA',
        items: [],
      };

      const result = GenerarAdendaContratoZodSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos una línea de equipo');
      }
    });

    it('debe aplicar defaults en motivo, diasAdicionales y metodoPago', () => {
      const input = {
        alquilerId: 880,
        items: [
          {
            equipoId: 5,
            cantidad: 1,
            tarifaAplicada: 35000,
            diasCobro: 5,
          },
        ],
      };

      const result = GenerarAdendaContratoZodSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.motivo).toBe('MODIFICACION_MIXTA');
        expect(result.data.diasAdicionales).toBe(0);
        expect(result.data.montoDepositoAdicional).toBe(0);
        expect(result.data.metodoPago).toBe('EFECTIVO');
      }
    });
  });

  describe('2. Flujo Exitoso de Generación de Adenda (Server Action)', () => {
    it('debe invocar la RPC alquiler_generar_adenda_transaccional_v1 y retornar la versión v1.1', async () => {
      const input: GenerarAdendaContratoInput = {
        alquilerId: 880,
        motivo: 'PRORROGA',
        diasAdicionales: 5,
        montoDepositoAdicional: 50000,
        metodoPago: 'EFECTIVO',
        observaciones: 'Prórroga de 5 días con abono en mostrador',
        items: [
          {
            equipoId: 101,
            cantidad: 2,
            tarifaAplicada: 40000,
            diasCobro: 15,
            subtotalLinea: 1200000,
          },
        ],
      };

      const resp = await generarAdendaContratoAction(input);

      expect(resp.success).toBe(true);
      expect(resp.data?.numero_version).toBe('v1.1');
      expect(resp.data?.monto_adicional).toBe(120000);
      expect(resp.data?.nuevo_total).toBe(620000);
      expect(resp.data?.movimiento_caja_id).toBe('mov-caja-adenda-001');

      // Verificar invocación RPC
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'alquiler_generar_adenda_transaccional_v1',
        expect.objectContaining({
          p_payload: expect.objectContaining({
            alquiler_id: 880,
            motivo: 'PRORROGA',
            dias_adicionales: 5,
            monto_deposito_adicional: 50000,
            metodo_pago: 'EFECTIVO',
            items: expect.arrayContaining([
              expect.objectContaining({
                equipo_id: 101,
                cantidad: 2,
                tarifa_aplicada: 40000,
                dias_contratados: 15,
              }),
            ]),
          }),
        })
      );

      // Verificar Auditoría Inmutable
      expect(AuditLogger.logAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          modulo: 'ALQUILERES',
          accion: 'GENERAR_ADENDA_ALQUILER',
          entidadId: '880',
        })
      );
    });
  });

  describe('3. Manejo de Errores Transaccionales y de Negocio', () => {
    it('debe retornar error cuando hay overbooking en equipos agregados (ERR_OVERBOOKING_ADENDA)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0006',
          message: 'ERR_OVERBOOKING_ADENDA: Stock insuficiente para equipo ID 101 en adenda. Disponibles: 1, Solicitados: 4',
        },
      };

      const input: GenerarAdendaContratoInput = {
        alquilerId: 880,
        motivo: 'ADICION_EQUIPOS',
        items: [
          {
            equipoId: 101,
            cantidad: 4,
            tarifaAplicada: 50000,
            diasCobro: 3,
          },
        ],
      };

      const resp = await generarAdendaContratoAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_OVERBOOKING_ADENDA');
      expect(resp.error).toContain('Stock insuficiente');
    });

    it('debe rechazar adendas sobre contratos cerrados o finalizados (ERR_CONTRATO_CERRADO)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0003',
          message: 'ERR_CONTRATO_CERRADO: No se pueden generar adendas sobre un contrato en estado FINALIZADO.',
        },
      };

      const input: GenerarAdendaContratoInput = {
        alquilerId: 880,
        motivo: 'PRORROGA',
        items: [
          {
            equipoId: 101,
            cantidad: 1,
            tarifaAplicada: 30000,
            diasCobro: 5,
          },
        ],
      };

      const resp = await generarAdendaContratoAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_CONTRATO_CERRADO');
    });

    it('debe rechazar si el contrato no existe (ERR_ALQUILER_NOT_FOUND)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0002',
          message: 'ERR_ALQUILER_NOT_FOUND: El contrato con ID 99999 no existe.',
        },
      };

      const input: GenerarAdendaContratoInput = {
        alquilerId: 99999,
        items: [
          {
            equipoId: 101,
            cantidad: 1,
            tarifaAplicada: 30000,
            diasCobro: 5,
          },
        ],
      };

      const resp = await generarAdendaContratoAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_ALQUILER_NOT_FOUND');
    });
  });
});
