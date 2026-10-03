import { describe, it, expect } from 'vitest';
import {
  calcularKPIsDashboard,
  generarEventosCalendario,
  generarTareasSistema,
  generarAlertasFeed,
  procesarDashboardCompleto,
  type RawAlquilerDashboard,
  type RawEquipoDashboard,
  type RawDevolucionDashboard
} from '@/core/services/dashboard-transaccional.service';

describe('DashboardTransaccionalService - Dominio y Calendario Operativo (Alquileres System)', () => {
  const fechaHoy = '2026-10-03';
  const fechaAyer = '2026-10-02';
  const fechaManana = '2026-10-04';
  const fechaFutura = '2026-10-15';

  const mockAlquileres: RawAlquilerDashboard[] = [
    {
      id: 'alq-1',
      numero_contrato: 'CC-00101',
      estado: 'ACTIVO_EN_OBRA',
      fecha_inicio: '2026-09-20',
      fecha_fin: fechaHoy, // Vence hoy -> Devolución pendiente hoy
      cliente_nombre: 'Constructora Omega S.A.S',
      total: 1200000,
      saldo_pendiente: 400000,
      detalles: [
        { equipo_nombre: 'Retroexcavadora CAT 416', cantidad: 1 }
      ]
    },
    {
      id: 'alq-2',
      numero_contrato: 'CC-00102',
      estado: 'ACTIVO',
      fecha_inicio: '2026-09-15',
      fecha_fin: fechaAyer, // Vencido ayer -> Devolución vencida y cartera en mora
      cliente_nombre: 'Ing. Carlos Mendoza',
      total: 800000,
      saldo_pendiente: 800000,
      detalles: [
        { equipo_nombre: 'Planta Eléctrica 10kVA', cantidad: 2 }
      ]
    },
    {
      id: 'alq-3',
      numero_contrato: 'COT-00055',
      estado: 'COTIZACION',
      fecha_inicio: fechaManana,
      fecha_fin: fechaFutura,
      cliente_nombre: 'Consorcio Vial 2026',
      total: 2500000,
      saldo_pendiente: 2500000,
      detalles: [
        { equipo_nombre: 'Rodillo Compactador 3T', cantidad: 1 }
      ]
    },
    {
      id: 'alq-4',
      numero_contrato: 'CC-00099',
      estado: 'FINALIZADO',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2026-08-15',
      cliente_nombre: 'Edificaciones del Norte',
      total: 500000,
      saldo_pendiente: 0,
      detalles: []
    }
  ];

  const mockEquipos: RawEquipoDashboard[] = [
    { id: 'eq-1', nombre: 'Retroexcavadora CAT 416', codigo: 'RET-01', estado: 'ALQUILADO', stock_total: 2, stock_disponible: 1 },
    { id: 'eq-2', nombre: 'Planta Eléctrica 10kVA', codigo: 'PLA-01', estado: 'ALQUILADO', stock_total: 4, stock_disponible: 2 },
    { id: 'eq-3', nombre: 'Andamio Tubular', codigo: 'AND-01', estado: 'DISPONIBLE', stock_total: 20, stock_disponible: 20 },
    { id: 'eq-4', nombre: 'Compresor de Aire', codigo: 'CMP-01', estado: 'MANTENIMIENTO', stock_total: 2, stock_disponible: 0 }
  ];

  const mockDevoluciones: RawDevolucionDashboard[] = [
    { id: 'dev-1', alquiler_id: 'alq-4', fecha_devolucion: '2026-08-15', estado: 'PROCESADA' }
  ];

  describe('1. Cálculo de KPIs Operativos y Financieros', () => {
    it('debe calcular correctamente los 4 KPIs en vivo', () => {
      const kpis = calcularKPIsDashboard(mockAlquileres, mockEquipos, fechaHoy);

      // Flota: total stock = 28, disponibles = 23, en obra = 5 (stock_total - stock_disponible - mantenimiento)
      expect(kpis.equiposTotal).toBe(28);
      expect(kpis.equiposEnObra).toBe(3); // 2 alquilados (RET-01: 1, PLA-01: 2)
      expect(kpis.utilizacionFlotaPct).toBeGreaterThan(0);
      expect(kpis.utilizacionFlotaPct).toBeLessThanOrEqual(100);

      // Contratos activos: alq-1 y alq-2
      expect(kpis.contratosActivos).toBe(2);
      // Cotizaciones pendientes: alq-3
      expect(kpis.cotizacionesPendientes).toBe(1);

      // Devoluciones hoy: alq-1 vence hoy
      expect(kpis.devolucionesPendientesHoy).toBe(1);
      // Devoluciones vencidas: alq-2 venció ayer
      expect(kpis.devolucionesVencidas).toBe(1);

      // Cartera: alq-1 (400k) + alq-2 (800k) = 1,200,000 (se excluyen cotizaciones y contratos finalizados)
      expect(kpis.carteraPendienteTotalCOP).toBe(1200000);
      // Cartera en mora: alq-2 que venció ayer = 800,000
      expect(kpis.carteraMoraCOP).toBe(800000);
    });

    it('debe manejar colecciones vacías con resiliencia sin divisiones por cero', () => {
      const kpis = calcularKPIsDashboard([], [], fechaHoy);
      expect(kpis.equiposEnObra).toBe(0);
      expect(kpis.equiposTotal).toBe(0);
      expect(kpis.utilizacionFlotaPct).toBe(0);
      expect(kpis.contratosActivos).toBe(0);
      expect(kpis.carteraPendienteTotalCOP).toBe(0);
    });
  });

  describe('2. Generación de Eventos de Calendario Operativo', () => {
    it('debe transformar alquileres en eventos de despacho y devolución', () => {
      const eventos = generarEventosCalendario(mockAlquileres, mockEquipos);

      // Debe haber eventos de despacho y de devolución
      const despachos = eventos.filter((e) => e.tipo === 'ALQUILER_DESPACHO');
      const devoluciones = eventos.filter((e) => e.tipo === 'DEVOLUCION');

      expect(despachos.length).toBeGreaterThan(0);
      expect(devoluciones.length).toBeGreaterThan(0);

      // Evento de devolución para alq-1 el día de hoy
      const devHoy = devoluciones.find((d) => d.fecha === fechaHoy);
      expect(devHoy).toBeDefined();
      expect(devHoy?.referenciaId).toBe('alq-1');
      expect(devHoy?.clienteNombre).toBe('Constructora Omega S.A.S');
      expect(devHoy?.urgencia).toBe('ALTA');
    });

    it('debe registrar equipos en mantenimiento como eventos de mantenimiento', () => {
      const eventos = generarEventosCalendario([], mockEquipos);
      const mantenimientos = eventos.filter((e) => e.tipo === 'MANTENIMIENTO');
      expect(mantenimientos.length).toBe(1);
      expect(mantenimientos[0].equipoNombre).toBe('Compresor de Aire');
      expect(mantenimientos[0].urgencia).toBe('MEDIA');
    });
  });

  describe('3. Generación de Tareas Automáticas del Sistema', () => {
    it('debe generar tareas urgentes para retornos vencidos y despachos del día', () => {
      const tareas = generarTareasSistema(mockAlquileres, fechaHoy);

      // Debe detectar la devolución vencida de alq-2
      const tareaVencida = tareas.find((t) => t.subtexto?.includes('Vencida') || t.titulo.includes('Vencida') || t.titulo.includes('devolución'));
      expect(tareaVencida).toBeDefined();
      expect(tareaVencida?.urgencia).toBe('URGENTE');

      // Todas las tareas de sistema deben tener tipo 'SISTEMA'
      expect(tareas.every((t) => t.tipo === 'SISTEMA')).toBe(true);
    });
  });

  describe('4. Generación de Alertas y Feed Cronológico', () => {
    it('debe emitir alertas clasificadas por severidad (CRITICA, ADVERTENCIA, INFO)', () => {
      const alertas = generarAlertasFeed(mockAlquileres, mockEquipos, fechaHoy);

      expect(alertas.length).toBeGreaterThan(0);
      const alertaCritica = alertas.find((a) => a.tipo === 'CRITICA');
      expect(alertaCritica).toBeDefined();
      expect(alertaCritica?.titulo).toMatch(/Mora|Vencid/i);
    });
  });

  describe('5. Procesamiento Completo de Dashboard', () => {
    it('debe orquestar el payload completo con mes activo y listas tipadas', () => {
      const payload = procesarDashboardCompleto({
        alquileres: mockAlquileres,
        equipos: mockEquipos,
        devoluciones: mockDevoluciones,
        tareasManuales: [
          { id: 't-manual-1', titulo: 'Llamar a banco para confirmar depósito', tipo: 'MANUAL', completada: false, urgencia: 'NORMAL' }
        ],
        fechaHoy
      });

      expect(payload.kpis).toBeDefined();
      expect(payload.eventos.length).toBeGreaterThan(0);
      expect(payload.tareas.some((t) => t.tipo === 'MANUAL')).toBe(true);
      expect(payload.tareas.some((t) => t.tipo === 'SISTEMA')).toBe(true);
      expect(payload.alertas.length).toBeGreaterThan(0);
      expect(payload.mesActivo).toBe('2026-10');
    });
  });

  describe('6. Integración de Cotizaciones y Cobros en el Calendario', () => {
    it('debe generar eventos para cotizaciones comerciales y facturas de cobro', () => {
      const mockCotizaciones = [
        {
          id: 'cot-1',
          consecutivo: 'COT-2026-001',
          cliente_nombre: 'P&P CONSTRUCCIONES',
          fecha_emision: '2026-10-06',
          fecha_vencimiento: '2026-10-20',
          total: 1250000,
          estado: 'ENVIADA',
          obra_nombre: 'Torre Navarra'
        }
      ];

      const mockFacturas = [
        {
          id: 'fac-1',
          numero_consecutivo: 1001,
          tipo_documento: 'CUENTA_COBRO',
          total_pagar: 280000,
          estado_pago: 'EMITIDA',
          fecha: '2026-10-15',
          cliente_nombre: 'ARTLINE SAS'
        }
      ];

      const mockPagos = [
        {
          id: 'pag-1',
          monto: 50000,
          metodo_pago: 'TRANSFERENCIA',
          fecha: '2026-10-03',
          cliente_nombre: 'ANGELA AZUCENA'
        }
      ];

      const eventos = generarEventosCalendario(
        [],
        [],
        fechaHoy,
        mockCotizaciones,
        mockFacturas,
        mockPagos
      );

      const evtCot = eventos.find((e) => e.tipo === 'COTIZACION' && e.fecha === '2026-10-06');
      expect(evtCot).toBeDefined();
      expect(evtCot?.titulo).toContain('COT-2026-001');
      expect(evtCot?.monto).toBe(1250000);

      const evtFac = eventos.find((e) => e.tipo === 'FACTURA_COBRO');
      expect(evtFac).toBeDefined();
      expect(evtFac?.titulo).toContain('Cuenta de Cobro #1001');
      expect(evtFac?.monto).toBe(280000);

      const evtPago = eventos.find((e) => e.tipo === 'PAGO_RECIBIDO');
      expect(evtPago).toBeDefined();
      expect(evtPago?.monto).toBe(50000);
    });
  });
});
