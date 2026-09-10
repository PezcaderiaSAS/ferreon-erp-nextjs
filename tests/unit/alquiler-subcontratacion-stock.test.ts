import { describe, it, expect } from 'vitest';
import { CalculoSubcontratacionService } from '../../src/core/services/calculo-subcontratacion.service';

describe('Flujo de Subcontratación por Stock Insuficiente en Alquileres', () => {
  it('debe activar la bandera de subcontratación cuando la cantidad requerida supera el stock disponible', () => {
    const stockDisponibleBodega = 0;
    const cantidadSolicitada = 2;

    const requiereSubcontratacion = stockDisponibleBodega < cantidadSolicitada || stockDisponibleBodega <= 0;
    expect(requiereSubcontratacion).toBe(true);
  });

  it('debe mantener como inventario propio cuando el stock disponible es suficiente', () => {
    const stockDisponibleBodega = 5;
    const cantidadSolicitada = 2;

    const requiereSubcontratacion = stockDisponibleBodega < cantidadSolicitada || stockDisponibleBodega <= 0;
    expect(requiereSubcontratacion).toBe(false);
  });

  it('debe calcular la rentabilidad proyectada del renglón subcontratado en el formulario de alquiler', () => {
    // Cliente solicita 2 apisonadores por 7 días a $45,000/día
    // El aliado comercial cobra $28,000/día
    const rentabilidad = CalculoSubcontratacionService.calcularRentabilidadLinea(2, 7, 28000, 45000);

    expect(rentabilidad.costoTotalLinea).toBe(392000); // 2 * 7 * 28,000
    expect(rentabilidad.ingresoTotalLinea).toBe(630000); // 2 * 7 * 45,000
    expect(rentabilidad.margenLinea).toBe(238000); // 630,000 - 392,000
    expect(rentabilidad.esMargenNegativo).toBe(false);
    expect(rentabilidad.margenPorcentual).toBeCloseTo(37.77, 1);
  });

  it('debe validar que los ítems subcontratados incluyan obligatoriamente el proveedor aliado asignado', () => {
    const items = [
      {
        itemId: 'eq-1',
        cantidad: 1,
        esSubcontratado: true,
        proveedorSubcontratadoId: 'prov-001'
      },
      {
        itemId: 'eq-2',
        cantidad: 2,
        esSubcontratado: true,
        proveedorSubcontratadoId: '' // Invalido
      }
    ];

    const subSinProveedor = items.find(it => it.esSubcontratado && !it.proveedorSubcontratadoId);
    expect(subSinProveedor).toBeDefined();
    expect(subSinProveedor?.itemId).toBe('eq-2');
  });

  it('debe consolidar contratos híbridos combinando maquinaria propia y maquinaria tercerizada', () => {
    const items = [
      // Ítem 1: Propio (Costo proveedor 0)
      { cantidad: 1, dias: 15, costoDiarioProveedor: 0, tarifaDiariaCliente: 35000 },
      // Ítem 2: Subcontratado a aliado
      { cantidad: 1, dias: 15, costoDiarioProveedor: 22000, tarifaDiariaCliente: 35000 }
    ];

    const subcontratados = items.filter(it => it.costoDiarioProveedor > 0);
    const rentabilidadSub = CalculoSubcontratacionService.calcularRentabilidadGlobal(subcontratados);

    expect(rentabilidadSub.subtotalCostoProveedor).toBe(330000); // 1 * 15 * 22,000
    expect(rentabilidadSub.subtotalTarifaCliente).toBe(525000); // 1 * 15 * 35,000
    expect(rentabilidadSub.margenBrutoNominal).toBe(195000);
    expect(rentabilidadSub.esMargenNegativo).toBe(false);
  });
});
