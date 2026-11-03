import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  procesarDevolucionPosAction,
  ProcesarDevolucionPosInput,
} from '../../src/app/actions/alquileres';
import { ProcesarDevolucionPosZodSchema } from '@/core/domain/schemas/posSchemas';
import { AuditLogger } from '@/lib/security/audit-logger';

// Mock de resultado RPC
let mockRpcResult: { data: any; error: any } = {
  data: {
    success: true,
    devolucion_id: 'dev-pos-uuid-001',
    consecutivo: 'DEV-POS-20261022-7712',
    alquiler_id: 880,
    total_danos: 25000,
    total_reposiciones: 0,
    deposito_aplicado: 100000,
    saldo_neto: 75000,
    tipo_resolucion: 'REEMBOLSO_CLIENTE',
    movimiento_caja_id: 'mov-caja-egreso-dev-01',
    sesion_caja_id: 'sesion-caja-activa-01',
    contrato_cerrado: true,
    mensaje: 'Devolución e inspección POS procesada exitosamente.',
  },
  error: null,
};

let mockCurrentUser: any = { id: 'usr-bodeguero-pos', email: 'bodega@ferreon.com' };

const createMockQueryBuilder = (resultData: any = {}) => {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(async () => ({ data: resultData, error: null })),
    maybeSingle: vi.fn(async () => ({ data: resultData, error: null })),
  };
  return builder;
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: mockCurrentUser },
    })),
  },
  from: vi.fn((table: string) => createMockQueryBuilder({ id: 'dummy-row-id', estado: 'ABIERTA', empresa_id: 'tenant-devoluciones-123' })),
  rpc: vi.fn(async (fnName: string, args: any) => mockRpcResult),
};

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  createAdminSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-devoluciones-123'),
}));

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  createAdminSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-devoluciones-123'),
}));

vi.mock('../../src/lib/redis', () => ({
  invalidateTenantCache: vi.fn(async () => true),
}));

vi.spyOn(AuditLogger, 'logAsync').mockImplementation(() => {});

