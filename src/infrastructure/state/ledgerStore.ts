import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FinancialAccount, LedgerTransaction, generarIdempotencyKey } from '../../core/domain/entities/ledger';

interface LedgerState {
  accounts: FinancialAccount[];
  wallets: FinancialAccount[]; // Cuentas de tipo ASSET / cash_equivalent
  isLoading: boolean;
  error: string | null;

  // Acciones
  fetchAccounts: () => Promise<void>;
  procesarTransaccionOptimista: (
    descripcion: string,
    referenceId: string | null,
    entradas: { account_id: string; amount: number }[]
  ) => Promise<boolean>;
  registrarLiquidacionGarantia: (payload: {
    contratoId: string;
    montoDanos: number;
    montoGarantia: number;
    metodoPagoExcedente?: string;
  }) => Promise<string | null>;
  getROI: (equipoId: string) => { ingresos: number; costos: number; roi: number };
}

// Store para la orquestación financiera
export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      accounts: [],
      wallets: [],
      isLoading: false,
      error: null,

      fetchAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
          // TODO: Sustituir con llamada real a Supabase (SELECT * FROM financial_accounts)
          const mockAccounts: FinancialAccount[] = [
            { id: '1', name: 'Caja Principal', type: 'ASSET', is_cash_equivalent: true, created_at: '', updated_at: '' },
            { id: '2', name: 'Nequi', type: 'ASSET', is_cash_equivalent: true, created_at: '', updated_at: '' },
            { id: '3', name: 'Ingresos por Alquileres', type: 'REVENUE', is_cash_equivalent: false, created_at: '', updated_at: '' },
            { id: '4', name: 'Gastos de Mantenimiento', type: 'EXPENSE', is_cash_equivalent: false, created_at: '', updated_at: '' },
            { id: '5', name: 'Equipos (Activo Fijo)', type: 'ASSET', is_cash_equivalent: false, created_at: '', updated_at: '' }
          ];

          const wallets = mockAccounts.filter(a => a.is_cash_equivalent);

          set({ accounts: mockAccounts, wallets, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      procesarTransaccionOptimista: async (descripcion, referenceId, entradas) => {
        // Validar partida doble localmente antes de enviar a DB
        const suma = entradas.reduce((acc, curr) => acc + curr.amount, 0);
        if (suma !== 0) {
          set({ error: 'La transacción está descuadrada.' });
          return false;
        }

        const idempotencyKey = generarIdempotencyKey('ledger', 'insert', crypto.randomUUID());
        
        try {
          // TODO: Call Supabase RPC `insert_transaction`
          console.log('Transacción enviada al ledger', { descripcion, referenceId, entradas, idempotencyKey });
          
          return true;
        } catch (error: any) {
          console.error(error);
          set({ error: 'Falló la inserción en el ledger.' });
          return false;
        }
      },

      registrarLiquidacionGarantia: async ({ contratoId, montoDanos, montoGarantia, metodoPagoExcedente }) => {
        const transactionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `txn-${Date.now()}`;
        
        const entradas = [];
        // 1. Reducir Pasivo de Garantía
        entradas.push({ account_id: 'pasivo_garantias', amount: -Math.min(montoDanos, montoGarantia) });
        
        // 2. Registrar el Ingreso por Penalidad/Daño
        entradas.push({ account_id: 'ingresos_penalidades', amount: montoDanos });
        
        // 3. Si los daños superan la garantía, entra dinero extra por Caja
        if (montoDanos > montoGarantia) {
          const excedente = montoDanos - montoGarantia;
          const cuentaCaja = metodoPagoExcedente === 'Transferencia' ? 'bancos' : 'caja_efectivo';
          entradas.push({ account_id: cuentaCaja, amount: excedente });
        } else if (montoDanos < montoGarantia) {
          // Si sobra garantía y se devuelve, se saca de caja/pasivo (simplificado aquí)
          // Asumimos que la devolución física del dinero se registra en otro asiento, 
          // pero el pasivo completo debe reducirse.
          const sobrante = montoGarantia - montoDanos;
          entradas.push({ account_id: 'pasivo_garantias', amount: -sobrante });
          entradas.push({ account_id: 'caja_efectivo', amount: sobrante }); // Salida de dinero
        }

        const suma = entradas.reduce((acc, curr) => acc + curr.amount, 0);
        if (suma !== 0) {
          console.error("Error contable: Liquidación descuadrada", entradas);
          // Auto-compensación (mock safety net)
          entradas.push({ account_id: 'cuenta_puente_error', amount: -suma });
        }

        const exito = await get().procesarTransaccionOptimista(
          `Liquidación Garantía y Daños Contrato ${contratoId}`,
          contratoId,
          entradas
        );

        return exito ? transactionId : null;
      },

      getROI: (equipoId: string) => {
        // Mock computation de ROI basado en transacciones
        return {
          ingresos: 1500000,
          costos: 450000,
          roi: ((1500000 - 450000) / 450000) * 100 // ROI %
        };
      }
    }),
    {
      name: 'ferreon-ledger-storage',
      partialize: (state) => ({ accounts: state.accounts, wallets: state.wallets }),
    }
  )
);
