import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TenantListTable } from '@/components/ultraadmin/TenantListTable';
import { TenantDetailDrawer } from '@/components/ultraadmin/TenantDetailDrawer';
import { useUltraAdminStore } from '@/infrastructure/state/ultraAdminStore';
import * as ultraadminActions from '@/app/actions/ultraadmin';

// Mocks de Server Actions de UltraAdmin
vi.mock('@/app/actions/ultraadmin', () => ({
  aprobarTenantAction: vi.fn(),
  extenderLicenciaEmpresaAction: vi.fn(),
  toggleModuloEmpresaAction: vi.fn(),
  obtenerUsuariosPorEmpresaAction: vi.fn().mockResolvedValue({ success: true, usuarios: [] }),
  cambiarEstadoUsuarioAction: vi.fn(),
}));

describe('Integración de Componentes: Gobernanza SaaS UltraAdmin', () => {
  const empresasIniciales = [
    {
      id: 'emp-prueba-01',
      nombre: 'Ferretería y Andamios El Constructor SAS',
      nit: '900555666-2',
      ciudad: 'Barranquilla',
      telefono: '3015556677',
      autorizado: false,
      subscription_status: 'trialing',
      estadoLicencia: 'VIGENTE',
      diasRestantes: 7,
      totalUsuarios: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    useUltraAdminStore.setState({
      empresas: empresasIniciales as any,
      filtroEstado: 'TODOS',
      tenantSeleccionado: null,
      drawerAbierto: false,
      isMutating: false,
    });
  });

  it('Flujo Completo: Seleccionar tenant pendiente, abrir drawer, autorizar tenant con Optimistic UI y actualizar tabla', async () => {
    const user = userEvent.setup();

    const mockAprobar = vi.spyOn(ultraadminActions, 'aprobarTenantAction')
      .mockResolvedValueOnce({
        success: true,
        autorizado: true,
      } as any);

    // Renderizamos la vista integrada: Tabla + Drawer
    render(
      <div>
        <TenantListTable />
        <TenantDetailDrawer />
      </div>
    );

    // 1. Verificar estado inicial: Empresa en modo prueba (No autorizada)
    expect(screen.getByText('Ferretería y Andamios El Constructor SAS')).toBeInTheDocument();
    expect(screen.getByText(/Pendiente \(Trial\)/i)).toBeInTheDocument();

    // 2. Abrir el drawer de gobernanza haciendo clic en Gestionar
    const botonGestionar = screen.getByRole('button', { name: /gestionar/i });
    await user.click(botonGestionar);

    // 3. El Drawer se abre con la información del tenant
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Ferretería y Andamios/i })).toBeInTheDocument();
      expect(screen.getAllByText(/900555666-2/i).length).toBeGreaterThanOrEqual(1);
    });

    // 4. El switch de aprobación debe estar visible (botón de autorización)
    const botonSwitchAutorizar = screen.getByRole('button', { name: /aprobar oficialmente/i });
    expect(botonSwitchAutorizar).toBeInTheDocument();

    // 5. El UltraAdmin hace clic para autorizar oficialmente la empresa
    await user.click(botonSwitchAutorizar);

    // 6. Debe haberse llamado a la Server Action con idempotencia
    await waitFor(() => {
      expect(mockAprobar).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'emp-prueba-01',
          autorizado: true,
        })
      );
    });

    // 7. Optimistic UI: El store se actualiza de inmediato
    await waitFor(() => {
      const tenantEnStore = useUltraAdminStore.getState().empresas.find(e => e.id === 'emp-prueba-01');
      expect(tenantEnStore?.autorizado).toBe(true);
    });

    // 8. Mensaje de feedback de éxito en pantalla
    await waitFor(() => {
      expect(screen.getByText(/Tenant autorizado oficialmente/i)).toBeInTheDocument();
    });
  });

  it('Flujo de Licencias: Extender vigencia de suscripción por 30 días', async () => {
    const user = userEvent.setup();

    const mockExtender = vi.spyOn(ultraadminActions, 'extenderLicenciaEmpresaAction')
      .mockResolvedValueOnce({
        success: true,
        nuevaFechaExpiracion: '2026-11-24T23:59:59.000Z',
      } as any);

    // Seleccionar y abrir drawer directamente
    useUltraAdminStore.setState({
      tenantSeleccionado: empresasIniciales[0] as any,
      drawerAbierto: true,
    });

    render(<TenantDetailDrawer />);

    // Navegar a la pestaña "Licencia & Módulos"
    const tabLicencias = screen.getByRole('button', { name: /licencia & módulos/i });
    await user.click(tabLicencias);

    // Presionar el botón de extender (+30 días)
    const botonExtender30 = screen.getByRole('button', { name: /\+30 días/i });
    await user.click(botonExtender30);

    await waitFor(() => {
      expect(mockExtender).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'emp-prueba-01',
          diasExtender: 30,
        })
      );
    });

    // Verificar actualización optimista en el store
    await waitFor(() => {
      const tenant = useUltraAdminStore.getState().tenantSeleccionado;
      expect(tenant?.subscription_status).toBe('active');
    });
  });
});
