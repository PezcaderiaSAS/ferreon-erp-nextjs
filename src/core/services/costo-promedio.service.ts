/**
 * ==============================================================================
 * SERVICIO DE DOMINIO: Costo Promedio Ponderado (PMP) & Valuación de Inventarios
 * ==============================================================================
 * Responsabilidad: Cálculo matemático puro del Costo Promedio Ponderado de adquisición,
 * prorrateo de fletes logísticos y valuación patrimonial de existencias en bodega
 * bajo estándares NIIF Pymes para Colombia (Pesos enteros COP sin centavos).
 */

export interface CostoPromedioInput {
  stockPrevio: number;
  costoPromedioActual: number;
  cantidadComprada: number;
  precioCompraUnitario: number;
  fleteTotalAsignado?: number;
}

export interface CostoPromedioResult {
  nuevoCostoPromedio: number;
  costoUnitarioEfectivoCompra: number;
  nuevoStockTotal: number;
  valorTotalInventario: number;
}

export interface ItemParaCosteoInput {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
}

export interface ItemFleteProrrateado {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
  fleteAsignado: number;
  fleteUnitario: number;
  costoEfectivoUnitario: number;
}

/**
 * Calcula el Costo Promedio Ponderado (PMP) tras una recepción de compra en bodega.
 * 
 * Fórmula:
 * PMP = ROUND( ( (Stock_Previo * Costo_Actual) + (Cantidad_Comprada * Costo_Efectivo_Compra) ) / (Stock_Previo + Cantidad_Comprada) )
 * 
 * Casos especiales:
 * - Si Stock_Previo <= 0: El nuevo costo promedio es exactamente el Costo_Efectivo_Compra.
 * - Moneda COP: Siempre enteros redondeados mediante Math.round().
 */
export function calcularCostoPromedioPonderado(params: CostoPromedioInput): CostoPromedioResult {
  const {
    stockPrevio,
    costoPromedioActual,
    cantidadComprada,
    precioCompraUnitario,
    fleteTotalAsignado = 0
  } = params;

  if (cantidadComprada <= 0 || !Number.isInteger(cantidadComprada)) {
    throw new Error('La cantidad comprada debe ser un entero positivo mayor a cero');
  }

  if (precioCompraUnitario < 0) {
    throw new Error('El precio de compra unitario no puede ser negativo');
  }

  if (fleteTotalAsignado < 0) {
    throw new Error('El flete asignado no puede ser negativo');
  }

  // Flete unitario prorrateado para esta compra
  const fleteUnitario = Math.round(fleteTotalAsignado / cantidadComprada);
  const costoUnitarioEfectivoCompra = Math.round(precioCompraUnitario + fleteUnitario);

  const nuevoStockTotal = stockPrevio + cantidadComprada;

  let nuevoCostoPromedio: number;

  if (stockPrevio <= 0) {
    // Si el stock era 0 o negativo por descuadres previos, el nuevo costo asume la compra actual
    nuevoCostoPromedio = costoUnitarioEfectivoCompra;
  } else {
    const valorInventarioPrevio = stockPrevio * Math.max(0, Math.round(costoPromedioActual));
    const valorCompraNueva = cantidadComprada * costoUnitarioEfectivoCompra;
    const costoPonderadoFloat = (valorInventarioPrevio + valorCompraNueva) / nuevoStockTotal;
    nuevoCostoPromedio = Math.round(costoPonderadoFloat);
  }

  const valorTotalInventario = Math.max(0, nuevoStockTotal) * nuevoCostoPromedio;

  return {
    nuevoCostoPromedio,
    costoUnitarioEfectivoCompra,
    nuevoStockTotal,
    valorTotalInventario
  };
}

/**
 * Prorratea el flete logístico total entre una lista de ítems de compra
 * proporcionalmente a su subtotal monetario.
 */
export function prorratearFleteEnItemsCompra(
  items: ItemParaCosteoInput[],
  fleteTotal: number
): ItemFleteProrrateado[] {
  if (!items || items.length === 0) return [];
  if (!fleteTotal || fleteTotal <= 0) {
    return items.map(it => ({
      equipoId: it.equipoId,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      fleteAsignado: 0,
      fleteUnitario: 0,
      costoEfectivoUnitario: it.precioUnitario
    }));
  }

  const subtotalTotal = items.reduce((acc, it) => acc + (it.cantidad * it.precioUnitario), 0);

  if (subtotalTotal <= 0) {
    // Si los precios son 0, dividir a partes iguales por ítem
    const fletePorItem = Math.round(fleteTotal / items.length);
    return items.map(it => {
      const fleteUnitario = Math.round(fletePorItem / it.cantidad);
      return {
        equipoId: it.equipoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        fleteAsignado: fletePorItem,
        fleteUnitario,
        costoEfectivoUnitario: it.precioUnitario + fleteUnitario
      };
    });
  }

  return items.map(it => {
    const itemSubtotal = it.cantidad * it.precioUnitario;
    const porcentaje = itemSubtotal / subtotalTotal;
    const fleteAsignado = Math.round(fleteTotal * porcentaje);
    const fleteUnitario = Math.round(fleteAsignado / it.cantidad);

    return {
      equipoId: it.equipoId,
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      fleteAsignado,
      fleteUnitario,
      costoEfectivoUnitario: it.precioUnitario + fleteUnitario
    };
  });
}

/**
 * Calcula el valor patrimonial monetario total del inventario de un equipo.
 */
export function calcularValorTotalInventario(stock: number, costoPromedio: number): number {
  if (stock <= 0 || costoPromedio <= 0) return 0;
  return Math.round(stock * costoPromedio);
}
