import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlquilerForm } from '@/components/forms/AlquilerForm';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import * as alquilerSegmentadoActions from '@/app/actions/alquiler-segmentado';
import * as clientesActions from '@/app/actions/clientes';
import * as equiposActions from '@/app/actions/equipos';

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

const mockEquipos = [
  {
    id: 1,
    codigo: 'AND-01',
    nombre: 'Andamio Tubular 1.5m',
    tarifa_dia: 35000,
    tarifa_diaria: 35000,
    precioDiario: 35000,
    stock_disponible: 10,
    stockDisponible: 10,
    valor_reposicion: 2000000,
    valorReposicion: 2000000,
    estado: 'Activo',
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

describe('Pruebas E2E/Integración: Registro de Nuevo Alquiler y Respaldo Asistido de Colateral', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(clientesActions, 'obtenerClientesAction').mockResolvedValue({
      success: true,
      data: mockClientes as any,
    });

    vi.spyOn(equiposActions, 'obtenerEquiposAction').mockResolvedValue({
      success: true,
      data: mockEquipos as any,
    });

    useClienteStore.setState({
      clientes: mockClientes as any,
      isLoading: false,
    } as any);

    useBodegaStore.setState({
      equipos: mockEquipos as any,
      isLoading: false,
    } as any);

    useAlquilerStore.setState({
      alquileres: [],
    });
  });

  it('Permite avanzar de Paso 1 a Paso 3 sin bloqueos en Paso 2 y resolver colateral asistidamente en Paso 3', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="CONTRATO"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // 1. Paso 1: Seleccionar cliente
    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    await user.type(searchInput, 'Bolívar');

    const clienteOption = await screen.findByText('Constructora Bolívar S.A.');
    await user.click(clienteOption);

    // Avanzar al Paso 2
    const btnContinuar = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuar);

    // Verificamos Paso 2 (Equipos y Logística)
    await waitFor(() => {
      expect(screen.getByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();
    });

    // 2. Paso 2: Seleccionar equipo en el Combobox
    const comboboxInput = screen.getByPlaceholderText('Escriba nombre o código...');
    await user.type(comboboxInput, 'Andamio');

    const equipoOption = await screen.findByText(/Andamio Tubular 1.5m/i);
    await user.click(equipoOption);

    // Avanzar al Paso 3 (no debe bloquearse en Paso 2)
    await user.click(btnContinuar);

    // Verificamos que llegamos exitosamente al Paso 3 (Resumen y Liquidación)
    await waitFor(() => {
      expect(screen.getByText(/Condiciones Especiales y Logística/i)).toBeInTheDocument();
    });

    // En Paso 3: Inicialmente el colateral es insuficiente porque el depósito es $0
    expect(screen.getByText(/Atención: Colateral Insuficiente/i)).toBeInTheDocument();

    // Verificamos el botón de asistencia rápida: "Ajustar Depósito al 10%"
    const btnAjustarDeposito = screen.getByRole('button', { name: /Ajustar Depósito al 10%/i });
    expect(btnAjustarDeposito).toBeInTheDocument();

    // Al hacer clic en el botón de asistencia rápida
    await user.click(btnAjustarDeposito);

    // Ahora debe indicar que el colateral está cumplido
    await waitFor(() => {
      expect(screen.getByText(/Colateral de Seguridad Cumplido \(10%\)/i)).toBeInTheDocument();
    });

    // Mockeamos la respuesta de la Server Action
    vi.spyOn(alquilerSegmentadoActions, 'crearAlquilerSegmentadoAction').mockResolvedValueOnce({
      success: true,
      data: {
        id: 999,
        consecutivo: 'ALQ-999',
        estado: 'ACTIVO',
      } as any,
    });

    // Formalizar contrato
    const btnFormalizar = screen.getAllByRole('button', { name: /formalizar contrato/i })[0];
    await user.click(btnFormalizar);

    // Verificar que se invocó la Server Action con el depósito ajustado
    await waitFor(() => {
      expect(alquilerSegmentadoActions.crearAlquilerSegmentadoAction).toHaveBeenCalledTimes(1);
    });

    const callPayload = vi.mocked(alquilerSegmentadoActions.crearAlquilerSegmentadoAction).mock.calls[0][0] as any;
    expect(callPayload.clienteId).toBe('101');
    expect(callPayload.deposito).toBe(200000); // 10% de reposición de 2.000.000
    expect(callPayload.estado).toBe('ACTIVO');
    expect(callPayload.items).toHaveLength(1);
  });

  it('Permite exonerar colateral por crédito corporativo directamente en Paso 3', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="CONTRATO"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // Seleccionar cliente y avanzar a Paso 2
    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    await user.type(searchInput, 'Bolívar');
    const clienteOption = await screen.findByText('Constructora Bolívar S.A.');
    await user.click(clienteOption);

    const btnContinuar = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuar);

    // Seleccionar equipo y avanzar a Paso 3
    const comboboxInput = await screen.findByPlaceholderText('Escriba nombre o código...');
    await user.type(comboboxInput, 'Andamio');
    const equipoOption = await screen.findByText(/Andamio Tubular 1.5m/i);
    await user.click(equipoOption);

    await user.click(btnContinuar);

    await waitFor(() => {
      expect(screen.getByText(/Atención: Colateral Insuficiente/i)).toBeInTheDocument();
    });

    // Exonerar por crédito corporativo en Paso 3
    const btnExonerar = screen.getByRole('button', { name: /Exonerar por Crédito Corporativo/i });
    await user.click(btnExonerar);

    // Verificar que el estado cambia a exonerado
    await waitFor(() => {
      expect(screen.getByText(/Cliente Corporativo a Crédito \(Exonerado\)/i)).toBeInTheDocument();
    });

    vi.spyOn(alquilerSegmentadoActions, 'crearAlquilerSegmentadoAction').mockResolvedValueOnce({
      success: true,
      data: {
        id: 1000,
        consecutivo: 'ALQ-1000',
        estado: 'ACTIVO',
      } as any,
    });

    const btnFormalizar = screen.getAllByRole('button', { name: /formalizar contrato/i })[0];
    await user.click(btnFormalizar);

    await waitFor(() => {
      expect(alquilerSegmentadoActions.crearAlquilerSegmentadoAction).toHaveBeenCalledTimes(1);
    });

    const callPayload = vi.mocked(alquilerSegmentadoActions.crearAlquilerSegmentadoAction).mock.calls[0][0] as any;
    expect(callPayload.deposito).toBe(0);
    expect(callPayload.estado).toBe('ACTIVO');
  });

  it('Muestra un mensaje explicativo claro y destacado si se intenta avanzar del Paso 2 sin seleccionar equipo', async () => {
    const user = userEvent.setup();

    render(
      <AlquilerForm
        modoInicial="COTIZACION"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // 1. Paso 1: Seleccionar cliente y avanzar
    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    await user.type(searchInput, 'Bolívar');
    const clienteOption = await screen.findByText('Constructora Bolívar S.A.');
    await user.click(clienteOption);

    const btnContinuar = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuar);

    // Verificamos Paso 2
    await waitFor(() => {
      expect(screen.getByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();
    });

    // 2. Intentar avanzar al Paso 3 SIN seleccionar equipo
    await user.click(btnContinuar);

    // Debe mostrarse el mensaje explicativo en la pantalla indicando exactamente la causa
    await waitFor(() => {
      expect(screen.getAllByText(/Paso 2 \(Fila #1\): Debe seleccionar un equipo del catálogo para poder continuar al resumen\./i).length).toBeGreaterThan(0);
    });

    // El formulario no avanza a Paso 3, permanece en Paso 2
    expect(screen.getByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();
    expect(screen.queryByText(/Condiciones Especiales y Logística/i)).not.toBeInTheDocument();
  });

  it('Permite seleccionar equipos con stock 0 en Cotizaciones y avanzar exitosamente al Paso 3', async () => {
    const user = userEvent.setup();

    const mockEquipoSinStock = [
      {
        id: 99,
        codigo: 'TEST-01',
        nombre: 'EQUIPO TEST SCRATCH',
        tarifa_dia: 10000,
        tarifa_diaria: 10000,
        precioDiario: 10000,
        stock_disponible: 0,
        stockDisponible: 0,
        valor_reposicion: 1000000,
        valorReposicion: 1000000,
        estado: 'Activo',
      },
    ];

    vi.spyOn(equiposActions, 'obtenerEquiposAction').mockResolvedValue({
      success: true,
      data: mockEquipoSinStock as any,
    });

    useBodegaStore.setState({
      equipos: mockEquipoSinStock as any,
      isLoading: false,
    } as any);

    render(
      <AlquilerForm
        modoInicial="COTIZACION"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    // 1. Paso 1: Seleccionar cliente y avanzar
    const searchInput = screen.getByPlaceholderText('Escriba nombre o NIT para buscar...');
    await user.type(searchInput, 'Bolívar');
    const clienteOption = await screen.findByText('Constructora Bolívar S.A.');
    await user.click(clienteOption);

    const btnContinuar = screen.getByRole('button', { name: /continuar/i });
    await user.click(btnContinuar);

    // Verificamos Paso 2
    await waitFor(() => {
      expect(screen.getByText(/Maquinaria y Equipos Solicitados/i)).toBeInTheDocument();
    });

    // 2. Seleccionar equipo sin stock en bodega (debe estar habilitado para cotizaciones)
    const comboboxInput = screen.getByPlaceholderText('Escriba nombre o código...');
    await user.type(comboboxInput, 'EQUIPO TEST SCRATCH');

    const equipoOption = await screen.findByText(/EQUIPO TEST SCRATCH/i);
    await user.click(equipoOption);

    // 3. Hacer clic en Continuar -> Debe avanzar al Paso 3 sin trabas
    await user.click(btnContinuar);

    await waitFor(() => {
      expect(screen.getByText(/Condiciones Especiales y Logística/i)).toBeInTheDocument();
    });
  });
});
