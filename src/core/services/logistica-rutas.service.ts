/**
 * ============================================================================
 * SERVICIO DE DOMINIO PURO: Logística de Rutas y Matriz de Fletes
 * Región: Bucaramanga y Área Metropolitana (Floridablanca, Girón, Piedecuesta, Lebrija)
 * Arquitectura: Dominio Puro sin efectos secundarios (TDD Certified)
 * ============================================================================
 */

export enum TipoVehiculoTransporte {
  MOTOCARRO = 'MOTOCARRO',
  CAMIONETA = 'CAMIONETA',
  TURBO_NPR = 'TURBO_NPR',
}

export type EstadoParadaTransporte = 'PENDIENTE' | 'EN_SITIO' | 'COMPLETADA' | 'FALLIDA';

export type TipoParadaTransporte = 'ENTREGA_DESPACHO' | 'RECOGIDA_DEVOLUCION';

export interface ZonaFleteBucaramanga {
  id: string;
  codigo: string;
  nombre: string;
  municipio: 'Bucaramanga' | 'Floridablanca' | 'Girón' | 'Piedecuesta' | 'Lebrija';
  tarifaBaseMotocarro: number;
  tarifaBaseCamioneta: number;
  tarifaBaseTurbo: number;
  tiempoEstimadoMinutos: number;
  activo: boolean;
}

export interface ParadaRutaItem {
  id: string;
  rutaId?: string;
  alquilerId?: number;
  clienteId?: number;
  tipoParada?: TipoParadaTransporte;
  ordenSecuencia: number;
  direccionObra?: string;
  zonaId?: string;
  estadoParada: EstadoParadaTransporte;
  horaLlegadaEstimada?: string;
  horaCompletada?: string;
  receptorNombre?: string;
  receptorTelefono?: string;
  observaciones?: string;
  evidenciaFotos?: string[];
  latitud?: number;
  longitud?: number;
}

export interface ParametrosCargaVehiculo {
  pesoTotalKg: number;
  volumenEstimadoM3: number;
  requiereGruaOPluma?: boolean;
}

export interface ProgresoRuta {
  totalParadas: number;
  completadas: number;
  enSitio: number;
  pendientes: number;
  fallidas: number;
  porcentajeAvance: number;
  estaCompletada: boolean;
}

export const ZONAS_METROPOLITANAS_CANONICAS: ZonaFleteBucaramanga[] = [
  {
    id: 'zona-bga-centro-norte',
    codigo: 'BGA_CENTRO_NORTE',
    nombre: 'Bucaramanga - Centro / San Francisco / Norte',
    municipio: 'Bucaramanga',
    tarifaBaseMotocarro: 20000,
    tarifaBaseCamioneta: 40000,
    tarifaBaseTurbo: 80000,
    tiempoEstimadoMinutos: 35,
    activo: true,
  },
  {
    id: 'zona-bga-cabecera-sur',
    codigo: 'BGA_CABECERA_SUR',
    nombre: 'Bucaramanga - Cabecera / Sotomayor / Provenza / Real de Minas',
    municipio: 'Bucaramanga',
    tarifaBaseMotocarro: 22000,
    tarifaBaseCamioneta: 45000,
    tarifaBaseTurbo: 85000,
    tiempoEstimadoMinutos: 40,
    activo: true,
  },
  {
    id: 'zona-florida-canaveral',
    codigo: 'FLORIDA_CANAVERAL',
    nombre: 'Floridablanca - Cañaveral / El Bosque / Casco Antiguo',
    municipio: 'Floridablanca',
    tarifaBaseMotocarro: 25000,
    tarifaBaseCamioneta: 50000,
    tarifaBaseTurbo: 95000,
    tiempoEstimadoMinutos: 45,
    activo: true,
  },
  {
    id: 'zona-florida-ruitoque',
    codigo: 'FLORIDA_RUITOQUE',
    nombre: 'Floridablanca - Ruitoque Condominio / Mesa de Ruitoque',
    municipio: 'Floridablanca',
    tarifaBaseMotocarro: 35000,
    tarifaBaseCamioneta: 70000,
    tarifaBaseTurbo: 130000,
    tiempoEstimadoMinutos: 60,
    activo: true,
  },
  {
    id: 'zona-giron-chimita',
    codigo: 'GIRON_CHIMITA',
    nombre: 'Girón - Zona Industrial Chimitá / Río Frío',
    municipio: 'Girón',
    tarifaBaseMotocarro: 25000,
    tarifaBaseCamioneta: 50000,
    tarifaBaseTurbo: 95000,
    tiempoEstimadoMinutos: 40,
    activo: true,
  },
  {
    id: 'zona-giron-poblado',
    codigo: 'GIRON_POBLADO',
    nombre: 'Girón - El Poblado / Casco Histórico / Rincón de Girón',
    municipio: 'Girón',
    tarifaBaseMotocarro: 28000,
    tarifaBaseCamioneta: 55000,
    tarifaBaseTurbo: 105000,
    tiempoEstimadoMinutos: 50,
    activo: true,
  },
  {
    id: 'zona-pda-guatiguara',
    codigo: 'PIEDECUESTA_GUATIGUARA',
    nombre: 'Piedecuesta - Guatiguará / Casco Urbano / San Telmo',
    municipio: 'Piedecuesta',
    tarifaBaseMotocarro: 35000,
    tarifaBaseCamioneta: 70000,
    tarifaBaseTurbo: 130000,
    tiempoEstimadoMinutos: 60,
    activo: true,
  },
  {
    id: 'zona-lebrija-palonegro',
    codigo: 'LEBRIJA_PALONEGRO',
    nombre: 'Lebrija - Aeropuerto Palonegro / Casco Urbano',
    municipio: 'Lebrija',
    tarifaBaseMotocarro: 40000,
    tarifaBaseCamioneta: 85000,
    tarifaBaseTurbo: 160000,
    tiempoEstimadoMinutos: 75,
    activo: true,
  },
];

