/**
 * Motor Matemático de Arqueo de Caja y Control de Efectivo POS (COP)
 * Proyecto: FerreOn ERP
 * Estándares: Inmutabilidad, Cero Decimales (COP), Manejo Seguro de Denominaciones
 */

export interface ConteoDenominaciones {
  billetes: {
    '100000'?: number;
    '50000'?: number;
    '20000'?: number;
    '10000'?: number;
    '5000'?: number;
    '2000'?: number;
  };
  monedas: {
    '1000'?: number;
    '500'?: number;
    '200'?: number;
    '100'?: number;
    '50'?: number;
  };
}

export interface DatosFlujoEfectivoSesion {
  montoApertura: number;
  totalCobrosEfectivo: number;
  totalIngresosCaja: number;
  totalEgresosCaja: number;
  montoFisicoContado: number;
}

export type ClasificacionDescuadre = 'CUADRADO' | 'SOBRANTE' | 'FALTANTE';

export interface BalanceSesionCajaResultado {
  saldoEsperado: number;
  montoFisicoContado: number;
  diferencia: number;
  clasificacionDescuadre: ClasificacionDescuadre;
  requiereJustificacion: boolean;
}

export interface SolicitudValidacionEgreso {
  montoApertura: number;
  totalCobrosEfectivo: number;
  totalIngresosCaja: number;
  totalEgresosPrevios: number;
  montoEgresoSolicitado: number;
}

export interface ResultadoValidacionEgreso {
  esValido: boolean;
  efectivoDisponible: number;
  saldoRestante: number;
  error?: string;
}

export const DENOMINACIONES_BILLETES = [100000, 50000, 20000, 10000, 5000, 2000] as const;
export const DENOMINACIONES_MONEDAS = [1000, 500, 200, 100, 50] as const;

/**
 * Calcula la sumatoria exacta del dinero físico a partir del conteo por denominaciones.
 * Ignora valores negativos o no numéricos para máxima robustez.
 */
export function calcularTotalFisicoArqueo(conteo: ConteoDenominaciones): number {
  let total = 0;

  // Billetes
  if (conteo.billetes) {
    for (const denom of DENOMINACIONES_BILLETES) {
      const key = denom.toString() as keyof ConteoDenominaciones['billetes'];
      const cantidad = conteo.billetes[key];
      if (typeof cantidad === 'number' && cantidad > 0 && !isNaN(cantidad)) {
        total += Math.round(cantidad) * denom;
      }
    }
  }

  // Monedas
  if (conteo.monedas) {
    for (const denom of DENOMINACIONES_MONEDAS) {
      const key = denom.toString() as keyof ConteoDenominaciones['monedas'];
      const cantidad = conteo.monedas[key];
      if (typeof cantidad === 'number' && cantidad > 0 && !isNaN(cantidad)) {
        total += Math.round(cantidad) * denom;
      }
    }
  }

  return Math.round(total);
}

/**
 * Calcula el saldo teórico esperado y determina si existe descuadre (sobrante o faltante).
 */
export function calcularBalanceSesionCaja(datos: DatosFlujoEfectivoSesion): BalanceSesionCajaResultado {
  const apertura = Math.round(Math.max(0, datos.montoApertura || 0));
  const cobros = Math.round(Math.max(0, datos.totalCobrosEfectivo || 0));
  const ingresos = Math.round(Math.max(0, datos.totalIngresosCaja || 0));
  const egresos = Math.round(Math.max(0, datos.totalEgresosCaja || 0));
  const fisico = Math.round(Math.max(0, datos.montoFisicoContado || 0));

  const saldoEsperado = apertura + cobros + ingresos - egresos;
  const diferencia = fisico - saldoEsperado;

  let clasificacionDescuadre: ClasificacionDescuadre = 'CUADRADO';
  if (diferencia > 0) {
    clasificacionDescuadre = 'SOBRANTE';
  } else if (diferencia < 0) {
    clasificacionDescuadre = 'FALTANTE';
  }

  return {
    saldoEsperado,
    montoFisicoContado: fisico,
    diferencia,
    clasificacionDescuadre,
    requiereJustificacion: diferencia !== 0
  };
}

