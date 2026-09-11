import { describe, it, expect } from 'vitest';
import { CalculoSubcontratacionService } from '../../src/core/services/calculo-subcontratacion.service';
import { SubcontratacionEntity } from '../../src/core/domain/entities/subcontratacion';

describe('Módulo de Subcontratación: Cálculos Financieros, Rentabilidad e Invariantes', () => {
  it('debe calcular la rentabilidad correcta por línea (Tarifa Cliente vs Costo Proveedor)', () => {
    // 2 equipos por 10 días. Proveedor cobra $30,000/día. Cliente paga $50,000/día.
    const res = CalculoSubcontratacionService.calcularRentabilidadLinea(2, 10, 30000, 50000);

    expect(res.costoTotalLinea).toBe(600000); // 2 * 10 * 30,000
    expect(res.ingresoTotalLinea).toBe(1000000); // 2 * 10 * 50,000
    expect(res.margenLinea).toBe(400000); // 1,000,000 - 600,000
    expect(res.margenPorcentual).toBe(40); // 40%
    expect(res.esMargenNegativo).toBe(false);
  });

  it('debe detectar y alertar margen negativo si el proveedor cobra más que la tarifa acordada con el cliente', () => {
    // Proveedor cobra $80,000/día. Cliente paga $60,000/día.
    const res = CalculoSubcontratacionService.calcularRentabilidadLinea(1, 5, 80000, 60000);

    expect(res.costoTotalLinea).toBe(400000);
    expect(res.ingresoTotalLinea).toBe(300000);
    expect(res.margenLinea).toBe(-100000);
    expect(res.esMargenNegativo).toBe(true);

    const global = CalculoSubcontratacionService.calcularRentabilidadGlobal([
      { cantidad: 1, dias: 5, costoDiarioProveedor: 80000, tarifaDiariaCliente: 60000 }
    ]);

    expect(global.esMargenNegativo).toBe(true);
    expect(global.alertaRentabilidad).toContain('Alerta: La subcontratación genera una pérdida operativa');
  });

  it('debe calcular la rentabilidad global compuesta de múltiples ítems subcontratados', () => {
    const items = [
      { cantidad: 1, dias: 7, costoDiarioProveedor: 40000, tarifaDiariaCliente: 65000 },
      { cantidad: 3, dias: 7, costoDiarioProveedor: 15000, tarifaDiariaCliente: 25000 }
    ];

    const global = CalculoSubcontratacionService.calcularRentabilidadGlobal(items);

    // Ítem 1: Costo 280,000 | Ingreso 455,000 | Margen 175,000
    // Ítem 2: Costo 315,000 | Ingreso 525,000 | Margen 210,000
    // Total: Costo 595,000 | Ingreso 980,000 | Margen 385,000
    expect(global.subtotalCostoProveedor).toBe(595000);
    expect(global.subtotalTarifaCliente).toBe(980000);
    expect(global.margenBrutoNominal).toBe(385000);
    expect(global.esMargenNegativo).toBe(false);
    expect(global.margenBrutoPorcentual).toBeGreaterThan(35);
  });

  it('valida invariantes estrictas en SubcontratacionEntity', () => {
    const fechaRecepcion = new Date('2026-09-15');
    const fechaDevolucionInvalida = new Date('2026-09-10'); // Menor a recepción

    // Debe lanzar error si fecha de devolución es anterior a recepción
    expect(() => {
      new SubcontratacionEntity(
        'sub-1',
        'SUB-0001',
        'prov-1',
        'MAQUINARIAS DEL VALLE',
        '900.888.777-1',
        '3101234567',
        new Date(),
        fechaRecepcion,
        fechaDevolucionInvalida
      );
    }).toThrow('La fecha estimada de devolución al proveedor no puede ser menor a la de recepción.');

    // Debe lanzar error si no tiene nombre o NIT de proveedor
    expect(() => {
      new SubcontratacionEntity(
        'sub-2',
        'SUB-0002',
        'prov-2',
        '',
        '900.888.777-1',
        undefined,
        new Date(),
        new Date(),
        new Date()
      );
    }).toThrow('El nombre del proveedor es obligatorio en la subcontratación.');
  });
});
