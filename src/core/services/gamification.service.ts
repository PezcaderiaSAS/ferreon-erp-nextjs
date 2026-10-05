import {
  RangoMaestria,
  RangoConfig,
  InsigniaGamification,
  MisionAprendizaje,
  ProgresoGamificationState,
  ProgresoNivelInfo,
  ResultadoRegistroMision,
} from '@/core/types/gamification';

export * from '@/core/types/gamification';

/**
 * Configuración oficial de los 5 Rangos de Maestría en Alquileres System.
 */
export const RANGOS_MAESTRIA_CONFIG: RangoConfig[] = [
  {
    nivel: 1,
    rango: 'APRENDIZ_TALLER',
    nombre: 'Aprendiz de Taller',
    icono: '🛠️',
    xpMin: 0,
    xpMax: 200,
    colorClase: 'from-amber-600 to-amber-700 text-amber-100',
    descripcion: 'Iniciando el camino. Conociendo el taller y la navegación básica.',
  },
  {
    nivel: 2,
    rango: 'OPERADOR_BODEGA',
    nombre: 'Operador de Bodega',
    icono: '📦',
    xpMin: 201,
    xpMax: 500,
    colorClase: 'from-blue-600 to-indigo-700 text-blue-100',
    descripcion: 'Controlando el patio. Domina inventario, kardex y mantenimiento.',
  },
  {
    nivel: 3,
    rango: 'ASESOR_COMERCIAL',
    nombre: 'Asesor Comercial',
    icono: '💼',
    xpMin: 501,
    xpMax: 900,
    colorClase: 'from-purple-600 to-violet-700 text-purple-100',
    descripcion: 'Cerrando tratos. Cotizaciones rápidas en 30s y clientes al día.',
  },
  {
    nivel: 4,
    rango: 'MAESTRO_CONTRATOS',
    nombre: 'Maestro de Contratos',
    icono: '📜',
    xpMin: 901,
    xpMax: 1400,
    colorClase: 'from-emerald-600 to-teal-700 text-emerald-100',
    descripcion: 'Operativa impecable. Despachos, split-line y cuentas de cobro.',
  },
  {
    nivel: 5,
    rango: 'GERENTE_MAQUINARIA',
    nombre: 'Gerente de Maquinaria Pro',
    icono: '👑',
    xpMin: 1401,
    xpMax: 999999,
    colorClase: 'from-amber-500 to-yellow-600 text-yellow-950 font-bold',
    descripcion: 'Maestría total. Control financiero, gobernanza y rentabilidad.',
  },
];

/**
 * Catálogo canónico de insignias coleccionables de la Academia.
 */
export const CATALOGO_INSIGNIAS: InsigniaGamification[] = [
  {
    id: 'primeros-pasos',
    titulo: 'Primeros Pasos 👟',
    descripcion: 'Completaste tu primera misión o recorrido en la Academia.',
    icono: '👟',
    modulo: 'General',
    puntosXP: 50,
  },
  {
    id: 'explorador-flota',
    titulo: 'Explorador de Inventario 🚜',
    descripcion: 'Completaste los tours de Bodega y Alquileres de Maquinaria.',
    icono: '🚜',
    modulo: 'Bodega',
    puntosXP: 100,
  },
  {
    id: 'experto-caja',
    titulo: 'Guardián del Tesoro 💰',
    descripcion: 'Aprendiste cómo funciona la caja menor y el arqueo de billetes.',
    icono: '💰',
    modulo: 'Caja',
    puntosXP: 100,
  },
  {
    id: 'maestro-comercial',
    titulo: 'As Comercial ⚡',
    descripcion: 'Dominaste las cotizaciones rápidas y el envío por WhatsApp.',
    icono: '⚡',
    modulo: 'Cotizaciones',
    puntosXP: 100,
  },
  {
    id: 'revisor-auditor',
    titulo: 'Ojo de Águila 🦅',
    descripcion: 'Completaste al menos 5 misiones de aprendizaje en la plataforma.',
    icono: '🦅',
    modulo: 'General',
    puntosXP: 150,
  },
  {
    id: 'leyenda-maquinaria',
    titulo: 'Leyenda de Maquinaria 👑',
    descripcion: 'Alcanzaste el Rango 5: Gerente de Maquinaria Pro.',
    icono: '👑',
    modulo: 'General',
    puntosXP: 300,
  },
];

/**
 * Obtiene el rango de maestría correspondiente al puntaje de XP acumulado.
 */
export function calcularRangoMaestria(xp: number): RangoMaestria {
  const puntos = Math.max(0, xp);
  if (puntos <= 200) return 'APRENDIZ_TALLER';
  if (puntos <= 500) return 'OPERADOR_BODEGA';
  if (puntos <= 900) return 'ASESOR_COMERCIAL';
  if (puntos <= 1400) return 'MAESTRO_CONTRATOS';
  return 'GERENTE_MAQUINARIA';
}

/**
 * Obtiene el número de nivel (1 a 5) según el rango.
 */
export function obtenerNumeroNivel(rango: RangoMaestria): number {
  switch (rango) {
    case 'APRENDIZ_TALLER': return 1;
    case 'OPERADOR_BODEGA': return 2;
    case 'ASESOR_COMERCIAL': return 3;
    case 'MAESTRO_CONTRATOS': return 4;
    case 'GERENTE_MAQUINARIA': return 5;
    default: return 1;
  }
}

/**
 * Calcula el progreso porcentual y puntos restantes hacia el siguiente rango.
 */
