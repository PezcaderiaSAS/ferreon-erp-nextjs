import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertirCotizacionModal } from '@/components/forms/cotizaciones/ConvertirCotizacionModal';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import * as cotizacionesActions from '@/app/actions/cotizaciones';

vi.mock('@/app/actions/cotizaciones', () => ({
  convertirCotizacionAContratoAction: vi.fn(),
}));

describe('Integración de Componentes: Flujo de Formalización de Cotizaciones a Contrato', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Inicializar inventario en BodegaStore
    useBodegaStore.setState({
      equipos: [
        {
          id: 10,
          codigo: 'AND-01',
          nombre: 'Andamio Tubular Estándar',
          stock_disponible: 8,
          stockDisponible: 8,
        } as any,
      ],
    });

    // Inicializar alquileres en AlquilerStore con una cotización in-situ (ID "17")
    useAlquilerStore.setState({
      alquileres: [
        {
          id: '17',
          consecutivo: 'COT-017',
          cliente_id: 'CLI-50',
          cliente_nombre: 'Constructora Bolívar',
          estado: 'COTIZACION',
          total: 600000,
          deposito: 100000,
          fecha_inicio_contrato: '2026-10-01',
          fecha_fin_estimada: '2026-10-15',
          detalles: [
            {
              id: 501,
              equipo_id: 10,
              nombre: 'Andamio Tubular Estándar',
              cantidad: 3,
              tarifa_diaria: 15000,
              es_subcontratado: false,
            },
          ],
        } as any,
      ],
    });
  });

  it('Flujo 1: Formalización in-situ de ID 17 actualiza el estado a ACTIVO en AlquilerStore sin crear registros duplicados', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    const actionMock = vi.spyOn(cotizacionesActions, 'convertirCotizacionAContratoAction')
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 17,
          consecutivo: 'ALQ-017',
          estado: 'ACTIVO',
          cliente_nombre: 'Constructora Bolívar',
          total: 600000,
        } as any,
      });

    // Callback de éxito que simula la sincronización con el store de alquileres
    const handleSuccess = (contratoFormalizado: any) => {
      const store = useAlquilerStore.getState();
      // En formalización in-situ, actualiza el registro existente
      const actualizados = store.alquileres.map((alq) =>
        String(alq.id) === String(contratoFormalizado.id)
          ? { ...alq, estado: contratoFormalizado.estado, consecutivo: contratoFormalizado.consecutivo }
          : alq
      );
      useAlquilerStore.setState({ alquileres: actualizados });
    };

    const cotizacionActual = useAlquilerStore.getState().alquileres[0];

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={handleClose}
        cotizacion={cotizacionActual}
        onSuccess={handleSuccess}
      />
    );

    // El modal muestra los datos de la cotización
    expect(screen.getByRole('heading', { name: /formalizar contrato/i })).toBeInTheDocument();
    expect(screen.getByText(/Constructora Bolívar/i)).toBeInTheDocument();

    // El usuario pulsa formalizar
    const botonFormalizar = screen.getByRole('button', { name: /formalizar contrato/i });
    await user.click(botonFormalizar);

    // Debe invocar la server action con el ID '17'
    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cotizacionId: '17',
        })
      );
    });

    // Se actualiza el store inmutablemente
    await waitFor(() => {
      const storeActual = useAlquilerStore.getState();
      expect(storeActual.alquileres.length).toBe(1); // No hay duplicación
      expect(storeActual.alquileres[0].estado).toBe('ACTIVO');
      expect(storeActual.alquileres[0].consecutivo).toBe('ALQ-017');
    }, { timeout: 3500 });
  });

  it('Flujo 2: Ratificación de fecha expirada envía la nueva fecha a la Server Action y formaliza', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    const actionMock = vi.spyOn(cotizacionesActions, 'convertirCotizacionAContratoAction')
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 17,
          estado: 'ACTIVO',
          fecha_inicio_contrato: '2026-10-15',
        } as any,
      });

    // Cotización con fecha original vencida
    const cotizacionExpirada = {
      ...useAlquilerStore.getState().alquileres[0],
      fecha_inicio: '2026-07-01',
    };

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={handleClose}
        cotizacion={cotizacionExpirada}
      />
    );

    // Detecta expiración y solicita ratificación
    expect(screen.getByText(/Ratificación de Fecha de Despacho Requerida/i)).toBeInTheDocument();

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    // Cambiar la fecha de inicio
    await user.clear(dateInput);
    await user.type(dateInput, '2026-10-15');

    const botonFormalizar = screen.getByRole('button', { name: /formalizar contrato/i });
    await user.click(botonFormalizar);

    await waitFor(() => {
      expect(actionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cotizacionId: '17',
          nuevaFechaInicio: '2026-10-15',
        })
      );
    });
  });

  it('Flujo 3: Manejo asistido de Overbooking Concurrente con redirección a subcontrataciones', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.spyOn(cotizacionesActions, 'convertirCotizacionAContratoAction')
      .mockResolvedValueOnce({
        success: false,
        codigoError: 'ERR_OVERBOOKING_CONCURRENTE',
        error: 'ERR_OVERBOOKING_CONCURRENTE: Déficit de 2 unidades para Andamio',
        esErrorStock: true,
      });

    const cotizacion = useAlquilerStore.getState().alquileres[0];

    render(
      <ConvertirCotizacionModal
        isOpen={true}
        onClose={handleClose}
        cotizacion={cotizacion}
      />
    );

    const botonFormalizar = screen.getByRole('button', { name: /formalizar contrato/i });
    await user.click(botonFormalizar);

    await waitFor(() => {
      expect(screen.getByText(/ERR_OVERBOOKING_CONCURRENTE/i)).toBeInTheDocument();
      const linkSubcontrataciones = screen.getByRole('link', { name: /subcontratar equipo/i });
      expect(linkSubcontrataciones).toHaveAttribute('href', '/subcontrataciones?cotizacionId=17');
    }, { timeout: 3000 });
  });
});
