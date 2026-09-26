import { z } from 'zod';

export interface SafeActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorId?: string;
}

export class BusinessRuleError extends Error {
  isBusinessRuleViolation = true;
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Envoltorio de Seguridad para Server Actions (Next.js 14 App Router)
 * 
 * Garantiza:
 * 1. Validación dual-layer de entrada con Zod.
 * 2. Supresión total de stack traces, nombres de tablas PostgreSQL y rutas de archivos en el cliente.
 * 3. Asignación de Correlation ID único (ERR-XXXXX) para trazabilidad en observabilidad privada.
 */
export async function safeServerAction<TInput, TOutput>(
  actionName: string,
  schema: z.ZodSchema<TInput> | null,
  rawInput: TInput,
  handler: (validatedInput: TInput) => Promise<TOutput>
): Promise<SafeActionResponse<TOutput>> {
  const correlationId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // 1. Validación Zod de entrada
  let validatedData: TInput = rawInput;
  if (schema) {
    const validation = schema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors = validation.error.errors.map(e => e.message).join('. ');
      return {
        success: false,
        error: `Datos inválidos: ${fieldErrors}`,
      };
    }
    validatedData = validation.data;
  }

  // 2. Ejecución con manejo aislado de excepciones
  try {
    const result = await handler(validatedData);
    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    // 3. Log privado estructurado exclusivamente en consola del servidor (Node.js)
    console.error(`[ACTION_ERROR][${correlationId}][${actionName}]`, {
      timestamp: new Date().toISOString(),
      action: actionName,
      correlationId,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack,
      inputContext: validatedData,
    });

    // 4. Determinar mensaje seguro para el cliente
    let clientMessage = 'Ha ocurrido un error inesperado al procesar la solicitud en el servidor.';

    if (error instanceof BusinessRuleError || error?.isBusinessRuleViolation) {
      clientMessage = error.message;
    } else if (error?.name === 'AuthorizationError' || error?.message?.includes('Acceso Denegado')) {
      clientMessage = error.message;
    }

    // Respuesta 100% opaca y blindada
    return {
      success: false,
      error: `${clientMessage} (Código de referencia: ${correlationId})`,
      errorId: correlationId,
    };
  }
}
