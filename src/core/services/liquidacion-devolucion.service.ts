/**
 * Servicio Puro de Dominio: Liquidación de Devoluciones, Split-Line e Inspección Técnica
 * Reglas de exactitud financiera y redondeo para Colombia (COP sin decimales).
 */

export interface ContratoAlquilerBase {
  id: number | string;
  consecutivo: string;
  clienteId?: number | string;
  clienteNombre?: string;
  depositoGarantia: number;
  fechaInicio: string;
  fechaFinEstimada?: string;
}

export type EstadoInspeccionTecnica = 'BUENO' | 'MANTENIMIENTO' | 'PERDIDA_TOTAL';

export interface ItemDevolucionInput {
  detalleId: number | string;
  equipoId: number | string;
  nombreEquipo: string;
  cantidadTotalOriginal: number;
  cantidadDevuelta: number;
  tarifaDiariaPactada: number;
  fechaInicio: string;
  fechaDevolucion: string;
  estadoInspeccion: EstadoInspeccionTecnica;
  costoReparacion?: number;
  valorReposicion?: number;
  descripcionDano?: string;
}

export interface ItemLiquidadoResultado {
  detalleId: number | string;
  equipoId: number | string;
  nombreEquipo: string;
  cantidadDevuelta: number;
  cantidadRemanenteEnObra: number;
  esSplitLine: boolean;
  diasCausados: number;
  tarifaDiaria: number;
  subtotalAlquilerItem: number;
  costoReparacion: number;
  valorReposicion: number;
  estadoInspeccion: EstadoInspeccionTecnica;
  descripcionDano?: string;
}

export interface LiquidacionDevolucionResultado {
  totalAlquilerLiquidado: number;
  totalDanos: number;
  totalReposiciones: number;
  totalCargos: number;
  depositoAplicado: number;
  saldoNeto: number; // Positivo = reembolso a cliente, Negativo = cobro a cliente
  tipoResolucion: 'REEMBOLSO_CLIENTE' | 'COBRO_CLIENTE' | 'SIN_SALDO';
  afectaCaja: boolean;
  tipoMovimientoCaja: 'INGRESO' | 'EGRESO' | null;
  itemsLiquidacion: ItemLiquidadoResultado[];
}

/**
 * Calcula los días de uso efectivos entre fechaInicio y fechaDevolucion (mínimo 1 día).
 */
export function calcularDiasEfectivosUso(fechaInicioStr: string, fechaDevolucionStr: string): number {
  const inicio = new Date(fechaInicioStr).getTime();
  const fin = new Date(fechaDevolucionStr).getTime();
  const diferenciaMs = Math.max(0, fin - inicio);
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  return Math.max(1, dias);
}

/**
 * Calcula la liquidación neta de una devolución de equipos.
 */
export function calcularLiquidacionDevolucion(
  contrato: ContratoAlquilerBase,
  items: ItemDevolucionInput[]
): LiquidacionDevolucionResultado {
  let totalAlquilerLiquidado = 0;
  let totalDanos = 0;
  let totalReposiciones = 0;

  const itemsLiquidacion: ItemLiquidadoResultado[] = items.map(item => {
    const diasCausados = calcularDiasEfectivosUso(item.fechaInicio, item.fechaDevolucion);
    const subtotalBruto = item.cantidadDevuelta * diasCausados * item.tarifaDiariaPactada;
    const subtotalAlquilerItem = Math.round(subtotalBruto);
    
    const costoReparacion = Math.round(item.costoReparacion || 0);
    const valorReposicion = Math.round(item.valorReposicion || 0);
    
    const cantidadRemanenteEnObra = Math.max(0, item.cantidadTotalOriginal - item.cantidadDevuelta);
    const esSplitLine = item.cantidadDevuelta < item.cantidadTotalOriginal && cantidadRemanenteEnObra > 0;

    totalAlquilerLiquidado += subtotalAlquilerItem;
    totalDanos += costoReparacion;
    totalReposiciones += valorReposicion;

    return {
      detalleId: item.detalleId,
      equipoId: item.equipoId,
      nombreEquipo: item.nombreEquipo,
      cantidadDevuelta: item.cantidadDevuelta,
      cantidadRemanenteEnObra,
      esSplitLine,
      diasCausados,
      tarifaDiaria: Math.round(item.tarifaDiariaPactada),
      subtotalAlquilerItem,
      costoReparacion,
      valorReposicion,
      estadoInspeccion: item.estadoInspeccion,
      descripcionDano: item.descripcionDano
    };
  });

  const totalCargos = totalAlquilerLiquidado + totalDanos + totalReposiciones;
  const depositoAplicado = Math.round(contrato.depositoGarantia || 0);
  
  // Saldo neto: Depósito - Total Cargos
  // Positivo: Sobra depósito -> Se devuelve al cliente (EGRESO de caja)
  // Negativo: Faltan recursos -> El cliente debe pagar el excedente (INGRESO de caja)
  const saldoNeto = depositoAplicado - totalCargos;

  let tipoResolucion: 'REEMBOLSO_CLIENTE' | 'COBRO_CLIENTE' | 'SIN_SALDO' = 'SIN_SALDO';
  let afectaCaja = false;
  let tipoMovimientoCaja: 'INGRESO' | 'EGRESO' | null = null;

  if (saldoNeto > 0) {
    tipoResolucion = 'REEMBOLSO_CLIENTE';
    afectaCaja = true;
    tipoMovimientoCaja = 'EGRESO';
  } else if (saldoNeto < 0) {
    tipoResolucion = 'COBRO_CLIENTE';
    afectaCaja = true;
    tipoMovimientoCaja = 'INGRESO';
  }

  return {
    totalAlquilerLiquidado,
    totalDanos,
    totalReposiciones,
    totalCargos,
    depositoAplicado,
    saldoNeto,
    tipoResolucion,
    afectaCaja,
    tipoMovimientoCaja,
    itemsLiquidacion
  };
}
