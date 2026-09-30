/**
 * Utilidades de normalización y saneamiento para clientes y documentos tributarios.
 * Proyecto: Alquileres System (FerreOn ERP)
 */

/**
 * Normaliza y sanitiza números de documento (NIT o Cédula) en Colombia.
 * - Elimina puntos de separación de miles, espacios y caracteres no imprimibles.
 * - Convierte a mayúsculas.
 * - Mantiene el dígito de verificación si está presente (ej. "900.123.456-1" -> "900123456-1").
 */
export function sanitizarNitCedula(documento: string): string {
  if (!documento) return '';
  return documento
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\.(?=\d)/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}
