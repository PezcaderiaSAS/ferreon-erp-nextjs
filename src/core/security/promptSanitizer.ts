/**
 * src/core/security/promptSanitizer.ts
 * Sanitización de Entradas No Confiables contra Inyecciones de Prompt
 * Directriz de Seguridad Aplicativa para Agentes y LLMs en FerreOn / Alquileres System
 */

const FORBIDDEN_PROMPT_INJECTIONS = [
  /system\s*prompt/gi,
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /olvida\s+(todas\s+las\s+)?instrucciones\s+(previas|anteriores)/gi,
  /act\s+as\s+(root|admin|system|developer|jailbreak)/gi,
  /dan\s+mode/gi,
  /disregard\s+the\s+above/gi,
  /override\s+rules/gi,
];

export interface SanitizePromptOptions {
  maxLength?: number;
  tagName?: string;
}

/**
 * Sanitiza texto libre (notas de devolución, observaciones de averías, cláusulas de contrato)
 * antes de suministrarlo como contexto a agentes autónomos o modelos de lenguaje.
 */
export function sanitizeForAgentContext(
  rawInput: string | null | undefined,
  options: SanitizePromptOptions = {}
): string {
  if (!rawInput || typeof rawInput !== 'string') {
    return '';
  }

  const { maxLength = 2000, tagName = 'untrusted_user_data' } = options;

  // 1. Limitar longitud máxima de caracteres para mitigar token-exhaustion
  let cleaned = rawInput.trim().slice(0, maxLength);

  // 2. Neutralizar patrones comunes de Prompt Injection
  for (const pattern of FORBIDDEN_PROMPT_INJECTIONS) {
    cleaned = cleaned.replace(pattern, '[INSTRUCCIÓN_REDACTADA]');
  }

  // 3. Escapar delimitadores sintácticos de tags para evitar que el input cierre prematuramente el bloque
  cleaned = cleaned
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 4. Encapsular en contenedor semántico seguro
  return `<${tagName}>\n${cleaned}\n</${tagName}>`;
}
