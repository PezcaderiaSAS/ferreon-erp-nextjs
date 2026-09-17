/**
 * ==============================================================================
 * SERVICIO DE DOMINIO: Cartera de Proveedores & Cuentas por Pagar (CXP)
 * ==============================================================================
 * Responsabilidad: Gestión de semáforo de morosidad, liquidación y recálculo de
 * saldos ante abonos parciales/totales, validación de egresos contra sesiones de caja
 * y generación de asientos en partida doble balanceada ($\sum D = \sum C$).
 */

export type CuentaPagarEstado = 'PENDIENTE' | 'ABONADA_PARCIAL' | 'PAGADA' | 'ANULADA';
export type SemaforoVencimiento = 'AL_DIA' | 'POR_VENCER' | 'VENCIDA';

export interface SemaforoResult {
  estadoSemaforo: SemaforoVencimiento;
  diasRestantes: number;
  diasMora: number;
}

export interface CuentaPagarSnapshot {
  id: string;
  montoTotal: number;
  saldoPendiente: number;
  estado: CuentaPagarEstado;
}

export interface ProcesarAbonoResult {
  nuevoSaldoPendiente: number;
  nuevoEstado: CuentaPagarEstado;
  totalAbonadoAcumulado: number;
}

export interface ValidarEgresoCajaParams {
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE';
  montoAbono: number;
  sesionCajaActiva?: {
    id: string;
    saldoEfectivoDisponible: number;
  } | null;
  referenciaBancaria?: string;
}

export interface ValidarEgresoResult {
  esValido: boolean;
  error?: string;
}

export interface GenerarAsientoAbonoParams {
  transactionId: string;
  montoAbono: number;
  cuentaProveedoresPasivoId: string;
  cuentaTesoreriaOrigenId: string;
  numeroComprobante: string;
  proveedorNombre: string;
}

export interface JournalEntryAbono {
  transaction_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

/**
 * Evalúa el estado del semáforo de vencimiento para una cuenta por pagar.
 * - AL_DIA: Faltan más de 5 días naturales.
 * - POR_VENCER: Faltan entre 0 y 5 días naturales.
 * - VENCIDA: La fecha límite ya expiró (días mora > 0).
 */
export function evaluarSemaforoVencimientoCXP(
  fechaVencimiento: string,
  fechaReferencia: string = new Date().toISOString().split('T')[0]
): SemaforoResult {
  const dVenc = new Date(`${fechaVencimiento}T00:00:00Z`);
  const dRef = new Date(`${fechaReferencia}T00:00:00Z`);

  const diffMs = dVenc.getTime() - dRef.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias > 5) {
    return {
      estadoSemaforo: 'AL_DIA',
      diasRestantes: diffDias,
      diasMora: 0
    };
  }

  if (diffDias >= 0) {
    return {
      estadoSemaforo: 'POR_VENCER',
      diasRestantes: diffDias,
      diasMora: 0
    };
  }

  const diasMora = Math.abs(diffDias);
  return {
    estadoSemaforo: 'VENCIDA',
    diasRestantes: 0,
    diasMora
  };
}

/**
 * Procesa matemáticamente la aplicación de un abono sobre una cuenta por pagar.
 * Valida que no exista sobrepago y calcula el nuevo saldo y estado resultante.
 */
export function procesarAbonoCuentaPagar(
  cuenta: CuentaPagarSnapshot,
  montoAbono: number
): ProcesarAbonoResult {
  if (montoAbono <= 0 || !Number.isInteger(montoAbono)) {
    throw new Error('El monto del abono debe ser un entero positivo mayor a cero');
  }

  if (montoAbono > cuenta.saldoPendiente) {
    const formattedAbono = montoAbono.toLocaleString('es-CO');
    const formattedSaldo = cuenta.saldoPendiente.toLocaleString('es-CO');
    throw new Error(`El monto del abono ($${formattedAbono}) no puede exceder el saldo pendiente ($${formattedSaldo})`);
  }

  const nuevoSaldoPendiente = cuenta.saldoPendiente - montoAbono;
  const nuevoEstado: CuentaPagarEstado = nuevoSaldoPendiente === 0 ? 'PAGADA' : 'ABONADA_PARCIAL';
  const totalAbonadoAcumulado = cuenta.montoTotal - nuevoSaldoPendiente;

  return {
    nuevoSaldoPendiente,
    nuevoEstado,
    totalAbonadoAcumulado
  };
}

/**
 * Valida las reglas de control de tesorería y caja para autorizar un abono a proveedor.
 */
export function validarEgresoCajaParaAbono(params: ValidarEgresoCajaParams): ValidarEgresoResult {
  const { metodoPago, montoAbono, sesionCajaActiva } = params;

  if (montoAbono <= 0) {
    return { esValido: false, error: 'El monto a abonar debe ser mayor a cero' };
  }

  if (metodoPago === 'EFECTIVO') {
    if (!sesionCajaActiva || !sesionCajaActiva.id) {
      return {
        esValido: false,
        error: 'Se requiere una sesión de caja activa abierta para realizar pagos a proveedores en efectivo'
      };
    }

    if (sesionCajaActiva.saldoEfectivoDisponible < montoAbono) {
      const dispFormatted = (sesionCajaActiva.saldoEfectivoDisponible || 0).toLocaleString('es-CO');
      const abonoFormatted = montoAbono.toLocaleString('es-CO');
      return {
        esValido: false,
        error: `Fondos en efectivo insuficientes en caja (Disponible: $${dispFormatted}, Requerido: $${abonoFormatted})`
      };
    }
  }

  return { esValido: true };
}

/**
 * Genera el asiento contable en partida doble para asentar el abono en el Ledger.
 * Débito: Cuenta de Proveedores (2205 - Pasivo disminuye)
 * Crédito: Cuenta de Tesorería (1105 Caja o 1110 Bancos - Activo disminuye)
 */
export function generarAsientoContableAbonoProveedor(
  params: GenerarAsientoAbonoParams
): JournalEntryAbono[] {
  const {
    transactionId,
    montoAbono,
    cuentaProveedoresPasivoId,
    cuentaTesoreriaOrigenId,
    numeroComprobante,
    proveedorNombre
  } = params;

  const montoEntero = Math.round(montoAbono);

  return [
    {
      transaction_id: transactionId,
      account_id: cuentaProveedoresPasivoId,
      debit: montoEntero,
      credit: 0,
      description: `Abono a Proveedor ${proveedorNombre} - ${numeroComprobante}`
    },
    {
      transaction_id: transactionId,
      account_id: cuentaTesoreriaOrigenId,
      debit: 0,
      credit: montoEntero,
      description: `Egreso de Tesorería para Abono ${numeroComprobante}`
    }
  ];
}
