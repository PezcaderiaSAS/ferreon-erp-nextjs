import { describe, it, expect } from 'vitest';
import { 
  calcularDesgloseCotizacion, 
  validarVigenciaCotizacion,
  CotizacionItemCalculo,
  ParametrosTributariosCotizacion
} from '../../src/core/services/cotizacion-tributaria.service';

describe('Servicio Puro de Dominio: Cotización Tributaria y Financiera', () => {
  const itemsMuestra: CotizacionItemCalculo[] = [
    {
      equipoId: 101,
      nombre: 'Mezcladora de Concreto 2 Bultos',
      cantidad: 2,
      dias: 10,
      tarifaDiaria: 45000, // 2 * 10 * 45000 = 900.000
    },
    {
      equipoId: 102,
      nombre: 'Vibrador de Concreto Gasolina',
      cantidad: 1,
      dias: 10,
      tarifaDiaria: 30000, // 1 * 10 * 30000 = 300.000
    }
  ];

  it('debe calcular correctamente el subtotal de equipos y líneas individuales en COP', () => {
    const params: ParametrosTributariosCotizacion = {
      items: itemsMuestra,
      aplicaIva: false,
      aplicaRetefuente: false,
      aplicaReteica: false,
      valorTransporte: 0,
      depositoGarantia: 0
    };

    const resultado = calcularDesgloseCotizacion(params);

    expect(resultado.subtotalEquipos).toBe(1200000);
    expect(resultado.lineas[0].subtotalLinea).toBe(900000);
    expect(resultado.lineas[1].subtotalLinea).toBe(300000);
    expect(resultado.valorIva).toBe(0);
    expect(resultado.valorRetefuente).toBe(0);
    expect(resultado.valorReteica).toBe(0);
    expect(resultado.totalNeto).toBe(1200000);
  });

  it('debe liquidar IVA del 19% estándar sobre el subtotal gravable y transporte', () => {
    const params: ParametrosTributariosCotizacion = {
      items: itemsMuestra,
      aplicaIva: true,
      tasaIva: 19.0,
      aplicaRetefuente: false,
      aplicaReteica: false,
      valorTransporte: 100000,
      depositoGarantia: 200000
    };

    const resultado = calcularDesgloseCotizacion(params);

    // Subtotal gravable = 1.200.000 + 100.000 (transporte gravado) = 1.300.000
    // IVA 19% = 1.300.000 * 0.19 = 247.000
    // Total neto = 1.300.000 + 247.000 = 1.547.000
    expect(resultado.subtotalEquipos).toBe(1200000);
    expect(resultado.valorTransporte).toBe(100000);
    expect(resultado.baseGravableIva).toBe(1300000);
    expect(resultado.valorIva).toBe(247000);
    expect(resultado.totalNeto).toBe(1547000);
    expect(resultado.depositoSugerido).toBe(200000);
  });

  it('debe deducir ReteFuente (2.5%) y ReteICA (9.66‰) para clientes corporativos / agentes retenedores', () => {
    const params: ParametrosTributariosCotizacion = {
      items: itemsMuestra,
      aplicaIva: true,
      tasaIva: 19.0,
      aplicaRetefuente: true,
      tasaRetefuente: 2.5,
      aplicaReteica: true,
      tasaReteica: 0.966, // 9.66 por mil
      valorTransporte: 50000,
      depositoGarantia: 300000
    };

    const resultado = calcularDesgloseCotizacion(params);

    // Subtotal base = 1.200.000 + 50.000 = 1.250.000
    // IVA (19%) = 1.250.000 * 0.19 = 237.500
    // ReteFuente (2.5% sobre base de alquiler) = Math.round(1.250.000 * 0.025) = 31.250
    // ReteICA (9.66 por mil = 0.00966 sobre base) = Math.round(1.250.000 * 0.00966) = 12.075
    // Total Neto a Pagar por el cliente = Base + IVA - ReteFuente - ReteICA
    // Total Neto = 1.250.000 + 237.500 - 31.250 - 12.075 = 1.444.175
    expect(resultado.valorIva).toBe(237500);
    expect(resultado.valorRetefuente).toBe(31250);
    expect(resultado.valorReteica).toBe(12075);
    expect(resultado.totalNeto).toBe(1444175);
    expect(Number.isInteger(resultado.totalNeto)).toBe(true);
  });

  it('debe validar la vigencia de una cotización con exactitud temporal', () => {
    const hoy = new Date();
    const fechaEmisionReciente = hoy.toISOString().split('T')[0];
    
    // Cotización de hace 40 días
    const fechaAntigua = new Date(hoy.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    expect(validarVigenciaCotizacion(fechaEmisionReciente, 15)).toBe(true);
    expect(validarVigenciaCotizacion(fechaAntigua, 30)).toBe(false);
  });

  it('debe manejar entradas vacías o valores en cero defensivamente sin arrojar NaN', () => {
    const params: ParametrosTributariosCotizacion = {
      items: [],
      aplicaIva: true,
      valorTransporte: -500, // Defensivo
      depositoGarantia: -100
    };

    const resultado = calcularDesgloseCotizacion(params);

    expect(resultado.subtotalEquipos).toBe(0);
    expect(resultado.valorTransporte).toBe(0);
    expect(resultado.totalNeto).toBe(0);
    expect(resultado.lineas).toHaveLength(0);
  });
});
