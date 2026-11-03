/**
 * Servicio de Dominio Puro: AlquilerHorasService
 * SPEC-015: Módulo de Alquiler Express por Horas en Mostrador POS
 * 
 * Centraliza las fórmulas matemáticas, redondeos COP, validaciones Poka-Yoke
 * y cálculos de tiempos de entrega y devolución para alquileres rápidos por horas.
 */

export type FormatoHoraSalida = '24h' | '12h';
export type TipoRedondeoRetraso = 'CEIL' | 'EXACT';

export interface EvaluacionTopeEquipos {
  permitido: boolean;
  restante: number;
  mensaje?: string;
}

export interface MetadataAlquilerExpress {
  esExpress: boolean;
  horas: number;
  horaDespacho: string | null;
  horaDevolucion: string | null;
}

export class AlquilerHorasService {
  /**
   * Horario estándar de corte / cierre operativo (6:00 PM)
   */
  public static readonly HORA_CIERRE_DEFECTO = '18:00';

  /**
   * Recargo express estándar por alquiler fraccionado en horas (+20%)
   */
  public static readonly RECARGO_EXPRESS_DEFECTO = 20;

  /**
   * Tope predeterminado de equipos para alquiler express
   */
  public static readonly TOPE_EQUIPOS_DEFECTO = 5;

  /**
   * Calcula la tarifa por hora con recargo express sobre una base de 8 horas diarias:
   * tarifa_hora = Math.round((tarifa_dia / 8) * (1 + recargoPorcentaje / 100))
   * 
   * @param tarifaDia Tarifa diaria pactada en COP
   * @param recargoPorcentaje Porcentaje de recargo express (por defecto: 20%)
   * @returns Tarifa por hora redondeada al entero COP más cercano
   */
  public static calcularTarifaHora(
    tarifaDia: number,
    recargoPorcentaje: number = AlquilerHorasService.RECARGO_EXPRESS_DEFECTO
  ): number {
    if (!tarifaDia || isNaN(tarifaDia) || tarifaDia <= 0) {
      return 0;
    }

    const recargo = Number(recargoPorcentaje) || 0;
    const basePorHora = tarifaDia / 8;
    const tarifaConRecargo = basePorHora * (1 + recargo / 100);

    return Math.round(tarifaConRecargo);
  }

  /**
   * Normaliza la cantidad de horas contratadas evitando valores <= 0 o NaN [W01].
   * 
   * @param horas Cantidad de horas ingresada
   * @returns Entero positivo >= 1
   */
  public static normalizarHoras(horas: number): number {
    if (!horas || isNaN(horas) || horas < 1) {
      return 1;
    }
    return Math.max(1, Math.floor(horas));
  }

  /**
   * Obtiene la hora actual del sistema en formato 24 horas 'HH:mm' (ej: '08:30').
   */
  public static obtenerHoraActualHHMM(): string {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  /**
   * Convierte una cadena de hora (24h o 12h) al formato legible de 12 horas 'hh:mm A' (ej: '02:30 PM').
   */
  public static formatearHora12(horaStr: string): string {
    if (!horaStr) return '12:00 PM';

    // Si ya contiene AM o PM, devolverlo normalizado
    if (/am|pm/i.test(horaStr)) {
      return horaStr.trim().toUpperCase();
    }

    const partes = horaStr.trim().split(':');
    let horas = parseInt(partes[0], 10);
    const minutos = parseInt(partes[1] || '0', 10);

    if (isNaN(horas)) horas = 12;
    const ampm = horas >= 12 ? 'PM' : 'AM';
    const horas12 = horas % 12 === 0 ? 12 : horas % 12;

    const hhStr = String(horas12).padStart(2, '0');
    const mmStr = String(isNaN(minutos) ? 0 : minutos).padStart(2, '0');

    return `${hhStr}:${mmStr} ${ampm}`;
  }

  /**
   * Proyecta automáticamente la hora de devolución pactada sumando las horas a la hora de salida.
   * Maneja formatos 24h ('14:30') y 12h ('02:30 PM').
   * 
   * @param horaEntrega Hora de salida / despacho (ej: '08:30' o '08:30 AM')
   * @param horas Cantidad de horas contratadas
   * @param formato Formato de salida ('24h' o '12h', por defecto: '24h')
   */
  public static proyectarHoraRetorno(
    horaEntrega: string,
    horas: number,
    formato: FormatoHoraSalida = '24h'
  ): string {
    const horasSumar = AlquilerHorasService.normalizarHoras(horas);
    const horaLimpia = (horaEntrega || AlquilerHorasService.obtenerHoraActualHHMM()).trim();

    let horasBase = 8;
    let minutosBase = 0;

    const match12 = horaLimpia.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const meridiano = match12[3]?.toUpperCase();

      if (meridiano === 'PM' && h < 12) h += 12;
      if (meridiano === 'AM' && h === 12) h = 0;

      horasBase = h;
      minutosBase = m;
    } else {
      const [hStr, mStr] = horaLimpia.split(':');
      horasBase = parseInt(hStr || '8', 10);
      minutosBase = parseInt(mStr || '0', 10);
    }

    if (isNaN(horasBase)) horasBase = 8;
    if (isNaN(minutosBase)) minutosBase = 0;

    const totalMinutos = horasBase * 60 + minutosBase + horasSumar * 60;
    const minutosEnDia = totalMinutos % (24 * 60);
    const horasFinales = Math.floor(minutosEnDia / 60);
    const minutosFinales = minutosEnDia % 60;

    const hh24 = String(horasFinales).padStart(2, '0');
    const mm = String(minutosFinales).padStart(2, '0');
    const resultado24 = `${hh24}:${mm}`;

    if (formato === '12h') {
      return AlquilerHorasService.formatearHora12(resultado24);
    }

    return resultado24;
  }

