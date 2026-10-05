import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  crearTareaManualAction,
  toggleTareaCompletadaAction,
  eliminarTareaManualAction,
  obtenerDashboardDataAction
} from '@/app/actions/dashboard';

// Mock de persistencia Supabase
vi.mock('@/infrastructure/persistence/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
  resolveEmpresaId: vi.fn().mockResolvedValue('empresa-test-uuid')
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

describe('Dashboard Tareas Manuales - Server Actions y Persistencia Supabase', () => {
  const mockUser = { id: 'user-uuid-123', email: 'admin@ferreon.com' };
  const mockEmpresaId = 'empresa-test-uuid';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. crearTareaManualAction', () => {
    it('debe rechazar si el título está vacío', async () => {
      const res = await crearTareaManualAction('');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/obligatorio/i);
    });

    it('debe rechazar si el usuario no tiene sesión activa', async () => {
      const { createServerSupabaseClient } = await import('@/infrastructure/persistence/supabase/server');
      vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } })
        }
      } as any);

      const res = await crearTareaManualAction('Llamar cliente');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Sesión no iniciada/i);
    });

    it('debe insertar la tarea en Supabase y retornar el payload persistido', async () => {
      const mockInserted = {
        id: 'task-uuid-456',
        titulo: 'Revisar saldo pendiente cliente Omega',
        subtexto: 'Tarea manual personalizada',
        completada: false,
        urgencia: 'URGENTE',
        fecha_limite: '2026-10-10'
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockInserted, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

      const { createServerSupabaseClient } = await import('@/infrastructure/persistence/supabase/server');
      vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
        },
        from: mockFrom
      } as any);

      const res = await crearTareaManualAction('Revisar saldo pendiente cliente Omega', '2026-10-10', 'URGENTE');

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.id).toBe('task-uuid-456');
      expect(res.data?.tipo).toBe('MANUAL');
      expect(res.data?.urgencia).toBe('URGENTE');
      expect(mockFrom).toHaveBeenCalledWith('dashboard_tareas');
    });
  });

  describe('2. toggleTareaCompletadaAction', () => {
    it('debe ignorar tareas de sistema sin consultar la base de datos', async () => {
      const res = await toggleTareaCompletadaAction('task-sys-ret-venc-1', true);
      expect(res.success).toBe(true);
    });

    it('debe actualizar el estado de una tarea manual en Supabase', async () => {
      const mockEqEmpresa = vi.fn().mockResolvedValue({ error: null });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqEmpresa });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      const { createServerSupabaseClient } = await import('@/infrastructure/persistence/supabase/server');
      vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
        },
        from: mockFrom
      } as any);

      const res = await toggleTareaCompletadaAction('task-uuid-456', true);

      expect(res.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('dashboard_tareas');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ completada: true })
      );
    });
  });

  describe('3. eliminarTareaManualAction', () => {
    it('debe impedir eliminar tareas del sistema', async () => {
      const res = await eliminarTareaManualAction('task-sys-cobr-1');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/tareas del sistema son dinámicas/i);
    });

    it('debe ejecutar soft delete en la tarea manual', async () => {
      const mockEqEmpresa = vi.fn().mockResolvedValue({ error: null });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqEmpresa });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

      const { createServerSupabaseClient } = await import('@/infrastructure/persistence/supabase/server');
      vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
        },
        from: mockFrom
      } as any);

      const res = await eliminarTareaManualAction('task-uuid-456');

      expect(res.success).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('dashboard_tareas');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      );
    });
  });

  describe('4. obtenerDashboardDataAction con Tareas Manuales', () => {
    it('debe consultar y procesar alquileres, equipos, devoluciones y dashboard_tareas concurrentemente', async () => {
      const mockTareasFromDb = [
        {
          id: 'task-uuid-999',
          titulo: 'Verificar estado de batería generador',
          subtexto: 'Tarea manual personalizada',
          completada: false,
          urgencia: 'NORMAL',
          fecha_limite: '2026-10-05'
        }
      ];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'dashboard_tareas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({ data: mockTareasFromDb, error: null })
                    })
                  })
                })
              })
            })
          };
        }
        // Fallback genérico para alquileres, equipos, devoluciones, cotizaciones, facturas y pagos
        const createChainableQuery = () => {
          const queryObj: any = {};
          const resolveData = () => Promise.resolve({ data: [], error: null });
          queryObj.then = (resolve: any, reject: any) => resolveData().then(resolve, reject);
          queryObj.eq = vi.fn().mockReturnValue(queryObj);
          queryObj.is = vi.fn().mockReturnValue(queryObj);
          queryObj.order = vi.fn().mockReturnValue(queryObj);
          queryObj.limit = vi.fn().mockReturnValue(queryObj);
          return queryObj;
        };

        return {
          select: vi.fn().mockReturnValue(createChainableQuery())
        };
      });

      const { createServerSupabaseClient } = await import('@/infrastructure/persistence/supabase/server');
      vi.mocked(createServerSupabaseClient).mockResolvedValueOnce({
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } })
        },
        from: mockFrom
      } as any);

      const res = await obtenerDashboardDataAction(mockEmpresaId);

      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(res.data?.tareas.some((t) => t.id === 'task-uuid-999')).toBe(true);
    });
  });
});
