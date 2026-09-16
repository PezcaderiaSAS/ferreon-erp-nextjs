/**
 * Servicio Puro de Dominio: Liquidación de Subcontrataciones y Asientos de Partida Doble
 * Cálculo exacto de costos con proveedores aliados, márgenes frente al cliente y retenciones (COP sin centavos).
 */

export interface OrdenSubcontratacionBase {
  id: string;
  consecutivo: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  fechaRecepcion: string;
  fechaRetornoProveedor: string;
}

export interface ItemSubcontratacionInput {
  itemSubcontratacionId: string | number;
  equipoId?: string | number;
  descripcionItem: string;
  cantidad: number;
  costoDiarioProveedor: number;
  tarifaDiariaCliente: number;
  diasFacturadosCliente?: number;
}

export interface OpcionesLiquidacionSubcontratacion {
  aplicaRetenciones?: boolean;
  tasaReteFuente?: number; // Ej. 0.025 (2.5%) o 0.035 (3.5%)
  tasaReteICA?: number;    // Ej. 0.00966 (9.66 por mil)
}

export interface LineaAsientoContable {
  cuentaCodigo: string;
  cuentaNombre: string;
  naturaleza: 'DEBITO' | 'CREDITO';
  monto: number;
}

export interface AsientoContableSubcontratacion {
  concepto: string;
  lineas: LineaAsientoContable[];
  estaBalanceado: boolean;
}

export interface LiquidacionSubcontratacionResultado {
  diasTranscurridosProveedor: number;
  costoTotalProveedor: number;
  ingresoTotalCliente: number;
  margenBruto: number;
  porcentajeMargen: number;
  aplicaRetenciones: boolean;
  valorReteFuente: number;
  valorReteICA: number;
  netoPagarProveedor: number;
  asientoContable: AsientoContableSubcontratacion;
}

/**
 * Calcula los días transcurridos entre recepción y retorno efectivo al proveedor (mínimo 1 día).
 */
export function calcularDiasSubcontratacion(fechaRecepcionStr: string, fechaRetornoStr: string): number {
  const inicio = new Date(fechaRecepcionStr).getTime();
  const fin = new Date(fechaRetornoStr).getTime();
  const diferenciaMs = Math.max(0, fin - inicio);
  const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  return Math.max(1, dias);
}

/**
 * Liquida la orden de subcontratación, computa costos con terceros, márgenes comerciales y partida doble contable.
 */
export function calcularLiquidacionSubcontratacion(
  orden: OrdenSubcontratacionBase,
  items: ItemSubcontratacionInput[],
  opciones: OpcionesLiquidacionSubcontratacion = {}
): LiquidacionSubcontratacionResultado {
  const diasTranscurridos = calcularDiasSubcontratacion(orden.fechaRecepcion, orden.fechaRetornoProveedor);
  
  let costoTotalProveedor = 0;
  let ingresoTotalCliente = 0;

  for (const item of items) {
    const costoItem = item.cantidad * diasTranscurridos * item.costoDiarioProveedor;
    costoTotalProveedor += Math.round(costoItem);

    const diasCliente = item.diasFacturadosCliente || diasTranscurridos;
    const ingresoItem = item.cantidad * diasCliente * item.tarifaDiariaCliente;
    ingresoTotalCliente += Math.round(ingresoItem);
  }

  const margenBruto = ingresoTotalCliente - costoTotalProveedor;
  const porcentajeMargen = ingresoTotalCliente > 0 
    ? (margenBruto / ingresoTotalCliente) * 100 
    : 0;

  const aplicaRetenciones = opciones.aplicaRetenciones ?? true;
  const tasaReteFuente = opciones.tasaReteFuente ?? 0.025;
  const tasaReteICA = opciones.tasaReteICA ?? 0.00966;

  let valorReteFuente = 0;
  let valorReteICA = 0;

  if (aplicaRetenciones && costoTotalProveedor > 0) {
    valorReteFuente = Math.round(costoTotalProveedor * tasaReteFuente);
    valorReteICA = Math.round(costoTotalProveedor * tasaReteICA);
  }

  const netoPagarProveedor = costoTotalProveedor - valorReteFuente - valorReteICA;

  // Construcción del Asiento Contable Balanceado
  const lineasAsiento: LineaAsientoContable[] = [];

  // Débito: Costo de Alquiler de Maquinaria
  lineasAsiento.push({
    cuentaCodigo: '6135',
    cuentaNombre: 'Costos Directos por Alquiler de Maquinaria Subcontratada',
    naturaleza: 'DEBITO',
    monto: costoTotalProveedor
  });

  // Crédito: Retención en la Fuente Pasivo (si aplica)
  if (valorReteFuente > 0) {
    lineasAsiento.push({
      cuentaCodigo: '2365',
      cuentaNombre: 'ReteFuente por Pagar Compras y Servicios',
      naturaleza: 'CREDITO',
      monto: valorReteFuente
    });
  }

  // Crédito: ReteICA Pasivo (si aplica)
  if (valorReteICA > 0) {
    lineasAsiento.push({
      cuentaCodigo: '2368',
      cuentaNombre: 'ReteICA por Pagar',
      naturaleza: 'CREDITO',
      monto: valorReteICA
    });
  }

  // Crédito: Cuentas por Pagar Proveedores y Subcontratistas (Neto)
  lineasAsiento.push({
    cuentaCodigo: '2205',
    cuentaNombre: 'Proveedores y Subcontratistas Nacionales',
    naturaleza: 'CREDITO',
    monto: netoPagarProveedor
  });

  const totalDebitos = lineasAsiento
    .filter(l => l.naturaleza === 'DEBITO')
    .reduce((sum, l) => sum + l.monto, 0);

  const totalCreditos = lineasAsiento
    .filter(l => l.naturaleza === 'CREDITO')
    .reduce((sum, l) => sum + l.monto, 0);

  const estaBalanceado = totalDebitos === totalCreditos;

  return {
    diasTranscurridosProveedor: diasTranscurridos,
    costoTotalProveedor,
    ingresoTotalCliente,
    margenBruto,
    porcentajeMargen,
    aplicaRetenciones,
    valorReteFuente,
    valorReteICA,
    netoPagarProveedor,
    asientoContable: {
      concepto: `Liquidación subcontratación ${orden.consecutivo} - ${orden.proveedorNombre}`,
      lineas: lineasAsiento,
      estaBalanceado
    }
  };
}
