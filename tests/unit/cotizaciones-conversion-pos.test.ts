import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  convertirCotizacionAContratoPosAction,
  ConvertirCotizacionPosInput,
} from '../../src/app/actions/cotizaciones';
import { ConvertirCotizacionPosZodSchema } from '@/core/domain/schemas/posSchemas';
import { AuditLogger } from '@/lib/security/audit-logger';

// Mock de resultado RPC
let mockRpcResult: { data: any; error: any } = {
  data: {
    success: true,
    alquiler_id: 991,
    consecutivo: 301,
    cotizacion_consecutivo: 1045,
    cliente_nombre: 'Ingeniería & Obras del Norte SAS',
    total: 480000,
    deposito: 150000,
    saldo_pendiente: 330000,
    movimiento_caja_id: 'mov-caja-uuid-cot-01',
    sesion_caja_id: 'sesion-caja-uuid-active',
    idempotent: false,
    mensaje: 'Cotización convertida exitosamente a contrato POS con cobro de depósito en caja.',
  },
  error: null,
};

let mockCurrentUser: any = { id: 'usr-pos-cajero', email: 'cajero@alquileressystem.com' };

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
  resolveEmpresaId: vi.fn(async () => 'tenant-pos-empresa-456'),
}));

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  createAdminSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-pos-empresa-456'),
}));

vi.mock('../../src/lib/redis', () => ({
  invalidateTenantCache: vi.fn(async () => true),
}));

vi.spyOn(AuditLogger, 'logAsync').mockImplementation(() => {});

describe('Suite TDD: TASK-010-08 — Conversión 1-Clic POS de Cotizaciones a Contrato con Caja', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { id: 'usr-pos-cajero', email: 'cajero@alquileressystem.com' };
    mockRpcResult = {
      data: {
        success: true,
        alquiler_id: 991,
        consecutivo: 301,
        cotizacion_consecutivo: 1045,
        cliente_nombre: 'Ingeniería & Obras del Norte SAS',
        total: 480000,
        deposito: 150000,
        saldo_pendiente: 330000,
        movimiento_caja_id: 'mov-caja-uuid-cot-01',
        sesion_caja_id: 'sesion-caja-uuid-active',
        idempotent: false,
        mensaje: 'Cotización convertida exitosamente a contrato POS con cobro de depósito en caja.',
      },
      error: null,
    };
  });

  describe('1. Validación Zod de Entrada (ConvertirCotizacionPosZodSchema)', () => {
    it('1.1 Debe rechazar payload si no se especifica cotizacionId', () => {
      const invalidInput: any = {
        montoDeposito: 50000,
        metodoPago: 'EFECTIVO',
      };
      const parsed = ConvertirCotizacionPosZodSchema.safeParse(invalidInput);
      expect(parsed.success).toBe(false);
    });

    it('1.2 Debe rechazar monto de depósito negativo', () => {
      const invalidInput: any = {
        cotizacionId: 'cot-uuid-123',
        montoDeposito: -20000,
      };
      const parsed = ConvertirCotizacionPosZodSchema.safeParse(invalidInput);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toContain('mayor o igual a 0');
      }
    });

    it('1.3 Debe aceptar payload válido y aplicar valores por defecto de método de pago y depósito', () => {
      const validInput = {
        cotizacionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      };
      const parsed = ConvertirCotizacionPosZodSchema.safeParse(validInput);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.montoDeposito).toBe(0);
        expect(parsed.data.metodoPago).toBe('EFECTIVO');
      }
    });
  });

  describe('2. Ejecución Transaccional POS 1-Clic (convertirCotizacionAContratoPosAction)', () => {
    it('2.1 Debe ejecutar la RPC cotizacion_convertir_pos_1clic y retornar datos de contrato y caja', async () => {
      const input: ConvertirCotizacionPosInput = {
        cotizacionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        montoDeposito: 150000,
        metodoPago: 'EFECTIVO',
        detallesLogistica: 'Despacho Inmediato en Mostrador',
      };

      const res = await convertirCotizacionAContratoPosAction(input);

      expect(res.success).toBe(true);
      expect(res.data?.alquilerId).toBe(991);
      expect(res.data?.consecutivo).toBe(301);
      expect(res.data?.cotizacionConsecutivo).toBe(1045);
      expect(res.data?.deposito).toBe(150000);
      expect(res.data?.saldoPendiente).toBe(330000);
      expect(res.data?.movimientoCajaId).toBe('mov-caja-uuid-cot-01');
      expect(res.data?.sesionCajaId).toBe('sesion-caja-uuid-active');

      // Verifica que la llamada a la RPC se ejecutó con los parámetros correctos
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'cotizacion_convertir_pos_1clic',
        expect.objectContaining({
          p_payload: expect.objectContaining({
            cotizacion_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            monto_deposito: 150000,
            metodo_pago: 'EFECTIVO',
            empresa_id: 'tenant-pos-empresa-456',
          }),
        })
      );
    });

    it('2.2 Debe prevenir overbooking capturando ERR_OVERBOOKING_CONCURRENTE y marcando esErrorStock', async () => {
      mockRpcResult = {
        data: null,
        error: {
          message: 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para equipo "Andamio Tubular". Disponibles: 2, Solicitados: 6',
          code: 'P0004',
        },
      };

      const input: ConvertirCotizacionPosInput = {
        cotizacionId: 'cot-overbooked-uuid',
        montoDeposito: 50000,
      };

      const res = await convertirCotizacionAContratoPosAction(input);

      expect(res.success).toBe(false);
      expect(res.esErrorStock).toBe(true);
      expect(res.codigoError).toBe('ERR_OVERBOOKING_CONCURRENTE');
      expect(res.error).toContain('POKA-YOKE INVENTARIO POS');
      expect(res.error).toContain('Stock insuficiente para equipo "Andamio Tubular"');
    });

    it('2.3 Debe manejar respuestas idempotentes sin duplicar contratos', async () => {
      mockRpcResult = {
        data: {
          success: true,
          alquiler_id: 991,
          consecutivo: 301,
          cotizacion_consecutivo: 1045,
          total: 480000,
          deposito: 150000,
          saldo_pendiente: 330000,
          idempotent: true,
          mensaje: 'La cotización ya había sido convertida previamente a este contrato.',
        },
        error: null,
      };

      const input: ConvertirCotizacionPosInput = {
        cotizacionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        idempotencyKey: 'idemp-key-repeat',
      };

      const res = await convertirCotizacionAContratoPosAction(input);

      expect(res.success).toBe(true);
      expect(res.data?.idempotent).toBe(true);
      expect(res.data?.alquilerId).toBe(991);
      expect(res.data?.consecutivo).toBe(301);
    });

    it('2.4 Debe rechazar la operación si el usuario no tiene sesión autenticada', async () => {
      mockCurrentUser = null;

      const input: ConvertirCotizacionPosInput = {
        cotizacionId: 'cot-unauth-test',
      };

      const res = await convertirCotizacionAContratoPosAction(input);

      expect(res.success).toBe(false);
      expect(res.error).toContain('No autorizado');
    });
  });
});
