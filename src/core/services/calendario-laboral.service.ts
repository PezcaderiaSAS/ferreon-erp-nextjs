/**
 * Servicio de Dominio Puro: Calendario Laboral y Tarifas Dinámicas
 * Alquileres System - SPEC-014
 * 
 * Implementa el cálculo canónico de días cobrables según la modalidad pactada
 * (Calendario, Hábiles Lun-Vie, Hábiles Lun-Sáb) y el calendario oficial de días festivos
 * de la República de Colombia bajo la Ley 51 de 1983 (Ley Emiliani) y el algoritmo
 * de Computus gregoriano (Meeus/Butcher) para la Pascua.
 */

export type ModoCobroDias =
  | 'CALENDARIO'
  | 'HABILES_LUNES_VIERNES'
  | 'HABILES_LUNES_SABADO';

export interface FestivoColombia {
  fecha: string; // ISO 'YYYY-MM-DD'
  nombre: string;
  tipo: 'FIJO' | 'EMILIANI' | 'PASCUA';
}

export interface DetalleDiaPeriodo {
  fecha: string; // 'YYYY-MM-DD'
  diaSemana: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  nombreDia: string;
  esCobrable: boolean;
  esFestivo: boolean;
  nombreFestivo?: string;
  motivoExclusion?: string;
}

export interface DesgloseDiasAlquiler {
  totalDiasCalendario: number;
  diasCobrables: number;
  diasExcluidos: number;
  modoCobro: ModoCobroDias;
  detalles: DetalleDiaPeriodo[];
}

