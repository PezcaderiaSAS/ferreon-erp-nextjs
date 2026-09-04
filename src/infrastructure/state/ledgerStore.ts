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
