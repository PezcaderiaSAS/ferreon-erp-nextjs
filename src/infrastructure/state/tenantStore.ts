import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getTenantSubscriptionAction, type TenantSubscriptionInfo } from '../../app/actions/billing';

interface TenantState {
  tenant: TenantSubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: TenantSubscriptionInfo | null) => void;
  fetchTenantSubscription: () => Promise<TenantSubscriptionInfo | null>;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenant: null,
      isLoading: false,
      error: null,
      setTenant: (tenant) => set({ tenant }),
      fetchTenantSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await getTenantSubscriptionAction();
          if (res.success && res.data) {
            set({ tenant: res.data, isLoading: false, error: null });
            return res.data;
          } else {
            set({ error: res.error || 'Error al obtener datos del tenant', isLoading: false });
            return null;
          }
        } catch (err: any) {
          set({ error: err.message || 'Error de red al consultar suscripción', isLoading: false });
          return null;
        }
      },
    }),
    {
      name: 'ferreon-tenant-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