describe('Suite TDD: TASK-010-16 — Devolución POS con Checklist de Averías & Liquidación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { id: 'usr-bodeguero-pos', email: 'bodega@ferreon.com' };
    mockRpcResult = {
      data: {
        success: true,
        devolucion_id: 'dev-pos-uuid-001',
        consecutivo: 'DEV-POS-20261022-7712',
        alquiler_id: 880,
        total_danos: 25000,
        total_reposiciones: 0,
        deposito_aplicado: 100000,
        saldo_neto: 75000,
        tipo_resolucion: 'REEMBOLSO_CLIENTE',
        movimiento_caja_id: 'mov-caja-egreso-dev-01',
        sesion_caja_id: 'sesion-caja-activa-01',
        contrato_cerrado: true,
        mensaje: 'Devolución e inspección POS procesada exitosamente.',
      },
      error: null,
    };
  });

  describe('1. Validación Zod de Entrada (ProcesarDevolucionPosZodSchema)', () => {
    it('debe validar y normalizar la recepción con semáforo táctil y desglose de averías', () => {
      const input = {
        alquilerId: '880',
        metodoPago: 'EFECTIVO',
        observaciones: 'Recepción Mostrador Central',
        items: [
          {
            detalleId: '1051',
            cantidadDevuelta: '2',
            semaforo: 'AMARILLO_SUCIO',
            costoLimpieza: '15000',
            costoReparacion: '0',
            descripcionDano: 'Lavado por barro de obra',
          },
        ],
      };

      const result = ProcesarDevolucionPosZodSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alquilerId).toBe(880);
        expect(result.data.items[0].detalleId).toBe(1051);
        expect(result.data.items[0].cantidadDevuelta).toBe(2);
        expect(result.data.items[0].semaforo).toBe('AMARILLO_SUCIO');
        expect(result.data.items[0].costoLimpieza).toBe(15000);
      }
    });

    it('debe rechazar si no se envía ningún equipo a devolver', () => {
      const input = {
        alquilerId: 880,
        items: [],
      };

      const result = ProcesarDevolucionPosZodSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('al menos un equipo');
      }
    });

    it('debe aplicar defaults en semaforo VERDE_BUENO y costos en cero', () => {
      const input = {
        alquilerId: 880,
        items: [
          {
            detalleId: 1052,
            cantidadDevuelta: 1,
          },
        ],
      };

      const result = ProcesarDevolucionPosZodSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items[0].semaforo).toBe('VERDE_BUENO');
        expect(result.data.items[0].costoLimpieza).toBe(0);
        expect(result.data.items[0].costoReparacion).toBe(0);
        expect(result.data.items[0].valorReposicion).toBe(0);
      }
    });
  });

  describe('2. Liquidación Transaccional de Devolución & Cruce de Garantía', () => {
    it('debe liquidar con reembolso a favor del cliente cuando el depósito excede los cargos', async () => {
      const input: ProcesarDevolucionPosInput = {
        alquilerId: 880,
        metodoPago: 'EFECTIVO',
        items: [
          {
            detalleId: 1051,
            cantidadDevuelta: 2,
            semaforo: 'AMARILLO_SUCIO',
            costoLimpieza: 25000,
          },
        ],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(true);
      expect(resp.data?.tipo_resolucion).toBe('REEMBOLSO_CLIENTE');
      expect(resp.data?.saldo_neto).toBe(75000);
      expect(resp.data?.contrato_cerrado).toBe(true);

      // Verificar invocación a la RPC
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'devolucion_pos_inspeccion_rapida_v1',
        expect.objectContaining({
          p_payload: expect.objectContaining({
            alquiler_id: 880,
            metodo_pago: 'EFECTIVO',
            items: expect.arrayContaining([
              expect.objectContaining({
                detalle_id: 1051,
                cantidad_devuelta: 2,
                semaforo: 'AMARILLO_SUCIO',
                costo_limpieza: 25000,
              }),
            ]),
          }),
        })
      );

      // Verificar Auditoría Inmutable
      expect(AuditLogger.logAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          modulo: 'DEVOLUCIONES',
          accion: 'PROCESAR_DEVOLUCION_AVANZADA',
          entidadId: '880',
        })
      );
    });

    it('debe liquidar con cobro al cliente cuando los daños superan el depósito (COBRO_CLIENTE)', async () => {
      mockRpcResult = {
        data: {
          success: true,
          devolucion_id: 'dev-pos-uuid-002',
          consecutivo: 'DEV-POS-20261022-8819',
          alquiler_id: 880,
          total_danos: 120000,
          total_reposiciones: 0,
          deposito_aplicado: 50000,
          saldo_neto: -70000,
          tipo_resolucion: 'COBRO_CLIENTE',
          movimiento_caja_id: 'mov-caja-ingreso-cobro-02',
          sesion_caja_id: 'sesion-caja-activa-01',
          contrato_cerrado: true,
          mensaje: 'Devolución e inspección POS procesada exitosamente.',
        },
        error: null,
      };

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 880,
        metodoPago: 'TARJETA',
        items: [
          {
            detalleId: 1052,
            cantidadDevuelta: 1,
            semaforo: 'NARANJA_DANADO',
            costoReparacion: 120000,
            descripcionDano: 'Cambio de inducido y rodamientos',
          },
        ],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(true);
      expect(resp.data?.tipo_resolucion).toBe('COBRO_CLIENTE');
      expect(resp.data?.saldo_neto).toBe(-70000);
      expect(resp.data?.total_danos).toBe(120000);
    });
  });

  describe('3. Manejo de Errores Transaccionales', () => {
    it('debe rechazar devoluciones sobre contratos ya finalizados (ERR_CONTRATO_CERRADO)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0003',
          message: 'ERR_CONTRATO_CERRADO: El contrato ya se encuentra en estado FINALIZADO.',
        },
      };

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 880,
        items: [{ detalleId: 1051, cantidadDevuelta: 1 }],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_CONTRATO_CERRADO');
    });

    it('debe rechazar si la cantidad a devolver excede las unidades pendientes (ERR_CANTIDAD_EXCEDE_PENDIENTE)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0006',
          message: 'ERR_CANTIDAD_EXCEDE_PENDIENTE: No puede devolver 5 unidades; pendientes: 2.',
        },
      };

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 880,
        items: [{ detalleId: 1051, cantidadDevuelta: 5 }],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_CANTIDAD_EXCEDE_PENDIENTE');
    });

    it('debe rechazar si la línea de detalle no existe en el contrato (ERR_DETALLE_NOT_FOUND)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0005',
          message: 'ERR_DETALLE_NOT_FOUND: Detalle ID 99999 no pertenece al contrato 880.',
        },
      };

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 880,
        items: [{ detalleId: 99999, cantidadDevuelta: 1 }],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(false);
      expect(resp.error).toContain('ERR_DETALLE_NOT_FOUND');
    });
  });

  describe('4. Resiliencia, Normalización de Semáforos & Fallback Automático', () => {
    it('debe ejecutar fallback a procesar_devolucion_avanzada si devolucion_pos_inspeccion_rapida_v1 falla con error de columna inexistente (42703)', async () => {
      // Simular fallo en RPC rápida por desalineación de columnas en Postgres
      mockSupabaseClient.rpc.mockImplementation(async (fnName: string, args: any) => {
        if (fnName === 'devolucion_pos_inspeccion_rapida_v1') {
          return {
            data: null,
            error: {
              code: '42703',
              message: 'column "desglose_averias" of relation "alquiler_detalles" does not exist',
            },
          };
        }
        if (fnName === 'procesar_devolucion_avanzada') {
          return {
            data: {
              success: true,
              finalizado: true,
              consecutivo: 'DEV-20261103-9999',
              saldo_neto: 50000,
              tipo_resolucion: 'REEMBOLSO_CLIENTE',
              total_danos: 15000,
              devolucion_id: 'dev-fallback-uuid-001',
            },
            error: null,
          };
        }
        return { data: null, error: new Error('Unknown RPC') };
      });

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 53,
        metodoPago: 'EFECTIVO',
        items: [
          {
            detalleId: 1205,
            cantidadDevuelta: 3,
            semaforo: 'AMARILLO_SUCIO',
            costoLimpieza: 15000,
          },
        ],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(true);
      expect(resp.data?.consecutivo).toBe('DEV-20261103-9999');
      expect(resp.data?.contrato_cerrado).toBe(true);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('procesar_devolucion_avanzada', expect.any(Object));
    });

    it('debe normalizar semáforos táctiles a estados canónicos de dominio compatibles con el CHECK constraint', async () => {
      let capturedPayload: any = null;
      mockSupabaseClient.rpc.mockImplementation(async (fnName: string, args: any) => {
        if (fnName === 'procesar_devolucion_avanzada') {
          capturedPayload = args.p_payload;
          return {
            data: {
              success: true,
              finalizado: false,
              consecutivo: 'DEV-20261103-8888',
              saldo_neto: 0,
              tipo_resolucion: 'SIN_SALDO',
              devolucion_id: 'dev-uuid-norm-01',
            },
            error: null,
          };
        }
        // Simular que RPC rápida no está disponible
        return {
          data: null,
          error: { code: '42703', message: 'column error' },
        };
      });

      const input: ProcesarDevolucionPosInput = {
        alquilerId: 63,
        items: [
          { detalleId: 1128, cantidadDevuelta: 1, semaforo: 'VERDE_BUENO', costoLimpieza: 0 },
          { detalleId: 1130, cantidadDevuelta: 2, semaforo: 'AMARILLO_SUCIO', costoLimpieza: 20000 },
          { detalleId: 1132, cantidadDevuelta: 1, semaforo: 'NARANJA_DANADO', costoReparacion: 45000 },
          { detalleId: 1134, cantidadDevuelta: 1, semaforo: 'ROJO_PERDIDA', valorReposicion: 180000 },
        ],
      };

      const resp = await procesarDevolucionPosAction(input);

      expect(resp.success).toBe(true);
      expect(capturedPayload).not.toBeNull();
      // Verificar mapeo canónico
      expect(capturedPayload.items[0].estado_inspeccion).toBe('BUENO');
      expect(capturedPayload.items[1].estado_inspeccion).toBe('BUENO');
      expect(capturedPayload.items[1].costo_reparacion).toBe(20000); // limpieza sumada a reparación
      expect(capturedPayload.items[2].estado_inspeccion).toBe('MANTENIMIENTO');
      expect(capturedPayload.items[2].costo_reparacion).toBe(45000);
      expect(capturedPayload.items[3].estado_inspeccion).toBe('PERDIDA_TOTAL');
      expect(capturedPayload.items[3].valor_reposicion).toBe(180000);
    });
  });
});
