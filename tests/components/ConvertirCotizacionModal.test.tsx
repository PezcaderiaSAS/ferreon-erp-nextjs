import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertirCotizacionModal } from '@/components/forms/cotizaciones/ConvertirCotizacionModal';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import * as cotizacionesActions from '@/app/actions/cotizaciones';

// Mock de Server Action
vi.mock('@/app/actions/cotizaciones', () => ({
  convertirCotizacionAContratoAction: vi.fn(),
}));

describe('Componente: ConvertirCotizacionModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Estado inicial de Bodega
    useBodegaStore.setState({
      equipos: [
        {
          id: 1,
          codigo: 'AND-01',
          nombre: 'Andamio Tubular 1.5m',
          stock_disponible: 5,
          stockDisponible: 5,
        } as any,
        {
          id: 2,
          codigo: 'TAL-01',
          nombre: 'Taladro Percutor Bosch',
          stock_disponible: 0,
          stockDisponible: 0,
        } as any,
      ],
    });

    useAlquilerStore.setState({
      alquileres: [],
    });
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <ConvertirCotizacionModal
        isOpen={false}
        onClose={mockOnClose}
        cotizacion={{ id: '17', cliente_nombre: 'Cliente Prueba' }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza encabezado, cliente, consecutivo y equipos cuando isOpen es true', () => {
    const cotizacionMock = {
      id: '17',
      consecutivo: 'COT-017',
      cliente_nombre: 'Constructora Capital',
      fecha_inicio: '2026-10-01',
      fecha_fin_estimada: '2026-10-15',
      detalles: [
        {
          id: 101,
          equipo_id: 1,
          nombre: 'Andamio Tubular 1.5m',
          codigo: 'AND-01',
          cantidad: 2,
          tarifa_diaria: 15000,
          es_subcontratado: false,
        },
      ],
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={mockOnClose}
        cotizacion={cotizacionMock}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('heading', { name: /formalizar contrato/i })).toBeInTheDocument();
    expect(screen.getByText(/Constructora Capital/i)).toBeInTheDocument();
    expect(screen.getByText(/COT-017/i)).toBeInTheDocument();
    expect(screen.getByText('Andamio Tubular 1.5m')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /formalizar contrato/i })).toBeInTheDocument();
  });

  it('excluye ítems subcontratados de la verificación de stock propio de bodega', () => {
    const cotizacionConSubcontratado = {
      id: 'COT-SUB-01',
      cliente_nombre: 'Constructora Metro',
      fecha_inicio: '2026-10-05',
      detalles: [
        {
          id: 201,
          equipo_id: 2, // Taladro tiene stock 0 en bodega
          nombre: 'Taladro Percutor Bosch',
          codigo: 'TAL-01',
          cantidad: 3,
          tarifa_diaria: 25000,
          es_subcontratado: true, // Subcontratado con tercero
        },
      ],
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={mockOnClose}
        cotizacion={cotizacionConSubcontratado}
      />
    );

    // Debe mostrar la etiqueta de Tercero / Subcontratado
    expect(screen.getByText(/Subcontratado/i)).toBeInTheDocument();
    // Y no debe mostrar alerta de faltante estático para este ítem
    expect(screen.queryByText(/Faltan/i)).toBeNull();
  });

  it('detecta fecha de inicio en el pasado y solicita ratificación interactiva con selector de fecha', async () => {
    const cotizacionExpirada = {
      id: '17',
      cliente_nombre: 'Ingeniería Global',
      fecha_inicio: '2026-08-01', // En el pasado
      detalles: [
        {
          id: 101,
          equipo_id: 1,
          nombre: 'Andamio Tubular 1.5m',
          cantidad: 1,
          tarifa_diaria: 15000,
        },
      ],
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={mockOnClose}
        cotizacion={cotizacionExpirada}
      />
    );

    // Debe mostrar el banner de ratificación de fecha
    expect(screen.getByText(/Ratificación de Fecha de Despacho Requerida/i)).toBeInTheDocument();
    expect(screen.getByText(/está en el pasado/i)).toBeInTheDocument();

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    expect(dateInput).toBeInTheDocument();
  });

  it('ejecuta formalización exitosa e invoca onSuccess y onClose tras completar la transacción', async () => {
    const user = userEvent.setup();
    const actionSpy = vi.spyOn(cotizacionesActions, 'convertirCotizacionAContratoAction')
      .mockResolvedValueOnce({
        success: true,
        data: { id: 17, consecutivo: 'ALQ-017', estado: 'ACTIVO' } as any,
      });

    const cotizacionMock = {
      id: '17',
      cliente_nombre: 'Constructora Bolívar',
      fecha_inicio: '2026-10-10',
      detalles: [
        {
          id: 101,
          equipo_id: 1,
          nombre: 'Andamio Tubular',
          cantidad: 1,
          tarifa_diaria: 10000,
        },
      ],
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={mockOnClose}
        cotizacion={cotizacionMock}
        onSuccess={mockOnSuccess}
      />
    );

    const btnFormalizar = screen.getByRole('button', { name: /formalizar contrato/i });
    await user.click(btnFormalizar);

    await waitFor(() => {
      expect(actionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          cotizacionId: '17',
        })
      );
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 17, estado: 'ACTIVO' })
      );
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3500 });
  });

  it('muestra mensaje de error estructurado cuando la Server Action retorna error de stock', async () => {
    const user = userEvent.setup();
    vi.spyOn(cotizacionesActions, 'convertirCotizacionAContratoAction')
      .mockResolvedValueOnce({
        success: false,
        codigoError: 'ERR_OVERBOOKING_CONCURRENTE',
        error: 'ERR_OVERBOOKING_CONCURRENTE: Stock insuficiente para Andamio',
        esErrorStock: true,
      });

    const cotizacionMock = {
      id: '17',
      cliente_nombre: 'Constructora Bolívar',
      fecha_inicio: '2026-10-10',
      detalles: [
        {
          id: 101,
          equipo_id: 1,
          nombre: 'Andamio',
          cantidad: 10,
          tarifa_diaria: 10000,
        },
      ],
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={mockOnClose}
        cotizacion={cotizacionMock}
        onSuccess={mockOnSuccess}
      />
    );

    const btnFormalizar = screen.getByRole('button', { name: /formalizar contrato/i });
    await user.click(btnFormalizar);

    await waitFor(() => {
      expect(screen.getByText(/ERR_OVERBOOKING_CONCURRENTE/i)).toBeInTheDocument();
      expect(screen.getByText(/Subcontratar Equipo/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