/**
 * Valida si la caja activa cuenta con suficiente efectivo disponible para autorizar un egreso de caja menor.
 */
export function validarDisponibilidadEgreso(datos: SolicitudValidacionEgreso): ResultadoValidacionEgreso {
  const apertura = Math.round(Math.max(0, datos.montoApertura || 0));
  const cobros = Math.round(Math.max(0, datos.totalCobrosEfectivo || 0));
  const ingresos = Math.round(Math.max(0, datos.totalIngresosCaja || 0));
  const egresosPrevios = Math.round(Math.max(0, datos.totalEgresosPrevios || 0));
  const solicitado = Math.round(Math.max(0, datos.montoEgresoSolicitado || 0));

  const efectivoDisponible = apertura + cobros + ingresos - egresosPrevios;

  if (solicitado <= 0) {
    return {
      esValido: false,
      efectivoDisponible,
      saldoRestante: efectivoDisponible,
      error: 'El monto del egreso debe ser mayor a cero.'
    };
  }

  if (solicitado > efectivoDisponible) {
    return {
      esValido: false,
      efectivoDisponible,
      saldoRestante: efectivoDisponible,
      error: `Efectivo insuficiente en caja. Disponible: $${efectivoDisponible.toLocaleString('es-CO')}, solicitado: $${solicitado.toLocaleString('es-CO')}.`
    };
  }

  return {
    esValido: true,
    efectivoDisponible,
    saldoRestante: efectivoDisponible - solicitado
  };
}

// ============================================================================
// COMPROBANTE OFICIAL DE ARQUEO Y CIERRE: MODELO DE DATOS Y AUDITORÍA
// ============================================================================

export interface DatosEmpresaComprobante {
  razonSocial: string;
  nit: string;
  direccion: string;
  telefono: string;
  ciudad: string;
  regimen: string;
}

export interface DatosSesionComprobante {
  id: string;
  usuarioId: string;
  cajeroNombre: string;
  cajeroEmail?: string;
  sucursal?: string;
  fechaApertura: string;
  fechaCierre: string;
  estado: 'CERRADA' | 'ABIERTA';
  observaciones?: string | null;
}

export interface MovimientoDetalleComprobante {
  id: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto: string;
  beneficiario?: string | null;
  comprobante?: string | null;
  fecha: string;
}

