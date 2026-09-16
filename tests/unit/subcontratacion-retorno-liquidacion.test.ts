import { describe, it, expect } from 'vitest';
import { 
  calcularLiquidacionSubcontratacion, 
  OrdenSubcontratacionBase, 
  ItemSubcontratacionInput 
} from '@/core/services/liquidacion-subcontratacion.service';

describe('Servicio de Liquidación de Subcontrataciones y Partida Doble (Dominio Puro)', () => {
  const ordenMock: OrdenSubcontratacionBase = {
    id: 'sub-uuid-001',
    consecutivo: 'SUB-2026-001',
    proveedorId: 'prov-uuid-10',
    proveedorNombre: 'Maquinaria y Andamios del Valle SAS',
    proveedorNit: '900.123.456-7',
    fechaRecepcion: '2026-09-01T08:00:00Z',
    fechaRetornoProveedor: '2026-09-16T08:00:00Z', // 15 días exactos con proveedor
  };

  it('1. Debe liquidar costo con proveedor aliado y calcular margen comercial neto frente al cliente', () => {
    const items: ItemSubcontratacionInput[] = [
      {
        itemSubcontratacionId: 'det-01',
        equipoId: 50,
        descripcionItem: 'Compresor de Aire 185 CFM',
        cantidad: 1,
        costoDiarioProveedor: 80000, // Proveedor cobra $80.000 COP/día
        tarifaDiariaCliente: 120000,  // FerreOn factura $120.000 COP/día al cliente
        diasFacturadosCliente: 15,
      }
    ];

    const liquidacion = calcularLiquidacionSubcontratacion(ordenMock, items, {
      aplicaRetenciones: false,
    });

    // Costo Proveedor = 1 * 15 días * 80.000 = 1.200.000 COP
    expect(liquidacion.costoTotalProveedor).toBe(1200000);

    // Ingreso Cliente = 1 * 15 días * 120.000 = 1.800.000 COP
    expect(liquidacion.ingresoTotalCliente).toBe(1800000);

    // Margen Bruto = 1.800.000 - 1.200.000 = +600.000 COP
    expect(liquidacion.margenBruto).toBe(600000);
    // Porcentaje = (600.000 / 1.800.000) * 100 = 33.33%
    expect(liquidacion.porcentajeMargen).toBeCloseTo(33.33, 1);
    expect(liquidacion.netoPagarProveedor).toBe(1200000);
  });

  it('2. Debe aplicar retenciones comerciales (ReteFuente 2.5% y ReteICA 9.66‰) con redondeo en COP', () => {
    const items: ItemSubcontratacionInput[] = [
      {
        itemSubcontratacionId: 'det-02',
        equipoId: 60,
        descripcionItem: 'Torre de Iluminación 4000W',
        cantidad: 2,
        costoDiarioProveedor: 50000, // 2 torres * 50.000 = 100.000/día
        tarifaDiariaCliente: 85000,
        diasFacturadosCliente: 10,
      }
    ];

    // 10 días: Costo Bruto = 2 * 10 * 50.000 = 1.000.000 COP
    const liquidacion = calcularLiquidacionSubcontratacion({
      ...ordenMock,
      fechaRetornoProveedor: '2026-09-11T08:00:00Z', // 10 días
    }, items, {
      aplicaRetenciones: true,
      tasaReteFuente: 0.025, // 2.5%
      tasaReteICA: 0.00966,  // 9.66‰
    });

    expect(liquidacion.costoTotalProveedor).toBe(1000000);
    // ReteFuente 2.5% = 25.000 COP
    expect(liquidacion.valorReteFuente).toBe(25000);
    // ReteICA 9.66‰ = 9.660 COP
    expect(liquidacion.valorReteICA).toBe(9660);
    // Neto = 1.000.000 - 25.000 - 9.660 = 965.340 COP
    expect(liquidacion.netoPagarProveedor).toBe(965340);
  });

  it('3. Debe generar asiento contable de partida doble estrictamente balanceado (Suma Débitos = Suma Créditos)', () => {
    const items: ItemSubcontratacionInput[] = [
      {
        itemSubcontratacionId: 'det-03',
        equipoId: 70,
        descripcionItem: 'Allanadora de Concreto 36"',
        cantidad: 1,
        costoDiarioProveedor: 45000,
        tarifaDiariaCliente: 70000,
        diasFacturadosCliente: 8,
      }
    ];

    // 8 días * 45.000 = 360.000 COP
    const liquidacion = calcularLiquidacionSubcontratacion({
      ...ordenMock,
      fechaRetornoProveedor: '2026-09-09T08:00:00Z', // 8 días
    }, items, {
      aplicaRetenciones: true,
      tasaReteFuente: 0.025,
      tasaReteICA: 0.00966,
    });

    const asiento = liquidacion.asientoContable;
    expect(asiento).toBeDefined();

    // Validar sumatoria de débitos y créditos
    const sumaDebitos = asiento.lineas
      .filter(l => l.naturaleza === 'DEBITO')
      .reduce((acc, l) => acc + l.monto, 0);

    const sumaCreditos = asiento.lineas
      .filter(l => l.naturaleza === 'CREDITO')
      .reduce((acc, l) => acc + l.monto, 0);

    expect(sumaDebitos).toBe(sumaCreditos);
    expect(sumaDebitos).toBe(liquidacion.costoTotalProveedor);

    // Verificar cuentas PUC
    expect(asiento.lineas.some(l => l.cuentaCodigo === '6135' && l.naturaleza === 'DEBITO')).toBe(true);
    expect(asiento.lineas.some(l => l.cuentaCodigo === '2205' && l.naturaleza === 'CREDITO')).toBe(true);
  });
});
