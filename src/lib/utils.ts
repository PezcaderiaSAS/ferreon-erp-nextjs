import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina condicionalmente clases de CSS y resuelve colisiones de Tailwind CSS.
 * Estándar canónico utilizado por shadcn/ui y Radix UI en Next.js.
 *
 * @param inputs - Lista de nombres de clases, expresiones condicionales, arrays u objetos de clase.
 * @returns Cadena de clases CSS resultante, optimizada e inmune a colisiones de Tailwind.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Parsea el valor string de un input numérico permitiendo borrar limpiamente
 * el campo con Backspace (cadena vacía retorna el mínimo, por defecto 0) sin
 * arrojar NaN ni bloquear la escritura del usuario.
 */
export function parsearNumeroErgonomico(valor: string, minimo = 0): number {
  const trimmed = valor.trim();
  if (trimmed === '') return minimo;
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? minimo : Math.max(minimo, parsed);
}

/**
 * Retorna cadena vacía cuando el valor numérico es 0 para permitir que el
 * input muestre el placeholder sin que el '0' interfiera en la escritura.
 */
export function formatearValorErgonomico(valor: number | null | undefined): string | number {
  if (valor === 0 || valor === null || valor === undefined) return '';
  return valor;
}
