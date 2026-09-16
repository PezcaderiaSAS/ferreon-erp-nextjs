/**
 * Servicio Puro de Dominio: Arqueo Ciego de Caja por Denominaciones
 * Gestiona el conteo físico sin sesgo y genera asientos de ajuste por descuadres.
 */

export interface DenominacionEfectivoItem {
  valor: number; // Ej: 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50
  cantidad: number;
}

export type ClasificacionArqueo = 'CIERRE_EXACTO' | 'SOBRANTE' | 'FALTANTE';

export interface ArqueoCiegoResultado {
  totalFisicoContado: number;
  saldoEsperadoSistema: number;
  diferencia: number; // totalFisico - saldoEsperado
  clasificacion: ClasificacionArqueo;
  desglosePorDenominacion: { valor: number; cantidad: number; subtotal: number }[];
}

export interface ValidarCierreArqueoParams {
  diferencia: number;
  motivoDescuadre?: string | null;
}

export interface ValidarCierreArqueoResultado {
  valido: boolean;
  error?: string;
}

export interface CuentaContablePUC {
  id: string;
  code?: string;
  name: string;
}

export interface AsientoEntry {
  accountId: string;
  amount: number;
}

export interface AsientoAjusteParams {
  sesionCajaId: string;
  diferencia: number;
  cuentas: CuentaContablePUC[];
}

export interface AsientoAjusteResultado {
  description: string;
  referenceId: string;
  entries: AsientoEntry[];
}

/**
 * Denominaciones oficiales de moneda y billetes en Colombia (COP).
 */
export const DENOMINACIONES_COP: number[] = [
  100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50
];

/**
 * Realiza la sumatoria estricta del conteo físico ciego y contrasta con el saldo esperado.
 */
export function calcularArqueoCiego(
  conteo: DenominacionEfectivoItem[],
  saldoEsperadoSistema: number
): ArqueoCiegoResultado {
  let totalFisico = 0;
  const desglosePorDenominacion = (conteo || []).map((c) => {
    const valor = Math.max(0, Math.round(c.valor || 0));
    const cantidad = Math.max(0, Math.round(c.cantidad || 0));
    const subtotal = valor * cantidad;
    totalFisico += subtotal;

    return { valor, cantidad, subtotal };
  });

  const saldoEsperado = Math.round(saldoEsperadoSistema || 0);
  const diferencia = totalFisico - saldoEsperado;

  let clasificacion: ClasificacionArqueo = 'CIERRE_EXACTO';
  if (diferencia > 0) {
    clasificacion = 'SOBRANTE';
  } else if (diferencia < 0) {
    clasificacion = 'FALTANTE';
  }

  return {
    totalFisicoContado: totalFisico,
    saldoEsperadoSistema: saldoEsperado,
    diferencia,
    clasificacion,
    desglosePorDenominacion
  };
}

/**
 * Valida si se cumplen las condiciones para autorizar el cierre formal de la caja.
 */
export function validarCierreArqueoCaja(
  params: ValidarCierreArqueoParams
): ValidarCierreArqueoResultado {
  const diferencia = Math.round(params.diferencia || 0);

  if (diferencia !== 0) {
    const motivo = (params.motivoDescuadre || '').trim();
    if (motivo.length < 5) {
      return {
        valido: false,
        error: 'Poka-Yoke: Se detectó una discrepancia en el arqueo físico. Se requiere justificación obligatoria detallada (mínimo 5 caracteres) para autorizar el cierre.'
      };
    }
  }

  return { valido: true };
}

/**
 * Genera el asiento contable balanceado en el Ledger para registrar sobrantes o faltantes de caja.
 */
export function generarAsientoAjusteDescuadre(
  params: AsientoAjusteParams
): AsientoAjusteResultado | null {
  const diferencia = Math.round(params.diferencia || 0);
  if (diferencia === 0) return null;

  const cuentas = params.cuentas || [];
  const cuentaCaja = cuentas.find(c => c.code === '1105' || c.name.includes('Caja')) || cuentas[0] || { id: 'acc_caja_default', code: '1105', name: 'Caja' };
  const cuentaSobrante = cuentas.find(c => c.code === '4295' || c.name.includes('Sobrante') || c.name.includes('Extraordinario')) || cuentas[1] || { id: 'acc_sobrante_default', code: '4295', name: 'Sobrantes' };
  const cuentaFaltante = cuentas.find(c => c.code === '1365' || c.name.includes('Faltante') || c.name.includes('Trabajador')) || cuentas[2] || { id: 'acc_faltante_default', code: '1365', name: 'Faltantes' };

  const entries: AsientoEntry[] = [];

  if (diferencia > 0) {
    // SOBRANTE:
    // Débito a Caja (+diferencia): Ingreso físico real
    // Crédito a Sobrantes (-diferencia): Ganancia / Ingreso extraordinario
    entries.push({ accountId: cuentaCaja.id, amount: diferencia });
    entries.push({ accountId: cuentaSobrante.id, amount: -diferencia });
  } else {
    // FALTANTE:
    // Débito a Cuentas por Cobrar Trabajador (+abs(diferencia)): Responsabilidad del cajero
    // Crédito a Caja (-abs(diferencia)): Salida contable del efectivo no encontrado
    const montoFaltante = Math.abs(diferencia);
    entries.push({ accountId: cuentaFaltante.id, amount: montoFaltante });
    entries.push({ accountId: cuentaCaja.id, amount: -montoFaltante });
  }

  return {
    description: `Ajuste Contable por ${diferencia > 0 ? 'Sobrante' : 'Faltante'} de Caja en Cierre de Turno`,
    referenceId: `ARQ-${params.sesionCajaId.slice(-8).toUpperCase()}`,
    entries
  };
}
