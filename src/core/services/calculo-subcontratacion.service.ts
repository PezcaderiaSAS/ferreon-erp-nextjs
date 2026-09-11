export interface ItemSubcontratadoCalculo {
  cantidad: number;
  dias: number;
  costoDiarioProveedor: number;
  tarifaDiariaCliente: number;
}

export interface ResultadoCalculoSubcontratacion {
  subtotalCostoProveedor: number;
  subtotalTarifaCliente: number;
  margenBrutoNominal: number;
  margenBrutoPorcentual: number;
  esMargenNegativo: boolean;
  alertaRentabilidad?: string;
}

export class CalculoSubcontratacionService {
  /**
   * Calcula el desglose financiero exacto de una orden o ítem subcontratado.
   */
  static calcularRentabilidadLinea(
    cantidad: number,
    dias: number,
    costoDiarioProveedor: number,
    tarifaDiariaCliente: number
  ): {
    costoTotalLinea: number;
    ingresoTotalLinea: number;
    margenLinea: number;
    margenPorcentual: number;
    esMargenNegativo: boolean;
  } {
    const cant = Math.max(1, cantidad || 1);
    const numDias = Math.max(1, dias || 1);
    const costoDiario = Math.max(0, costoDiarioProveedor || 0);
    const tarifaDiaria = Math.max(0, tarifaDiariaCliente || 0);

    const costoTotalLinea = cant * numDias * costoDiario;
    const ingresoTotalLinea = cant * numDias * tarifaDiaria;
    const margenLinea = ingresoTotalLinea - costoTotalLinea;
    const margenPorcentual = ingresoTotalLinea > 0 
      ? Math.round((margenLinea / ingresoTotalLinea) * 10000) / 100 
      : 0;

    return {
      costoTotalLinea,
      ingresoTotalLinea,
      margenLinea,
      margenPorcentual,
      esMargenNegativo: margenLinea < 0
    };
  }

  /**
   * Calcula la rentabilidad total de un paquete de ítems subcontratados.
   */
  static calcularRentabilidadGlobal(items: ItemSubcontratadoCalculo[]): ResultadoCalculoSubcontratacion {
    let subtotalCostoProveedor = 0;
    let subtotalTarifaCliente = 0;

    for (const it of items) {
      const linea = this.calcularRentabilidadLinea(
        it.cantidad,
        it.dias,
        it.costoDiarioProveedor,
        it.tarifaDiariaCliente
      );
      subtotalCostoProveedor += linea.costoTotalLinea;
      subtotalTarifaCliente += linea.ingresoTotalLinea;
    }

    const margenBrutoNominal = subtotalTarifaCliente - subtotalCostoProveedor;
    const margenBrutoPorcentual = subtotalTarifaCliente > 0 
      ? Math.round((margenBrutoNominal / subtotalTarifaCliente) * 10000) / 100 
      : 0;

    const esMargenNegativo = margenBrutoNominal < 0;
    let alertaRentabilidad: string | undefined;

    if (esMargenNegativo) {
      alertaRentabilidad = `Alerta: La subcontratación genera una pérdida operativa de $${Math.abs(margenBrutoNominal).toLocaleString('es-CO')} COP. El costo cobrado por el proveedor supera la tarifa acordada con el cliente.`;
    } else if (margenBrutoPorcentual < 15 && subtotalTarifaCliente > 0) {
      alertaRentabilidad = `Aviso: El margen comercial es del ${margenBrutoPorcentual}% (por debajo del 15% recomendado).`;
    }

    return {
      subtotalCostoProveedor,
      subtotalTarifaCliente,
      margenBrutoNominal,
      margenBrutoPorcentual,
      esMargenNegativo,
      alertaRentabilidad
    };
  }
}
