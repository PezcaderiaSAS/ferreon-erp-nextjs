/**
 * Servicio Puro de Dominio: Pagos Mixtos y Partida Doble en Ledger
 * Valida consistencia monetaria multilínea y genera asientos de contabilidad financiera.
 */

export interface MetodoPagoItemInput {
  metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'NEQUI' | 'DAVIPLATA' | 'CHEQUE' | 'SALDO_A_FAVOR' | string;
  monto: number;
  referencia?: string;
  efectivoRecibido?: number;
}

export interface ValidarPagoMixtoParams {
  totalAbonar: number;
  metodos: MetodoPagoItemInput[];
  sesionCajaActivaId?: string | null;
  saldoFavorCliente?: number;
}

export interface ValidarPagoMixtoResultado {
  valido: boolean;
  error?: string;
  requiereCaja: boolean;
  montoEfectivo: number;
  montoBancos: number;
  montoSaldoFavor: number;
  cambioTotal: number;
}

export interface CuentaContablePUC {
  id: string;
  code?: string;
  name: string;
  isCashEquivalent?: boolean;
}

export interface AsientoEntry {
  accountId: string;
  amount: number; // Positivo: Débito, Negativo: Crédito
}

export interface GenerarAsientoParams {
  pagoId: number | string;
  alquilerId: number | string;
  consecutivoAlquiler?: string;
  totalAbono: number;
  metodos: MetodoPagoItemInput[];
  cuentas: CuentaContablePUC[];
}

export interface AsientoContableResultado {
  description: string;
  referenceId: string;
  entries: AsientoEntry[];
}

/**
 * Valida la suficiencia, balance y consistencia de un pago mixto.
 */
export function validarLiquidacionPagoMixto(
  params: ValidarPagoMixtoParams
): ValidarPagoMixtoResultado {
  const totalAbonar = Math.max(0, Math.round(params.totalAbonar || 0));
  const metodos = params.metodos || [];
  const saldoFavorDisponible = Math.max(0, Math.round(params.saldoFavorCliente || 0));

  if (totalAbonar <= 0) {
    return {
      valido: false,
      error: 'El monto total a abonar debe ser mayor a cero.',
      requiereCaja: false,
      montoEfectivo: 0,
      montoBancos: 0,
      montoSaldoFavor: 0,
      cambioTotal: 0
    };
  }

  if (metodos.length === 0) {
    return {
      valido: false,
      error: 'Debe especificar al menos un método de pago.',
      requiereCaja: false,
      montoEfectivo: 0,
      montoBancos: 0,
      montoSaldoFavor: 0,
      cambioTotal: 0
    };
  }

  let sumaMetodos = 0;
  let montoEfectivo = 0;
  let montoBancos = 0;
  let montoSaldoFavor = 0;
  let cambioTotal = 0;

  for (const m of metodos) {
    const monto = Math.max(0, Math.round(m.monto || 0));
    sumaMetodos += monto;

    const metodoUpper = (m.metodo || '').toUpperCase();
    if (metodoUpper === 'EFECTIVO') {
      montoEfectivo += monto;
      if (m.efectivoRecibido && m.efectivoRecibido > monto) {
        cambioTotal += Math.round(m.efectivoRecibido - monto);
      }
    } else if (metodoUpper === 'SALDO_A_FAVOR') {
      montoSaldoFavor += monto;
    } else {
      montoBancos += monto;
    }
  }

  // 1. Validar que la suma coincida exactamente con el total deseado
  if (sumaMetodos !== totalAbonar) {
    return {
      valido: false,
      error: `La suma de los métodos ($${sumaMetodos.toLocaleString('es-CO')}) no coincide con el total a abonar ($${totalAbonar.toLocaleString('es-CO')}).`,
      requiereCaja: montoEfectivo > 0,
      montoEfectivo,
      montoBancos,
      montoSaldoFavor,
      cambioTotal
    };
  }

  // 2. Validar sesión de caja si hay porción en efectivo
  const requiereCaja = montoEfectivo > 0;
  if (requiereCaja && !params.sesionCajaActivaId) {
    return {
      valido: false,
      error: 'Poka-Yoke: Para recibir pagos en EFECTIVO es obligatorio tener una sesión de caja abierta.',
      requiereCaja,
      montoEfectivo,
      montoBancos,
      montoSaldoFavor,
      cambioTotal
    };
  }

  // 3. Validar suficiencia de saldo a favor
  if (montoSaldoFavor > saldoFavorDisponible) {
    return {
      valido: false,
      error: `Saldo a favor insuficiente. Disponible: $${saldoFavorDisponible.toLocaleString('es-CO')}, solicitado: $${montoSaldoFavor.toLocaleString('es-CO')}.`,
      requiereCaja,
      montoEfectivo,
      montoBancos,
      montoSaldoFavor,
      cambioTotal
    };
  }

  return {
    valido: true,
    requiereCaja,
    montoEfectivo,
    montoBancos,
    montoSaldoFavor,
    cambioTotal
  };
}

/**
 * Genera las partidas contables en doble partida cumpliendo Sum(Débitos) + Sum(Créditos) = 0.
 */
export function generarAsientoContablePagoMixto(
  params: GenerarAsientoParams
): AsientoContableResultado {
  const cuentas = params.cuentas || [];
  
  // Buscar cuentas con prioridad en código PUC exacto para evitar falsos positivos
  const cuentaCaja = cuentas.find(c => c.code === '1105') 
    || cuentas.find(c => c.isCashEquivalent || c.name.toLowerCase().includes('caja')) 
    || cuentas[0];

  const cuentaBancos = cuentas.find(c => c.code === '1110') 
    || cuentas.find(c => c.name.toLowerCase().includes('banco') || c.name.toLowerCase().includes('bancolombia')) 
    || cuentaCaja;

  const cuentaAnticipos = cuentas.find(c => c.code === '2805') 
    || cuentas.find(c => c.name.toLowerCase().includes('anticipo') || c.name.toLowerCase().includes('saldo a favor')) 
    || cuentaCaja;

  const cuentaCartera = cuentas.find(c => c.code === '1305') 
    || cuentas.find(c => c.name.toLowerCase().includes('cartera') || c.name.toLowerCase().includes('cobrar')) 
    || cuentas[cuentas.length - 1];

  const entries: AsientoEntry[] = [];
  let totalDebitos = 0;

  for (const m of params.metodos) {
    const monto = Math.round(m.monto || 0);
    if (monto <= 0) continue;

    const metUpper = (m.metodo || '').toUpperCase();
    let accountTargetId = cuentaBancos.id;

    if (metUpper === 'EFECTIVO') {
      accountTargetId = cuentaCaja.id;
    } else if (metUpper === 'SALDO_A_FAVOR') {
      accountTargetId = cuentaAnticipos.id;
    }

    entries.push({
      accountId: accountTargetId,
      amount: monto // Débito (+monto)
    });
    totalDebitos += monto;
  }

  // Crédito único a Cartera (-totalDebitos) para equilibrar la partida doble
  entries.push({
    accountId: cuentaCartera.id,
    amount: -totalDebitos // Crédito (-monto)
  });

  const consecutivoRecibo = `RC-${String(params.pagoId || Date.now()).slice(-8).toUpperCase()}`;

  return {
    description: `Recaudo Pago Mixto Alquiler ${params.consecutivoAlquiler || params.alquilerId}`,
    referenceId: consecutivoRecibo,
    entries
  };
}
