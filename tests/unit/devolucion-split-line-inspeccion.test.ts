import { describe, it, expect } from 'vitest';
import { 
  calcularLiquidacionDevolucion, 
  ItemDevolucionInput, 
  ContratoAlquilerBase 
} from '@/core/services/liquidacion-devolucion.service';

describe('Servicio de Liquidación de Devoluciones y Split-Line (Dominio Puro)', () => {
  const contratoMock: ContratoAlquilerBase = {
    id: 101,
    consecutivo: 'CTR-00101',
    clienteId: 5,
    clienteNombre: 'Constructora Bolívar',
    depositoGarantia: 500000, // $500.000 COP
    fechaInicio: '2026-09-01T08:00:00Z',
    fechaFinEstimada: '2026-09-30T18:00:00Z',
  };

  it('1. Debe liquidar devolución total sin daños con saldo a favor del cliente (Reembolso de garantía remanente)', () => {
    // 1 equipo devuelto el día 10 de 30
    const itemsDevueltos: ItemDevolucionInput[] = [
      {
        detalleId: 1,
        equipoId: 20,
        nombreEquipo: 'Mezcladora de Concreto 2 Bultos',
        cantidadTotalOriginal: 1,
        cantidadDevuelta: 1,
        tarifaDiariaPactada: 25000,
        fechaInicio: '2026-09-01T08:00:00Z',
        fechaDevolucion: '2026-09-11T08:00:00Z', // 10 días exactos
        estadoInspeccion: 'BUENO',
        costoReparacion: 0,
        valorReposicion: 0,
      }
    ];

    const liquidacion = calcularLiquidacionDevolucion(contratoMock, itemsDevueltos);

    // Días causados = 10 días * 25.000 = 250.000 COP
    expect(liquidacion.totalAlquilerLiquidado).toBe(250000);
    expect(liquidacion.totalDanos).toBe(0);
    expect(liquidacion.totalReposiciones).toBe(0);
    expect(liquidacion.depositoAplicado).toBe(500000);

    // Saldo Neto = 500.000 - 250.000 = +250.000 (Reembolso al cliente)
    expect(liquidacion.saldoNeto).toBe(250000);
    expect(liquidacion.tipoResolucion).toBe('REEMBOLSO_CLIENTE');
    expect(liquidacion.afectaCaja).toBe(true);
    expect(liquidacion.tipoMovimientoCaja).toBe('EGRESO');
  });

  it('2. Debe calcular Split-Line proporcional en devolución parcial (2 de 5 andamios devueltos anticipadamente)', () => {
    const itemsDevueltos: ItemDevolucionInput[] = [
      {
        detalleId: 2,
        equipoId: 30,
        nombreEquipo: 'Andamio Tubular 2x2m',
        cantidadTotalOriginal: 5,
        cantidadDevuelta: 2, // Devuelve 2, retiene 3 en obra
        tarifaDiariaPactada: 8000,
        fechaInicio: '2026-09-01T08:00:00Z',
        fechaDevolucion: '2026-09-06T08:00:00Z', // 5 días transcurridos
        estadoInspeccion: 'BUENO',
        costoReparacion: 0,
        valorReposicion: 0,
      }
    ];

    const liquidacion = calcularLiquidacionDevolucion(contratoMock, itemsDevueltos);

    // 2 andamios * 5 días * 8.000 = 80.000 COP
    expect(liquidacion.totalAlquilerLiquidado).toBe(80000);
    expect(liquidacion.itemsLiquidacion[0].esSplitLine).toBe(true);
    expect(liquidacion.itemsLiquidacion[0].cantidadRemanenteEnObra).toBe(3);
    expect(liquidacion.itemsLiquidacion[0].subtotalAlquilerItem).toBe(80000);
  });

  it('3. Debe compensar automáticamente depósito contra daños reparables y pérdida total con saldo en contra (Cobro al cliente)', () => {
    const itemsDevueltos: ItemDevolucionInput[] = [
      {
        detalleId: 3,
        equipoId: 40,
        nombreEquipo: 'Taladro Percutor Industrial',
        cantidadTotalOriginal: 2,
        cantidadDevuelta: 2,
        tarifaDiariaPactada: 15000,
        fechaInicio: '2026-09-01T08:00:00Z',
        fechaDevolucion: '2026-09-21T08:00:00Z', // 20 días
        estadoInspeccion: 'MANTENIMIENTO',
        costoReparacion: 180000, // $180.000 reparación por quemadura de inducido
        valorReposicion: 0,
        descripcionDano: 'Inducido quemado por sobrecarga en obra',
      },
      {
        detalleId: 4,
        equipoId: 41,
        nombreEquipo: 'Cortadora de Disco Diamantado',
        cantidadTotalOriginal: 1,
        cantidadDevuelta: 1,
        tarifaDiariaPactada: 30000,
        fechaInicio: '2026-09-01T08:00:00Z',
        fechaDevolucion: '2026-09-21T08:00:00Z', // 20 días
        estadoInspeccion: 'PERDIDA_TOTAL',
        costoReparacion: 0,
        valorReposicion: 650000, // Reposición de equipo extraviado
        descripcionDano: 'Equipo hurtado en frente de trabajo',
      }
    ];

    const liquidacion = calcularLiquidacionDevolucion(contratoMock, itemsDevueltos);

    // Alquiler:
    // Taladros: 2 * 20 días * 15.000 = 600.000 COP
    // Cortadora: 1 * 20 días * 30.000 = 600.000 COP
    // Total Alquiler = 1.200.000 COP
    expect(liquidacion.totalAlquilerLiquidado).toBe(1200000);

    // Daños y Pérdidas:
    // Reparaciones = 180.000 COP
    // Reposición = 650.000 COP
    expect(liquidacion.totalDanos).toBe(180000);
    expect(liquidacion.totalReposiciones).toBe(650000);

    // Total cargos = 1.200.000 + 180.000 + 650.000 = 2.030.000 COP
    // Depósito en garantía = 500.000 COP
    // Saldo Neto = 500.000 - 2.030.000 = -1.530.000 COP (A cargo del cliente)
    expect(liquidacion.saldoNeto).toBe(-1530000);
    expect(liquidacion.tipoResolucion).toBe('COBRO_CLIENTE');
    expect(liquidacion.afectaCaja).toBe(true);
    expect(liquidacion.tipoMovimientoCaja).toBe('INGRESO');
  });

  it('4. Debe redondear de forma entera para Colombia (COP sin decimales)', () => {
    const itemsDevueltos: ItemDevolucionInput[] = [
      {
        detalleId: 5,
        equipoId: 50,
        nombreEquipo: 'Equipo de Prueba',
        cantidadTotalOriginal: 1,
        cantidadDevuelta: 1,
        tarifaDiariaPactada: 33333.33,
        fechaInicio: '2026-09-01T08:00:00Z',
        fechaDevolucion: '2026-09-04T08:00:00Z', // 3 días
        estadoInspeccion: 'BUENO',
        costoReparacion: 12500.80,
        valorReposicion: 0,
      }
    ];

    const liquidacion = calcularLiquidacionDevolucion(contratoMock, itemsDevueltos);

    expect(Number.isInteger(liquidacion.totalAlquilerLiquidado)).toBe(true);
    expect(Number.isInteger(liquidacion.totalDanos)).toBe(true);
    expect(Number.isInteger(liquidacion.saldoNeto)).toBe(true);
  });
});
