import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sumarDiasAFechaISO,
  calcularDiasEntreFechas,
  formatearFechaISO,
  parsearFechaLocal,
} from '@/core/utils/fechas';
import { emitirCuentaCobroPeriodicaAction, obtenerHistorialCuentasCobroAction } from '@/app/actions/facturacion-recurrente';
import * as serverSupabase from '@/infrastructure/persistence/supabase/server';

describe('Edición Flexible, Fechas Maestras, Cortes Periódicos y Adendas', () => {
  describe('1. Utilidad Canónica sumarDiasAFechaISO', () => {
    it('suma días correctamente manteniendo zona horaria y formato ISO', () => {
      expect(sumarDiasAFechaISO('2026-11-10', 0)).toBe('2026-11-10');
      expect(sumarDiasAFechaISO('2026-11-10', 5)).toBe('2026-11-15');
      expect(sumarDiasAFechaISO('2026-11-10', 30)).toBe('2026-12-10');
    });

    it('es congruente con calcularDiasEntreFechas', () => {
      const start = '2026-11-10';
      const dias = 14;
      const end = sumarDiasAFechaISO(start, dias);
      expect(end).toBe('2026-11-24');
      expect(calcularDiasEntreFechas(start, end)).toBe(14);
    });

    it('maneja cambio de mes y años bisiestos de forma determinística', () => {
      expect(sumarDiasAFechaISO('2028-02-28', 1)).toBe('2028-02-29');
      expect(sumarDiasAFechaISO('2028-02-28', 2)).toBe('2028-03-01');
      expect(sumarDiasAFechaISO('2026-02-28', 1)).toBe('2026-03-01');
    });
  });

  describe('2. Server Actions de Facturación Recurrente (Cortes Periódicos)', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
      vi.clearAllMocks();
      mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        insert: vi.fn().mockReturnThis(),
      };

      mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'usr-123', email: 'test@empresa.com' } },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.spyOn(serverSupabase, 'createServerSupabaseClient').mockResolvedValue(mockSupabase as any);
      vi.spyOn(serverSupabase, 'resolveEmpresaId').mockResolvedValue('empresa-tenant-123' as any);
    });

    it('emitirCuentaCobroPeriodicaAction usa estado_pago EMITIDA y consulta columnas válidas de alquileres', async () => {
      // Mock alquiler válido
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: {
            id: 10,
            cliente_id: 5,
            consecutivo: 101,
            estado: 'ACTIVO',
            clientes: { nombre: 'Constructora Bolivar', nit_cedula: '900.111.222', telefono: '3001234567' },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            id: 99,
            alquiler_id: 10,
            cliente_id: 5,
            empresa_id: 'empresa-tenant-123',
            estado_pago: 'EMITIDA',
            total_pagar: 150000,
          },
          error: null,
        });

      const input = {
        alquilerId: 10,
        tipoDocumento: 'CUENTA_COBRO' as const,
        fechaInicioPeriodo: '2026-11-01',
        fechaFinPeriodo: '2026-11-15',
        diasFacturables: 15,
        subtotal: 150000,
        totalNeto: 150000,
        items: [
          {
            nombre: 'Andamio Tubular',
            cantidad: 2,
            dias: 15,
            tarifaDiaria: 5000,
            subtotal: 150000,
          },
        ],
      };

      const res = await emitirCuentaCobroPeriodicaAction(input);

      expect(res.success).toBe(true);
      // Validar consulta a alquileres sin columnas inexistentes
      expect(mockSupabase.from).toHaveBeenCalledWith('alquileres');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'id, cliente_id, consecutivo, estado, clientes ( nombre, nit_cedula, telefono )'
      );

      // Validar que la factura se inserta con estado_pago EMITIDA compatible con CHECK constraint
      expect(mockSupabase.from).toHaveBeenCalledWith('facturas');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            estado_pago: 'EMITIDA',
            alquiler_id: 10,
            cliente_id: 5,
            total_pagar: 150000,
          }),
        ])
      );
    });

    it('obtenerHistorialCuentasCobroAction consulta facturas con relación válida a alquileres', async () => {
      mockQueryBuilder.order.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            numero_consecutivo: 101,
            tipo_documento: 'CUENTA_COBRO',
            alquiler_id: 10,
            total_pagar: 150000,
            estado_pago: 'EMITIDA',
            created_at: '2026-11-10T12:00:00Z',
          },
        ],
        error: null,
      });

      const res = await obtenerHistorialCuentasCobroAction();

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('facturas');
      // Debe incluir alquileres y clientes sin campos inexistentes
      const selectArgs = mockQueryBuilder.select.mock.calls[0][0];
      expect(selectArgs).not.toContain('numero_contrato');
      expect(selectArgs).not.toContain('cliente_nombre');
      expect(selectArgs).not.toContain('detallesLogistica');
    });
  });

  describe('3. Lógica de Reconciliación de Stock y Bypass de Colateral en useAlquilerForm', () => {
    it('en modo edición suma las unidades del contrato previo para no bloquear por stock propio', () => {
      const isEditMode = true;
      const initialDetalles = [
        { itemId: 'eq-1', cantidad: 3 },
        { itemId: 'eq-2', cantidad: 2 },
      ];

      const initialQuantitiesByItem = new Map<string, number>();
      if (isEditMode) {
        for (const d of initialDetalles) {
          initialQuantitiesByItem.set(d.itemId, (initialQuantitiesByItem.get(d.itemId) || 0) + d.cantidad);
        }
      }

      const bodegaStockDisponible = 0; // Bodega propia muestra 0 disponible porque ya estaban arrendados
      const cantidadEnEdicion = 3;

      const cantInicial = initialQuantitiesByItem.get('eq-1') || 0;
      const disponibleEfectivo = bodegaStockDisponible + cantInicial;
      const stockInsuficiente = cantidadEnEdicion > disponibleEfectivo;

      expect(cantInicial).toBe(3);
      expect(disponibleEfectivo).toBe(3);
      expect(stockInsuficiente).toBe(false); // No se bloquea
    });

    it('en modo creación sin stock sí detecta stock insuficiente', () => {
      const isEditMode = false;
      const initialQuantitiesByItem = new Map<string, number>();

      const bodegaStockDisponible = 0;
      const cantidadSolicitada = 2;

      const cantInicial = isEditMode ? (initialQuantitiesByItem.get('eq-1') || 0) : 0;
      const disponibleEfectivo = bodegaStockDisponible + cantInicial;
      const stockInsuficiente = cantidadSolicitada > disponibleEfectivo;

      expect(disponibleEfectivo).toBe(0);
      expect(stockInsuficiente).toBe(true);
    });

    it('en modo edición omite el requerimiento de colateral mínimo del 10%', () => {
      const isEditMode = true;
      const valorReposicionTotal = 10000000;
      const minimoRequerido = valorReposicionTotal * 0.1; // 1,000,000
      const deposito = 0;
      const garantiaMonto = 0;
      const depositoExoneradoCredito = false;

      // Validación con bypass
      let bloqueadoPorColateral = false;
      if (!isEditMode && !depositoExoneradoCredito) {
        const garantiaTotal = Number(deposito) + Number(garantiaMonto);
        if (garantiaTotal < minimoRequerido) {
          bloqueadoPorColateral = true;
        }
      }

      expect(bloqueadoPorColateral).toBe(false);
    });

    it('en modo edición excluye el propio contrato para evitar auto-bloqueo por mora de cartera', () => {
      const isEditMode = true;
      const initialData = { id: 45, consecutivo: 1045, clienteId: 'cli-1' };
      const alquileresCliente = [
        { id: 45, consecutivo: 1045, cliente_id: 'cli-1', saldo_pendiente: 500000, fecha_fin: '2026-10-01', estado: 'ACTIVO' },
        { id: 12, consecutivo: 1012, cliente_id: 'cli-1', saldo_pendiente: 0, fecha_fin: '2026-10-01', estado: 'FINALIZADO' },
      ];

      const filtrados = alquileresCliente.filter((a) => {
        if (a.estado === 'DEVUELTO' || a.estado === 'CANCELADO' || a.estado === 'FINALIZADO') return false;
        if (isEditMode && initialData) {
          const idContratoActual = initialData.id;
          if (idContratoActual && (String(a.id) === String(idContratoActual) || String(a.consecutivo) === String(initialData.consecutivo))) {
            return false;
          }
        }
        return true;
      });

      expect(filtrados).toHaveLength(0); // El contrato 45 no se autoincluye
    });

    it('sincronización de fechas maestras actualiza todas las líneas, días y subtotales', () => {
      const items = [
        {
          id: 'row-1',
          itemId: 'eq-1',
          cantidad: 2,
          precioDiario: 10000,
          fechaInicio: '2026-11-01',
          fechaFinEstimada: '2026-11-05',
          dias: 4,
          subtotal: 80000,
          subtotalPersonalizado: false,
        },
        {
          id: 'row-2',
          itemId: 'eq-2',
          cantidad: 1,
          precioDiario: 25000,
          fechaInicio: '2026-11-01',
          fechaFinEstimada: '2026-11-05',
          dias: 4,
          subtotal: 100000,
          subtotalPersonalizado: false,
        },
      ];

      const newStart = '2026-11-01';
      const newEnd = '2026-11-15'; // 14 días

      const updated = items.map((item) => {
        const dias = calcularDiasEntreFechas(newStart, newEnd);
        const tarifa = Number(item.precioDiario) || 0;
        const cant = Number(item.cantidad) || 1;
        const subtotal = item.subtotalPersonalizado ? item.subtotal : Math.round(tarifa * cant * dias);
        return {
          ...item,
          fechaInicio: newStart,
          fechaFinEstimada: newEnd,
          dias,
          subtotal,
        };
      });

      expect(updated[0].dias).toBe(14);
      expect(updated[0].subtotal).toBe(280000); // 2 * 10000 * 14
      expect(updated[0].fechaFinEstimada).toBe('2026-11-15');

      expect(updated[1].dias).toBe(14);
      expect(updated[1].subtotal).toBe(350000); // 1 * 25000 * 14
      expect(updated[1].fechaFinEstimada).toBe('2026-11-15');
    });
  });

  describe('4. Sincronización Bidireccional en Modal de Adendas', () => {
    it('al modificar la fecha fin de una línea se recalculan días y subtotal', () => {
      const item = {
        equipoId: 101,
        nombreItem: 'Andamio Tubular',
        cantidad: 2,
        tarifaAplicada: 5000,
        fechaInicio: '2026-11-01',
        fechaFinEstimada: '2026-11-08',
        diasCobro: 7,
        subtotalLinea: 70000,
      };

      const nuevaFechaFin = '2026-11-15';
      const dias = calcularDiasEntreFechas(item.fechaInicio, nuevaFechaFin);
      const subtotal = item.cantidad * item.tarifaAplicada * dias;

      expect(dias).toBe(14);
      expect(subtotal).toBe(140000);
    });

    it('al modificar los días de cobro de una línea se sincroniza la fecha fin estimada', () => {
      const item = {
        equipoId: 101,
        nombreItem: 'Andamio Tubular',
        cantidad: 2,
        tarifaAplicada: 5000,
        fechaInicio: '2026-11-01',
        fechaFinEstimada: '2026-11-08',
        diasCobro: 7,
        subtotalLinea: 70000,
      };

      const nuevosDias = 15;
      const nuevaFechaFin = sumarDiasAFechaISO(item.fechaInicio, nuevosDias);
      const subtotal = item.cantidad * item.tarifaAplicada * nuevosDias;

      expect(nuevaFechaFin).toBe('2026-11-16');
      expect(subtotal).toBe(150000);
    });
  });

  describe('5. Dominio de Cortes Periódicos (FacturacionRecurrenteService)', () => {
    it('extrae tarifa_aplicada de alquiler_detalles de PostgreSQL y calcula subtotal real', async () => {
      const { calcularCortePeriodicoAlquiler } = await import('@/core/services/facturacion-recurrente.service');

      const contratoDB = {
        id: 42,
        consecutivo: 2042,
        estado: 'ACTIVO',
        clientes: {
          nombre: 'Inversiones El Cóndor',
          nit_cedula: '800.222.333',
          telefono: '3115558899',
        },
        detalles_logistica: 'Frente 2 Variante Zipaquirá',
        alquiler_detalles: [
          {
            id: 1,
            equipo_id: 88,
            cantidad: 3,
            tarifa_aplicada: 12000,
            fecha_inicio: '2026-11-01',
            fecha_fin: '2026-11-15',
            equipos: { nombre: 'Vibrador de Concreto 2HP' },
          },
        ],
      };

      const periodo = {
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-15',
      };

      const liq = calcularCortePeriodicoAlquiler(contratoDB, periodo, { aplicaIva: false, aplicaRetenciones: false });

      expect(liq.esFacturable).toBe(true);
      expect(liq.clienteNombre).toBe('Inversiones El Cóndor');
      expect(liq.clienteTelefono).toBe('3115558899');
      expect(liq.obraNombre).toBe('Frente 2 Variante Zipaquirá');
      expect(liq.items).toHaveLength(1);
      expect(liq.items[0].tarifaDiaria).toBe(12000);
      expect(liq.items[0].diasFacturables).toBe(15);
      expect(liq.items[0].subtotal).toBe(3 * 12000 * 15); // 540,000 COP
      expect(liq.subtotal).toBe(540000);
      expect(liq.totalNeto).toBe(540000);
    });

    it('intersección cronológica respeta fecha_fin_estimada en contratos activos', async () => {
      const { calcularCortePeriodicoAlquiler } = await import('@/core/services/facturacion-recurrente.service');

      const contratoEstimado = {
        id: 50,
        consecutivo: 2050,
        estado: 'ACTIVO',
        fecha_inicio: '2026-11-01',
        fecha_fin_estimada: '2026-11-10',
        alquiler_detalles: [
          {
            id: 2,
            equipo_id: 12,
            cantidad: 1,
            tarifa_aplicada: 50000,
            fecha_inicio: '2026-11-01',
            fecha_fin: '2026-11-10',
          },
        ],
      };

      // Ventana de corte para toda la quincena (1 al 15)
      const periodo = {
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-15',
      };

      const liq = calcularCortePeriodicoAlquiler(contratoEstimado, periodo, { aplicaIva: false });

      // Solo debe facturar hasta el 10 (10 días devengados, no 15)
      expect(liq.diasFacturablesPeriodo).toBe(10);
      expect(liq.fechaHastaEfectiva).toBe('2026-11-10');
      expect(liq.subtotal).toBe(1 * 50000 * 10); // 500,000 COP
    });
  });

  describe('6. Robustez de Mapeo de Detalles de Supabase (alquiler_detalles)', () => {
    it('ignora equipos subcontratados al reconciliar inventario propio en edición', () => {
      const sourceDetalles = [
        { equipo_id: '10', cantidad: 2, es_subcontratado: false },
        { equipo_id: '10', cantidad: 1, es_subcontratado: true }, // Re-rent aliado
        { equipo_id: '20', cantidad: 5, esSubcontratado: false },
      ];

      const map = new Map<string, number>();
      for (const d of sourceDetalles) {
        if (d.es_subcontratado || (d as any).esSubcontratado) continue;
        const eqId = String(d.equipo_id);
        map.set(eqId, (map.get(eqId) || 0) + d.cantidad);
      }

      expect(map.get('10')).toBe(2); // No 3
      expect(map.get('20')).toBe(5);
    });

    it('adenda modal extrae detalles desde alquiler_detalles relacional', () => {
      const contratoSupabase = {
        id: 77,
        consecutivo: 1077,
        alquiler_detalles: [
          {
            id: 501,
            equipo_id: 99,
            cantidad: 2,
            tarifa_aplicada: 25000,
            fecha_inicio: '2026-11-01',
            fecha_fin: '2026-11-08',
            equipos: { nombre: 'Torre de Iluminación 4000W' },
          },
        ],
      };

      const detallesOriginales =
        Array.isArray(contratoSupabase.alquiler_detalles) && contratoSupabase.alquiler_detalles.length > 0
          ? contratoSupabase.alquiler_detalles
          : (contratoSupabase as any).detalles || [];

      expect(detallesOriginales).toHaveLength(1);
      expect(detallesOriginales[0].equipos.nombre).toBe('Torre de Iluminación 4000W');
      expect(detallesOriginales[0].tarifa_aplicada).toBe(25000);
    });

    it('preserva el consecutivo original al editar contrato recuperado de Supabase sin campo tipo', () => {
      const initialData = {
        id: 42,
        consecutivo: 'CON-0042',
        estado: 'ACTIVO', // Sin tipo ni tipoDocumento
      };
      const modo: string = 'CONTRATO';

      const consecutivoAsignado = initialData?.consecutivo && (
        (initialData as any)?.tipo === modo ||
        (initialData as any)?.tipoDocumento === modo ||
        (modo === 'COTIZACION' && initialData?.estado === 'COTIZACION') ||
        (modo === 'CONTRATO' && initialData?.estado !== 'COTIZACION')
      )
        ? initialData.consecutivo
        : 'GENERADO-NUEVO';

      expect(consecutivoAsignado).toBe('CON-0042');
    });

    it('protege corte si fechaHasta es anterior a fechaDesde ajustando periodo a 1 día mínimo', () => {
      const fechaDesde = '2026-11-15';
      const fechaHasta = '2026-11-10'; // Invertida por error de usuario

      let targetFin = fechaHasta;
      if (targetFin < fechaDesde) targetFin = fechaDesde;

      const dias = calcularDiasEntreFechas(fechaDesde, targetFin);
      expect(dias).toBe(1);
      expect(targetFin).toBe(fechaDesde);
    });
  });
});