  /**
   * Extrae metadatos de alquiler express (horas, hora despacho, hora devolución)
   * desde las propiedades directas del objeto o desde la etiqueta en observaciones.
   */
  public static extraerMetadataExpress(alquiler: any): MetadataAlquilerExpress {
    if (!alquiler || typeof alquiler !== 'object') {
      return { esExpress: false, horas: 1, horaDespacho: null, horaDevolucion: null };
    }

    const obs = typeof alquiler.observaciones === 'string' ? alquiler.observaciones : '';
    const esExpress = Boolean(
      alquiler.unidadTiempo === 'HORAS' ||
      alquiler.unidad_tiempo === 'HORAS' ||
      obs.includes('ALQUILER EXPRESS POR HORAS') ||
      Boolean(alquiler.horasContratadas || alquiler.horas_contratadas || alquiler.horasAlquiler)
    );

    if (!esExpress) {
      return { esExpress: false, horas: 1, horaDespacho: null, horaDevolucion: null };
    }

    // 1. Extraer horas contratadas
    let horas = Number(
      alquiler.horasAlquiler ||
      alquiler.horasContratadas ||
      alquiler.horas_contratadas ||
      alquiler.duracion
    );

    if (!horas || isNaN(horas) || horas <= 0) {
      const matchHoras = obs.match(/ALQUILER EXPRESS POR HORAS\s*\|\s*(\d+)h/i);
      if (matchHoras) {
        horas = parseInt(matchHoras[1], 10);
      } else if (Array.isArray(alquiler.detalles) && alquiler.detalles.length > 0) {
        const d0 = alquiler.detalles[0];
        horas = Number(d0.duracion || d0.horas || d0.horasCobro || d0.horas_contratadas || 1);
      } else {
        horas = 4; // Predeterminado express
      }
    }

    // 2. Extraer hora de despacho / salida
    let horaDespacho: string | null = alquiler.horaEntrega || alquiler.hora_entrega || null;
    if (!horaDespacho) {
      const matchDespacho = obs.match(/Despacho:\s*([^\s->\]]+)/i);
      if (matchDespacho) {
        horaDespacho = matchDespacho[1].trim();
      }
    }

    // 3. Extraer hora de retorno / devolución estimada
    let horaDevolucion: string | null =
      alquiler.horaDevolucionEstimada ||
      alquiler.hora_devolucion_estimada ||
      alquiler.hora_retorno_estimada ||
      null;

