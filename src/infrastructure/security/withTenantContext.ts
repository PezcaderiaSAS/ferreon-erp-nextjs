import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { getTenantPrismaClient, TenantPrismaClient } from "@/infrastructure/persistence/prisma/client";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Zod schema para asegurar que app_metadata.empresa_id existe y es un UUID
const jwtSchema = z.object({
  app_metadata: z.object({
    empresa_id: z.string().uuid({ message: "Formato de empresa_id inválido en el token." })
  }).passthrough()
}).passthrough();

/**
 * Middleware para Server Actions (HOC)
 * Garantiza que la acción sólo se ejecute si la sesión de Supabase es válida
 * y el token (JWT) contiene la claim requerida de `empresa_id`.
 */
export async function withTenantContext<T>(
  action: (context: { empresaId: string; userId: string; db: TenantPrismaClient }) => Promise<T>
): Promise<T> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      throw new AuthorizationError("Autenticación requerida o sesión expirada.");
    }

    // Validación Zod de la integridad del token y existencia de empresa_id
    const parsedUser = jwtSchema.safeParse(session.user);
    if (!parsedUser.success) {
      console.error("[TENANT_BREACH_ATTEMPT] JWT alterado o incompleto:", parsedUser.error);
      throw new AuthorizationError("El contexto de la empresa no es válido o no está autorizado.");
    }

    const empresaId = parsedUser.data.app_metadata.empresa_id;
    const userId = session.user.id;

    // Instanciar el prisma contextualizado al tenant validado estrictamente
    const db = getTenantPrismaClient(empresaId);

    // Ejecutar el action inyectando dependencias seguras
    return await action({ empresaId, userId, db });

  } catch (error) {
    if (error instanceof AuthorizationError) {
      console.error(`[403 FORBIDDEN - ${new Date().toISOString()}]`, error.message);
      // En un Server Action, lanzar una excepción envía un mensaje opaco al cliente en React 19,
      // pero es la forma correcta de abortar la ejecución.
      throw new Error(`Acceso Denegado: ${error.message}`); 
    }
    console.error(`[500 SERVER_ERROR - ${new Date().toISOString()}]`, error);
    throw new Error("Error interno al procesar la solicitud.");
  }
}
