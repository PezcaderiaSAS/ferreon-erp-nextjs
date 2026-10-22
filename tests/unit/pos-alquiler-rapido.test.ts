import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  crearAlquilerRapidoPosAction,
  CrearAlquilerRapidoPosZodSchema,
  CrearAlquilerRapidoPosInput,
} from '../../src/app/actions/alquileres';
import { AuditLogger } from '@/lib/security/audit-logger';
import * as redisModule from '../../src/lib/redis';

// Mocks de Supabase y dependencias
let mockRpcResult: { data: any; error: any } = {
  data: {
    id: 888,
    consecutivo: 205,
    cliente_id: 12,
    cliente_nombre: 'Constructora Bolívar SAS',
    total: 350000,
    deposito: 100000,
    saldo_pendiente: 250000,
    movimiento_caja_id: 'mov-caja-uuid-001',
    sesion_caja_id: 'sesion-caja-uuid-001',
    estado: 'ACTIVO',
    idempotent: false,
    mensaje: 'Alquiler mostrador POS despachado con éxito (<30s).',
  },
  error: null,
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: { id: 'usr-pos-operator', email: 'cajero@alquileressystem.com' } },
    })),
  },
  rpc: vi.fn(async (fnName: string, args: any) => mockRpcResult),
};

vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-pos-empresa-123'),
}));

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => mockSupabaseClient),
  resolveEmpresaId: vi.fn(async () => 'tenant-pos-empresa-123'),
}));

vi.mock('../../src/lib/redis', () => ({
  invalidateTenantCache: vi.fn(async () => true),
}));

vi.spyOn(AuditLogger, 'logAsync').mockImplementation(() => {});

