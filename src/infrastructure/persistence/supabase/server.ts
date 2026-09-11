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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignorar si se llama desde un Server Component de solo lectura
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Acepta tanto SUPABASE_SECRET_KEY (nuevo SDK @supabase/server)
  // como SUPABASE_SERVICE_ROLE_KEY (SDK clásico @supabase/supabase-js)
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[Supabase Admin] Faltan variables de entorno: SUPABASE_URL y SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Empresa ID por defecto (FerreOn Principal)
 */
export const DEFAULT_EMPRESA_ID = 'ac8719ea-f16a-4538-b308-40d9511a14cb';

/**
 * Resuelve el empresa_id activo para operaciones multi-tenant.
 * Si el usuario está autenticado, consulta su empresa activa en empresa_usuarios.
 * Si no está autenticado o no tiene empresa asignada, retorna la empresa principal de FerreOn.
 */
export async function resolveEmpresaId(userId?: string | null): Promise<string> {
  if (!userId) {
    return DEFAULT_EMPRESA_ID;
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from('empresa_usuarios')
      .select('empresa_id')
      .eq('user_id', userId)
      .eq('es_empresa_activa', true)
      .eq('estado', 'ACTIVO')
      .maybeSingle();

    if (data?.empresa_id) {
      return data.empresa_id;
    }
  } catch (err) {
    console.warn('[resolveEmpresaId] Error buscando empresa de usuario, usando fallback:', err);
  }

  return DEFAULT_EMPRESA_ID;
}