export interface DesgloseDenominacionItem {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

export interface ArqueoFisicoDetallado {
  billetes: DesgloseDenominacionItem[];
  subtotalBilletes: number;
  monedas: DesgloseDenominacionItem[];
  subtotalMonedas: number;
  totalFisico: number;
}

export interface FlujoEfectivoLiquidacion {
  montoApertura: number;
  totalCobrosEfectivo: number;
  cantidadCobros: number;
  totalIngresosCaja: number;
  totalEgresosCaja: number;
  saldoEsperado: number;
}

export interface CuadreAuditoria {
  saldoEsperado: number;
  totalFisico: number;
  diferencia: number;
  clasificacion: ClasificacionDescuadre;
  motivoDescuadre?: string | null;
}

export interface FirmasComprobante {
  cajero: {
    nombre: string;
    cargo: string;
    documento?: string;
  };
  supervisor: {
    nombre: string;
    cargo: string;
    documento?: string;
  };
}

export interface ComprobanteArqueoCompleto {
  version: string;
  empresa: DatosEmpresaComprobante;
  sesion: DatosSesionComprobante;
  flujo: FlujoEfectivoLiquidacion;
  arqueoFisico: ArqueoFisicoDetallado;
  cuadre: CuadreAuditoria;
  movimientos: MovimientoDetalleComprobante[];
  firmas: FirmasComprobante;
  hashAuditoria: string;
  generadoEn: string;
}

/**
 * Genera un código hash alfanumérico determinístico para el comprobante de arqueo.
 */
export function generarHashAuditoriaComprobante(
  sesionId: string,
  fechaCierre: string,
  montoFisico: number,
  diferencia: number
): string {
  const seed = `${sesionId}|${fechaCierre}|${montoFisico}|${diferencia}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const shortId = sesionId.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `ARQ-${shortId}-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Construye el modelo completo del comprobante de arqueo y cierre,
 * computando cada campo y cada cálculo matemático de forma atómica.
 */
export function construirComprobanteArqueoCompleto(input: {
  empresa?: Partial<DatosEmpresaComprobante>;
  sesion: {
    id: string;
    usuarioId: string;
    cajeroNombre?: string;
    cajeroEmail?: string;
    sucursal?: string;
    fechaApertura: string;
    fechaCierre?: string;
    estado?: 'CERRADA' | 'ABIERTA';
    montoApertura: number;
    montoCierre?: number;
    observaciones?: string | null;
    motivoDescuadre?: string | null;
    arqueoDetalle?: ConteoDenominaciones | null;
  };
  totalCobrosEfectivo?: number;
  cantidadCobros?: number;
  movimientos?: any[];
  firmas?: Partial<FirmasComprobante>;
}): ComprobanteArqueoCompleto {
  const emp: DatosEmpresaComprobante = {
    razonSocial: input.empresa?.razonSocial?.trim() || 'FERREON ERP & APPFRIOS PEZCA',
    nit: input.empresa?.nit?.trim() || '901.884.221-5',
    direccion: input.empresa?.direccion?.trim() || 'Calle 45 # 22 - 18',
    telefono: input.empresa?.telefono?.trim() || '(607) 645-1234',
    ciudad: input.empresa?.ciudad?.trim() || 'Bucaramanga, Santander',
    regimen: input.empresa?.regimen?.trim() || 'Régimen Común - IVA Responsable'
  };

  const sesionId = input.sesion.id;
  const fechaApertura = input.sesion.fechaApertura;
  const fechaCierre = input.sesion.fechaCierre || new Date().toISOString();
  const cajeroNombre = input.sesion.cajeroNombre?.trim() || 'Cajero de Turno';
  const cajeroEmail = input.sesion.cajeroEmail?.trim() || undefined;
  const sucursal = input.sesion.sucursal?.trim() || 'Sede Principal - Bodega 1';

  // Flujo financiero
  const montoApertura = Math.round(Number(input.sesion.montoApertura) || 0);
  const totalCobrosEfectivo = Math.round(Number(input.totalCobrosEfectivo) || 0);
  const cantidadCobros = Math.max(0, Number(input.cantidadCobros) || 0);

  const rawMovs = input.movimientos || [];
  const movimientos: MovimientoDetalleComprobante[] = rawMovs.map((m: any, idx: number) => ({
    id: m.id || `mov-${idx}`,
    tipo: m.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO',
    monto: Math.round(Number(m.monto) || 0),
    concepto: m.concepto || 'Movimiento de caja menor',
    beneficiario: m.beneficiario || null,
    comprobante: m.comprobante || null,
    fecha: m.created_at || m.fecha || fechaCierre
  }));

  const totalIngresosCaja = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((acc, m) => acc + m.monto, 0);

  const totalEgresosCaja = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((acc, m) => acc + m.monto, 0);

  const saldoEsperado = montoApertura + totalCobrosEfectivo + totalIngresosCaja - totalEgresosCaja;

  // Arqueo físico desglosado
  const conteo = input.sesion.arqueoDetalle || { billetes: {}, monedas: {} };
  const billetesList: DesgloseDenominacionItem[] = [];
  let subtotalBilletes = 0;

  for (const denom of DENOMINACIONES_BILLETES) {
    const key = denom.toString() as keyof ConteoDenominaciones['billetes'];
    const cant = Math.max(0, Math.round(Number(conteo.billetes?.[key]) || 0));
    const subtotal = cant * denom;
    billetesList.push({ denominacion: denom, cantidad: cant, subtotal });
    subtotalBilletes += subtotal;
  }

  const monedasList: DesgloseDenominacionItem[] = [];
  let subtotalMonedas = 0;

  for (const denom of DENOMINACIONES_MONEDAS) {
    const key = denom.toString() as keyof ConteoDenominaciones['monedas'];
    const cant = Math.max(0, Math.round(Number(conteo.monedas?.[key]) || 0));
    const subtotal = cant * denom;
    monedasList.push({ denominacion: denom, cantidad: cant, subtotal });
    subtotalMonedas += subtotal;
  }

  const totalFisicoCalculado = subtotalBilletes + subtotalMonedas;
  // Si no se suministró conteo detallado pero sí montoCierre, se respeta el monto reportado
  const totalFisico = (totalFisicoCalculado > 0 || !input.sesion.montoCierre)
    ? totalFisicoCalculado
    : Math.round(Number(input.sesion.montoCierre) || 0);

  const diferencia = totalFisico - saldoEsperado;
  let clasificacion: ClasificacionDescuadre = 'CUADRADO';
  if (diferencia > 0) clasificacion = 'SOBRANTE';
  else if (diferencia < 0) clasificacion = 'FALTANTE';

  const hashAuditoria = generarHashAuditoriaComprobante(sesionId, fechaCierre, totalFisico, diferencia);

  const firmas: FirmasComprobante = {
    cajero: {
      nombre: input.firmas?.cajero?.nombre || cajeroNombre,
      cargo: input.firmas?.cajero?.cargo || 'Cajero Responsable POS',
      documento: input.firmas?.cajero?.documento || 'C.C. ____________________'
    },
    supervisor: {
      nombre: input.firmas?.supervisor?.nombre || 'Supervisor de Caja y Tesorería',
      cargo: input.firmas?.supervisor?.cargo || 'Auditor de Operaciones',
      documento: input.firmas?.supervisor?.documento || 'C.C. ____________________'
    }
  };

  return {
    version: '1.0',
    empresa: emp,
    sesion: {
      id: sesionId,
      usuarioId: input.sesion.usuarioId,
      cajeroNombre,
      cajeroEmail,
      sucursal,
      fechaApertura,
      fechaCierre,
      estado: input.sesion.estado || 'CERRADA',
      observaciones: input.sesion.observaciones || null
    },
    flujo: {
      montoApertura,
      totalCobrosEfectivo,
      cantidadCobros,
      totalIngresosCaja,
      totalEgresosCaja,
      saldoEsperado
    },
    arqueoFisico: {
      billetes: billetesList,
      subtotalBilletes,
      monedas: monedasList,
      subtotalMonedas,
      totalFisico
    },
    cuadre: {
      saldoEsperado,
      totalFisico,
      diferencia,
      clasificacion,
      motivoDescuadre: input.sesion.motivoDescuadre || null
    },
    movimientos,
    firmas,
    hashAuditoria,
    generadoEn: new Date().toISOString()
  };
}

/**
 * Valida minuciosamente cada campo requerido del comprobante.
 * Retorna lista detallada de errores en caso de datos faltantes o inválidos.
 */
export function validarCamposComprobanteArqueo(comprobante: ComprobanteArqueoCompleto): {
  esValido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  // 1. Empresa
  if (!comprobante.empresa.razonSocial?.trim()) errores.push('Razón social de la empresa requerida.');
  if (!comprobante.empresa.nit?.trim()) errores.push('NIT de la empresa requerido.');
  if (!comprobante.empresa.direccion?.trim()) errores.push('Dirección de la empresa requerida.');
  if (!comprobante.empresa.telefono?.trim()) errores.push('Teléfono de la empresa requerido.');

  // 2. Sesión
  if (!comprobante.sesion.id?.trim()) errores.push('ID de la sesión de caja requerido.');
  if (!comprobante.sesion.cajeroNombre?.trim()) errores.push('Nombre del cajero requerido.');
  if (!comprobante.sesion.fechaApertura) errores.push('Fecha y hora de apertura requerida.');
  if (!comprobante.sesion.fechaCierre) errores.push('Fecha y hora de cierre requerida.');
  if (!comprobante.sesion.estado) errores.push('Estado de la sesión requerido.');

  // 3. Flujo financiero
  if (typeof comprobante.flujo.montoApertura !== 'number' || isNaN(comprobante.flujo.montoApertura) || comprobante.flujo.montoApertura < 0) {
    errores.push('Monto de apertura inválido o negativo.');
  }
  if (typeof comprobante.flujo.totalCobrosEfectivo !== 'number' || isNaN(comprobante.flujo.totalCobrosEfectivo) || comprobante.flujo.totalCobrosEfectivo < 0) {
    errores.push('Total cobros en efectivo inválido.');
  }
  if (typeof comprobante.flujo.totalIngresosCaja !== 'number' || isNaN(comprobante.flujo.totalIngresosCaja) || comprobante.flujo.totalIngresosCaja < 0) {
    errores.push('Total de ingresos de caja menor inválido.');
  }
  if (typeof comprobante.flujo.totalEgresosCaja !== 'number' || isNaN(comprobante.flujo.totalEgresosCaja) || comprobante.flujo.totalEgresosCaja < 0) {
    errores.push('Total de egresos de caja menor inválido.');
  }

  // 4. Arqueo físico
  if (typeof comprobante.arqueoFisico.totalFisico !== 'number' || isNaN(comprobante.arqueoFisico.totalFisico) || comprobante.arqueoFisico.totalFisico < 0) {
    errores.push('Total físico de dinero contado inválido o negativo.');
  }
  if (typeof comprobante.arqueoFisico.subtotalBilletes !== 'number' || isNaN(comprobante.arqueoFisico.subtotalBilletes)) {
    errores.push('Subtotal de billetes inválido.');
  }
  if (typeof comprobante.arqueoFisico.subtotalMonedas !== 'number' || isNaN(comprobante.arqueoFisico.subtotalMonedas)) {
    errores.push('Subtotal de monedas inválido.');
  }

  // 5. Cuadre y justificación
  if (comprobante.cuadre.diferencia !== 0 && (!comprobante.cuadre.motivoDescuadre || comprobante.cuadre.motivoDescuadre.trim().length < 3)) {
    errores.push('El acta presenta descuadre pero carece de justificación válida obligatoria.');
  }

  // 6. Firmas y auditoría
  if (!comprobante.firmas.cajero.nombre?.trim()) errores.push('Nombre para firma de cajero requerido.');
  if (!comprobante.firmas.supervisor.nombre?.trim()) errores.push('Nombre para firma de supervisor requerido.');
  if (!comprobante.hashAuditoria?.trim()) errores.push('Código hash de auditoría inmutable requerido.');

  return {
    esValido: errores.length === 0,
    errores
  };
}

/**
 * Valida con rigor matemático cada cálculo numérico del comprobante de arqueo.
 */
export function validarCalculosComprobanteArqueo(comprobante: ComprobanteArqueoCompleto): {
  esValido: boolean;
  inconsistencias: string[];
  detallesVerificacion: {
    sumaBilletesCorrecta: boolean;
    sumaMonedasCorrecta: boolean;
    totalFisicoCorrecto: boolean;
    saldoEsperadoCorrecto: boolean;
    diferenciaCorrecta: boolean;
    clasificacionCoherente: boolean;
  };
} {
  const inconsistencias: string[] = [];

  // 1. Verificación de Billetes
  let sumaBilletesEsperada = 0;
  for (const b of comprobante.arqueoFisico.billetes) {
    const subCalc = Math.round(b.denominacion * b.cantidad);
    if (b.subtotal !== subCalc) {
      inconsistencias.push(`Subtotal billete $${b.denominacion.toLocaleString('es-CO')} inconsistente: esperado $${subCalc}, recibido $${b.subtotal}`);
    }
    sumaBilletesEsperada += subCalc;
  }

  const sumaBilletesCorrecta = comprobante.arqueoFisico.subtotalBilletes === sumaBilletesEsperada;
  if (!sumaBilletesCorrecta) {
    inconsistencias.push(`Subtotal general de billetes inconsistente: esperado $${sumaBilletesEsperada}, recibido $${comprobante.arqueoFisico.subtotalBilletes}`);
  }

  // 2. Verificación de Monedas
  let sumaMonedasEsperada = 0;
  for (const m of comprobante.arqueoFisico.monedas) {
    const subCalc = Math.round(m.denominacion * m.cantidad);
    if (m.subtotal !== subCalc) {
      inconsistencias.push(`Subtotal moneda $${m.denominacion.toLocaleString('es-CO')} inconsistente: esperado $${subCalc}, recibido $${m.subtotal}`);
    }
    sumaMonedasEsperada += subCalc;
  }

  const sumaMonedasCorrecta = comprobante.arqueoFisico.subtotalMonedas === sumaMonedasEsperada;
  if (!sumaMonedasCorrecta) {
    inconsistencias.push(`Subtotal general de monedas inconsistente: esperado $${sumaMonedasEsperada}, recibido $${comprobante.arqueoFisico.subtotalMonedas}`);
  }

  // 3. Verificación de Total Físico
  const totalFisicoCalculado = sumaBilletesEsperada + sumaMonedasEsperada;
  const totalFisicoCorrecto = (totalFisicoCalculado > 0)
    ? (comprobante.arqueoFisico.totalFisico === totalFisicoCalculado)
    : true; // En caso de cierre sin detalle de denominaciones

  if (!totalFisicoCorrecto) {
    inconsistencias.push(`Total físico reportado inconsistente con la suma de billetes y monedas: esperado $${totalFisicoCalculado}, recibido $${comprobante.arqueoFisico.totalFisico}`);
  }

  // 4. Verificación de Saldo Teórico Esperado
  const saldoEsperadoCalculado = Math.round(
    comprobante.flujo.montoApertura +
    comprobante.flujo.totalCobrosEfectivo +
    comprobante.flujo.totalIngresosCaja -
    comprobante.flujo.totalEgresosCaja
  );

  const saldoEsperadoCorrecto = comprobante.flujo.saldoEsperado === saldoEsperadoCalculado;
  if (!saldoEsperadoCorrecto) {
    inconsistencias.push(`Saldo esperado inconsistente: esperado $${saldoEsperadoCalculado}, recibido $${comprobante.flujo.saldoEsperado}`);
  }

  // 5. Verificación de Diferencia
  const diferenciaCalculada = Math.round(comprobante.arqueoFisico.totalFisico - comprobante.flujo.saldoEsperado);
  const diferenciaCorrecta = comprobante.cuadre.diferencia === diferenciaCalculada;
  if (!diferenciaCorrecta) {
    inconsistencias.push(`Diferencia de arqueo inconsistente: esperada $${diferenciaCalculada}, recibida $${comprobante.cuadre.diferencia}`);
  }

  // 6. Verificación de Clasificación
  let clasificacionEsperada: ClasificacionDescuadre = 'CUADRADO';
  if (diferenciaCalculada > 0) clasificacionEsperada = 'SOBRANTE';
  else if (diferenciaCalculada < 0) clasificacionEsperada = 'FALTANTE';

  const clasificacionCoherente = comprobante.cuadre.clasificacion === clasificacionEsperada;
  if (!clasificacionCoherente) {
    inconsistencias.push(`Clasificación de descuadre incongruente: esperada ${clasificacionEsperada}, recibida ${comprobante.cuadre.clasificacion}`);
  }

  return {
    esValido: inconsistencias.length === 0,
    inconsistencias,
    detallesVerificacion: {
      sumaBilletesCorrecta,
      sumaMonedasCorrecta,
      totalFisicoCorrecto,
      saldoEsperadoCorrecto,
      diferenciaCorrecta,
      clasificacionCoherente
    }
  };
}

/**
 * Genera el documento HTML completo del comprobante de arqueo y cierre,
 * con estilos profesionales de impresión para Ticket 80mm o Carta.
 */
export function generarHTMLComprobanteArqueo(
  comprobante: ComprobanteArqueoCompleto,
  formato: 'TICKET_80MM' | 'CARTA' = 'CARTA'
): string {
  const isTicket = formato === 'TICKET_80MM';
  const c = comprobante;

  const fmtMoneda = (val: number) => `$${Math.round(val || 0).toLocaleString('es-CO')} COP`;
  const fmtFecha = (f: string) => f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

  const billetesFiltrados = c.arqueoFisico.billetes.filter(b => b.cantidad > 0);
  const monedasFiltradas = c.arqueoFisico.monedas.filter(m => m.cantidad > 0);

  const badgeColor = c.cuadre.diferencia === 0
    ? 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
    : c.cuadre.diferencia > 0
    ? 'background-color: #ecfeff; color: #155e75; border: 1px solid #a5f3fc;'
    : 'background-color: #fff1f2; color: #9f1239; border: 1px solid #fecdd3;';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Arqueo POS - ${c.sesion.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
      font-size: ${isTicket ? '12px' : '13px'};
      padding: ${isTicket ? '8px' : '32px'};
      max-width: ${isTicket ? '80mm' : '210mm'};
      margin: 0 auto;
    }
    @media print {
      body { padding: ${isTicket ? '0' : '15mm'}; max-width: 100%; }
      .no-print { display: none !important; }
      @page {
        size: ${isTicket ? '80mm auto' : 'letter'};
        margin: ${isTicket ? '2mm' : '10mm'};
      }
    }
    .header { text-align: ${isTicket ? 'center' : 'left'}; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 12px; }
    .empresa-nombre { font-size: ${isTicket ? '14px' : '18px'}; font-weight: 900; text-transform: uppercase; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px; }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin: 12px 0 6px 0;
      color: #334155;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    td, th { padding: 4px 2px; text-align: left; }
    td.text-right, th.text-right { text-align: right; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
    .box-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 8px; }
    .firmas-container { display: flex; justify-content: space-between; gap: 20px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #cbd5e1; }
    .firma-box { flex: 1; text-align: center; font-size: 11px; }
    .linea-firma { border-bottom: 1px solid #64748b; height: 35px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa-nombre">${c.empresa.razonSocial}</div>
    <div style="font-size: 11px; color: #475569; font-weight: 600;">NIT: ${c.empresa.nit} | ${c.empresa.regimen}</div>
    <div style="font-size: 10px; color: #64748b;">${c.empresa.direccion} - ${c.empresa.ciudad} | Tel: ${c.empresa.telefono}</div>
    <div style="margin-top: 6px; font-weight: bold; font-size: 12px; text-transform: uppercase;">
      ACTA OFICIAL DE ARQUEO Y CIERRE POS
    </div>
  </div>

  <div class="box-info">
    <div class="meta-row"><span>Sesión:</span><span class="font-mono font-bold">${c.sesion.id.slice(0, 8).toUpperCase()}</span></div>
    <div class="meta-row"><span>Cajero(a):</span><span class="font-bold">${c.sesion.cajeroNombre}</span></div>
    <div class="meta-row"><span>Sucursal:</span><span>${c.sesion.sucursal}</span></div>
    <div class="meta-row"><span>Apertura:</span><span>${fmtFecha(c.sesion.fechaApertura)}</span></div>
    <div class="meta-row"><span>Cierre:</span><span>${fmtFecha(c.sesion.fechaCierre)}</span></div>
  </div>

  <div class="section-title">1. Liquidación del Flujo de Efectivo</div>
  <table>
    <tbody>
      <tr><td>Base Inicial de Efectivo:</td><td class="text-right font-mono font-bold">${fmtMoneda(c.flujo.montoApertura)}</td></tr>
      <tr><td>(+) Cobros en Efectivo (${c.flujo.cantidadCobros}):</td><td class="text-right font-mono font-bold">${fmtMoneda(c.flujo.totalCobrosEfectivo)}</td></tr>
      <tr><td>(+) Ingresos Menores / Inyecciones:</td><td class="text-right font-mono">${fmtMoneda(c.flujo.totalIngresosCaja)}</td></tr>
      <tr><td>(-) Gastos Menores / Egresos:</td><td class="text-right font-mono text-rose-600">-${fmtMoneda(c.flujo.totalEgresosCaja)}</td></tr>
      <tr style="border-top: 1px solid #0f172a; font-weight: bold;">
        <td>(=) Saldo Teórico Esperado:</td>
        <td class="text-right font-mono font-bold" style="font-size: 13px;">${fmtMoneda(c.flujo.saldoEsperado)}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Conteo Físico Real (Arqueo Ciego)</div>
  ${billetesFiltrados.length > 0 ? `
    <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px;">Billetes:</div>
    <table>
      <tbody>
        ${billetesFiltrados.map(b => `
          <tr>
            <td class="font-mono">$${b.denominacion.toLocaleString('es-CO')} x ${b.cantidad}</td>
            <td class="text-right font-mono font-bold">${fmtMoneda(b.subtotal)}</td>
          </tr>
        `).join('')}
        <tr style="font-weight: bold; font-size: 11px; border-top: 1px dashed #cbd5e1;">
          <td>Subtotal Billetes:</td>
          <td class="text-right font-mono">${fmtMoneda(c.arqueoFisico.subtotalBilletes)}</td>
        </tr>
      </tbody>
    </table>
  ` : ''}

  ${monedasFiltradas.length > 0 ? `
    <div style="font-weight: bold; font-size: 11px; margin-bottom: 2px; margin-top: 4px;">Monedas:</div>
    <table>
      <tbody>
        ${monedasFiltradas.map(m => `
          <tr>
            <td class="font-mono">$${m.denominacion.toLocaleString('es-CO')} x ${m.cantidad}</td>
            <td class="text-right font-mono font-bold">${fmtMoneda(m.subtotal)}</td>
          </tr>
        `).join('')}
        <tr style="font-weight: bold; font-size: 11px; border-top: 1px dashed #cbd5e1;">
          <td>Subtotal Monedas:</td>
          <td class="text-right font-mono">${fmtMoneda(c.arqueoFisico.subtotalMonedas)}</td>
        </tr>
      </tbody>
    </table>
  ` : ''}

  <div class="box-info" style="margin-top: 8px;">
    <div class="meta-row" style="font-size: 12px; font-weight: bold;">
      <span>Total Físico Contado:</span>
      <span class="font-mono" style="font-size: 14px;">${fmtMoneda(c.arqueoFisico.totalFisico)}</span>
    </div>
  </div>

  <div class="section-title">3. Resultado y Cuadre de Caja</div>
  <div style="padding: 8px; border-radius: 6px; margin-bottom: 8px; ${badgeColor}">
    <div class="meta-row" style="font-weight: bold;">
      <span>Estado:</span>
      <span>${c.cuadre.clasificacion === 'CUADRADO' ? 'CUADRADO EXACTO' : c.cuadre.clasificacion}</span>
    </div>
    <div class="meta-row" style="font-weight: bold; font-size: 13px;">
      <span>Diferencia de Arqueo:</span>
      <span class="font-mono">${c.cuadre.diferencia > 0 ? '+' : ''}${fmtMoneda(c.cuadre.diferencia)}</span>
    </div>
  </div>

  ${c.cuadre.motivoDescuadre ? `
    <div class="box-info" style="border-left: 3px solid #f59e0b;">
      <div style="font-size: 10px; font-weight: bold; color: #b45309;">JUSTIFICACIÓN OBLIGATORIA DEL DESCUADRE:</div>
      <div style="font-size: 11px; font-style: italic;">"${c.cuadre.motivoDescuadre}"</div>
    </div>
  ` : ''}

  ${c.movimientos.length > 0 ? `
    <div class="section-title">4. Detalle de Movimientos Menores (${c.movimientos.length})</div>
    <table>
      <thead>
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 10px; color: #64748b;">
          <th>Tipo</th>
          <th>Concepto</th>
          <th class="text-right">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${c.movimientos.map(m => `
          <tr style="font-size: 11px;">
            <td style="font-weight: bold; color: ${m.tipo === 'INGRESO' ? '#059669' : '#dc2626'};">${m.tipo}</td>
            <td>${m.concepto}${m.beneficiario ? ` (${m.beneficiario})` : ''}</td>
            <td class="text-right font-mono">${fmtMoneda(m.monto)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="firmas-container">
    <div class="firma-box">
      <div class="linea-firma"></div>
      <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Entregado por:</div>
      <div style="font-weight: bold;">${c.firmas.cajero.nombre}</div>
      <div style="color: #64748b;">${c.firmas.cajero.cargo}</div>
      <div style="font-size: 10px; color: #94a3b8;">${c.firmas.cajero.documento}</div>
    </div>
    <div class="firma-box">
      <div class="linea-firma"></div>
      <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Recibido por:</div>
      <div style="font-weight: bold;">${c.firmas.supervisor.nombre}</div>
      <div style="color: #64748b;">${c.firmas.supervisor.cargo}</div>
      <div style="font-size: 10px; color: #94a3b8;">${c.firmas.supervisor.documento}</div>
    </div>
  </div>

  <div style="margin-top: 16px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 9px; color: #94a3b8; text-align: center;">
    <div>Código Hash de Auditoría Forense: <span class="font-mono font-bold" style="color: #475569;">${c.hashAuditoria}</span></div>
    <div>Documento inmutable generado el ${fmtFecha(c.generadoEn)} para fines de auditoría tributaria y contable.</div>
  </div>
</body>
</html>`;
}
