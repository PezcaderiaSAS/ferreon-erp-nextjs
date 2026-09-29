import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearClienteAction, editarClienteAction } from '../../src/app/actions/clientes';
import { crearEquipoAction, editarEquipoAction, liberarMantenimientoAction } from '../../src/app/actions/equipos';
import {
  crearSubcontratacionAction,
  cambiarEstadoSubcontratacionAction,
  registrarRetornoAProveedorAction,
  liquidarSubcontratacionAction,
} from '../../src/app/actions/subcontrataciones';

// Mocks de infraestructura Supabase retornando usuario nulo (anónimo / no autenticado)
vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  resolveEmpresaId: vi.fn().mockResolvedValue('empresa-test-uuid'),
}));

vi.mock('@/lib/redis', () => ({
  redis: { del: vi.fn(), get: vi.fn(), set: vi.fn() },
  invalidateTenantCache: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    logAsync: vi.fn(),
  },
}));

describe('Blindaje AppSec: Guardias de Autenticación en Server Actions (Alquileres System)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }), // Usuario anónimo
      },
      from: vi.fn(),
    } as any);
  });

  describe('Módulo Clientes', () => {
    it('crearClienteAction debe rechazar peticiones no autenticadas', async () => {
      const res = await crearClienteAction({
        nit_cedula: '900123456-1',
        nombre: 'CLIENTE HACKER SAS',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('editarClienteAction debe rechazar peticiones no autenticadas', async () => {
      const res = await editarClienteAction({
        id: '123',
        nombre: 'CLIENTE MODIFICADO',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });
  });

  describe('Módulo Equipos', () => {
    it('crearEquipoAction debe rechazar peticiones no autenticadas', async () => {
      const res = await crearEquipoAction({
        sku: 'AND-001',
        nombre: 'Andamio Tubular',
        categoria: 'Andamios',
        tarifaDiaria: 10000,
        stockInicial: 5,
        valorReposicion: 500000,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('editarEquipoAction debe rechazar peticiones no autenticadas', async () => {
      const res = await editarEquipoAction({
        id: 1,
        nombre: 'Andamio Modificado',
        categoria: 'Andamios',
        tarifaDiaria: 12000,
        valorReposicion: 300000,
        estado: 'Disponible',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('liberarMantenimientoAction debe rechazar peticiones no autenticadas', async () => {
      const res = await liberarMantenimientoAction(1, 2, 'Mantenimiento preventivo completado');

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });
  });

  describe('Módulo Subcontrataciones', () => {
    it('crearSubcontratacionAction debe rechazar peticiones no autenticadas', async () => {
      const res = await crearSubcontratacionAction({
        proveedorId: 'prov-99',
        proveedorNombre: 'PROVEEDOR TEST',
        proveedorNit: '900999888-1',
        fechaRecepcionEstimada: '2026-10-01',
        fechaDevolucionEstimada: '2026-10-15',
        items: [
          {
            descripcionItem: 'Grúa Torre',
            cantidad: 1,
            diasPactados: 14,
            costoDiarioUnitario: 250000,
          },
        ],
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('cambiarEstadoSubcontratacionAction debe rechazar peticiones no autenticadas', async () => {
      const res = await cambiarEstadoSubcontratacionAction({
        subcontratacionId: 'sub-1',
        nuevoEstado: 'RECIBIDA_EN_BODEGA',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('registrarRetornoAProveedorAction debe rechazar peticiones no autenticadas', async () => {
      const res = await registrarRetornoAProveedorAction({
        subcontratacionId: 'sub-1',
        observaciones: 'Retorno formal',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });

    it('liquidarSubcontratacionAction debe rechazar peticiones no autenticadas', async () => {
      const res = await liquidarSubcontratacionAction({
        subcontratacionId: 'sub-1',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizado/i);
    });
  });
});