describe('Suite TDD: TASK-010-04 — Core Operativo de Alquileres en Modo Mostrador POS (<30s)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpcResult = {
      data: {
        id: 888,
        consecutivo: 205,
        cliente_id: 12,
        cliente_nombre: 'Constructora Bolívar SAS',
        total: 350000,
        deposito: 100000,
        saldo_pendiente: 250000,
        movimiento_caja_id: 'mov-caja-uuid-001',
        sesion_caja_id: 'sesion-caja-uuid-001',
        estado: 'ACTIVO',
        idempotent: false,
        mensaje: 'Alquiler mostrador POS despachado con éxito (<30s).',
      },
      error: null,
    };
  });

  describe('1. Validación Zod Ultra-Rápida (CrearAlquilerRapidoPosZodSchema)', () => {
    it('1.1 Debe rechazar payload si no incluye ni clienteId ni clienteNuevo', () => {
      const invalidInput: any = {
        items: [{ equipoId: 101, cantidad: 2, tarifaAplicada: 50000, diasCobro: 3 }],
      };

      const result = CrearAlquilerRapidoPosZodSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Debe especificar un cliente existente o los datos del cliente nuevo');
      }
    });

    it('1.2 Debe rechazar payload si la lista de equipos está vacía', () => {
      const invalidInput: any = {
        clienteId: 5,
        items: [],
      };

      const result = CrearAlquilerRapidoPosZodSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('1.3 Debe aceptar payload con cliente existente y calcular valores por defecto', () => {
      const validInput: CrearAlquilerRapidoPosInput = {
        clienteId: '12',
        items: [
          { equipoId: 101, cantidad: 2, tarifaAplicada: 50000, diasCobro: 3 },
          { equipoId: 102, cantidad: 1, tarifaAplicada: 25000, diasCobro: 2 },
        ],
        deposito: 100000,
      };

      const result = CrearAlquilerRapidoPosZodSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clienteId).toBe('12');
        expect(result.data.items.length).toBe(2);
        expect(result.data.garantiaTipo).toBe('Efectivo');
      }
    });

    it('1.4 Debe aceptar cliente On-The-Fly con documento y datos rápidos', () => {
      const validInput: CrearAlquilerRapidoPosInput = {
        clienteNuevo: {
          nit_cedula: '1098765432',
          nombre: 'Juan Pérez Mostrador',
          telefono: '3001234567',
        },
        items: [{ equipoId: 101, cantidad: 1, tarifaAplicada: 45000, diasCobro: 1 }],
      };

      const result = CrearAlquilerRapidoPosZodSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('2. Integración Server Action crearAlquilerRapidoPosAction', () => {
    it('2.1 Debe despachar exitosamente en POS e invocar la RPC alquiler_crear_pos_rapido_v1', async () => {
      const input: CrearAlquilerRapidoPosInput = {
        clienteId: 12,
        items: [
          { equipoId: 101, cantidad: 2, tarifaAplicada: 50000, diasCobro: 3 }, // 300,000
          { equipoId: 102, cantidad: 1, tarifaAplicada: 50000, diasCobro: 1 }, // 50,000
        ],
        deposito: 100000,
        fleteEntrega: 0,
        fleteRecogida: 0,
        garantiaMonto: 200000,
        garantiaTipo: 'Efectivo',
      };

      const response = await crearAlquilerRapidoPosAction(input);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(888);
      expect(response.data?.consecutivo).toBe(205);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'alquiler_crear_pos_rapido_v1',
        expect.objectContaining({
          p_payload: expect.objectContaining({
            cliente_id: 12,
            total: 350000,
            deposito: 100000,
            subtotal_equipos: 350000,
          }),
        })
      );
      expect(AuditLogger.logAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          modulo: 'ALQUILERES',
          accion: 'CREAR_ALQUILER',
        })
      );
      expect(redisModule.invalidateTenantCache).toHaveBeenCalledWith(
        'tenant-pos-empresa-123',
        expect.arrayContaining(['alquileres', 'equipos', 'caja'])
      );
    });

    it('2.2 Debe propagar error cuando el inventario no tiene stock suficiente (INSUFFICIENT_STOCK)', async () => {
      mockRpcResult = {
        data: null,
        error: {
          code: 'P0004',
          message: 'INSUFFICIENT_STOCK: Stock insuficiente para equipo ID 101. Disponibles: 1, Solicitados: 5',
        },
      };

      const input: CrearAlquilerRapidoPosInput = {
        clienteId: 12,
        items: [{ equipoId: 101, cantidad: 5, tarifaAplicada: 50000, diasCobro: 2 }],
      };

      const response = await crearAlquilerRapidoPosAction(input);

      expect(response.success).toBe(false);
      expect(response.error).toContain('INSUFFICIENT_STOCK');
    });

    it('2.3 Debe resolver cliente On-The-Fly y transferir el payload correctamente a la RPC', async () => {
      mockRpcResult = {
        data: {
          id: 889,
          consecutivo: 206,
          cliente_id: 99,
          cliente_nombre: 'Ingeniería Express SAS',
          total: 80000,
          deposito: 80000,
          saldo_pendiente: 0,
          estado: 'ACTIVO',
        },
        error: null,
      };

      const input: CrearAlquilerRapidoPosInput = {
        clienteNuevo: {
          nit_cedula: '901234567-1',
          nombre: 'Ingeniería Express SAS',
          telefono: '3159876543',
          direccion: 'Carrera 7 # 45-10',
        },
        items: [{ equipoId: 105, cantidad: 1, tarifaAplicada: 80000, diasCobro: 1 }],
        deposito: 80000,
      };

      const response = await crearAlquilerRapidoPosAction(input);

      expect(response.success).toBe(true);
      expect(response.data?.cliente_id).toBe(99);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'alquiler_crear_pos_rapido_v1',
        expect.objectContaining({
          p_payload: expect.objectContaining({
            cliente_nuevo: expect.objectContaining({
              nit_cedula: '901234567-1',
              nombre: 'Ingeniería Express SAS',
            }),
          }),
        })
      );
    });
  });
});
