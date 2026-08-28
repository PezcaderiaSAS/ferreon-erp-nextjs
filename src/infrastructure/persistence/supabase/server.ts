import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Cliente para Server Components y Server Actions.
 * Usa la sesión del usuario (anon key + cookies).
 * Úsalo cuando necesites contexto de autenticación del usuario.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignorar si se llama desde Server Component sin capacidad de set
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Ignorar si se llama desde Server Component sin capacidad de remove
          }
        },
      },
    }
  );
}

/**
 * Cliente Admin privilegiado con service_role.
 * NUNCA expongas este cliente al navegador (solo usar en Server Actions o API Routes).
 * Úsalo para operaciones que necesitan saltarse RLS:
 * - Insertar en idempotency_logs
 * - Operaciones de administración de usuarios
 * - RPCs atómicas críticas de negocio
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[Supabase Admin] Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      // Deshabilitar persistencia de sesión en el cliente admin (no necesita cookies)
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
