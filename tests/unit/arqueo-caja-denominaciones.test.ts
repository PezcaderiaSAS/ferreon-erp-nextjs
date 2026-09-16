import { describe, it, expect } from 'vitest';
import { 
  calcularArqueoCiego, 
  validarCierreArqueoCaja,
  generarAsientoAjusteDescuadre,
  DenominacionEfectivoItem,
  CuentaContablePUC
} from '../../src/core/services/arqueo-caja.service';

describe('Servicio Puro de Dominio: Arqueo Ciego de Caja por Denominaciones', () => {
  const cuentasAjusteMuestra: CuentaContablePUC[] = [
    { id: 'acc-caja', code: '1105', name: 'Caja Principal' },
    { id: 'acc-sobrante', code: '4295', name: 'Sobrantes de Caja (Ingreso Extraordinario)' },
    { id: 'acc-faltante', code: '1365', name: 'Cuentas por Cobrar a Trabajadores (Faltantes)' },
  ];

  it('debe calcular correctamente el total físico a partir de billetes y monedas colombianas', () => {
    const conteo: DenominacionEfectivoItem[] = [
      { valor: 100000, cantidad: 5 }, // 500.000
      { valor: 50000, cantidad: 4 },  // 200.000
      { valor: 20000, cantidad: 5 },  // 100.000
      { valor: 10000, cantidad: 2 },  // 20.000
      { valor: 5000, cantidad: 1 },   // 5.000
      { valor: 1000, cantidad: 5 }    // 5.000
    ];

    const resultado = calcularArqueoCiego(conteo, 830000);

    expect(resultado.totalFisicoContado).toBe(830000);
    expect(resultado.saldoEsperadoSistema).toBe(830000);
    expect(resultado.diferencia).toBe(0);
    expect(resultado.clasificacion).toBe('CIERRE_EXACTO');
  });

  it('debe clasificar correctamente un sobrante de efectivo', () => {
    const conteo: DenominacionEfectivoItem[] = [
      { valor: 100000, cantidad: 3 } // 300.000
    ];

    // El sistema esperaba 280.000, pero hay 300.000 -> Sobran 20.000
    const resultado = calcularArqueoCiego(conteo, 280000);

    expect(resultado.totalFisicoContado).toBe(300000);
    expect(resultado.diferencia).toBe(20000);
    expect(resultado.clasificacion).toBe('SOBRANTE');
  });

  it('debe clasificar correctamente un faltante de efectivo', () => {
    const conteo: DenominacionEfectivoItem[] = [
      { valor: 50000, cantidad: 2 } // 100.000
    ];

    // El sistema esperaba 120.000, pero hay 100.000 -> Faltan 20.000
    const resultado = calcularArqueoCiego(conteo, 120000);

    expect(resultado.totalFisicoContado).toBe(100000);
    expect(resultado.diferencia).toBe(-20000);
    expect(resultado.clasificacion).toBe('FALTANTE');
  });

  it('debe exigir motivo de descuadre obligatorio cuando la diferencia sea distinta de cero', () => {
    // Caso con descuadre y sin justificación
    const intentoInvalido = validarCierreArqueoCaja({
      diferencia: -15000,
      motivoDescuadre: ''
    });

    expect(intentoInvalido.valido).toBe(false);
    expect(intentoInvalido.error).toContain('justificación obligatoria');

    // Caso con descuadre y justificación válida
    const intentoValido = validarCierreArqueoCaja({
      diferencia: -15000,
      motivoDescuadre: 'Billete falso detectado y retenido en el banco durante consignación'
    });

    expect(intentoValido.valido).toBe(true);
  });

  it('debe generar asiento contable para sobrante llevando a Ingreso Extraordinario (4295)', () => {
    const asiento = generarAsientoAjusteDescuadre({
      sesionCajaId: 'sesion-caja-uuid',
      diferencia: 25000, // Sobrante
      cuentas: cuentasAjusteMuestra
    });

    expect(asiento).not.toBeNull();
    // Débito a Caja (+25.000)
    const debito = asiento?.entries.find(e => e.accountId === 'acc-caja');
    expect(debito?.amount).toBe(25000);

    // Crédito a Sobrantes (-25.000)
    const credito = asiento?.entries.find(e => e.accountId === 'acc-sobrante');
    expect(credito?.amount).toBe(-25000);

    // Partida doble
    const suma = asiento!.entries.reduce((a, b) => a + b.amount, 0);
    expect(suma).toBe(0);
  });

  it('debe generar asiento contable para faltante llevando a Cuentas por Cobrar Trabajador (1365)', () => {
    const asiento = generarAsientoAjusteDescuadre({
      sesionCajaId: 'sesion-caja-uuid',
      diferencia: -10000, // Faltante
      cuentas: cuentasAjusteMuestra
    });

    expect(asiento).not.toBeNull();
    // Débito a Cuentas por Cobrar Trabajador (+10.000)
    const debito = asiento?.entries.find(e => e.accountId === 'acc-faltante');
    expect(debito?.amount).toBe(10000);

    // Crédito a Caja (-10.000)
    const credito = asiento?.entries.find(e => e.accountId === 'acc-caja');
    expect(credito?.amount).toBe(-10000);

    // Partida doble
    const suma = asiento!.entries.reduce((a, b) => a + b.amount, 0);
    expect(suma).toBe(0);
  });
});
