import { describe, it, expect } from 'vitest';
import { 
  calcularCostoPromedioPonderado, 
  calcularValorTotalInventario,
  prorratearFleteEnItemsCompra,
  ItemParaCosteoInput
} from '../../src/core/services/costo-promedio.service';

describe('Costo Promedio Ponderado (PMP) & Valuación de Inventarios', () => {
  describe('calcularCostoPromedioPonderado', () => {
    it('debe calcular exactamente el PMP en un caso estándar sin fletes', () => {
      // Stock: 5 unidades a $600.000 c/u ($3.000.000)
      // Compra: 5 unidades a $800.000 c/u ($4.000.000)
      // Total: $7.000.000 / 10 = $700.000
      const resultado = calcularCostoPromedioPonderado({
        stockPrevio: 5,
        costoPromedioActual: 600000,
        cantidadComprada: 5,
        precioCompraUnitario: 800000,
      });

      expect(resultado.nuevoCostoPromedio).toBe(700000);
      expect(resultado.nuevoStockTotal).toBe(10);
      expect(resultado.valorTotalInventario).toBe(7000000);
    });

    it('debe prorratear flete logístico incrementando el costo unitario de compra y el PMP', () => {
      // Stock: 2 unidades a $500.000 c/u ($1.000.000)
      // Compra: 3 unidades a $600.000 c/u con flete total de $60.000 ($20.000 por unidad -> $620.000 c/u)
      // Total nuevo: 1.000.000 + (3 * 620.000 = 1.860.000) = 2.860.000 / 5 = 572.000
      const resultado = calcularCostoPromedioPonderado({
        stockPrevio: 2,
        costoPromedioActual: 500000,
        cantidadComprada: 3,
        precioCompraUnitario: 600000,
        fleteTotalAsignado: 60000,
      });

      expect(resultado.nuevoCostoPromedio).toBe(572000);
      expect(resultado.costoUnitarioEfectivoCompra).toBe(620000);
      expect(resultado.nuevoStockTotal).toBe(5);
      expect(resultado.valorTotalInventario).toBe(2860000);
    });

    it('debe asignar el precio de compra directo si el stock previo es cero', () => {
      const resultado = calcularCostoPromedioPonderado({
        stockPrevio: 0,
        costoPromedioActual: 0,
        cantidadComprada: 4,
        precioCompraUnitario: 450000,
      });

      expect(resultado.nuevoCostoPromedio).toBe(450000);
      expect(resultado.nuevoStockTotal).toBe(4);
      expect(resultado.valorTotalInventario).toBe(1800000);
    });

    it('debe proteger contra división por cero si el stock previo es negativo por descuadre', () => {
      const resultado = calcularCostoPromedioPonderado({
        stockPrevio: -2,
        costoPromedioActual: 300000,
        cantidadComprada: 5,
        precioCompraUnitario: 500000,
      });

      // Al ser stock previo negativo, asume el nuevo costo de reposición como base
      expect(resultado.nuevoCostoPromedio).toBe(500000);
      expect(resultado.nuevoStockTotal).toBe(3); // -2 + 5 = 3
      expect(resultado.valorTotalInventario).toBe(1500000);
    });

    it('debe redondear el costo a pesos enteros COP sin centavos', () => {
      // 3 unidades a 100.000 = 300.000
      // 4 unidades a 150.000 = 600.000
      // Total 900.000 / 7 = 128571.42857... -> Redondeo 128571
      const resultado = calcularCostoPromedioPonderado({
        stockPrevio: 3,
        costoPromedioActual: 100000,
        cantidadComprada: 4,
        precioCompraUnitario: 150000,
      });

      expect(resultado.nuevoCostoPromedio).toBe(128571);
      expect(Number.isInteger(resultado.nuevoCostoPromedio)).toBe(true);
    });

    it('debe lanzar error de dominio si la cantidad comprada es menor o igual a cero', () => {
      expect(() => {
        calcularCostoPromedioPonderado({
          stockPrevio: 10,
          costoPromedioActual: 100000,
          cantidadComprada: 0,
          precioCompraUnitario: 120000,
        });
      }).toThrow('La cantidad comprada debe ser un entero positivo mayor a cero');
    });

    it('debe lanzar error de dominio si el precio de compra es negativo', () => {
      expect(() => {
        calcularCostoPromedioPonderado({
          stockPrevio: 10,
          costoPromedioActual: 100000,
          cantidadComprada: 2,
          precioCompraUnitario: -5000,
        });
      }).toThrow('El precio de compra unitario no puede ser negativo');
    });
  });

  describe('prorratearFleteEnItemsCompra', () => {
    it('debe distribuir el flete proporcionalmente al subtotal de cada ítem', () => {
      const items: ItemParaCosteoInput[] = [
        { equipoId: 1, cantidad: 2, precioUnitario: 1000000 }, // Subtotal: 2.000.000 (66.67%)
        { equipoId: 2, cantidad: 1, precioUnitario: 1000000 }, // Subtotal: 1.000.000 (33.33%)
      ];
      // Flete total: 300.000 COP
      const distribucion = prorratearFleteEnItemsCompra(items, 300000);

      expect(distribucion[0].fleteAsignado).toBe(200000);
      expect(distribucion[1].fleteAsignado).toBe(100000);
      expect(distribucion[0].fleteUnitario).toBe(100000); // 200.000 / 2
      expect(distribucion[1].fleteUnitario).toBe(100000); // 100.000 / 1
    });

    it('debe asignar cero flete si el flete total es cero o no se especifica', () => {
      const items: ItemParaCosteoInput[] = [
        { equipoId: 1, cantidad: 1, precioUnitario: 500000 }
      ];
      const distribucion = prorratearFleteEnItemsCompra(items, 0);

      expect(distribucion[0].fleteAsignado).toBe(0);
      expect(distribucion[0].fleteUnitario).toBe(0);
    });
  });

  describe('calcularValorTotalInventario', () => {
    it('debe calcular el valor monetario de un stock por su costo promedio', () => {
      expect(calcularValorTotalInventario(15, 450000)).toBe(6750000);
      expect(calcularValorTotalInventario(0, 450000)).toBe(0);
      expect(calcularValorTotalInventario(-5, 450000)).toBe(0);
    });
  });
});
