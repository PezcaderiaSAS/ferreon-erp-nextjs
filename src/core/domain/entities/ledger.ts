export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  is_cash_equivalent: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id?: string;
  transaction_id?: string;
  account_id: string;
  amount: number; // Positivo = Débito, Negativo = Crédito
  created_at?: string;
}

export interface LedgerTransaction {
  id?: string;
  description: string;
  reference_id?: string; // ID del alquiler, equipo, pago o null
  created_by?: string;
  idempotency_key: string;
  timestamp?: string;
  entries: JournalEntry[]; // Siempre deben sumar 0 (Partida Doble)
}

/**
 * Utilidad: Genera una llave de idempotencia basada en los parámetros únicos del pago o transacción
 */
export function generarIdempotencyKey(entidad: string, operacion: string, idUnico: string): string {
  return `${entidad}_${operacion}_${idUnico}_${new Date().toISOString().split('T')[0]}`;
}
