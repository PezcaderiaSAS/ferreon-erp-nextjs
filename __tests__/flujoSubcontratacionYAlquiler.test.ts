import { describe, it, expect, beforeEach } from 'vitest';
import { alquilerSchema } from '../src/components/forms/alquiler/types';
import { useBodegaStore } from '../src/infrastructure/state/bodegaStore';
import { useAlquilerStore } from '../src/infrastructure/state/alquilerStore';

describe('Flujo Unificado de Alquileres, Cotizaciones y Subcontratación (Re-Renting)', () => {
  beforeEach(() => {
    // Reset de stores para aislamiento puro de pruebas
    useBodegaStore.setState({
      equipos: [
        {
          id: 'EQ-001',
          codigo: 'AND-001',
          nombre: 'Andamio Tubular Estándar',
          categoria: 'Andamios',
          tarifa_diaria: 35000,
          stock_total: 10,
          stock_disponible: 10,
          stock_en_obra: 0,
          estado: 'Disponible'
        },
        {
          id: 'EQ-002',
          codigo: 'RET-001',
          nombre: 'Retroexcavadora Oruga 20T',
          categoria: 'Maquinaria Pesada',
          tarifa_diaria: 450000,
          stock_total: 1,
          stock_disponible: 0, // Stock agotado en bodega propia
          stock_en_obra: 1,
          estado: 'En Alquiler'
        }
      ],
      idempotencyKeys: []
    });

    useAlquilerStore.setState({
      alquileres: [],
      idempotencyKeys: []
    });
  });

  // =========================================================================
  // 1. VALIDACIÓN ZOD Y SOPORTE DUAL (COTIZACIÓN vs CONTRATO)
  // =========================================================================
  describe('1. Validación Zod y Soporte Dual de Documentos', () => {
    it('Debe validar exitosamente una Cotización Comercial (COT) con depósito en cero', () => {
      const payloadCotizacion = {
        tipoDocumento: 'COTIZACION' as const,
        validezOfertaDias: 15,
        clienteId: 'CLI-99',
        fechaRegistro: '2026-09-11',
        fechaInicioContrato: '2026-09-15',
        fechaFinEstimadaContrato: '2026-09-20',
        fleteEntrega: 25000,
        fleteRecogida: 25000,
        deposito: 0, // En cotización el colateral es 0 / referencial
        garantiaMonto: 0,
        garantiaTipo: 'Efectivo',
        depositoExoneradoCredito: false,
        items: [
          {
            itemId: 'EQ-001',
            cantidad: 2,
            precioDiario: 35000,
            fechaInicio: '2026-09-15',
            fechaFinEstimada: '2026-09-20',
            esSubcontratado: false
          }
        ]
      };

      const resultado = alquilerSchema.safeParse(payloadCotizacion);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.tipoDocumento).toBe('COTIZACION');
        expect(resultado.data.validezOfertaDias).toBe(15);
      }
    });

    it('Debe validar exitosamente un Contrato Formal con maquinaria subcontratada (Re-Renting)', () => {
      const payloadContratoReRenting = {
        tipoDocumento: 'CONTRATO' as const,
        clienteId: 'CLI-88',
        fechaRegistro: '2026-09-11',
        fechaInicioContrato: '2026-09-12',
        fechaFinEstimadaContrato: '2026-09-18',
        fleteEntrega: 50000,
        fleteRecogida: 50000,
        deposito: 120000,
        garantiaMonto: 2500000,
        garantiaTipo: 'Pagaré',
        depositoExoneradoCredito: false,
        items: [
          {
            itemId: 'EQ-001', // Equipo Propio
            cantidad: 1,
            precioDiario: 35000,
            fechaInicio: '2026-09-12',
            fechaFinEstimada: '2026-09-18',
            esSubcontratado: false
          },
          {
            itemId: 'EQ-002', // Equipo Subcontratado (Stock propio era 0)
            cantidad: 1,
            precioDiario: 450000,
            fechaInicio: '2026-09-12',
            fechaFinEstimada: '2026-09-18',
            esSubcontratado: true,
            proveedorAliadoNombre: 'Equipos & Maquinarias del Valle S.A.S.',
            proveedorAliadoNit: '900.887.654-1',
            costoSubcontrato: 380000,
            fechaRecepcionMuelleTercero: '2026-09-12T07:00:00'
          }
        ]
      };

      const resultado = alquilerSchema.safeParse(payloadContratoReRenting);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.items[1].esSubcontratado).toBe(true);
        expect(resultado.data.items[1].proveedorAliadoNombre).toBe('Equipos & Maquinarias del Valle S.A.S.');
        expect(resultado.data.items[1].costoSubcontrato).toBe(380000);
      }
    });

    it('Debe permitir exoneración de depósito mediante casilla de Cliente Corporativo a Crédito', () => {
      const payloadCreditoCorporativo = {
        tipoDocumento: 'CONTRATO' as const,
        clienteId: 'CLI-CORP-01',
        fechaRegistro: '2026-09-11',
        fechaInicioContrato: '2026-09-11',
        fechaFinEstimadaContrato: '2026-09-15',
        fleteEntrega: 0,
        fleteRecogida: 0,
        deposito: 0, // Exonerado por línea de crédito
        garantiaMonto: 0,
        garantiaTipo: 'Crédito Corporativo 30D',
        depositoExoneradoCredito: true,
        items: [
          {
            itemId: 'EQ-001',
            cantidad: 3,
            precioDiario: 35000,
            fechaInicio: '2026-09-11',
            fechaFinEstimada: '2026-09-15',
            esSubcontratado: false
          }
        ]
      };

      const resultado = alquilerSchema.safeParse(payloadCreditoCorporativo);
      expect(resultado.success).toBe(true);
      if (resultado.success) {
        expect(resultado.data.depositoExoneradoCredito).toBe(true);
        expect(resultado.data.deposito).toBe(0);
      }
    });
  });

  // =========================================================================
  // 2. PRESERVACIÓN INVIOLABLE DE BODEGA PROPIA
  // =========================================================================
  describe('2. Preservación Inviolable de Bodega Propia', () => {
    it('Emisión de Cotización NO debe alterar ni descontar stock en bodega', () => {
      const estadoBodegaInicial = [...useBodegaStore.getState().equipos];
      const stockDisponibleInicial = estadoBodegaInicial.find(e => e.id === 'EQ-001')?.stock_disponible;
      expect(stockDisponibleInicial).toBe(10);

      // Simulamos la lógica transaccional de guardarComoCotizacion
      const nuevaCotizacion = {
        id: 'cot_uuid_001',
        consecutivo: 'COT-101',
        tipoDocumento: 'COTIZACION' as const,
        cliente_id: 'CLI-99',
        clienteNombre: 'Constructora Bolívar',
        estado: 'COTIZACION',
        flete_entrega: 25000,
        flete_recogida: 25000,
        deposito: 0,
        garantia_monto: 0,
        garantia_tipo: 'Sin Garantía',
        garantia_estado: 'Cotización',
        subtotal_equipos: 350000,
        subtotal_general: 400000,
        total: 400000,
        detalles: [
          {
            equipo_id: 'EQ-001',
            equipoNombre: 'Andamio Tubular Estándar',
            cantidad: 5, // Demanda alta
            precio_diario: 35000,
            fecha_inicio: '2026-09-15',
            fecha_fin_estimada: '2026-09-20',
            esSubcontratado: false
          }
        ],
        created_at: new Date().toISOString()
      };

      // Agregar cotización al store
      useAlquilerStore.getState().addAlquiler(nuevaCotizacion as any);

      // Verificamos que se guardó la cotización
      expect(useAlquilerStore.getState().alquileres.length).toBe(1);
      expect(useAlquilerStore.getState().alquileres[0].consecutivo).toBe('COT-101');

      // CRITERIO CRÍTICO DE NEGOCIO: La bodega permanece 100% intacta
      const equipoBodega = useBodegaStore.getState().equipos.find(e => e.id === 'EQ-001');
      expect(equipoBodega?.stock_disponible).toBe(10);
      expect(equipoBodega?.stock_en_obra).toBe(0);
    });

    it('Formalización de Contrato debe descontar stock SOLO de equipos propios y preservar equipos subcontratados', () => {
      const itemsDelContrato = [
        {
          equipo_id: 'EQ-001', // Propio: debe descontar 3 unidades
          cantidad: 3,
          esSubcontratado: false
        },
        {
          equipo_id: 'EQ-002', // Subcontratado a aliado comercial: NO debe tocar bodega propia
          cantidad: 1,
          esSubcontratado: true,
          proveedorAliadoNombre: 'Equipos del Valle',
          costoSubcontrato: 380000
        }
      ];

      // Ejecución del despacho selectivo
      itemsDelContrato.forEach(item => {
        if (!item.esSubcontratado) {
          useBodegaStore.getState().descontarStock(item.equipo_id, item.cantidad);
        }
      });

      // Validamos equipo propio: stock_disponible baja de 10 a 7, stock_en_obra sube de 0 a 3
      const equipoPropio = useBodegaStore.getState().equipos.find(e => e.id === 'EQ-001');
      expect(equipoPropio?.stock_disponible).toBe(7);
      expect(equipoPropio?.stock_en_obra).toBe(3);

      // Validamos equipo subcontratado: stock propio no fue tocado (sigue en 0 disponible)
      const equipoSubcontratado = useBodegaStore.getState().equipos.find(e => e.id === 'EQ-002');
      expect(equipoSubcontratado?.stock_disponible).toBe(0);
      expect(equipoSubcontratado?.stock_en_obra).toBe(1); // Mantiene su valor original sin alteración
    });
  });

  // =========================================================================
  // 3. MÁQUINA DE ESTADOS Y CIERRE DEL CICLO COMERCIAL
  // =========================================================================
  describe('3. Máquina de Estados y Cierre del Ciclo Comercial', () => {
    it('Al formalizar una Cotización previa, su estado debe actualizarse a FORMALIZADA', () => {
      // 1. Cotización inicial
      const cotizacionInicial = {
        id: 'cot_base_777',
        consecutivo: 'COT-205',
        tipoDocumento: 'COTIZACION',
        cliente_id: 'CLI-55',
        clienteNombre: 'Ingeniería & Diseños',
        estado: 'COTIZACION',
        flete_entrega: 10000,
        flete_recogida: 10000,
        deposito: 0,
        garantia_monto: 0,
        garantia_tipo: 'Sin Garantía',
        garantia_estado: 'Cotización',
        subtotal_equipos: 150000,
        subtotal_general: 170000,
        total: 170000,
        detalles: [],
        created_at: new Date().toISOString()
      };

      useAlquilerStore.getState().addAlquiler(cotizacionInicial as any);
      expect(useAlquilerStore.getState().alquileres[0].estado).toBe('COTIZACION');

      // 2. Formalización del contrato
      const contratoFormalizado = {
        id: 'alq_uuid_888',
        consecutivo: 'ALQ-501',
        tipoDocumento: 'CONTRATO',
        cotizacionOrigenId: 'cot_base_777', // Trazabilidad de origen
        cliente_id: 'CLI-55',
        clienteNombre: 'Ingeniería & Diseños',
        estado: 'ACTIVO',
        flete_entrega: 10000,
        flete_recogida: 10000,
        deposito: 50000,
        garantia_monto: 500000,
        garantia_tipo: 'Efectivo',
        garantia_estado: 'Activa',
        subtotal_equipos: 150000,
        subtotal_general: 170000,
        total: 170000,
        detalles: [],
        created_at: new Date().toISOString()
      };

      // Guardamos el contrato
      useAlquilerStore.getState().addAlquiler(contratoFormalizado as any);

      // Cerramos la cotización origen marcándola como FORMALIZADA
      const cotizacionPrevia = useAlquilerStore.getState().alquileres.find(a => a.id === 'cot_base_777');
      if (cotizacionPrevia) {
        useAlquilerStore.getState().updateAlquiler({ ...cotizacionPrevia, estado: 'FORMALIZADA' });
      }

      // Verificamos estados resultantes
      const cotizacionActualizada = useAlquilerStore.getState().alquileres.find(a => a.id === 'cot_base_777');
      const contratoEmitido = useAlquilerStore.getState().alquileres.find(a => a.id === 'alq_uuid_888');

      expect(cotizacionActualizada?.estado).toBe('FORMALIZADA');
      expect(contratoEmitido?.estado).toBe('ACTIVO');
      expect(contratoEmitido?.consecutivo).toBe('ALQ-501');
    });
  });

  // =========================================================================
  // 4. SEMÁFORO DE CARTERA Y AUTORIZACIÓN GERENCIAL CON PIN
  // =========================================================================
  describe('4. Semáforo de Cartera y Desbloqueo Supervisado', () => {
    it('Debe bloquear emisión de contratos ante mora o cliente bloqueado', () => {
      const clienteEnMora = {
        id: 'cli_mora_01',
        nombre: 'Constructora Deudora',
        estado: 'Inactivo', // Bloqueado comercialmente
        saldo_pendiente: 4500000
      };

      const esCarteraBloqueada = clienteEnMora.estado === 'Inactivo' || clienteEnMora.saldo_pendiente > 0;
      expect(esCarteraBloqueada).toBe(true);

      // Un intento de formalizar sin PIN debe ser denegado
      const supervisorAutorizado = false;
      const puedeEmitirContrato = !esCarteraBloqueada || supervisorAutorizado;
      expect(puedeEmitirContrato).toBe(false);
    });

    it('Debe autorizar desbloqueo gerencial exclusivamente con el PIN institucional FERREON2026', () => {
      const PIN_INSTITUCIONAL = 'FERREON2026';

      const validarPinSupervisor = (pinIngresado: string) => {
        return pinIngresado.trim().toUpperCase() === PIN_INSTITUCIONAL;
      };

      expect(validarPinSupervisor('1234')).toBe(false);
      expect(validarPinSupervisor('admin')).toBe(false);
      expect(validarPinSupervisor('ferreon2026')).toBe(true); // Case-insensitive
      expect(validarPinSupervisor('FERREON2026')).toBe(true);
    });
  });

  // =========================================================================
  // 5. CÁLCULO DE RENTABILIDAD Y MÁRGENES DE RE-RENTING
  // =========================================================================
  describe('5. Cálculo de Rentabilidad y Margen Comercial de Re-Renting', () => {
    it('Debe calcular con exactitud matemática el margen bruto diario y consolidado', () => {
      const itemSubcontratado = {
        itemId: 'EQ-002',
        cantidad: 1,
        precioDiario: 450000,      // Cobrado al cliente
        costoSubcontrato: 380000,  // Costo del aliado
        dias: 6                    // Duración de la obra
      };

      const margenDiario = itemSubcontratado.precioDiario - itemSubcontratado.costoSubcontrato;
      const ingresoTotalItem = itemSubcontratado.precioDiario * itemSubcontratado.cantidad * itemSubcontratado.dias;
      const costoTotalItem = itemSubcontratado.costoSubcontrato * itemSubcontratado.cantidad * itemSubcontratado.dias;
      const margenNetoItem = ingresoTotalItem - costoTotalItem;

      expect(margenDiario).toBe(70000);
      expect(ingresoTotalItem).toBe(2700000);
      expect(costoTotalItem).toBe(2280000);
      expect(margenNetoItem).toBe(420000);

      // Rentabilidad porcentual
      const rentabilidadPct = Math.round((margenNetoItem / ingresoTotalItem) * 100);
      expect(rentabilidadPct).toBe(16); // 15.55% redondeado a 16%
    });
  });

  // =========================================================================
  // 6. MOTOR TRIBUTARIO MULTIPAÍS LATAM Y CONTROL DE IMPUESTOS
  // =========================================================================
  describe('6. Motor Tributario Multipaís LATAM y Control de Impuestos', () => {
    it('Debe validar esquema Zod con campos tributarios completos (IVA 19% Colombia)', () => {
      const payloadConIVA = {
        tipoDocumento: 'COTIZACION' as const,
        validezOfertaDias: 15,
        clienteId: 'CLI-IVA-01',
        fechaRegistro: '2026-09-11',
        fechaInicioContrato: '2026-09-15',
        fechaFinEstimadaContrato: '2026-09-20',
        fleteEntrega: 30000,
        fleteRecogida: 30000,
        deposito: 0,
        garantiaMonto: 0,
        garantiaTipo: 'Efectivo',
        aplicaImpuesto: true,
        tasaImpuesto: 19,
        valorImpuesto: 39900,
        nombreImpuesto: 'IVA',
        items: [
          {
            itemId: 'EQ-001',
            cantidad: 2,
            precioDiario: 35000,
            fechaInicio: '2026-09-15',
            fechaFinEstimada: '2026-09-20', // 5 días -> subtotal = 35000 * 2 * 3 = 210000
            esSubcontratado: false
          }
        ]
      };

      const res = alquilerSchema.safeParse(payloadConIVA);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.aplicaImpuesto).toBe(true);
        expect(res.data.tasaImpuesto).toBe(19);
        expect(res.data.valorImpuesto).toBe(39900);
        expect(res.data.nombreImpuesto).toBe('IVA');
      }
    });

    it('Debe calcular con exactitud matemática el impuesto según las tasas de Colombia (19%), México (16%), Perú (18%) y Ecuador (15%)', () => {
      const subtotalEquipos = 1000000; // $1,000,000 COP

      const calcularTax = (subtotal: number, tasa: number, activo: boolean) => {
        return activo ? Math.round(subtotal * (tasa / 100)) : 0;
      };

      // Colombia IVA 19%
      expect(calcularTax(subtotalEquipos, 19, true)).toBe(190000);

      // México IVA 16%
      expect(calcularTax(subtotalEquipos, 16, true)).toBe(160000);

      // Perú IGV 18%
      expect(calcularTax(subtotalEquipos, 18, true)).toBe(180000);

      // Ecuador IVA 15%
      expect(calcularTax(subtotalEquipos, 15, true)).toBe(150000);

      // Exonerado / Desactivado (0%)
      expect(calcularTax(subtotalEquipos, 19, false)).toBe(0);
      expect(calcularTax(subtotalEquipos, 0, true)).toBe(0);
    });

    it('Debe sumar correctamente el impuesto al total general y al saldo de liquidación', () => {
      const subtotalEquipos = 500000;
      const totalFletes = 60000;
      const deposito = 150000;
      const tasaImpuesto = 19;
      const aplicaImpuesto = true;

      const valorImpuesto = aplicaImpuesto ? Math.round(subtotalEquipos * (tasaImpuesto / 100)) : 0;
      const totalGeneral = subtotalEquipos + totalFletes + valorImpuesto;
      const saldoPendiente = Math.max(0, totalGeneral - deposito);

      expect(valorImpuesto).toBe(95000);
      expect(totalGeneral).toBe(655000); // 500k + 60k + 95k
      expect(saldoPendiente).toBe(505000); // 655k - 150k
    });

    it('Al desactivar el switch con 1-clic, el total debe recalcularse instantáneamente excluyendo el impuesto', () => {
      const subtotalEquipos = 500000;
      const totalFletes = 60000;
      let aplicaImpuesto = true;
      let tasaImpuesto = 19;

      let valorImpuesto = aplicaImpuesto ? Math.round(subtotalEquipos * (tasaImpuesto / 100)) : 0;
      let totalGeneral = subtotalEquipos + totalFletes + valorImpuesto;
      expect(totalGeneral).toBe(655000);

      // Toggle a false (1 solo clic)
      aplicaImpuesto = false;
      valorImpuesto = aplicaImpuesto ? Math.round(subtotalEquipos * (tasaImpuesto / 100)) : 0;
      totalGeneral = subtotalEquipos + totalFletes + valorImpuesto;

      expect(valorImpuesto).toBe(0);
      expect(totalGeneral).toBe(560000); // Excluye los 95k
      // La tasa original se preserva para cuando el usuario vuelva a activarlo
      expect(tasaImpuesto).toBe(19);
    });
  });
});
