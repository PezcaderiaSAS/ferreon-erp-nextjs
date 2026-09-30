import { describe, it, expect, vi } from 'vitest';
import { CajaTransaccionalService } from '@/core/services/caja-transaccional.service';

describe('Blindaje CAJA-001: Poka-Yoke y Manejo de Concurrencia (Código 23505 en PostgreSQL)', () => {
  it('debe rechazar la apertura si PostgreSQL arroja error 23505 (violación de índice único condicional)', async () => {
    // Simular que la validación preliminar en aplicación pasó, pero al insertar en BD ocurre una colisión concurrente (código 23505)
    const adminMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }), // Pasa verificación inicial
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "idx_sesion_activa_usuario_unica"',
              },
            }),
          }),
        }),
      }),
    };

    const resultado = await CajaTransaccionalService.abrirSesion(adminMock, {
      userId: 'cajero-uuid-1',
      empresaId: 'empresa-uuid-99',
      montoApertura: 50000,
      observaciones: 'Apertura concurrente duplicada',
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error).toContain('Poka-Yoke: Ya tienes una sesión de caja ABIERTA actualmente');
    expect(resultado.error).toContain('Restricción de Concurrencia');
  });

  it('debe abrir la sesión exitosamente cuando no existe conflicto de concurrencia ni sesión previa', async () => {
    const sesionNueva = {
      id: 'sesion-uuid-101',
      usuario_id: 'cajero-uuid-2',
      empresa_id: 'empresa-uuid-99',
      monto_apertura: 100000,
      estado: 'ABIERTA',
    };

    const adminMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: sesionNueva,
              error: null,
            }),
          }),
        }),
      }),
    };

    const resultado = await CajaTransaccionalService.abrirSesion(adminMock, {
      userId: 'cajero-uuid-2',
      empresaId: 'empresa-uuid-99',
      montoApertura: 100000,
    });

    expect(resultado.success).toBe(true);
    expect(resultado.sesion?.id).toBe('sesion-uuid-101');
    expect(resultado.montoAperturaEntero).toBe(100000);
  });
});
