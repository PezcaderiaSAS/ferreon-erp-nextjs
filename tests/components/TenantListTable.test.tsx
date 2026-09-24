import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TenantListTable } from '@/components/ultraadmin/TenantListTable';
import { useUltraAdminStore } from '@/infrastructure/state/ultraAdminStore';

describe('Componente: TenantListTable', () => {
  const empresasMock = [
    {
      id: 'emp-001',
      nombre: 'Andamios & Equipos Bogotá SAS',
      nit: '900123456-1',
      ciudad: 'Bogotá',
      telefono: '3001234567',
      autorizado: false,
      subscription_status: 'trialing',
      estadoLicencia: 'VIGENTE',
      diasRestantes: 14,
      totalUsuarios: 2,
    },
    {
      id: 'emp-002',
      nombre: 'Construcciones Del Valle Ltda',
      nit: '800987654-3',
      ciudad: 'Cali',
      telefono: '3109876543',
      autorizado: true,
      subscription_status: 'active',
      estadoLicencia: 'VIGENTE',
      diasRestantes: 60,
      totalUsuarios: 5,
    },
    {
      id: 'emp-003',
      nombre: 'Maquinaria Antioquia SAS',
      nit: '901234567-8',
      ciudad: 'Medellín',
      telefono: '3157891234',
      autorizado: true,
      subscription_status: 'past_due',
      estadoLicencia: 'VENCIDA',
      diasRestantes: 0,
      totalUsuarios: 3,
    },
  ];

  beforeEach(() => {
    useUltraAdminStore.setState({
      empresas: empresasMock as any,
      filtroEstado: 'TODOS',
      tenantSeleccionado: null,
      drawerAbierto: false,
    });
  });

  it('renderiza la lista de empresas y los pills de filtrado', () => {
    render(<TenantListTable />);

    expect(screen.getByText('Andamios & Equipos Bogotá SAS')).toBeInTheDocument();
    expect(screen.getByText('Construcciones Del Valle Ltda')).toBeInTheDocument();
    expect(screen.getByText('Maquinaria Antioquia SAS')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pendientes de aprobación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /suspendidas/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expiradas/i })).toBeInTheDocument();
  });

  it('filtra correctamente al hacer clic en el pill "Pendientes de Aprobación"', async () => {
    const user = userEvent.setup();
    render(<TenantListTable />);

    const pillPendientes = screen.getByRole('button', { name: /pendientes de aprobación/i });
    await user.click(pillPendientes);

    // Solo debe verse la empresa no autorizada
    expect(screen.getByText('Andamios & Equipos Bogotá SAS')).toBeInTheDocument();
    expect(screen.queryByText('Construcciones Del Valle Ltda')).toBeNull();
    expect(screen.queryByText('Maquinaria Antioquia SAS')).toBeNull();
  });

  it('filtra correctamente al hacer clic en el pill "Activas"', async () => {
    const user = userEvent.setup();
    render(<TenantListTable />);

    const pillActivas = screen.getByRole('button', { name: /^activas$/i });
    await user.click(pillActivas);

    expect(screen.queryByText('Andamios & Equipos Bogotá SAS')).toBeNull();
    expect(screen.getByText('Construcciones Del Valle Ltda')).toBeInTheDocument();
    expect(screen.queryByText('Maquinaria Antioquia SAS')).toBeNull();
  });

  it('abre el drawer al hacer clic en una empresa o botón "Gestionar"', async () => {
    const user = userEvent.setup();
    render(<TenantListTable />);

    const botonesGestionar = screen.getAllByRole('button', { name: /gestionar/i });
    await user.click(botonesGestionar[0]);

    const state = useUltraAdminStore.getState();
    expect(state.drawerAbierto).toBe(true);
    expect(state.tenantSeleccionado?.id).toBe('emp-001');
  });
});