const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export class CalendarioLaboralService {
  /**
   * Cache de festivos por año para optimizar operaciones masivas
   */
  private static festivosPorAnioCache = new Map<number, FestivoColombia[]>();

  /**
   * Parsea de forma segura una fecha 'YYYY-MM-DD' o Date a un Date UTC neutro al mediodía (12:00:00Z)
   * para inmunidad absoluta contra timezones locales y cambios de horario.
   */
  public static normalizarFechaUTC(fechaInput: Date | string): Date {
    if (typeof fechaInput === 'string') {
      const parteFecha = fechaInput.split('T')[0];
      const [y, m, d] = parteFecha.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    }
    return new Date(
      Date.UTC(
        fechaInput.getUTCFullYear(),
        fechaInput.getUTCMonth(),
        fechaInput.getUTCDate(),
        12,
        0,
        0
      )
    );
  }

  /**
   * Formatea un Date UTC a cadena canónica 'YYYY-MM-DD'.
   */
  public static formatearFechaISO(fecha: Date): string {
    const y = fecha.getUTCFullYear();
    const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const d = String(fecha.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Calcula la fecha del Domingo de Resurrección (Pascua) para cualquier año gregoriano
   * utilizando el algoritmo Meeus / Butcher.
   */
  public static calcularPascua(anio: number): Date {
    const a = anio % 19;
    const b = Math.floor(anio / 100);
    const c = anio % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed: 2=Marzo, 3=Abril
    const dia = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(Date.UTC(anio, mes, dia, 12, 0, 0));
  }

  /**
   * Traslada una fecha al siguiente lunes según las reglas de la Ley Emiliani (Ley 51 de 1983).
   * Si la fecha cae en lunes, se mantiene. En caso contrario, se traslada al lunes inmediato posterior.
   */
  private static trasladarAlSiguienteLunes(fecha: Date): Date {
    const diaSemana = fecha.getUTCDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    if (diaSemana === 1) {
      return new Date(fecha.getTime());
    }
    const diasASumar = (8 - diaSemana) % 7;
    const trasladada = new Date(fecha.getTime());
    trasladada.setUTCDate(trasladada.getUTCDate() + diasASumar);
    return trasladada;
  }

  /**
   * Obtiene la lista completa de los 18 días festivos oficiales de Colombia para un año específico.
   */
  public static obtenerFestivosColombia(anio: number): FestivoColombia[] {
    if (this.festivosPorAnioCache.has(anio)) {
      return this.festivosPorAnioCache.get(anio)!;
    }

    const festivos: FestivoColombia[] = [];

    // 1. Festivos Fijos (6 días)
    const fijos: { mes: number; dia: number; nombre: string }[] = [
      { mes: 0, dia: 1, nombre: 'Año Nuevo' },
      { mes: 4, dia: 1, nombre: 'Día del Trabajo' },
      { mes: 6, dia: 20, nombre: 'Grito de Independencia' },
      { mes: 7, dia: 7, nombre: 'Batalla de Boyacá' },
      { mes: 11, dia: 8, nombre: 'Inmaculada Concepción' },
      { mes: 11, dia: 25, nombre: 'Navidad' },
    ];

    for (const f of fijos) {
      festivos.push({
        fecha: this.formatearFechaISO(new Date(Date.UTC(anio, f.mes, f.dia, 12, 0, 0))),
        nombre: f.nombre,
        tipo: 'FIJO',
      });
    }

    // 2. Festivos Ley Emiliani (7 días trasladables al lunes siguiente)
    const emiliani: { mes: number; dia: number; nombre: string }[] = [
      { mes: 0, dia: 6, nombre: 'Reyes Magos' },
      { mes: 2, dia: 19, nombre: 'San José' },
      { mes: 5, dia: 29, nombre: 'San Pedro y San Pablo' },
      { mes: 7, dia: 15, nombre: 'Asunción de la Virgen' },
      { mes: 9, dia: 12, nombre: 'Día de la Raza' },
      { mes: 10, dia: 1, nombre: 'Todos los Santos' },
      { mes: 10, dia: 11, nombre: 'Independencia de Cartagena' },
    ];

    for (const e of emiliani) {
      const fechaOriginal = new Date(Date.UTC(anio, e.mes, e.dia, 12, 0, 0));
      const fechaTrasladada = this.trasladarAlSiguienteLunes(fechaOriginal);
      festivos.push({
        fecha: this.formatearFechaISO(fechaTrasladada),
        nombre: e.nombre,
        tipo: 'EMILIANI',
      });
    }

    // 3. Festivos dependientes de la Pascua (5 días)
    const pascua = this.calcularPascua(anio);

    const agregarPascuaOffset = (
      offsetDias: number,
      nombre: string,
      trasladar: boolean
    ) => {
      const fecha = new Date(pascua.getTime());
      fecha.setUTCDate(fecha.getUTCDate() + offsetDias);
      const fechaFinal = trasladar ? this.trasladarAlSiguienteLunes(fecha) : fecha;
      festivos.push({
        fecha: this.formatearFechaISO(fechaFinal),
        nombre,
        tipo: 'PASCUA',
      });
    };

    agregarPascuaOffset(-3, 'Jueves Santo', false);
    agregarPascuaOffset(-2, 'Viernes Santo', false);
    agregarPascuaOffset(43, 'Ascensión del Señor', true);
    agregarPascuaOffset(64, 'Corpus Christi', true);
    agregarPascuaOffset(71, 'Sagrado Corazón de Jesús', true);

    // Ordenar cronológicamente
    festivos.sort((a, b) => a.fecha.localeCompare(b.fecha));

    this.festivosPorAnioCache.set(anio, festivos);
    return festivos;
  }

  /**
   * Determina si una fecha dada es un día festivo oficial en Colombia.
   */
  public static esFestivo(fechaInput: Date | string): {
    esFestivo: boolean;
    nombre?: string;
  } {
    const fecha = this.normalizarFechaUTC(fechaInput);
    const anio = fecha.getUTCFullYear();
    const festivos = this.obtenerFestivosColombia(anio);
    const fechaISO = this.formatearFechaISO(fecha);

    const encontrado = festivos.find((f) => f.fecha === fechaISO);
    if (encontrado) {
      return { esFestivo: true, nombre: encontrado.nombre };
    }
    return { esFestivo: false };
  }

  /**
   * Determina si un día dado es cobrable según el modo de cobro seleccionado.
   */
  public static esDiaHabil(
    fechaInput: Date | string,
    modo: ModoCobroDias = 'CALENDARIO'
  ): boolean {
    if (modo === 'CALENDARIO') {
      return true;
    }

    const fecha = this.normalizarFechaUTC(fechaInput);
    const diaSemana = fecha.getUTCDay(); // 0=Domingo, 6=Sábado

    // Los domingos nunca se cobran en modalidad de días hábiles
    if (diaSemana === 0) {
      return false;
    }

    // Los festivos nacionales se excluyen en ambas modalidades hábiles
    const festivo = this.esFestivo(fecha);
    if (festivo.esFestivo) {
      return false;
    }

    // En Lunes a Viernes, los sábados se excluyen
    if (modo === 'HABILES_LUNES_VIERNES' && diaSemana === 6) {
      return false;
    }

    // En HABILES_LUNES_SABADO, sábado no festivo se cobra
    return true;
  }

  /**
   * Calcula el número exacto de días cobrables entre dos fechas (inclusive).
   */
  public static calcularDiasCobrables(
    fechaInicio: Date | string,
    fechaFin: Date | string,
    modo: ModoCobroDias = 'CALENDARIO'
  ): number {
    const inicio = this.normalizarFechaUTC(fechaInicio);
    const fin = this.normalizarFechaUTC(fechaFin);

    if (fin.getTime() < inicio.getTime()) {
      throw new Error(
        'La fecha final debe ser posterior o igual a la fecha de inicio'
      );
    }

    let diasCobrables = 0;
    const actual = new Date(inicio.getTime());

    while (actual.getTime() <= fin.getTime()) {
      if (this.esDiaHabil(actual, modo)) {
        diasCobrables++;
      }
      actual.setUTCDate(actual.getUTCDate() + 1);
    }

    return diasCobrables;
  }

  /**
   * Provee un desglose pormenorizado día por día del período con los motivos de exclusión.
   */
  public static desglosarDiasPeriodo(
    fechaInicio: Date | string,
    fechaFin: Date | string,
    modo: ModoCobroDias = 'CALENDARIO'
  ): DesgloseDiasAlquiler {
    const inicio = this.normalizarFechaUTC(fechaInicio);
    const fin = this.normalizarFechaUTC(fechaFin);

    if (fin.getTime() < inicio.getTime()) {
      throw new Error(
        'La fecha final debe ser posterior o igual a la fecha de inicio'
      );
    }

    const detalles: DetalleDiaPeriodo[] = [];
    const actual = new Date(inicio.getTime());
    let diasCobrables = 0;
    let diasExcluidos = 0;

    while (actual.getTime() <= fin.getTime()) {
      const fechaISO = this.formatearFechaISO(actual);
      const diaSemana = actual.getUTCDay();
      const nombreDia = NOMBRES_DIAS[diaSemana];
      const festivo = this.esFestivo(actual);

      let esCobrable = true;
      let motivoExclusion: string | undefined = undefined;

      if (modo !== 'CALENDARIO') {
        if (festivo.esFestivo) {
          esCobrable = false;
          motivoExclusion = `Festivo (${festivo.nombre})`;
        } else if (diaSemana === 0) {
          esCobrable = false;
          motivoExclusion = 'Domingo';
        } else if (modo === 'HABILES_LUNES_VIERNES' && diaSemana === 6) {
          esCobrable = false;
          motivoExclusion = 'Sábado no laborable';
        }
      }

      if (esCobrable) {
        diasCobrables++;
      } else {
        diasExcluidos++;
      }

      detalles.push({
        fecha: fechaISO,
        diaSemana,
        nombreDia,
        esCobrable,
        esFestivo: festivo.esFestivo,
        nombreFestivo: festivo.nombre,
        motivoExclusion,
      });

      actual.setUTCDate(actual.getUTCDate() + 1);
    }

    return {
      totalDiasCalendario: detalles.length,
      diasCobrables,
      diasExcluidos,
      modoCobro: modo,
      detalles,
    };
  }
}
