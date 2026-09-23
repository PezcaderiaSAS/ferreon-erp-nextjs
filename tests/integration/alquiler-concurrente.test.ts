import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearAlquilerSegmentadoAction } from '@/app/actions/alquiler-segmentado';
import { AlquilerTransaccionalService } from '@/core/services/alquiler-transaccional.service';

// ============================================================================
// MOCKS DE INFRAESTRUCTURA NEXT.JS & SUPABASE
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
  redis: null,
}));

vi.mock('../../lib/redis', () => ({
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
  redis: null,
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    log: vi.fn().mockResolvedValue(undefined),
    logAsync: vi.fn().mockReturnValue(undefined),
  }
}));

// Mock controlable de Supabase para simular respuestas de RPC y Auth
let mockRpcHandler = vi.fn();

vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  DEFAULT_EMPRESA_ID: 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  resolveEmpresaId: async () => 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'usr-wms-007',
            email: 'operador@alquileressystem.com'
          }
        },
        error: null
      })
    },
    rpc: (...args: any[]) => mockRpcHandler(...args)
  })
}));

vi.mock('../../infrastructure/persistence/supabase/server', () => ({
  DEFAULT_EMPRESA_ID: 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  resolveEmpresaId: async () => 'ac8719ea-f16a-4538-b308-40d9511a14cb',
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: 'usr-wms-007',
            email: 'operador@alquileressystem.com'
          }
        },
        error: null
      })
    },
    rpc: (...args: any[]) => mockRpcHandler(...args)
  })
}));

/**
 * Emite métricas de ejecución con timestamp ISO y duración precisa en ms
 */
function logTestMetric(testCase: string, duracionMs: number, detalles: Record<string, any>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    modulo: 'TEST_INTEGRATION_CONCURRENT_RENTALS',
    sistema: 'Alquileres System',
    testCase,
    duracionMs: Number(duracionMs.toFixed(2)),
    detalles
  }, null, 2));
}

// ============================================================================
// SUITE DE INTEGRACIÓN: ALQUILERES SEGMENTADOS Y CONCURRENTES (TAREA-08)
// ============================================================================

