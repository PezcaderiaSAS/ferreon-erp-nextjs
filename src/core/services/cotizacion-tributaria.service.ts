/**
 * Servicio Puro de Dominio: Cotización Tributaria y Financiera
 * Gobernanza de redondeo en Pesos Colombianos (COP) y cálculo de retenciones.
 */

export interface CotizacionItemCalculo {
  equipoId: string | number;
  nombre?: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
}

export interface ParametrosTributariosCotizacion {
  items: CotizacionItemCalculo[];
  aplicaIva?: boolean;
  tasaIva?: number; // Ej: 19.0 para 19%
  aplicaRetefuente?: boolean;
  tasaRetefuente?: number; // Ej: 2.5 para 2.5%
  aplicaReteica?: boolean;
  tasaReteica?: number; // Ej: 0.966 para 9.66 por mil
  valorTransporte?: number;
  depositoGarantia?: number;
}

export interface LineaCotizacionCalculada {
  equipoId: string | number;
  nombre?: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  subtotalLinea: number;
}

export interface DesgloseCotizacionResultado {
  lineas: LineaCotizacionCalculada[];
  subtotalEquipos: number;
  valorTransporte: number;
  baseGravableIva: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
  depositoSugerido: number;
  totalNeto: number;
}

/**
 * Calcula el desglose financiero completo de una cotización con parámetros tributarios colombianos.
 * Regla: Toda cifra monetaria se redondea a número entero en COP.
 */
export function calcularDesgloseCotizacion(
  params: ParametrosTributariosCotizacion
): DesgloseCotizacionResultado {
  const items = params.items || [];
  const valorTransporte = Math.max(0, Math.round(params.valorTransporte || 0));
  const depositoGarantia = Math.max(0, Math.round(params.depositoGarantia || 0));

  let subtotalEquipos = 0;
  const lineas: LineaCotizacionCalculada[] = [];

  for (const it of items) {
    const cantidad = Math.max(0, it.cantidad || 0);
    const dias = Math.max(0, it.dias || 0);
    const tarifa = Math.max(0, it.tarifaDiaria || 0);
    const subtotalLinea = Math.round(cantidad * dias * tarifa);

    subtotalEquipos += subtotalLinea;
    lineas.push({
      equipoId: it.equipoId,
      nombre: it.nombre,
      cantidad,
      dias,
      tarifaDiaria: tarifa,
      subtotalLinea
    });
  }

  // Base gravable para IVA: Subtotal de equipos + flete de transporte
  const baseGravableIva = subtotalEquipos + valorTransporte;

  // Cálculo de IVA (estándar 19%)
  const tasaIva = params.aplicaIva ? (params.tasaIva !== undefined ? params.tasaIva : 19.0) : 0;
  const valorIva = params.aplicaIva && baseGravableIva > 0
    ? Math.round(baseGravableIva * (tasaIva / 100))
    : 0;

  // Cálculo de ReteFuente (generalmente 2.5% sobre el servicio de alquiler)
  const tasaRetefuente = params.aplicaRetefuente ? (params.tasaRetefuente !== undefined ? params.tasaRetefuente : 2.5) : 0;
  const valorRetefuente = params.aplicaRetefuente && baseGravableIva > 0
    ? Math.round(baseGravableIva * (tasaRetefuente / 100))
    : 0;

  // Cálculo de ReteICA (tarifa por mil, ej: 9.66 por mil = 0.00966)
  const tasaReteica = params.aplicaReteica ? (params.tasaReteica !== undefined ? params.tasaReteica : 0.966) : 0;
  const valorReteica = params.aplicaReteica && baseGravableIva > 0
    ? Math.round(baseGravableIva * (tasaReteica / 100))
    : 0;

  // Total Neto = Base + IVA - Deducciones Tributarias Practicadas por el Cliente
  const totalNeto = Math.max(0, baseGravableIva + valorIva - valorRetefuente - valorReteica);

  return {
    lineas,
    subtotalEquipos,
    valorTransporte,
    baseGravableIva,
    valorIva,
    valorRetefuente,
    valorReteica,
    depositoSugerido: depositoGarantia,
    totalNeto
  };
}

/**
 * Valida si una cotización continúa vigente en función de su fecha de emisión y días de vigencia comercial.
 */
export function validarVigenciaCotizacion(
  fechaEmision: string,
  diasValidez: number = 15
): boolean {
  if (!fechaEmision) return false;
  
  const partes = fechaEmision.split('T')[0].split('-');
  if (partes.length !== 3) return false;

  const anio = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const fechaInicio = new Date(anio, mes, dia, 0, 0, 0);
  const fechaLimite = new Date(fechaInicio.getTime() + (diasValidez * 24 * 60 * 60 * 1000));
  const ahora = new Date();

  return ahora.getTime() <= fechaLimite.getTime();
}
