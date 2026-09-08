import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Sanitiza cadenas de texto eliminando caracteres de control nulos y espacios residuales.
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\0/g, '').trim();
}

export type ApiValidationResult<T> =
  | { success: true; data: T; response?: NextResponse }
  | { success: false; response: NextResponse; data?: T };

/**
 * Validador de orden superior para peticiones API Route (NextRequest / Request).
 * Si la validación falla, genera una respuesta JSON 400 estandarizada y segura.
 */
export async function validateApiRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ApiValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Formato de solicitud inválido: Se esperaba un cuerpo JSON bien formado.',
        },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const primerError = result.error.errors[0]?.message || 'Datos de entrada inválidos';
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: primerError,
          detalles: result.error.errors.map((err) => ({
            campo: err.path.join('.'),
            mensaje: err.message,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

export type ActionValidationResult<T> =
  | { success: true; data: T; error?: string; issues?: z.ZodIssue[] }
  | { success: false; error: string; issues: z.ZodIssue[]; data?: T };

/**
 * Validador en tiempo de ejecución para Server Actions ('use server').
 * Evita ataques por manipulación directa de parámetros en llamadas Next-Action.
 */
export function validateActionInput<T>(
  input: unknown,
  schema: z.ZodSchema<T>
): ActionValidationResult<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errorMensaje =
      result.error.errors[0]?.message ||
      `Error de validación en los datos proporcionados para la operación.`;
    return {
      success: false,
      error: errorMensaje,
      issues: result.error.issues,
    };
  }
  return { success: true, data: result.data };
}