describe('Suite de Integración: Alquileres Segmentados y Concurrentes por Ítem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // CASO A: Superposición Válida de Líneas Concurrentes del Mismo Equipo
  // --------------------------------------------------------------------------
  it('Caso A (Éxito): Debe procesar exitosamente un contrato con 2 líneas superpuestas del mismo equipo y tarifas personalizadas', async () => {
    const tInicio = performance.now();

    // Configurar respuesta exitosa simulada del RPC transaccional
    mockRpcHandler.mockImplementation(async (fnName: string, params: any) => {
      expect(fnName).toBe('alquiler_despachar_segmentado_concurrente_v1');
      expect(params.p_payload.items).toHaveLength(2);
      expect(params.p_payload.items[0].equipo_id).toBe('EQ-001');
      expect(params.p_payload.items[1].equipo_id).toBe('EQ-001');

      return {
        data: {
          id: 9941,
          consecutivo: 5012,
          estado: 'PENDIENTE_ENTREGA',
          total: 1565000,
          lineas_procesadas: 2,
          created_at: new Date().toISOString()
        },
        error: null
      };
    });

    const payloadValido = {
      clienteId: 'cli_constructora_capital',
      estado: 'ACTIVO' as const,
      fechaRegistro: '2026-10-01',
      fleteEntrega: 25000,
      fleteRecogida: 25000,
      deposito: 200000,
      garantiaMonto: 1000000,
      garantiaTipo: 'Letra',
      idempotency_key: 'e7b1a2c3-d4e5-4f6a-8b9c-0d1e2f3a4b5c',
      items: [
        {
          lineaNumero: 1,
          itemId: 'EQ-001',
          nombreItem: 'Andamio Tubular Certificado',
          cantidad: 2,
          tarifaAplicada: 35000,
          tarifaPersonalizada: false,
          fechaInicio: '2026-10-01',
          fechaFinEstimada: '2026-10-07',
          diasContratados: 7,
          subtotalLinea: 490000, // 2 * 35,000 * 7
          subtotalPersonalizado: false
        },
        {
          lineaNumero: 2,
          itemId: 'EQ-001',
          nombreItem: 'Andamio Tubular Certificado',
          cantidad: 3,
          tarifaAplicada: 40000, // Tarifa unitaria personalizada
          tarifaPersonalizada: true,
          fechaInicio: '2026-10-03', // Fechas concurrentes/superpuestas con Línea 1
          fechaFinEstimada: '2026-10-14',
          diasContratados: 12,
          subtotalLinea: 1440000, // Subtotal pactado
          subtotalPersonalizado: true
        }
      ]
    };

    const resultado = await crearAlquilerSegmentadoAction(payloadValido);
    const duracionMs = performance.now() - tInicio;

    logTestMetric('Caso A: Éxito Concurrente Superpuesto', duracionMs, {
      success: resultado.success,
      consecutivo: resultado.data?.consecutivo,
      lineasProcesadas: resultado.data?.lineas_procesadas
    });

    expect(resultado.success).toBe(true);
    expect(resultado.data).toBeDefined();
    expect(resultado.data.consecutivo).toBeGreaterThan(0);
    expect(resultado.data.lineas_procesadas).toBe(2);
    expect(resultado.error).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // CASO B: Detección y Rechazo Atómico por Overbooking Concurrente
  // --------------------------------------------------------------------------
  it('Caso B (Overbooking): Debe atrapar ERR_OVERBOOKING_CONCURRENTE cuando la suma de líneas excede el stock físico en la curva', async () => {
    const tInicio = performance.now();

    // Simular que el motor PostgreSQL detecta overbooking en el día de máxima superposición
    mockRpcHandler.mockImplementation(async (fnName: string) => {
      expect(fnName).toBe('alquiler_despachar_segmentado_concurrente_v1');
      return {
        data: null,
        error: {
          code: 'P0001',
          message: 'ERR_OVERBOOKING_CONCURRENTE: El equipo EQ-001 sobrepasa el stock disponible (Demanda concurrente: 7 > Capacidad total: 5) para la fecha 2026-10-05 en línea #3.',
          hint: 'Considere dividir la línea a subcontratación o ajustar fechas.',
          details: 'Curva temporal saturada en ventana 2026-10-03 a 2026-10-07'
        }
      };
    });

    const payloadOverbooking = {
      clienteId: 'cli_megaproyectos_sas',
      estado: 'ACTIVO' as const,
      fechaRegistro: '2026-10-01',
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      deposito: 100000,
      garantiaMonto: 500000,
      garantiaTipo: 'Efectivo',
      items: [
        {
          lineaNumero: 1,
          itemId: 'EQ-001',
          cantidad: 3,
          tarifaAplicada: 35000,
          fechaInicio: '2026-10-01',
          fechaFinEstimada: '2026-10-10',
          diasContratados: 10,
          subtotalLinea: 1050000
        },
        {
          lineaNumero: 2,
          itemId: 'EQ-001',
          cantidad: 2,
          tarifaAplicada: 35000,
          fechaInicio: '2026-10-03',
          fechaFinEstimada: '2026-10-08',
          diasContratados: 6,
          subtotalLinea: 420000
        },
        {
          lineaNumero: 3,
          itemId: 'EQ-001',
          cantidad: 2, // 3 + 2 + 2 = 7 > Capacidad de 5
          tarifaAplicada: 35000,
          fechaInicio: '2026-10-04',
          fechaFinEstimada: '2026-10-07',
          diasContratados: 4,
          subtotalLinea: 280000
        }
      ]
    };

    const resultado = await crearAlquilerSegmentadoAction(payloadOverbooking);
    const duracionMs = performance.now() - tInicio;

    logTestMetric('Caso B: Rechazo Overbooking Concurrente', duracionMs, {
      success: resultado.success,
      errorCode: resultado.error,
      path: resultado.path,
      message: resultado.message
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('ERR_OVERBOOKING_CONCURRENTE');
    expect(resultado.message).toContain('Demanda concurrente: 7 > Capacidad total: 5');
    expect(resultado.path).toContain('src/app/actions/alquiler-segmentado.ts');
    expect(resultado.path).toContain('PostgrestRpcExecution');
  });

  // --------------------------------------------------------------------------
  // CASO C: Intercepción en Capa Zod por Fechas Invertidas (Defensa en Profundidad)
  // --------------------------------------------------------------------------
  it('Caso C (Validación Zod): Debe interceptar en frontera de entrada si fechaFinEstimada < fechaInicio sin invocar base de datos', async () => {
    const tInicio = performance.now();

    const payloadFechasInvertidas = {
      clienteId: 'cli_obras_viales',
      estado: 'ACTIVO' as const,
      fechaRegistro: '2026-10-01',
      fleteEntrega: 0,
      fleteRecogida: 0,
      deposito: 0,
      garantiaMonto: 0,
      garantiaTipo: 'Efectivo',
      items: [
        {
          lineaNumero: 1,
          itemId: 'EQ-001',
          cantidad: 1,
          tarifaAplicada: 50000,
          fechaInicio: '2026-10-15',
          fechaFinEstimada: '2026-10-10', // Fecha fin anterior al inicio
          diasContratados: 1,
          subtotalLinea: 50000
        }
      ]
    };

    const resultado = await crearAlquilerSegmentadoAction(payloadFechasInvertidas);
    const duracionMs = performance.now() - tInicio;

    logTestMetric('Caso C: Intercepción Zod Fechas Invertidas', duracionMs, {
      success: resultado.success,
      error: resultado.error,
      message: resultado.message,
      path: resultado.path
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error).toBe('ERR_VALIDATION_ZOD');
    expect(resultado.message).toContain('La fecha de fin estimada debe ser igual o posterior a la fecha de inicio');
    expect(resultado.path).toContain('ZodValidation');
    // Verificar que Supabase RPC NUNCA fue llamado
    expect(mockRpcHandler).not.toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // CASO D: Lógica de Dominio - Recálculo Proporcional de Tarifa Diaria Efectiva
  // --------------------------------------------------------------------------
  it('Caso D (Dominio): calcularLiquidacionSegmentada debe recalcular la tarifa diaria unitaria proporcional cuando subtotalPersonalizado es true', () => {
    const tInicio = performance.now();

    // 3 unidades por 11 días = 33 días-equipo
    // Subtotal editado manualmente a $1,320,000
    // Tarifa efectiva resultante debe ser: Math.round(1,320,000 / 33) = 40,000
    const items = [
      {
        lineaNumero: 1,
        itemId: 'EQ-001',
        cantidad: 3,
        tarifaAplicada: 50000, // Tarifa lista original
        tarifaPersonalizada: false,
        fechaInicio: '2026-10-01',
        fechaFinEstimada: '2026-10-11',
        diasContratados: 11,
        subtotalLinea: 1320000, // Subtotal pactado con descuento cerrado
        subtotalPersonalizado: true
      },
      {
        lineaNumero: 2,
        itemId: 'EQ-002',
        cantidad: 1,
        tarifaAplicada: 80000,
        tarifaPersonalizada: false,
        fechaInicio: '2026-10-05',
        fechaFinEstimada: '2026-10-09',
        diasContratados: 5,
        subtotalLinea: 400000, // 1 * 80000 * 5 = 400,000
        subtotalPersonalizado: false
      }
    ];

    const liquidacion = AlquilerTransaccionalService.calcularLiquidacionSegmentada(
      items,
      30000, // fleteEntrega
      30000, // fleteRecogida
      500000 // deposito
    );

    const duracionMs = performance.now() - tInicio;

    logTestMetric('Caso D: Recálculo Proporcional de Tarifa Diaria', duracionMs, {
      subtotalEquipos: liquidacion.subtotalEquipos,
      total: liquidacion.total,
      saldoPendiente: liquidacion.saldoPendiente,
      linea1TarifaEfectiva: liquidacion.itemsLiquidados[0].tarifaAplicada,
      linea1Subtotal: liquidacion.itemsLiquidados[0].subtotalLinea
    });

    // Validar línea 1 con subtotal personalizado
    expect(liquidacion.itemsLiquidados[0].subtotalLinea).toBe(1320000);
    expect(liquidacion.itemsLiquidados[0].tarifaAplicada).toBe(40000); // 1320000 / (3 * 11) = 40,000

    // Validar línea 2 estándar
    expect(liquidacion.itemsLiquidados[1].subtotalLinea).toBe(400000);
    expect(liquidacion.itemsLiquidados[1].tarifaAplicada).toBe(80000);

    // Validar totales generales
    expect(liquidacion.subtotalEquipos).toBe(1720000); // 1320000 + 400000
    expect(liquidacion.total).toBe(1780000); // 1720000 + 30000 + 30000
    expect(liquidacion.saldoPendiente).toBe(1280000); // 1780000 - 500000
  });
});
