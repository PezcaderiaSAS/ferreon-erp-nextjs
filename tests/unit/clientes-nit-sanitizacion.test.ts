import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearClienteAction, editarClienteAction } from '../../src/app/actions/clientes';
import { sanitizarNitCedula } from '../../src/core/utils/clientes-sanitizacion';

// Mocks de infraestructura Supabase y Redis
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

describe('Sanitización e Integridad de NIT / Cédula (Alquileres System)', () => {
  describe('Función pura sanitizarNitCedula', () => {
    it('debe eliminar puntos de miles y espacios manteniendo el dígito de verificación', () => {
      const nitConPuntos = ' 900.123.456-1 ';
      const nitLimpio = sanitizarNitCedula(nitConPuntos);
      expect(nitLimpio).toBe('900123456-1');
    });

    it('debe limpiar cédulas con puntos y espacios espurios', () => {
      const cedulaSucia = ' 1. 020 . 304 . 506 ';
      const cedulaLimpia = sanitizarNitCedula(cedulaSucia);
      expect(cedulaLimpia).toBe('1020304506');
    });

    it('debe eliminar caracteres no permitidos como símbolos o caracteres de control', () => {
      const entradaRara = '800.999.111-2 #$%&!';
      const entradaLimpia = sanitizarNitCedula(entradaRara);
      expect(entradaLimpia).toBe('800999111-2');
    });

    it('debe retornar cadena vacía si el argumento es nulo o indefinido', () => {
      expect(sanitizarNitCedula('')).toBe('');
      expect(sanitizarNitCedula(null as any)).toBe('');
      expect(sanitizarNitCedula(undefined as any)).toBe('');
    });
  });

  describe('Acciones del Servidor: crearClienteAction', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('debe rechazar si el documento sanitizado queda con menos de 3 caracteres', async () => {
      const resultado = await crearClienteAction({
        nit_cedula: ' . - ',
        nombre: 'EMPRESA FANTASMA SAS',
      });

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/al menos 3 caracteres/i);
    });

    it('debe capturar el error de unicidad 23505 y retornar un mensaje Poka-Yoke explicativo', async () => {
      const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-123' } } }),
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "clientes_nit_cedula_key"',
                },
              }),
            }),
          }),
        }),
      };

      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await crearClienteAction({
        nit_cedula: '900.123.456-1',
        nombre: 'CONSTRUCTORA REPETIDA SAS',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Error de restricción única');
      expect(res.error).toContain('900.123.456-1');
    });
  });

  describe('Acciones del Servidor: editarClienteAction', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('debe sanitizar nit_cedula y validar que no quede menor a 3 caracteres al editar', async () => {
      const res = await editarClienteAction({
        id: 'CLI-123',
        nit_cedula: ' . - ',
        nombre: 'CLIENTE EDITADO',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/al menos 3 caracteres/i);
    });

    it('debe capturar violación única 23505 al editar cliente con NIT ya perteneciente a otro', async () => {
      const { createServerSupabaseClient } = await import('../../src/infrastructure/persistence/supabase/server');
      const mockEq = vi.fn();
      mockEq.mockReturnValue({
        eq: mockEq,
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint',
            },
          }),
        }),
      });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-edit-1', email: 'admin@ferreon.com' } } }),
        },
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      };

      vi.mocked(createServerSupabaseClient).mockResolvedValue(mockSupabase as any);

      const res = await editarClienteAction({
        id: 'CLI-123',
        nit_cedula: '900.123.456-1',
        nombre: 'CLIENTE EDITADO',
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain('Error de restricción única: El NIT/Cédula ya existe en otro cliente.');
    });
  });
});
