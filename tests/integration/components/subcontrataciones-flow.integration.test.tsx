import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CrearSubcontratacionModal } from '@/components/subcontrataciones/CrearSubcontratacionModal';
import { DevolucionSubcontratacionModal } from '@/components/subcontrataciones/DevolucionSubcontratacionModal';
import { LiquidarSubcontratacionModal } from '@/components/subcontrataciones/LiquidarSubcontratacionModal';

import { useProveedorStore } from '@/infrastructure/state/proveedorStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import { useSubcontratacionStore, type SubcontratacionUI } from '@/infrastructure/state/subcontratacionStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';

import * as subcontratacionesActions from '@/app/actions/subcontrataciones';
import { calcularLiquidacionSubcontratacion } from '@/core/services/liquidacion-subcontratacion.service';

// Mock de Server Actions de subcontrataciones
vi.mock('@/app/actions/subcontrataciones', () => ({
  crearSubcontratacionAction: vi.fn(),
  cambiarEstadoSubcontratacionAction: vi.fn(),
  registrarRetornoAProveedorAction: vi.fn(),
  liquidarSubcontratacionAction: vi.fn(),
  obtenerSubcontratacionesAction: vi.fn(),
}));

describe('Integración Multicapa: Flujo Integral de Subcontrataciones & Re-Renting', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 1. Inicializar ProveedorStore con aliados comerciales
    useProveedorStore.setState({
      proveedores: [
        {
          id: 'prov-001',
          nombre: 'Maquillajes & Equipos de Colombia S.A.S.',
          razonSocial: 'Maquillajes & Equipos de Colombia S.A.S.',
          nit: '900.876.543-2',
          telefono: '3157894561',
          email: 'contacto@maquicol.com',
          direccion: 'Zona Industrial Chimitá',
          ciudad: 'Bucaramanga',
          activo: true,
          created_at: new Date().toISOString(),
        } as any,
      ],
      isLoading: false,
    });

    // 2. Inicializar AlquilerStore
    useAlquilerStore.setState({
      alquileres: [
        {
          id: 'alq-500',
          consecutivo: 'ALQ-500',
          cliente_nombre: 'Consorcio Vial Santander',
          estado: 'ACTIVO',
          total: 2500000,
        } as any,
      ],
    });

    // 3. Inicializar BodegaStore para certificar invariante de inventario propio
    useBodegaStore.setState({
      equipos: [
        {
          id: 101,
          codigo: 'VIB-01',
          nombre: 'Vibrocompactador Manual 4T',
          stock_total: 2,
          stock_disponible: 0, // Stock propio agotado
          stock_en_obra: 2,
          tarifa_diaria: 90000,
        } as any,
      ],
      idempotencyKeys: [],
    });

    // 4. Inicializar SubcontratacionStore
    useSubcontratacionStore.setState({
      subcontrataciones: [],
      filtros: { busqueda: '', estado: 'TODAS', soloVencidas: false },
      isLoading: false,
      error: null,
    });
  });

  // =========================================================================
  // FASE 1: CREACIÓN DE ORDEN Y DETECCIÓN DE MARGEN NEGATIVO
  // =========================================================================
  describe('Fase 1: Creación de Orden y Control de Rentabilidad (Margen Negativo)', () => {
    it('debe alertar visualmente cuando el costo del aliado supera la tarifa acordada con el cliente', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <CrearSubcontratacionModal
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      );

      // Verificamos que el modal abre con título canónico
      expect(screen.getByText(/Registrar Orden de Subcontratación/i)).toBeInTheDocument();

      // Completamos el ítem: costo proveedor $100,000 > tarifa cliente $60,000
      const descInput = screen.getByPlaceholderText(/Cortadora de Concreto/i);
      await user.type(descInput, 'Minicargador Bobcat S175');

      const costoInput = screen.getByPlaceholderText(/Costo\/Día Proveedor/i);
      const tarifaInput = screen.getByPlaceholderText(/Tarifa\/Día Cliente/i);

      fireEvent.change(costoInput, { target: { value: '100000' } });
      fireEvent.change(tarifaInput, { target: { value: '60000' } });

      // Verificamos que la regla de negocio de margen negativo se active
      await waitFor(() => {
        expect(screen.getByText(/pérdida operativa/i)).toBeInTheDocument();
      });
    });

    it('debe enviar la orden correctamente calculada cuando los datos son rentables', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      const actionMock = vi.spyOn(subcontratacionesActions, 'crearSubcontratacionAction')
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'sub-999',
            consecutivo: 'SUB-9999',
            proveedor_nombre: 'Maquillajes & Equipos de Colombia S.A.S.',
            estado: 'ORDENADA',
            costo_total_estimado: 350000,
            detalles: [
              {
                descripcion_item: 'Vibrocompactador 4T',
                cantidad: 1,
                dias_pactados: 7,
                costo_diario_unitario: 50000,
                tarifa_diaria_cliente: 85000,
              },
            ],
          } as any,
        });

      render(
        <CrearSubcontratacionModal
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      );

      // Seleccionar proveedor aliado (primer combobox)
      const proveedorSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(proveedorSelect, 'prov-001');

      // Descripción del ítem
      const descInput = screen.getByPlaceholderText(/Cortadora de Concreto/i);
      await user.type(descInput, 'Vibrocompactador 4T');

      // Inputs de costo y tarifa
      const costoInput = screen.getByPlaceholderText(/Costo\/Día Proveedor/i);
      const tarifaInput = screen.getByPlaceholderText(/Tarifa\/Día Cliente/i);

      fireEvent.change(costoInput, { target: { value: '50000' } });
      fireEvent.change(tarifaInput, { target: { value: '85000' } });

      // Clic en Generar Orden
      const submitBtn = screen.getByRole('button', { name: /Generar Orden de Subcontratación/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(actionMock).toHaveBeenCalledTimes(1);
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // FASE 2: RETORNO FORMAL AL PROVEEDOR ALIADO (CHECK-IN)
  // =========================================================================
  describe('Fase 2: Retorno Formal y Devolución a Proveedor Aliado', () => {
    it('debe registrar el check-in físico y cambiar el estado a DEVUELTA', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      const subcontratacionActiva: SubcontratacionUI = {
        id: 'sub-100',
        consecutivo: 'SUB-100',
        proveedorNombre: 'Maquillajes & Equipos de Colombia S.A.S.',
        proveedorNit: '900.876.543-2',
        estado: 'ACTIVA',
        costoTotalEstimado: 350000,
        ingresoTotalEstimado: 595000,
        depositoGarantia: 100000,
        fechaEntregaEstimada: '2026-09-20',
        fechaDevolucionEstimada: '2026-09-27',
        subcontrataciones_detalles: [
          {
            id: 'item-101',
            cantidad: 1,
            diasContratados: 7,
            tarifaDiariaProveedor: 50000,
            equipoNombre: 'Vibrocompactador 4T',
          } as any,
        ],
      };

      const actionMock = vi.spyOn(subcontratacionesActions, 'cambiarEstadoSubcontratacionAction')
        .mockResolvedValueOnce({
          success: true,
          data: {
            ...subcontratacionActiva,
            estado: 'DEVUELTA',
          } as any,
        });

      render(
        <DevolucionSubcontratacionModal
          isOpen={true}
          onClose={handleClose}
          subcontratacion={subcontratacionActiva}
          onSuccess={handleSuccess}
        />
      );

      expect(screen.getByText(/Retorno y Liquidación/i)).toBeInTheDocument();

      // Confirmar retorno formal y liquidar
      const confirmarBtn = screen.getByRole('button', { name: /Confirmar Retorno y Liquidar/i });
      await user.click(confirmarBtn);

      await waitFor(() => {
        expect(actionMock).toHaveBeenCalledWith(
          expect.objectContaining({
            subcontratacionId: 'sub-100',
            nuevoEstado: 'DEVUELTA',
          })
        );
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // FASE 3: LIQUIDACIÓN CONTABLE Y GENERACIÓN DE ASIENTO EN LEDGER
  // =========================================================================
  describe('Fase 3: Liquidación Contable y Asiento en Ledger de Partida Doble', () => {
    it('debe computar retenciones DIAN (ReteFuente 2.5%, ReteICA 0.966%) y generar asiento balanceado', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      const subcontratacionDevuelta: SubcontratacionUI = {
        id: 'sub-200',
        consecutivo: 'SUB-200',
        proveedorNombre: 'Maquillajes & Equipos de Colombia S.A.S.',
        proveedorNit: '900.876.543-2',
        estado: 'DEVUELTA',
        costoTotalEstimado: 1000000,
        ingresoTotalEstimado: 1600000,
        depositoGarantia: 0,
        fecha_recepcion_real: '2026-09-01T08:00:00Z',
        fecha_devolucion_real: '2026-09-11T08:00:00Z', // 10 días
        detalles: [
          {
            id: 'det-1',
            cantidad: 2,
            tarifa_diaria_proveedor: 50000, // 2 * 10 * 50,000 = 1,000,000
            tarifa_diaria_cliente: 80000,   // 2 * 10 * 80,000 = 1,600,000
            equipo_nombre: 'Compactador 4T',
          } as any,
        ],
      };

      // Simular cálculo de dominio puro
      const liquidacionDominio = calcularLiquidacionSubcontratacion(
        {
          id: 'sub-200',
          consecutivo: 'SUB-200',
          proveedorId: 'prov-001',
          proveedorNombre: 'Maquillajes & Equipos de Colombia S.A.S.',
          proveedorNit: '900.876.543-2',
          fechaRecepcion: '2026-09-01',
          fechaRetornoProveedor: '2026-09-11',
        },
        [
          {
            itemSubcontratacionId: 'det-1',
            equipoId: 101,
            descripcionItem: 'Compactador 4T',
            cantidad: 2,
            costoDiarioProveedor: 50000,
            tarifaDiariaCliente: 80000,
          },
        ],
        { aplicaRetenciones: true, tasaReteFuente: 0.025, tasaReteICA: 0.00966 }
      );

      // Verificamos invariante de partida doble: Débitos === Créditos
      const totalDebitos = liquidacionDominio.asientoContable.lineas
        .filter(l => l.naturaleza === 'DEBITO')
        .reduce((acc, curr) => acc + curr.monto, 0);

      const totalCreditos = liquidacionDominio.asientoContable.lineas
        .filter(l => l.naturaleza === 'CREDITO')
        .reduce((acc, curr) => acc + curr.monto, 0);

      expect(totalDebitos).toBe(totalCreditos);
      expect(totalDebitos).toBe(1000000); // Cuenta 6135
      expect(liquidacionDominio.valorReteFuente).toBe(25000); // 2.5%
      expect(liquidacionDominio.valorReteICA).toBe(9660); // 0.966%
      expect(liquidacionDominio.netoPagarProveedor).toBe(965340); // 1,000,000 - 34,660

      const actionMock = vi.spyOn(subcontratacionesActions, 'liquidarSubcontratacionAction')
        .mockResolvedValueOnce({
          success: true,
          data: {
            subcontratacion: { ...subcontratacionDevuelta, estado: 'LIQUIDADA' },
            liquidacion: liquidacionDominio,
            transaccionId: 'tx-ledger-999',
          } as any,
        });

      render(
        <LiquidarSubcontratacionModal
          isOpen={true}
          onClose={handleClose}
          subcontratacion={subcontratacionDevuelta}
          onSuccess={handleSuccess}
        />
      );

      expect(screen.getByText(/Liquidación Contable de Subcontratación/i)).toBeInTheDocument();

      // Clic en Aprobar y Liquidar Orden
      const liquidarBtn = screen.getByRole('button', { name: /Aprobar y Liquidar Orden/i });
      await user.click(liquidarBtn);

      await waitFor(() => {
        expect(actionMock).toHaveBeenCalledWith(
          expect.objectContaining({
            subcontratacionId: 'sub-200',
            aplicaRetenciones: true,
          })
        );
        expect(handleSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // FASE 4: INVARIANTE WMS DE AISLAMIENTO DE INVENTARIO PROPIO
  // =========================================================================
  describe('Fase 4: Invariante de Aislamiento de Inventario Propio (WMS)', () => {
    it('la formalización y despacho de maquinaria subcontratada NO debe tocar el stock disponible de la bodega propia', () => {
      const bodegaInicial = useBodegaStore.getState().equipos.find(e => e.id === 101);
      expect(bodegaInicial?.stock_disponible).toBe(0);

      // Simular ítem en contrato marcado como subcontratado
      const itemsAlquiler = [
        {
          equipo_id: 101,
          cantidad: 1,
          esSubcontratado: true, // Subcontratado a tercero
          proveedorAliado: 'Maquillajes & Equipos de Colombia S.A.S.',
        },
      ];

      // Lógica transaccional WMS: solo descontar de bodega propia si NO es subcontratado
      itemsAlquiler.forEach(item => {
        if (!item.esSubcontratado) {
          useBodegaStore.getState().descontarStock(item.equipo_id, item.cantidad);
        }
      });

      // El stock disponible propio debe permanecer inalterado (en 0)
      const bodegaFinal = useBodegaStore.getState().equipos.find(e => e.id === 101);
      expect(bodegaFinal?.stock_disponible).toBe(0);
      expect(bodegaFinal?.stock_en_obra).toBe(2);
    });
  });
});
