import { describe, it, expect } from 'vitest';
import { 
  validarLiquidacionPagoMixto, 
  generarAsientoContablePagoMixto,
  MetodoPagoItemInput,
  CuentaContablePUC
} from '../../src/core/services/pago-mixto.service';

describe('Servicio Puro de Dominio: Pagos Mixtos y Partida Doble en Ledger', () => {
  const cuentasPUCMuestra: CuentaContablePUC[] = [
    { id: 'acc-caja-1', code: '1105', name: 'Caja Principal', isCashEquivalent: true },
    { id: 'acc-banco-1', code: '1110', name: 'Bancolombia Ahorros', isCashEquivalent: true },
    { id: 'acc-anticipo-1', code: '2805', name: 'Anticipos y Saldos a Favor Clientes', isCashEquivalent: false },
    { id: 'acc-cartera-1', code: '1305', name: 'Cuentas por Cobrar (Clientes)', isCashEquivalent: false },
  ];

  it('debe validar exitosamente un pago monometódico en efectivo con caja abierta', () => {
    const metodos: MetodoPagoItemInput[] = [
      {
        metodo: 'EFECTIVO',
        monto: 300000,
        efectivoRecibido: 350000 // Cliente entregó 350.000
      }
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 300000,
      metodos,
      sesionCajaActivaId: 'sesion-caja-uuid-001',
      saldoFavorCliente: 0
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.cambioTotal).toBe(50000);
    expect(resultado.requiereCaja).toBe(true);
    expect(resultado.montoEfectivo).toBe(300000);
    expect(resultado.montoBancos).toBe(0);
    expect(resultado.montoSaldoFavor).toBe(0);
  });

  it('debe rechazar pago en efectivo si no hay sesión de caja activa (Poka-Yoke)', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'EFECTIVO', monto: 150000 }
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 150000,
      metodos,
      sesionCajaActivaId: null, // Sin caja
      saldoFavorCliente: 0
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain('sesión de caja abierta');
  });

  it('debe validar exitosamente un pago 100% bancario sin requerir caja abierta', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'TRANSFERENCIA', monto: 500000, referencia: 'BANCOL-88219' }
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 500000,
      metodos,
      sesionCajaActivaId: null, // No se requiere caja para transferencias
      saldoFavorCliente: 0
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.requiereCaja).toBe(false);
    expect(resultado.montoBancos).toBe(500000);
  });

  it('debe validar un pago mixto (Efectivo + Transferencia + Saldo a Favor)', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'EFECTIVO', monto: 200000 },
      { metodo: 'TRANSFERENCIA', monto: 500000, referencia: 'NEQUI-3101234567' },
      { metodo: 'SALDO_A_FAVOR', monto: 300000 }
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 1000000,
      metodos,
      sesionCajaActivaId: 'sesion-caja-activa-01',
      saldoFavorCliente: 350000 // Tiene 350.000 y usa 300.000
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.montoEfectivo).toBe(200000);
    expect(resultado.montoBancos).toBe(500000);
    expect(resultado.montoSaldoFavor).toBe(300000);
  });

  it('debe rechazar si se intenta redimir más saldo a favor del que el cliente tiene disponible', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'SALDO_A_FAVOR', monto: 400000 }
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 400000,
      metodos,
      sesionCajaActivaId: null,
      saldoFavorCliente: 150000 // Solo tiene 150.000
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain('insuficiente');
  });

  it('debe rechazar si la suma de los métodos no coincide con el total a abonar', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'EFECTIVO', monto: 200000 },
      { metodo: 'TRANSFERENCIA', monto: 300000 } // Suma 500.000 pero total es 600.000
    ];

    const resultado = validarLiquidacionPagoMixto({
      totalAbonar: 600000,
      metodos,
      sesionCajaActivaId: 'sesion-01',
      saldoFavorCliente: 0
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toContain('no coincide');
  });

  it('debe generar asiento contable multilínea en partida doble cumpliendo Suma Débitos + Suma Créditos = 0', () => {
    const metodos: MetodoPagoItemInput[] = [
      { metodo: 'EFECTIVO', monto: 200000 },
      { metodo: 'TRANSFERENCIA', monto: 500000, referencia: 'BANCOL-9901' },
      { metodo: 'SALDO_A_FAVOR', monto: 300000 }
    ];

    const asiento = generarAsientoContablePagoMixto({
      pagoId: 881,
      alquilerId: 54,
      consecutivoAlquiler: 'ALQ-1054',
      totalAbono: 1000000,
      metodos,
      cuentas: cuentasPUCMuestra
    });

    expect(asiento.entries).toHaveLength(4);
    
    // Débito a Caja (+200.000)
    const debitoCaja = asiento.entries.find(e => e.accountId === 'acc-caja-1');
    expect(debitoCaja?.amount).toBe(200000);

    // Débito a Bancos (+500.000)
    const debitoBanco = asiento.entries.find(e => e.accountId === 'acc-banco-1');
    expect(debitoBanco?.amount).toBe(500000);

    // Débito a Anticipos (+300.000)
    const debitoAnticipo = asiento.entries.find(e => e.accountId === 'acc-anticipo-1');
    expect(debitoAnticipo?.amount).toBe(300000);

    // Crédito a Cartera (-1.000.000)
    const creditoCartera = asiento.entries.find(e => e.accountId === 'acc-cartera-1');
    expect(creditoCartera?.amount).toBe(-1000000);

    // Invariante de partida doble estricta
    const sumaTotal = asiento.entries.reduce((acc, curr) => acc + curr.amount, 0);
    expect(sumaTotal).toBe(0);
  });
});
