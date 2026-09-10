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
