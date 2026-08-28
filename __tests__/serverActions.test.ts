import { describe, it, expect, vi } from 'vitest';
import { crearClienteAction } from '../src/app/actions/clientes';
import { crearAlquilerAction } from '../src/app/actions/alquileres';

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

vi.mock('../src/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: () => {
    return {
      from: (table: string) => ({
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              if (table === 'clientes' && data[0].nit_cedula === '123456789') {
                return { data: null, error: { code: '23505', message: 'duplicate key' } };
              }
              if (table === 'alquiler_detalles') {
                 return { data: [{ id: 99, ...data }], error: null };
              }
              return { data: { id: 1, consecutivo: 101, ...data[0] }, error: null };
            }
          }),
        }),
        update: (data: any) => ({
          eq: (field: string, value: any) => ({
            select: () => ({
              single: async () => {
                return { data: { id: 1, ...data }, error: null };
              }
            })
          })
        }),
        delete: () => ({
          eq: (field: string, value: any) => Promise.resolve({ data: null, error: null })
        })
      })
    };
  }
}));

describe('Validación de Server Actions (Persistencia DB)', () => {
  it('crearClienteAction debe devolver un objeto struct { success, data, error }', async () => {
    const res = await crearClienteAction({
      nit_cedula: 'TEST-123',
      nombre: 'Test Client',
      telefono: '555',
      nivel_riesgo: 'Bajo', 
      idempotency_key: 'idemp123'
    });
    
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('id', 1);
    expect(res.data).toHaveProperty('estado', 'Activo');
  });

  it('crearClienteAction debe atrapar error 23505 y devolver success: false', async () => {
    const res = await crearClienteAction({
      nit_cedula: '123456789', 
      nombre: 'Test Duplicate',
      nivel_riesgo: 'Bajo',
      idempotency_key: 'idemp123'
    });
    
    expect(res.success).toBe(false);
    expect(res.error).toContain('Posible duplicado');
  });

  it('crearAlquilerAction debe estructurar la cabecera e ignorar error de throw', async () => {
    const res = await crearAlquilerAction({
      clienteId: '1',
      fechaRegistro: new Date().toISOString(),
      fleteEntrega: 50,
      fleteRecogida: 50,
      deposito: 100,
      garantiaMonto: 500,
      garantiaTipo: 'Letra',
      items: [
        {
          itemId: '10',
          cantidad: 2,
          tarifaAplicada: 100,
          fechaInicio: '2026-08-28T00:00:00Z',
          fechaFinEstimada: '2026-08-30T00:00:00Z'
        }
      ],
      idempotency_key: 'algo123'
    });
    
    expect(res.success).toBe(true);
    expect(res.data).toHaveProperty('subtotal_equipos');
  });
});
