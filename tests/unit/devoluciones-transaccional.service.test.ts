import { describe, it, expect } from 'vitest';
import { DevolucionesTransaccionalService } from '../../src/core/services/devoluciones-transaccional.service';

describe('Suite de Pruebas Unitarias: DevolucionesTransaccionalService (Alquileres System)', () => {
  describe('1. Evaluación de Split-Line en Devolución', () => {
    it('debe detectar correctamente Split-Line y calcular la cantidad remanente en obra', () => {
      // 5 andamios en contrato, el cliente devuelve 2 anticipadamente
      const res = DevolucionesTransaccionalService.evaluarSplitLine(5, 2);

      expect(res.valido).toBe(true);
      expect(res.esSplitLine).toBe(true);
      expect(res.cantidadDevolver).toBe(2);
      expect(res.cantidadRemanenteEnObra).toBe(3);
    });

    it('debe rechazar devoluciones con cantidades <= 0 o mayores a las contratadas', () => {
      const resCero = DevolucionesTransaccionalService.evaluarSplitLine(5, 0);
      expect(resCero.valido).toBe(false);
      expect(resCero.error).toContain('mayor a 0');

      const resExceso = DevolucionesTransaccionalService.evaluarSplitLine(5, 8);
      expect(resExceso.valido).toBe(false);
      expect(resExceso.error).toContain('No es posible devolver 8');
    });

    it('debe marcar devolución completa sin Split-Line cuando se devuelve todo', () => {
      const res = DevolucionesTransaccionalService.evaluarSplitLine(4, 4);

      expect(res.valido).toBe(true);
      expect(res.esSplitLine).toBe(false);
      expect(res.cantidadDevolver).toBe(4);
      expect(res.cantidadRemanenteEnObra).toBe(0);
    });
  });

  describe('2. Mapeo de Contratos con Maquinaria en Obra', () => {
    it('debe filtrar contratos activos y extraer únicamente los que tienen ítems pendientes', () => {
      const alquileresMock = [
        {
          id: 'ALQ-001',
          consecutivo: 101,
          estado: 'ACTIVO',
          clienteNombre: 'Constructora Bolívar S.A.S.',
          deposito: 300000,
          created_at: '2026-09-01T10:00:00Z',
          detalles: [
            {
              id: 'det-1',
              itemId: 'eq-1',
              nombreItem: 'Andamio Tubular',
              cantidad: 10,
              cantidadDevuelta: 10, // Ya devuelto totalmente
              tarifaAplicada: 12000,
            },
            {
              id: 'det-2',
              itemId: 'eq-2',
              nombreItem: 'Vibroapisonador',
              cantidad: 2,
              cantidadDevuelta: 0, // Pendiente
              tarifaAplicada: 45000,
            },
          ],
        },
        {
          id: 'ALQ-002',
          consecutivo: 102,
          estado: 'FINALIZADO', // Inactivo -> debe ignorarse
          clienteNombre: 'Cliente Finalizado',
          detalles: [
            { id: 'det-3', cantidad: 1, cantidadDevuelta: 0 },
          ],
        },
      ];

      const resultado = DevolucionesTransaccionalService.mapearContratosConPendientes(alquileresMock);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].consecutivo).toBe(101);
      expect(resultado[0].clienteNombre).toBe('Constructora Bolívar S.A.S.');
      expect(resultado[0].equiposResumen).toContain('2x Vibroapisonador');
      expect(resultado[0].depositoGarantia).toBe(300000);
    });
  });

  describe('3. Búsqueda Reactiva Insensible a Tildes y Mayúsculas', () => {
    it('debe encontrar contratos por coincidencia parcial insensible a diacríticos', () => {
      const contratos = [
        {
          id: '1',
          consecutivo: 201,
          clienteNombre: 'Construcción y Pavimentación Bolívar',
          clienteNit: '900.111.222-1',
          clienteTelefono: '3101234567',
          depositoGarantia: 500000,
          fechaInicio: '2026-09-10',
          fechaEsperada: '2026-09-30',
          equiposResumen: '3x Mezcladora Eléctrica',
          estadoRetraso: 'En tiempo',
          detallesCompletos: [],
        },
        {
          id: '2',
          consecutivo: 202,
          clienteNombre: 'Ingeniería Andina',
          clienteNit: '900.333.444-2',
          clienteTelefono: '3209876543',
          depositoGarantia: 200000,
          fechaInicio: '2026-09-12',
          fechaEsperada: '2026-09-25',
          equiposResumen: '10x Andamio Tubular',
          estadoRetraso: 'En tiempo',
          detallesCompletos: [],
        },
      ];

      // Búsqueda con tildes vs sin tildes
      const busqueda1 = DevolucionesTransaccionalService.filtrarContratosPendientes(contratos, 'construccion');
      expect(busqueda1).toHaveLength(1);
      expect(busqueda1[0].consecutivo).toBe(201);

      const busqueda2 = DevolucionesTransaccionalService.filtrarContratosPendientes(contratos, 'mezcladora');
      expect(busqueda2).toHaveLength(1);
      expect(busqueda2[0].consecutivo).toBe(201);

      const busqueda3 = DevolucionesTransaccionalService.filtrarContratosPendientes(contratos, '202');
      expect(busqueda3).toHaveLength(1);
      expect(busqueda3[0].consecutivo).toBe(202);
    });
  });

  describe('4. Adaptación Segura de Acta a Comprobante PDF', () => {
    it('debe estructurar el acta de Supabase con cálculos y fallbacks seguros', () => {
      const actaMock = {
        consecutivo: 'ACTA-00045',
        fecha_devolucion: '2026-09-20T15:30:00Z',
        alquiler_id: 88,
        recibido_por: 'JUAN_BODEGUERO',
        deposito_aplicado: 400000,
        total_alquiler_liquidado: 250000,
        total_danos: 50000,
        total_reposiciones: 0,
        saldo_neto: 100000, // 400k - (250k + 50k) = 100k reembolso
        tipo_resolucion: 'REEMBOLSO_CLIENTE',
        metodo_pago: 'EFECTIVO',
        observaciones: 'Equipo devuelto con limpieza pendiente',
        alquileres: {
          consecutivo: 1088,
          clientes: {
            nombre: 'Edificaciones del Valle',
            nit_cedula: '800.555.666-3',
          },
        },
        devolucion_detalles: [
          {
            cantidad_devuelta: 2,
            dias_efectivos_cobrados: 5,
            tarifa_diaria_aplicada: 25000,
            subtotal_alquiler: 250000,
            estado_inspeccion: 'MANTENIMIENTO',
            costo_reparacion: 50000,
            valor_reposicion: 0,
            descripcion_dano: 'Filtro saturado y cable raspado',
            equipos: {
              nombre: 'Generador Diésel 6kW',
              codigo: 'GEN-006',
            },
          },
        ],
      };

      const adaptado = DevolucionesTransaccionalService.adaptarActaAComprobanteData(actaMock);

      expect(adaptado).not.toBeNull();
      expect(adaptado?.consecutivo).toBe('ACTA-00045');
      expect(adaptado?.contratoConsecutivo).toBe(1088);
      expect(adaptado?.clienteNombre).toBe('Edificaciones del Valle');
      expect(adaptado?.saldoNeto).toBe(100000);
      expect(adaptado?.tipoResolucion).toBe('REEMBOLSO_CLIENTE');
      expect(adaptado?.items).toHaveLength(1);
      expect(adaptado?.items[0].nombreEquipo).toBe('Generador Diésel 6kW');
      expect(adaptado?.items[0].costoReparacion).toBe(50000);
    });
  });
});
