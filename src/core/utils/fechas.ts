/**
 * Utilidades canónicas de manejo y formateo seguro de fechas en FerreOn ERP.
 * 
 * Neutraliza el desfase de zona horaria UTC (ej. UTC-5 Colombia) donde las cadenas
 * "YYYY-MM-DD" se interpretan tradicionalmente a las 00:00:00 UTC, restando 5 horas
 * y mostrando el día anterior en PDF y vistas previas.
 */

/**
 * Parsea una entrada de fecha (string YYYY-MM-DD, ISO-8601 o Date) garantizando
 * que la fecha calendario se interprete en la zona horaria local a mediodía (12:00:00).
 */
export function parsearFechaLocal(fechaInput: string | Date | null | undefined): Date {
  if (!fechaInput) {
    return new Date();
  }

  if (fechaInput instanceof Date) {
    if (isNaN(fechaInput.getTime())) return new Date();
    return new Date(
      fechaInput.getFullYear(),
      fechaInput.getMonth(),
      fechaInput.getDate(),
      12, 0, 0
    );
  }

  const str = String(fechaInput).trim();
  if (!str) return new Date();

  // Si tiene formato YYYY-MM-DD (con o sin timestamp T...)
  const matchIsoDate = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchIsoDate) {
    const anio = parseInt(matchIsoDate[1], 10);
    const mes = parseInt(matchIsoDate[2], 10) - 1; // 0-indexed en JavaScript
    const dia = parseInt(matchIsoDate[3], 10);

    if (!isNaN(anio) && !isNaN(mes) && !isNaN(dia)) {
      return new Date(anio, mes, dia, 12, 0, 0);
    }
  }

  // Fallback para otros formatos de string
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    return new Date();
  }

  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

/**
 * Formatea una fecha a representación estándar colombiana "DD/MM/YYYY".
 * Garantiza que 2026-09-17 se formatee invariablemente como "17/09/2026".
 */
export function formatearFechaLocal(
  fechaInput: string | Date | null | undefined,
  opciones?: {
    separador?: '/' | '-';
    formatoLargo?: boolean;
  }
): string {
  if (!fechaInput) return 'Sin fecha';

  const d = parsearFechaLocal(fechaInput);
  const dia = String(d.getDate()).padStart(2, '0');
  const mesNum = d.getMonth() + 1;
  const mes = String(mesNum).padStart(2, '0');
  const anio = d.getFullYear();

  if (opciones?.formatoLargo) {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${dia} de ${meses[d.getMonth()]} de ${anio}`;
  }

  const sep = opciones?.separador || '/';
  return `${dia}${sep}${mes}${sep}${anio}`;
}

/**
 * Calcula de manera determinística los días calendario transcurridos entre dos fechas.
 * Mínimo 1 día.
 */
export function calcularDiasEntreFechas(
  fechaInicio: string | Date | null | undefined,
  fechaFin: string | Date | null | undefined
): number {
  const dInicio = parsearFechaLocal(fechaInicio);
  const dFin = parsearFechaLocal(fechaFin);

  const diffMs = dFin.getTime() - dInicio.getTime();
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, dias);
}
