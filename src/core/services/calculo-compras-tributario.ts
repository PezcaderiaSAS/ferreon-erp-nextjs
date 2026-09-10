/**
 * Servicio de Dominio: Cálculo Tributario de Compras y Partida Doble en Ledger
 * 
 * Reglas de Negocio en Colombia:
 * - Moneda: Pesos Colombianos (COP) sin centavos (redondeo entero estándar).
 * - Subtotal: Suma de (cantidad * precioUnitario).
 * - IVA Descontable: 19% aplicable sobre el Subtotal (si aplicaIva = true).
 * - ReteFuente: Retención aplicada sobre el Subtotal (ej: 2.5% declarantes, 3.5% no declarantes).
 * - ReteICA: Retención municipal aplicada sobre el Subtotal por mil (ej: 9.66‰, 4.14‰).
 * - Total Factura Proveedor = Subtotal + IVA.
 * - Neto a Pagar = Total Factura - ReteFuente - ReteICA.
 * - Invariante Contable:
 *   Débitos (+Subtotal + IVA) === Créditos (+ReteFuente + ReteICA + NetoPagar).
 */

export interface ItemCompraCalculo {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
}

export interface ConfiguracionTributariaCompra {
  aplicaIva: boolean;
  aplicaRetefuente: boolean;
  porcentajeRetefuente: number; // Ej: 2.5 o 3.5
  aplicaReteica: boolean;
  porcentajeReteica: number;    // Ej: 9.66 o 4.14
}

export interface LiquidacionCompraResultado {
  subtotal: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
  totalFactura: number;
  netoPagar: number;
  estaBalanceado: boolean;
  desbalance: number;
}

export interface AccountsLedgerCompraMap {
  cuentaActivoMaquinariaId: string;
  cuentaIvaDescontableId?: string;
  cuentaRetefuentePasivoId?: string;
  cuentaReteicaPasivoId?: string;
  cuentaContrapartidaId: string; // Caja, Banco o CxP Proveedores
}

export interface JournalEntryPayload {
  transaction_id: string;
  account_id: string;
  amount: number; // Positivo: Débito, Negativo: Crédito
}

/**
 * Calcula con precisión entera de moneda COP la liquidación comercial y tributaria de una compra.
 */
export function calcularLiquidacionCompra(
  items: ItemCompraCalculo[],
  config: ConfiguracionTributariaCompra
): LiquidacionCompraResultado {
  if (!items || items.length === 0) {
    throw new Error('Debe incluir al menos un ítem para liquidar la compra.');
  }

  // 1. Validar y calcular Subtotal
  let subtotal = 0;
  for (const it of items) {
    if (it.cantidad <= 0) {
      throw new Error(`Cantidad inválida (${it.cantidad}) para el equipo ${it.equipoId}. Debe ser mayor a 0.`);
    }
    if (it.precioUnitario < 0) {
      throw new Error(`Precio unitario negativo (${it.precioUnitario}) para el equipo ${it.equipoId}.`);
    }
    subtotal += Math.round(it.cantidad * it.precioUnitario);
  }

  // 2. IVA Descontable (19%)
  const valorIva = config.aplicaIva ? Math.round(subtotal * 0.19) : 0;

  // 3. ReteFuente (porcentaje sobre Subtotal)
  const pctRetefuente = Math.max(0, config.porcentajeRetefuente || 0);
  const valorRetefuente = config.aplicaRetefuente ? Math.round(subtotal * (pctRetefuente / 100)) : 0;

  // 4. ReteICA (tasa por mil sobre Subtotal)
  const pctReteica = Math.max(0, config.porcentajeReteica || 0);
  const valorReteica = config.aplicaReteica ? Math.round(subtotal * (pctReteica / 1000)) : 0;

  // 5. Total Factura y Neto a Pagar
  const totalFactura = subtotal + valorIva;
  const totalRetenciones = valorRetefuente + valorReteica;
  const netoPagar = totalFactura - totalRetenciones;

  // 6. Verificación de Partida Doble
  const sumaDebitos = subtotal + valorIva;
  const sumaCreditos = valorRetefuente + valorReteica + netoPagar;
  const desbalance = sumaDebitos - sumaCreditos;

  return {
    subtotal,
    valorIva,
    valorRetefuente,
    valorReteica,
    totalFactura,
    netoPagar,
    estaBalanceado: Math.abs(desbalance) === 0,
    desbalance
  };
}

/**
 * Genera el conjunto de asientos de diario contables (Partida Doble) para insertar en journal_entries.
 */
export function generarAsientosContablesCompra(
  transactionId: string,
  liquidacion: LiquidacionCompraResultado,
  accounts: AccountsLedgerCompraMap
): JournalEntryPayload[] {
  const entries: JournalEntryPayload[] = [];

  // 1. Débito a Activo Fijo / Equipos y Maquinaria (+Subtotal)
  if (liquidacion.subtotal > 0 && accounts.cuentaActivoMaquinariaId) {
    entries.push({
      transaction_id: transactionId,
      account_id: accounts.cuentaActivoMaquinariaId,
      amount: liquidacion.subtotal
    });
  }

  // 2. Débito a IVA Descontable (+IVA)
  if (liquidacion.valorIva > 0 && accounts.cuentaIvaDescontableId) {
    entries.push({
      transaction_id: transactionId,
      account_id: accounts.cuentaIvaDescontableId,
      amount: liquidacion.valorIva
    });
  }

  // 3. Crédito a ReteFuente por Pagar (-Retefuente)
  if (liquidacion.valorRetefuente > 0 && accounts.cuentaRetefuentePasivoId) {
    entries.push({
      transaction_id: transactionId,
      account_id: accounts.cuentaRetefuentePasivoId,
      amount: -liquidacion.valorRetefuente
    });
  }

  // 4. Crédito a ReteICA por Pagar (-Reteica)
  if (liquidacion.valorReteica > 0 && accounts.cuentaReteicaPasivoId) {
    entries.push({
      transaction_id: transactionId,
      account_id: accounts.cuentaReteicaPasivoId,
      amount: -liquidacion.valorReteica
    });
  }

  // 5. Crédito a Cuenta de Tesorería o CxP (-Neto a Pagar)
  if (liquidacion.netoPagar > 0 && accounts.cuentaContrapartidaId) {
    entries.push({
      transaction_id: transactionId,
      account_id: accounts.cuentaContrapartidaId,
      amount: -liquidacion.netoPagar
    });
  }

  return entries;
}
