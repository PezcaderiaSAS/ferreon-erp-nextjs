/**
 * Servicio de Dominio Puro: Firma Digital y Rúbricas Touch
 * Alquileres System — Gestión y Certificación de Firmas Electrónicas
 * Cumplimiento: Ley 527 de 1999 y Decreto 2364 de 2012 (Colombia)
 */

export interface ResultadoValidacionFirma {
  valida: boolean;
  error?: string;
  bytesAprox?: number;
  formato?: 'png' | 'webp';
}

export class FirmaDigitalService {
  private static readonly MAX_BYTES_PERMITIDOS = 500 * 1024; // 500 KB
  private static readonly MIN_PAYLOAD_BASE64_LENGTH = 15; // Mínimo de datos de imagen

  /**
   * Valida que una firma en Base64 cumpla con los estándares de seguridad,
   * formato soportado (PNG o WebP) y rango de peso operativo.
   */
  public static validarFirmaBase64(base64: string): ResultadoValidacionFirma {
    if (!base64 || typeof base64 !== 'string' || base64.trim() === '') {
      return { valida: false, error: 'La firma no puede estar vacía.' };
    }

    const trimmed = base64.trim();
    const match = trimmed.match(/^data:image\/(png|webp);base64,(.+)$/i);

    if (!match) {
      return {
        valida: false,
        error: 'Formato de imagen no soportado. Se requiere Data URI de PNG o WebP.',
      };
    }

    const formato = match[1].toLowerCase() as 'png' | 'webp';
    const rawData = match[2];

    if (rawData.length < this.MIN_PAYLOAD_BASE64_LENGTH) {
      return {
        valida: false,
        error: 'Trazo de firma insuficiente o lienzo en blanco.',
      };
    }

    // Cálculo aproximado de bytes a partir de base64: (longitud * 3) / 4
    const padding = rawData.endsWith('==') ? 2 : rawData.endsWith('=') ? 1 : 0;
    const bytesAprox = Math.max(0, (rawData.length * 3) / 4 - padding);

    if (bytesAprox > this.MAX_BYTES_PERMITIDOS) {
      return {
        valida: false,
        error: `El tamaño de la firma (${Math.round(bytesAprox / 1024)} KB) excede el límite de 500 KB.`,
        bytesAprox,
      };
    }

    return {
      valida: true,
      bytesAprox,
      formato,
    };
  }

  /**
   * Genera el texto de estampa legal para el contrato de alquiler
   * respaldado bajo la Ley 527 de 1999 de comercio electrónico en Colombia.
   */
  public static generarEstampaLegalCliente(
    clienteNombre: string,
    nit: string,
    fecha: Date = new Date()
  ): string {
    const nombre = (clienteNombre || '').trim() || 'CLIENTE / ARRENDATARIO';
    const doc = (nit || '').trim() || 'S/N';
    const fechaTexto = this.formatearFechaLegal(fecha);

    return `Firma digital touch estampada por ${nombre} (NIT/C.C.: ${doc}) el ${fechaTexto}. Certificada bajo Ley 527 de 1999 y Decreto 2364 de 2012 de la República de Colombia.`;
  }

  /**
   * Formatea la fecha y hora bajo el estándar colombiano (DD/MM/YYYY hh:mm:ss a)
   */
  public static formatearFechaLegal(fecha: Date = new Date()): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(fecha);
  }
}
