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

/**
 * Formatea una hora a formato estándar colombiano 12 horas con AM/PM (ej. "06:15 AM").
 * Utiliza estrictamente la zona horaria 'America/Bogota' (UTC-5) para neutralizar desfasajes.
 */
export function formatearHoraLocal(
  fechaInput: string | Date | null | undefined,
  opciones?: {
    incluirSegundos?: boolean;
    horaFallback?: string;
  }
): string {
  if (!fechaInput) {
    if (opciones?.horaFallback) return opciones.horaFallback;
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: opciones?.incluirSegundos ? '2-digit' : undefined,
      hour12: true,
    }).format(new Date()).replace(/\s+/g, ' ').replace(/a\.\s*m\./i, 'AM').replace(/p\.\s*m\./i, 'PM').toUpperCase();
  }

  // Si es un string simple de hora tipo "07:00" o "17:30"
  if (typeof fechaInput === 'string') {
    const str = fechaInput.trim();
    const matchHoraSimple = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (matchHoraSimple) {
      const h = parseInt(matchHoraSimple[1], 10);
      const m = parseInt(matchHoraSimple[2], 10);
      const s = matchHoraSimple[3] ? parseInt(matchHoraSimple[3], 10) : 0;
      const d = new Date();
      d.setHours(h, m, s, 0);
      return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        second: opciones?.incluirSegundos ? '2-digit' : undefined,
        hour12: true,
      }).format(d).replace(/\s+/g, ' ').replace(/a\.\s*m\./i, 'AM').replace(/p\.\s*m\./i, 'PM').toUpperCase();
    }

    // Si es una cadena pura de fecha YYYY-MM-DD sin componente de hora T ni espacio con hora
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      if (opciones?.horaFallback) return opciones.horaFallback;
      // Retornar la hora actual en Bogotá en lugar de 19:00 o 00:00 por desfase UTC
      return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        second: opciones?.incluirSegundos ? '2-digit' : undefined,
        hour12: true,
      }).format(new Date()).replace(/\s+/g, ' ').replace(/a\.\s*m\./i, 'AM').replace(/p\.\s*m\./i, 'PM').toUpperCase();
    }
  }

  const d = fechaInput instanceof Date ? fechaInput : new Date(fechaInput);
  if (isNaN(d.getTime())) {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      second: opciones?.incluirSegundos ? '2-digit' : undefined,
      hour12: true,
    }).format(new Date()).replace(/\s+/g, ' ').replace(/a\.\s*m\./i, 'AM').replace(/p\.\s*m\./i, 'PM').toUpperCase();
  }

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: opciones?.incluirSegundos ? '2-digit' : undefined,
    hour12: true,
  }).format(d).replace(/\s+/g, ' ').replace(/a\.\s*m\./i, 'AM').replace(/p\.\s*m\./i, 'PM').toUpperCase();
}

/**
 * Resuelve la fecha y hora canónica de emisión de un documento en Alquileres System.
 * Garantiza que siempre existan fecha y hora legibles y legalmente válidas en zona horaria colombiana.
 */
export function resolverFechaYHoraDocumento(payload: {
  fechaEmision?: string | Date | null;
  horaEmision?: string | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
  horaInicio?: string | null;
  hora_inicio?: string | null;
}): { fecha: string; hora: string } {
  // 1. Resolver fecha
  const fuenteFecha = payload.fechaEmision || payload.created_at || payload.createdAt || new Date();
  const fecha = formatearFechaLocal(fuenteFecha);

  // 2. Resolver hora
  let hora: string;
  if (payload.horaEmision && payload.horaEmision.trim()) {
    hora = formatearHoraLocal(payload.horaEmision);
  } else if (typeof payload.fechaEmision === 'string' && (payload.fechaEmision.includes('T') || payload.fechaEmision.includes(' '))) {
    hora = formatearHoraLocal(payload.fechaEmision);
  } else if (payload.created_at || payload.createdAt) {
    hora = formatearHoraLocal(payload.created_at || payload.createdAt);
  } else if (payload.horaInicio || payload.hora_inicio) {
    hora = formatearHoraLocal(payload.horaInicio || payload.hora_inicio);
  } else {
    hora = formatearHoraLocal(new Date());
  }

  return { fecha, hora };
}

