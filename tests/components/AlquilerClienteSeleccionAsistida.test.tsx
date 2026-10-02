import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlquilerForm } from '@/components/forms/AlquilerForm';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';

const mockClientesData = [
  {
    id: 101,
    nombre: 'Constructora Bolívar S.A.',
    nit_cedula: '900123456-1',
    telefono: '3109876543',
    contacto: 'Ing. Carlos Mendoza',
    estado: 'Activo',
  },
  {
    id: 102,
    nombre: 'Ingeniería & Diseños SAS',
    nit_cedula: '901987654-2',
    telefono: '3151234567',
    contacto: 'Dra. María Ospina',
    estado: 'Activo',
  },
];

// Mock de fetch para catálogos
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/clientes')) {
    return Promise.resolve({
      json: () => Promise.resolve({ success: true, data: mockClientesData }),
    });
  }
  if (url.includes('/api/equipos')) {
    return Promise.resolve({
      json: () => Promise.resolve({ success: true, data: [] }),
    });
  }
  return Promise.resolve({
    json: () => Promise.resolve({ success: true, data: {} }),
  });
});

describe('Componente: AlquilerForm - Selección Asistida de Cliente (Bugfix)', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Inicializar tiendas con datos de prueba
    useClienteStore.setState({
      clientes: [
        {
          id: 101,
          nombre: 'Constructora Bolívar S.A.',
          nit_cedula: '900123456-1',
          telefono: '3109876543',
          contacto: 'Ing. Carlos Mendoza',
          estado: 'Activo',
        } as any,
        {
          id: 102,
          nombre: 'Ingeniería & Diseños SAS',
          nit_cedula: '901987654-2',
          telefono: '3151234567',
          contacto: 'Dra. María Ospina',
          estado: 'Activo',
        } as any,
      ],
      isLoading: false,
    });

    useBodegaStore.setState({
      equipos: [
        {
          id: 1,
          codigo: 'AND-01',
          nombre: 'Andamio Tubular 1.5m',
          tarifa_diaria: 35000,
          precioDiario: 35000,
          stock_disponible: 10,
          stockDisponible: 10,
          estado: 'Activo',
        } as any,
      ],
      isLoading: false,
    });

    useAlquilerStore.setState({
      alquileres: [],
    });
  });

  it('al iniciar un nuevo registro, el campo de cliente NO está bloqueado y muestra el buscador asistido', () => {
    render(
      <AlquilerForm
        modoInicial="COTIZACION"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // 1. Debe mostrar el label de campo abierto y el botón "+ Nuevo Cliente"
    expect(screen.getByText('Cliente / Razón Social *')).toBeInTheDocument();
    expect(screen.getByText('+ Nuevo Cliente')).toBeInTheDocument();

    // 2. NO debe haber ningún texto de bloqueo ni candado
    expect(screen.queryByText('Cliente Vinculado (Solo Lectura)')).toBeNull();
    expect(screen.queryByText('Bloqueado')).toBeNull();

    // 3. El input de búsqueda asistida debe estar presente y habilitado
    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).not.toBeDisabled();
  });

  it('permite buscar y seleccionar un cliente asistidamente en un nuevo registro', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="CONTRATO"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    
    // Escribir en el buscador
    await user.type(searchInput, 'Bolívar');

    // Debe desplegar las opciones coincidentes
    const clienteOption = await screen.findByText('Constructora Bolívar S.A.');
    expect(clienteOption).toBeInTheDocument();

    // Seleccionar cliente
    await user.click(clienteOption);

    // Debe mostrar la tarjeta del cliente seleccionado con NIT y botón Cambiar
    expect(screen.getByText('Constructora Bolívar S.A.')).toBeInTheDocument();
    expect(screen.getByText(/NIT: 900123456-1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cambiar' })).toBeInTheDocument();

    // Si se presiona Cambiar, debe volver a abrir el buscador asistido
    await user.click(screen.getByRole('button', { name: 'Cambiar' }));
    expect(screen.getByPlaceholderText('Escriba nombre o NIT para buscar...')).toBeInTheDocument();
  });

  it('en modo edición con contrato existente y cliente fijado, muestra el cliente vinculado', () => {
    const contratoExistente = {
      id: 45,
      consecutivo: 1045,
      cliente_id: 101,
      clienteId: '101',
      clienteNombre: 'Constructora Bolívar S.A.',
      clienteNit: '900123456-1',
      estado: 'ACTIVO',
      tipoDocumento: 'CONTRATO',
      detalles: [],
    };

    render(
      <AlquilerForm
        initialData={contratoExistente}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Cliente Vinculado (Solo Lectura)')).toBeInTheDocument();
    expect(screen.getByText('Constructora Bolívar S.A.')).toBeInTheDocument();
    expect(screen.getByText('Vinculado a Contrato')).toBeInTheDocument();
  });
});
