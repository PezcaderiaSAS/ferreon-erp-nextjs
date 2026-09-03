import { supabaseClient } from '../../infrastructure/persistence/supabase/client';

/**
 * Lógica atómica y centralizada para el cierre de sesión dual y perimetral.
 * Purga el estado persistente y cookies para evitar exposición de datos.
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

  storesToClear.forEach(store => {
    localStorage.removeItem(store);
  });

  // 3. Limpiar de manera agresiva las cookies locales (excepto HttpOnly que el server manejará)
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
  }
}
