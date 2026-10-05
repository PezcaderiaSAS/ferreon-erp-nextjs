export type RangoMaestria =
  | 'APRENDIZ_TALLER'      // Nivel 1 (0-200 XP)
  | 'OPERADOR_BODEGA'      // Nivel 2 (201-500 XP)
  | 'ASESOR_COMERCIAL'     // Nivel 3 (501-900 XP)
  | 'MAESTRO_CONTRATOS'    // Nivel 4 (901-1400 XP)
  | 'GERENTE_MAQUINARIA';  // Nivel 5 (1401+ XP)

export interface RangoConfig {
  nivel: number;
  rango: RangoMaestria;
  nombre: string;
  icono: string;
  xpMin: number;
  xpMax: number;
  colorClase: string;
  descripcion: string;
}

export interface InsigniaGamification {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  modulo: string;
  puntosXP: number;
  desbloqueada?: boolean;
  fechaDesbloqueo?: string;
}

export interface MisionAprendizaje {
  id: string;
  modulo: string;
  titulo: string;
  descripcionApta12: string;
  recompensaXP: number;
  tourId: string;
  ruta: string;
  duracionMinutos: number;
  icono?: string;
}

export interface ProgresoGamificationState {
  xpTotal: number;
  rangoActual: RangoMaestria;
  misionesCompletadas: string[];
  toursCompletados: string[];
  insigniasDesbloqueadas: string[];
}

export interface ProgresoNivelInfo {
  nivelActual: number;
  rango: RangoMaestria;
  nombreRango: string;
  iconoRango: string;
  xpEnNivel: number;
  xpNecesariaNivel: number;
  porcentaje: number;
  xpParaSubir: number;
}

export interface ResultadoRegistroMision {
  xpTotal: number;
  rangoActual: RangoMaestria;
  misionesCompletadas: string[];
  nuevasInsignias: string[];
  huboSubidaNivel: boolean;
  nivelPrevio?: number;
  nivelNuevo?: number;
}