    if (!horaDevolucion) {
      const matchRetorno = obs.match(/Retorno Estimado:\s*([^\]]+)/i);
      if (matchRetorno) {
        horaDevolucion = matchRetorno[1].trim();
      } else if (horaDespacho && horas > 0) {
        horaDevolucion = AlquilerHorasService.proyectarHoraRetorno(horaDespacho, horas, '12h');
      }
    }

    return {
      esExpress: true,
      horas: AlquilerHorasService.normalizarHoras(horas),
      horaDespacho,
      horaDevolucion,
    };
  }

  /**
   * Comprueba si la hora proyectada de retorno sobrepasa el horario laboral de cierre [W02].
   * Maneja horas en formato 24h ('18:30') y 12h ('06:30 PM'), así como cruce de medianoche (madrugada).
   * 
   * @param horaRetorno Hora estimada de retorno en formato 24h 'HH:mm' o 12h
   * @param horaCierre Hora de cierre del establecimiento (por defecto: '18:00')
   * @param horaSalida Hora de salida opcional para detectar cruce nocturno al día siguiente
   */
  public static esSobrepasoHorarioLaboral(
    horaRetorno: string,
    horaCierre: string = AlquilerHorasService.HORA_CIERRE_DEFECTO,
    horaSalida?: string
  ): boolean {
    const aMinutos = (hStr: string): number => {
      if (!hStr) return 0;
      const match12 = hStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const meridiano = match12[3]?.toUpperCase();
        if (meridiano === 'PM' && h < 12) h += 12;
        if (meridiano === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      }
      const match = hStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };

    const minRetorno = aMinutos(horaRetorno);
    const minCierre = aMinutos(horaCierre);

    // Si se pasa hora de salida y el retorno es menor que la salida, cruzó la medianoche
    if (horaSalida) {
      const minSalida = aMinutos(horaSalida);
      if (minRetorno < minSalida) {
        return true;
      }
    }

    // Cualquier retorno proyectado en la madrugada (00:01 a 06:59) está fuera del horario comercial
    if (minRetorno < 7 * 60 && minRetorno > 0) {
      return true;
    }

    return minRetorno > minCierre;
  }

  /**
   * Calcula el número de horas extras de retraso si la hora real de recepción es posterior a la pactada.
   * 
   * @param horaPactada Hora prometida en formato 'HH:mm'
   * @param horaReal Hora real de recepción en formato 'HH:mm'
   * @param redondeo 'CEIL' redondea cualquier fracción hacia arriba (estándar express), 'EXACT' retorna decimal
   */
  public static calcularHorasRetraso(
    horaPactada: string,
    horaReal: string,
    redondeo: TipoRedondeoRetraso = 'CEIL'
  ): number {
    const aMinutos = (hStr: string): number => {
      const match = hStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };

    const minPactados = aMinutos(horaPactada);
    const minReales = aMinutos(horaReal);

    const diferenciaMinutos = minReales - minPactados;
    if (diferenciaMinutos <= 0) {
      return 0;
    }

    const horasDecimal = diferenciaMinutos / 60;
    if (redondeo === 'EXACT') {
      return Number(horasDecimal.toFixed(2));
    }

    return Math.ceil(horasDecimal);
  }

  /**
   * Valida si se puede agregar un equipo al carrito de alquiler express según el límite [E03].
   * 
   * @param cantidadTotalEnCarrito Suma total de unidades en el carrito actual
   * @param maxPermitido Límite máximo configurado (por defecto: 5)
   */
  public static validarTopeEquipos(
    cantidadTotalEnCarrito: number,
    maxPermitido: number = AlquilerHorasService.TOPE_EQUIPOS_DEFECTO
  ): EvaluacionTopeEquipos {
    const cant = Math.max(0, Number(cantidadTotalEnCarrito) || 0);
    const max = Math.max(1, Number(maxPermitido) || AlquilerHorasService.TOPE_EQUIPOS_DEFECTO);

    const restante = Math.max(0, max - cant);
    const permitido = cant < max;

    return {
      permitido,
      restante,
      mensaje: permitido
        ? undefined
        : `Tope de equipos alcanzado para alquiler express (máx. ${max}). Pase a alquiler por días para mayor volumen.`,
    };
  }

  /**
   * Calcula de forma reactiva el subtotal de una línea de alquiler por horas:
   * subtotal = tarifaHora * horas * cantidad
   * 
   * @param tarifaDia Tarifa diaria del equipo
   * @param horas Horas pactadas
   * @param cantidad Cantidad de unidades
   * @param recargoPorcentaje Recargo por hora (por defecto 20%)
   */
  public static calcularSubtotalItem(
    tarifaDia: number,
    horas: number,
    cantidad: number = 1,
    recargoPorcentaje: number = AlquilerHorasService.RECARGO_EXPRESS_DEFECTO
  ): number {
    const tarifaHora = AlquilerHorasService.calcularTarifaHora(tarifaDia, recargoPorcentaje);
    const horasNorm = AlquilerHorasService.normalizarHoras(horas);
    const cantNorm = Math.max(1, Math.floor(cantidad || 1));

    return tarifaHora * horasNorm * cantNorm;
  }
}
