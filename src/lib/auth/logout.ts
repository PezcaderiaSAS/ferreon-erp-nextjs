import { supabaseClient } from '../../infrastructure/persistence/supabase/client';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useAlquilerStore } from '../../infrastructure/state/alquilerStore';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';
import { useTenantStore } from '../../infrastructure/state/tenantStore';
import { DEFAULT_EMPRESA_CONFIG } from '../../core/domain/entities/empresa-config';

/**
 * Lógica atómica y centralizada para el cierre de sesión dual y perimetral.
 * Purga el estado persistente (localStorage y memoria) y cookies para evitar exposición de datos inter-tenant.
 */
export async function unifiedLogout() {
  // 1. Terminar sesión en Supabase (emite SIGNED_OUT globalmente)
  await supabaseClient.auth.signOut();

  // 2. Purgar estado persistente (Zustand LocalStorage)
  const storesToClear = [
    'alquiler-storage',
    'bodega-storage',
    'cliente-storage',
    'ferreon-empresa-storage',
    'ferreon-tenant-storage'
  ];

  if (typeof window !== 'undefined' && window.localStorage) {
    storesToClear.forEach(store => {
      try {
        localStorage.removeItem(store);
      } catch (_) {}
    });
  }

  // 3. Purgar almacenes de Zustand en memoria (Zero Cross-Tenant Leakage)
  try {
    if (typeof useBodegaStore?.getState?.().resetStore === 'function') {
      useBodegaStore.getState().resetStore();
    } else {
      useBodegaStore.setState({ equipos: [], idempotencyKeys: [] });
    }
  } catch (_) {}

  try {
    useClienteStore.setState({ clientes: [] });
  } catch (_) {}

  try {
    useAlquilerStore.setState({ alquileres: [], idempotencyKeys: [] });
  } catch (_) {}

  try {
    useEmpresaStore.setState({ config: DEFAULT_EMPRESA_CONFIG });
  } catch (_) {}

  try {
    useTenantStore.setState({ tenant: null, error: null });
  } catch (_) {}

  // 4. Limpiar de manera agresiva las cookies locales (excepto HttpOnly que el server manejará)
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  }
}

