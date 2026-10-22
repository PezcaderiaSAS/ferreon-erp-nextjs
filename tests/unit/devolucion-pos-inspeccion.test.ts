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
});
