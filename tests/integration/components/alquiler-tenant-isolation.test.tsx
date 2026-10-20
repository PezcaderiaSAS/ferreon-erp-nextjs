import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlquilerForm } from '@/components/forms/AlquilerForm';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { useEmpresaStore } from '@/infrastructure/state/empresaStore';
import { unifiedLogout } from '@/lib/auth/logout';
import * as clientesActions from '@/app/actions/clientes';
import * as equiposActions from '@/app/actions/equipos';

const TENANT_ACTIVO = 'ac8719ea-f16a-4538-b308-40d9511a14cb'; // FERREON
const TENANT_AJENO = 'e2f05234-9d73-4e88-a223-ce546d838d92';  // Ferretería Josase

const mockClientes = [
  {
    id: 101,
    nombre: 'Constructora Bolívar S.A.',
    nit_cedula: '900123456-1',
    telefono: '3109876543',
    contacto: 'Ing. Carlos Mendoza',
    estado: 'Activo',
  },
];

const mockEquiposMixtos = [
  {
    id: 1,
    codigo: 'AND-01',
    nombre: 'Andamio Tubular Propio',
    tarifa_diaria: 35000,
    precioDiario: 35000,
    stock_disponible: 10,
    stockDisponible: 10,
    valor_reposicion: 2000000,
    valorReposicion: 2000000,
    estado: 'Activo',
    empresaId: TENANT_ACTIVO,
  },
  {
    id: 106,
    codigo: 'FOR-106',
    nombre: 'FORMALETA METALICA DE 15CM (Ajena)',
    tarifa_diaria: 12000,
    precioDiario: 12000,
    stock_disponible: 5,
    stockDisponible: 5,
    valor_reposicion: 800000,
    valorReposicion: 800000,
    estado: 'Activo',
    empresaId: TENANT_AJENO,
  },
];

vi.mock('@/app/actions/alquiler-segmentado', () => ({
  crearAlquilerSegmentadoAction: vi.fn(),
}));

vi.mock('@/app/actions/equipos', () => ({
  obtenerEquiposAction: vi.fn(),
}));

vi.mock('@/app/actions/clientes', () => ({
  obtenerClientesAction: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe('Pruebas de Blindaje Multi-Tenant y Purga de Memoria en Alquileres', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(clientesActions, 'obtenerClientesAction').mockResolvedValue({
      success: true,
      data: mockClientes as any,
    });

    vi.spyOn(equiposActions, 'obtenerEquiposAction').mockResolvedValue({
      success: true,
      data: mockEquiposMixtos as any,
    });

    useEmpresaStore.setState({
      config: {
        id: TENANT_ACTIVO,
        nombre: 'FERREON',
        nit: '900000000-1',
        autorizado: true,
        subscription_status: 'active',
      } as any,
    });

    useClienteStore.setState({
      clientes: mockClientes as any,
      isLoading: false,
    } as any);

    useBodegaStore.setState({
      equipos: mockEquiposMixtos as any,
      isLoading: false,
    } as any);
  });

  it('useBodegaStore.resetStore purga completamente los equipos en memoria', () => {
    expect(useBodegaStore.getState().equipos.length).toBe(2);
    useBodegaStore.getState().resetStore();
    expect(useBodegaStore.getState().equipos.length).toBe(0);
  });

  it('El combobox de maquinaria solo lista los equipos del tenant activo y excluye los ajenos', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="CONTRATO"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          cliente_id: '101',
          cliente: mockClientes[0],
          cliente_nombre: 'Constructora Bolívar S.A.',
        } as any}
      />
    );

    // Avanzar a Paso 2
    const btnContinuar = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuar);

    await waitFor(() => {
      expect(screen.getByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();
    });

    // Abrir combobox de selección de equipo mediante focus/click
    const comboboxInput = screen.getByRole('combobox');
    await user.click(comboboxInput);

    // Debe aparecer el equipo propio del tenant activo
    expect(await screen.findByText(/Andamio Tubular Propio/i)).toBeInTheDocument();

    // NO debe aparecer en el DOM el equipo ajeno de Ferretería Josase
    expect(screen.queryByText(/FORMALETA METALICA DE 15CM/i)).not.toBeInTheDocument();
  });

  it('El formulario bloquea el avance al Paso 3 si contiene un equipo que pertenece a otro tenant', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="CONTRATO"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          cliente_id: '101',
          cliente: mockClientes[0],
          cliente_nombre: 'Constructora Bolívar S.A.',
          detalles: [
            {
              id: 'det_1',
              equipo_id: '106', // Equipo ID 106 perteneciente a TENANT_AJENO
              cantidad: 2,
              tarifa_aplicada: 12000,
              subtotal_linea: 24000,
            },
          ],
        } as any}
      />
    );

    // 1. Paso 1: Avanzar a Paso 2
    const btnContinuarPaso1 = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuarPaso1);

    // 2. Verificar que estamos en Paso 2
    expect(await screen.findByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();

    // 3. Intentar avanzar al Paso 3 con el equipo ajeno en la lista
    const btnContinuarPaso2 = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuarPaso2);

    // 4. Debe bloquear el avance y mostrar el mensaje Poka-Yoke de aislamiento de tenant
    await waitFor(() => {
      const msgs = screen.getAllByText('Paso 2 (Fila #1)', { exact: false });
      expect(msgs.length).toBeGreaterThan(0);
    });

    // 5. No debe haber avanzado al Paso 3 (debe seguir en el Paso 2)
    expect(screen.queryByText(/Condiciones Especiales y Logística/i)).not.toBeInTheDocument();
  });

  it('unifiedLogout purga los almacenes de Zustand en memoria', async () => {
    useBodegaStore.setState({ equipos: mockEquiposMixtos as any });
    expect(useBodegaStore.getState().equipos.length).toBe(2);

    await unifiedLogout();

    expect(useBodegaStore.getState().equipos.length).toBe(0);
  });
});
