/**
 * Utilidades de generación de consecutivos e identificadores para subcontrataciones.
 * Proyecto: Alquileres System (FerreOn ERP)
 */

/**
 * Genera un consecutivo amigable y colisión-resistente para órdenes de subcontratación.
 * Formato: SUB-YYYYMMDD-XXXX (consecutivo cronológico con sufijo aleatorio).
 */
export function generarConsecutivoSubcontratacion(fechaReferencia: Date = new Date(), seed?: number): string {
  const yyyy = fechaReferencia.getFullYear();
  const mm = String(fechaReferencia.getMonth() + 1).padStart(2, '0');
  const dd = String(fechaReferencia.getDate()).padStart(2, '0');
  const timeSlice = String(fechaReferencia.getTime()).slice(-4);
  const randomSuffix = seed !== undefined ? String(seed).padStart(3, '0') : Math.floor(100 + Math.random() * 900);
  return `SUB-${yyyy}${mm}${dd}-${timeSlice}${randomSuffix}`;
}
