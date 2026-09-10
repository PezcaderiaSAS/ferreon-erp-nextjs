import { describe, it, expect } from 'vitest';
import { 
  calcularLiquidacionCompra, 
  ItemCompraCalculo, 
  ConfiguracionTributariaCompra,
  generarAsientosContablesCompra
} from '../../src/core/services/calculo-compras-tributario';

describe('Motor Matemático de Liquidación Tributaria de Compras y Partida Doble', () => {
  const itemsBase: ItemCompraCalculo[] = [
    { equipoId: 1, cantidad: 2, precioUnitario: 500000 },  // 1,000,000
    { equipoId: 2, cantidad: 1, precioUnitario: 1500000 }  // 1,500,000
  ]; // Subtotal: 2,500,000 COP

  it('debe calcular correctamente una compra estándar sin impuestos ni retenciones', () => {
    const config: ConfiguracionTributariaCompra = {
      aplicaIva: false,
      aplicaRetefuente: false,
      porcentajeRetefuente: 0,
      aplicaReteica: false,
      porcentajeReteica: 0
    };

    const resultado = calcularLiquidacionCompra(itemsBase, config);

    expect(resultado.subtotal).toBe(2500000);
    expect(resultado.valorIva).toBe(0);
    expect(resultado.valorRetefuente).toBe(0);
    expect(resultado.valorReteica).toBe(0);
    expect(resultado.totalFactura).toBe(2500000);
    expect(resultado.netoPagar).toBe(2500000);
    expect(resultado.estaBalanceado).toBe(true);
    expect(resultado.desbalance).toBe(0);
  });

  it('debe calcular IVA 19% con precisión entera en COP', () => {
    const config: ConfiguracionTributariaCompra = {
      aplicaIva: true,
      aplicaRetefuente: false,
      porcentajeRetefuente: 0,
      aplicaReteica: false,
      porcentajeReteica: 0
    };

    const resultado = calcularLiquidacionCompra(itemsBase, config);

    // 2,500,000 * 0.19 = 475,000
    expect(resultado.subtotal).toBe(2500000);
    expect(resultado.valorIva).toBe(475000);
    expect(resultado.totalFactura).toBe(2975000);
    expect(resultado.netoPagar).toBe(2975000);
    expect(resultado.estaBalanceado).toBe(true);
  });

  it('debe liquidar compra completa con IVA (19%), ReteFuente (2.5%) y ReteICA (9.66‰)', () => {
    const config: ConfiguracionTributariaCompra = {
      aplicaIva: true,
      aplicaRetefuente: true,
      porcentajeRetefuente: 2.5, // 2.5% sobre subtotal
      aplicaReteica: true,
      porcentajeReteica: 9.66    // 9.66 por mil sobre subtotal
    };

    const resultado = calcularLiquidacionCompra(itemsBase, config);

    // Subtotal: 2,500,000
    // IVA (19%): 475,000
    // Total Factura: 2,975,000
    // ReteFuente (2.5% de 2.5M): 62,500
    // ReteICA (9.66 / 1000 de 2.5M): 24,150
    // Total Retenciones: 62,500 + 24,150 = 86,650
    // Neto a Pagar: 2,975,000 - 86,650 = 2,888,350
    expect(resultado.subtotal).toBe(2500000);
    expect(resultado.valorIva).toBe(475000);
    expect(resultado.valorRetefuente).toBe(62500);
    expect(resultado.valorReteica).toBe(24150);
    expect(resultado.totalFactura).toBe(2975000);
    expect(resultado.netoPagar).toBe(2888350);

    // Invariante de partida doble contable: (Subtotal + IVA) === (ReteFuente + ReteICA + NetoPagar)
    const debitos = resultado.subtotal + resultado.valorIva;
    const creditos = resultado.valorRetefuente + resultado.valorReteica + resultado.netoPagar;
    expect(debitos).toBe(creditos);
    expect(resultado.estaBalanceado).toBe(true);
  });

  it('debe generar las entradas de diario contables (journal_entries) con suma neta cero', () => {
    const config: ConfiguracionTributariaCompra = {
      aplicaIva: true,
      aplicaRetefuente: true,
      porcentajeRetefuente: 3.5, // No declarante
      aplicaReteica: true,
      porcentajeReteica: 4.14
    };

    const liquidacion = calcularLiquidacionCompra(itemsBase, config);

    const accountsMap = {
      cuentaActivoMaquinariaId: 'acc-1520',
      cuentaIvaDescontableId: 'acc-2408',
      cuentaRetefuentePasivoId: 'acc-2365',
      cuentaReteicaPasivoId: 'acc-2368',
      cuentaContrapartidaId: 'acc-1105' // Caja Principal
    };

    const asientos = generarAsientosContablesCompra('txn-001', liquidacion, accountsMap);

    // Débitos positivos, Créditos negativos
    const sumaTotal = asientos.reduce((acc, a) => acc + a.amount, 0);
    expect(Math.abs(sumaTotal)).toBeLessThanOrEqual(1); // Exactitud a 0-1 peso por redondeos enteros

    // Debe contener las cuentas esperadas
    const cuentaActivo = asientos.find(a => a.account_id === 'acc-1520');
    const cuentaIva = asientos.find(a => a.account_id === 'acc-2408');
    const cuentaRetefuente = asientos.find(a => a.account_id === 'acc-2365');
    const cuentaReteica = asientos.find(a => a.account_id === 'acc-2368');
    const cuentaCaja = asientos.find(a => a.account_id === 'acc-1105');

    expect(cuentaActivo?.amount).toBe(liquidacion.subtotal);
    expect(cuentaIva?.amount).toBe(liquidacion.valorIva);
    expect(cuentaRetefuente?.amount).toBe(-liquidacion.valorRetefuente);
    expect(cuentaReteica?.amount).toBe(-liquidacion.valorReteica);
    expect(cuentaCaja?.amount).toBe(-liquidacion.netoPagar);
  });

  it('debe rechazar o sanitizar valores atípicos y cantidades menores o iguales a cero', () => {
    const itemsInvalidos: ItemCompraCalculo[] = [
      { equipoId: 1, cantidad: -5, precioUnitario: 100000 }
    ];
    const config: ConfiguracionTributariaCompra = {
      aplicaIva: false,
      aplicaRetefuente: false,
      porcentajeRetefuente: 0,
      aplicaReteica: false,
      porcentajeReteica: 0
    };

    expect(() => calcularLiquidacionCompra(itemsInvalidos, config)).toThrow();
  });
});
