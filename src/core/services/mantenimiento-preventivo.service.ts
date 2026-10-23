/**
 * Servicio de Dominio: Mantenimiento Preventivo, Horómetros y Alertas de Uso WMS
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Centraliza la lógica de negocio pura para:
 * - Evaluación de semáforos de desgaste (OK, PROXIMO, VENCIDO).
 * - Cálculo de porcentajes de vida útil de maquinaria en base a horas y días de obra.
 * - Liquidación de desgaste tras devolución de alquiler con Poka-Yoke de horómetro.
 * - Reseteo inmutable de ciclo técnico tras mantenimiento.
 */

export type EstadoSemaforoMantenimiento = 'OK' | 'PROXIMO' | 'VENCIDO';

export interface MantenimientoConfig {
  tieneHorometro: boolean;
  horasUsoAcumuladas: number;
  horasLimiteMantenimiento: number;
  diasUsoAcumulados: number;
  diasLimiteMantenimiento: number;
  stockMantenimiento?: number;
  ultimoMantenimientoAt: string | null;
  ultimoMantenimientoObs: string | null;
}

export interface LiquidarCicloDevolucionParams {
  diasEnObra: number;
  horometroDespacho?: number;
  horometroRetorno?: number;
}

export interface LiquidarCicloDevolucionResult {
  valido: boolean;
  error?: string;
  configActualizada?: MantenimientoConfig;
  deltaHoras?: number;
  deltaDias?: number;
}

export class MantenimientoPreventivoService {
  /**
   * Determina el semáforo de mantenimiento de un equipo.
   * Reglas:
   * - Si stockMantenimiento > 0 -> 'VENCIDO' (unidades físicas en el taller).
   * - Si el porcentaje de horas o días >= 100% -> 'VENCIDO'.
   * - Si el porcentaje de horas o días >= 80% y < 100% -> 'PROXIMO'.
   * - De lo contrario -> 'OK'.
   */
  public static evaluarSemaforoMantenimiento(config: MantenimientoConfig): EstadoSemaforoMantenimiento {
    if (config.stockMantenimiento && config.stockMantenimiento > 0) {
      return 'VENCIDO';
    }

    const pctHoras = config.tieneHorometro && config.horasLimiteMantenimiento > 0
      ? this.calcularPorcentajeUso(config.horasUsoAcumuladas, config.horasLimiteMantenimiento)
      : 0;

    const pctDias = config.diasLimiteMantenimiento > 0
      ? this.calcularPorcentajeUso(config.diasUsoAcumulados, config.diasLimiteMantenimiento)
      : 0;

    const maxPct = Math.max(pctHoras, pctDias);

    if (maxPct >= 100) {
      return 'VENCIDO';
    }

    if (maxPct >= 80) {
      return 'PROXIMO';
    }

    return 'OK';
  }

  /**
   * Calcula el porcentaje entero seguro entre el valor actual y el límite permitido.
   * Tolerante a divisiones por cero o valores negativos.
   */
  public static calcularPorcentajeUso(actual: number, limite: number): number {
    if (!limite || limite <= 0) return 0;
    if (actual <= 0) return 0;
    return Math.round((actual / limite) * 100);
  }

  /**
   * Obtiene el porcentaje de desgaste crítico máximo consolidado entre horas y días.
   */
  public static obtenerPorcentajeDesgasteMaximo(config: MantenimientoConfig): number {
    const pctHoras = config.tieneHorometro && config.horasLimiteMantenimiento > 0
      ? this.calcularPorcentajeUso(config.horasUsoAcumuladas, config.horasLimiteMantenimiento)
      : 0;

    const pctDias = config.diasLimiteMantenimiento > 0
      ? this.calcularPorcentajeUso(config.diasUsoAcumulados, config.diasLimiteMantenimiento)
      : 0;

    return Math.max(pctHoras, pctDias);
  }

  /**
   * Liquida el uso de un equipo tras una devolución de alquiler.
   * Valida consistencia de lecturas de horómetros (Poka-Yoke).
   */
  public static liquidarCicloDevolucion(
    config: MantenimientoConfig,
    params: LiquidarCicloDevolucionParams
  ): LiquidarCicloDevolucionResult {
    let deltaHoras = 0;

    // Validación Poka-Yoke de horómetros
    if (params.horometroRetorno !== undefined && params.horometroDespacho !== undefined) {
      if (params.horometroRetorno < params.horometroDespacho) {
        return {
          valido: false,
          error: `Lectura de horómetro inconsistente: el horómetro de retorno (${params.horometroRetorno}) no puede ser inferior al de despacho (${params.horometroDespacho}).`,
        };
      }
      deltaHoras = params.horometroRetorno - params.horometroDespacho;
    }

    const deltaDias = Math.max(0, params.diasEnObra || 0);

    const configActualizada: MantenimientoConfig = {
      ...config,
      diasUsoAcumulados: (config.diasUsoAcumulados || 0) + deltaDias,
      horasUsoAcumuladas: (config.horasUsoAcumuladas || 0) + deltaHoras,
    };

    return {
      valido: true,
      configActualizada,
      deltaHoras,
      deltaDias,
    };
  }

  /**
   * Reinicia los contadores de ciclo técnico tras un mantenimiento preventivo.
   * Retorna una nueva copia inmutable del estado.
   */
  public static ejecutarResetMantenimiento(
    config: MantenimientoConfig,
    observaciones: string,
    fechaISO?: string
  ): MantenimientoConfig {
    return {
      ...config,
      horasUsoAcumuladas: 0,
      diasUsoAcumulados: 0,
      stockMantenimiento: 0,
      ultimoMantenimientoAt: fechaISO || new Date().toISOString(),
      ultimoMantenimientoObs: observaciones,
    };
  }
}