export function calcularProgresoSiguienteNivel(xp: number): ProgresoNivelInfo {
  const puntos = Math.max(0, xp);
  const rango = calcularRangoMaestria(puntos);
  const nivelActual = obtenerNumeroNivel(rango);
  const config = RANGOS_MAESTRIA_CONFIG.find((c) => c.rango === rango) || RANGOS_MAESTRIA_CONFIG[0];

  if (nivelActual === 5) {
    return {
      nivelActual: 5,
      rango: 'GERENTE_MAQUINARIA',
      nombreRango: config.nombre,
      iconoRango: config.icono,
      xpEnNivel: puntos - 1400,
      xpNecesariaNivel: 0,
      porcentaje: 100,
      xpParaSubir: 0,
    };
  }

  // Límites del tramo actual
  let tramoMin = 0;
  let tramoMax = 200;

  if (nivelActual === 2) {
    tramoMin = 200;
    tramoMax = 500;
  } else if (nivelActual === 3) {
    tramoMin = 500;
    tramoMax = 900;
  } else if (nivelActual === 4) {
    tramoMin = 900;
    tramoMax = 1400;
  }

  const xpEnNivel = puntos - tramoMin;
  const xpNecesariaNivel = tramoMax - tramoMin;
  const porcentaje = Math.min(100, Math.max(0, Math.floor((xpEnNivel / xpNecesariaNivel) * 100)));
  const xpParaSubir = Math.max(0, (tramoMax + 1) - puntos);

  return {
    nivelActual,
    rango,
    nombreRango: config.nombre,
    iconoRango: config.icono,
    xpEnNivel,
    xpNecesariaNivel,
    porcentaje,
    xpParaSubir,
  };
}

/**
 * Evalúa las condiciones para desbloquear insignias que el usuario aún no posea.
 */
export function evaluarDesbloqueoInsignias(progreso: ProgresoGamificationState): string[] {
  const nuevasInsignias: string[] = [];
  const yaDesbloqueadas = new Set(progreso.insigniasDesbloqueadas);

  // 1. Primeros Pasos: Completar al menos 1 misión o tour
  if (!yaDesbloqueadas.has('primeros-pasos')) {
    if (progreso.misionesCompletadas.length >= 1 || progreso.toursCompletados.length >= 1) {
      nuevasInsignias.push('primeros-pasos');
    }
  }

  // 2. Explorador de Flota: Tours de bodega y alquileres
  if (!yaDesbloqueadas.has('explorador-flota')) {
    if (
      progreso.toursCompletados.includes('tour-bodega') &&
      progreso.toursCompletados.includes('tour-alquileres')
    ) {
      nuevasInsignias.push('explorador-flota');
    }
  }

  // 3. Experto en Caja: Tour de caja
  if (!yaDesbloqueadas.has('experto-caja')) {
    if (progreso.toursCompletados.includes('tour-caja')) {
      nuevasInsignias.push('experto-caja');
    }
  }

  // 4. As Comercial: Tour de cotizaciones
  if (!yaDesbloqueadas.has('maestro-comercial')) {
    if (progreso.toursCompletados.includes('tour-cotizaciones')) {
      nuevasInsignias.push('maestro-comercial');
    }
  }

  // 5. Ojo de Águila: 5 o más misiones completadas
  if (!yaDesbloqueadas.has('revisor-auditor')) {
    if (progreso.misionesCompletadas.length >= 5) {
      nuevasInsignias.push('revisor-auditor');
    }
  }

  // 6. Leyenda de Maquinaria: Nivel 5 alcanzado
  if (!yaDesbloqueadas.has('leyenda-maquinaria')) {
    if (progreso.xpTotal >= 1401) {
      nuevasInsignias.push('leyenda-maquinaria');
    }
  }

  return nuevasInsignias;
}

/**
 * Registra la finalización de una misión de forma idempotente (sin duplicar XP).
 */
export function registrarCompletitudMision(
  estado: ProgresoGamificationState,
  misionId: string,
  xpRecompensa: number
): ResultadoRegistroMision {
  // Prevenir duplicidad de puntos
  if (estado.misionesCompletadas.includes(misionId)) {
    return {
      xpTotal: estado.xpTotal,
      rangoActual: estado.rangoActual,
      misionesCompletadas: estado.misionesCompletadas,
      nuevasInsignias: [],
      huboSubidaNivel: false,
    };
  }

  const nuevoXp = estado.xpTotal + Math.max(0, xpRecompensa);
  const rangoPrevio = calcularRangoMaestria(estado.xpTotal);
  const rangoNuevo = calcularRangoMaestria(nuevoXp);
  const nivelPrevio = obtenerNumeroNivel(rangoPrevio);
  const nivelNuevo = obtenerNumeroNivel(rangoNuevo);
  const huboSubidaNivel = nivelNuevo > nivelPrevio;

  const misionesActualizadas = [...estado.misionesCompletadas, misionId];
  const estadoIntermedio: ProgresoGamificationState = {
    ...estado,
    xpTotal: nuevoXp,
    rangoActual: rangoNuevo,
    misionesCompletadas: misionesActualizadas,
  };

  const nuevasInsignias = evaluarDesbloqueoInsignias(estadoIntermedio);

  return {
    xpTotal: nuevoXp,
    rangoActual: rangoNuevo,
    misionesCompletadas: misionesActualizadas,
    nuevasInsignias,
    huboSubidaNivel,
    nivelPrevio,
    nivelNuevo,
  };
}
