import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearSubcontratacionAction } from '../../src/app/actions/subcontrataciones';
import { generarConsecutivoSubcontratacion } from '../../src/core/utils/subcontrataciones-consecutivos';

// Mocks de infraestructura Supabase y Auditoría
vi.mock('../../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/security/audit-logger', () => ({
  AuditLogger: {
    logAsync: vi.fn(),
  },
}));

describe('Subcontrataciones: Consecutivos Robustos, Integridad e Idempotencia (Alquileres System)', () => {
  describe('Función pura generarConsecutivoSubcontratacion', () => {
    it('debe generar un consecutivo con formato cronológico SUB-YYYYMMDD-XXXX', () => {
      const fechaFija = new Date('2026-09-29T10:30:00.000Z');
      const consecutivo = generarConsecutivoSubcontratacion(fechaFija, 456);

      expect(consecutivo).toMatch(/^SUB-20260929-\d{4}456$/);
      expect(consecutivo.startsWith('SUB-20260929-')).toBe(true);
    });

    it('dos llamadas consecutivas con fechas distintas deben mantener orden cronológico y ser distintas', () => {
      const fecha1 = new Date('2026-09-29T10:00:00.000Z');
      const fecha2 = new Date('2026-09-30T10:00:00.000Z');

      const c1 = generarConsecutivoSubcontratacion(fecha1, 100);
      const c2 = generarConsecutivoSubcontratacion(fecha2, 100);

      expect(c1).not.toBe(c2);
      expect(c1 < c2).toBe(true);
    });
  });

  describe('Acción de Servidor: crearSubcontratacionAction', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('debe respetar un consecutivo manual si es proporcionado en el input', async () => {
      const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');

      let insertCabeceraPayload: any = null;

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-sub-1', email: 'cajero@ferreon.com' } } }),
        },
        from: vi.fn((tabla: string) => {
          if (tabla === 'subcontrataciones') {
            return {
              insert: vi.fn((payload) => {
                insertCabeceraPayload = payload;
                return {
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'sub-uuid-1', ...payload },
                      error: null,
                    }),
                  }),
                };
              }),
            };
          }
          if (tabla === 'subcontrataciones_detalles') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await crearSubcontratacionAction({
        consecutivo: 'SUB-CUSTOM-001',
        proveedorId: 'prov-1',
        proveedorNombre: 'MAQUIPROVEEDORES SAS',
        proveedorNit: '900.888.777-1',
        fechaRecepcionEstimada: '2026-10-01',
        fechaDevolucionEstimada: '2026-10-10',
        items: [
          {
            descripcionItem: 'Torre de Iluminación 4000W',
            cantidad: 2,
            diasPactados: 9,
            costoDiarioUnitario: 80000,
            tarifaDiariaCliente: 120000,
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(insertCabeceraPayload.consecutivo).toBe('SUB-CUSTOM-001');
      expect(res.data?.consecutivo).toBe('SUB-CUSTOM-001');
    });

    it('debe capturar error 23505 si el consecutivo ya existe y advertir colisión concurrente', async () => {
      const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } } }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "subcontrataciones_consecutivo_key"',
                },
              }),
            }),
          }),
        }),
      };

      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await crearSubcontratacionAction({
        proveedorId: 'prov-1',
        proveedorNombre: 'MAQUIPROVEEDORES SAS',
        proveedorNit: '900.888.777-1',
        fechaRecepcionEstimada: '2026-10-01',
        fechaDevolucionEstimada: '2026-10-10',
        items: [
          {
            descripcionItem: 'Compactador',
            cantidad: 1,
            diasPactados: 5,
            costoDiarioUnitario: 50000,
          },
        ],
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Error de restricción única');
    });

    it('debe ejecutar compensación (rollback de cabecera) si falla la inserción de detalles', async () => {
      const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');

      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } } }),
        },
        from: vi.fn((tabla: string) => {
          if (tabla === 'subcontrataciones') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'sub-a-eliminar' },
                    error: null,
                  }),
                }),
              }),
              delete: mockDelete,
            };
          }
          if (tabla === 'subcontrataciones_detalles') {
            return {
              insert: vi.fn().mockResolvedValue({
                error: { message: 'Fallo forzado de red o constraint en detalles' },
              }),
            };
          }
          return {};
        }),
      };

      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await crearSubcontratacionAction({
        proveedorId: 'prov-1',
        proveedorNombre: 'MAQUIPROVEEDORES SAS',
        proveedorNit: '900.888.777-1',
        fechaRecepcionEstimada: '2026-10-01',
        fechaDevolucionEstimada: '2026-10-10',
        items: [
          {
            descripcionItem: 'Generador Diésel',
            cantidad: 1,
            diasPactados: 3,
            costoDiarioUnitario: 70000,
          },
        ],
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Error al registrar ítems subcontratados');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'sub-a-eliminar');
    });
  });
});