export class LogisticaRutasService {
  /**
   * Retorna el catálogo canónico de zonas de flete del Área Metropolitana de Bucaramanga.
   */
  public static obtenerZonasMetropolitanas(): ZonaFleteBucaramanga[] {
    return [...ZONAS_METROPOLITANAS_CANONICAS];
  }

  /**
   * Calcula la tarifa sugerida en pesos colombianos (COP) según la zona y el vehículo.
   * Retorna un entero exacto (TRUNC) en COP.
   */
  public static calcularTarifaSugerida(
    zona: ZonaFleteBucaramanga | null | undefined,
    vehiculo: TipoVehiculoTransporte
  ): number {
    if (!zona) return 0;

    let tarifa = 0;
    switch (vehiculo) {
      case TipoVehiculoTransporte.MOTOCARRO:
        tarifa = zona.tarifaBaseMotocarro;
        break;
      case TipoVehiculoTransporte.CAMIONETA:
        tarifa = zona.tarifaBaseCamioneta;
        break;
      case TipoVehiculoTransporte.TURBO_NPR:
        tarifa = zona.tarifaBaseTurbo;
        break;
      default:
        tarifa = zona.tarifaBaseCamioneta;
    }

    return Math.trunc(tarifa);
  }

  /**
   * Clasifica y recomienda el tipo de vehículo ideal según el volumen, peso y requerimientos de grúa.
   */
  public static recomendarVehiculo(params: ParametrosCargaVehiculo): TipoVehiculoTransporte {
    const { pesoTotalKg, volumenEstimadoM3, requiereGruaOPluma } = params;

    // Regla 1: Si requiere grúa o supera 1,200 kg o 3.5 m³, se asigna camión Turbo NPR
    if (requiereGruaOPluma || pesoTotalKg > 1200 || volumenEstimadoM3 > 3.5) {
      return TipoVehiculoTransporte.TURBO_NPR;
    }

    // Regla 2: Si es una carga ligera (< 250 kg y < 1.0 m³), se sugiere motocarro
    if (pesoTotalKg < 250 && volumenEstimadoM3 < 1.0) {
      return TipoVehiculoTransporte.MOTOCARRO;
    }

    // Regla 3: En el rango medio, se sugiere camioneta estacas / platón
    return TipoVehiculoTransporte.CAMIONETA;
  }

  /**
   * Normaliza el orden secuencial de paradas de 1 a N sin discontinuidades.
   */
  public static normalizarSecuenciaParadas(paradas: ParadaRutaItem[]): ParadaRutaItem[] {
    const clon = [...paradas].sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
    return clon.map((p, index) => ({
      ...p,
      ordenSecuencia: index + 1,
    }));
  }

  /**
   * Mueve una parada específica a un índice objetivo y renumera las demás paradas secuencialmente.
   */
  public static moverParada(
    paradas: ParadaRutaItem[],
    paradaId: string,
    nuevoOrden: number
  ): ParadaRutaItem[] {
    const ordenadas = [...paradas].sort((a, b) => a.ordenSecuencia - b.ordenSecuencia);
    const indexActual = ordenadas.findIndex((p) => p.id === paradaId);
    if (indexActual === -1) return ordenadas;

    const [paradaAMover] = ordenadas.splice(indexActual, 1);
    const indexDestino = Math.max(0, Math.min(nuevoOrden - 1, ordenadas.length));
    ordenadas.splice(indexDestino, 0, paradaAMover);

    return ordenadas.map((p, index) => ({
      ...p,
      ordenSecuencia: index + 1,
    }));
  }

  /**
   * Calcula métricas de avance y conteos de estado para una hoja de ruta de transporte.
   */
  public static calcularProgresoRuta(paradas: ParadaRutaItem[]): ProgresoRuta {
    const total = paradas.length;
    if (total === 0) {
      return {
        totalParadas: 0,
        completadas: 0,
        enSitio: 0,
        pendientes: 0,
        fallidas: 0,
        porcentajeAvance: 0,
        estaCompletada: false,
      };
    }

    let completadas = 0;
    let enSitio = 0;
    let pendientes = 0;
    let fallidas = 0;

    for (const p of paradas) {
      switch (p.estadoParada) {
        case 'COMPLETADA':
          completadas++;
          break;
        case 'EN_SITIO':
          enSitio++;
          break;
        case 'FALLIDA':
          fallidas++;
          break;
        case 'PENDIENTE':
        default:
          pendientes++;
          break;
      }
    }

    const resueltas = completadas + fallidas;
    const porcentaje = Math.round((resueltas / total) * 100);

    return {
      totalParadas: total,
      completadas,
      enSitio,
      pendientes,
      fallidas,
      porcentajeAvance: porcentaje,
      estaCompletada: resueltas === total,
    };
  }

  /**
   * Valida si unas coordenadas GPS corresponden al bounding box del Área Metropolitana de Bucaramanga.
   * Latitud: 6.90 a 7.35 | Longitud: -73.35 a -73.00
   */
  public static esCoordenadaBucaramangaValida(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;

    const latValida = lat >= 6.9 && lat <= 7.35;
    const lngValida = lng >= -73.35 && lng <= -73.0;

    return latValida && lngValida;
  }

  /**
   * Genera el enlace oficial a Google Maps para navegación hacia las coordenadas de obra.
   */
  public static generarGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
}
