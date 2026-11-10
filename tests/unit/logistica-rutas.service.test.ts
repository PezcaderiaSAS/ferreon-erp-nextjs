import { describe, it, expect } from 'vitest';
import {
  LogisticaRutasService,
  TipoVehiculoTransporte,
  ZonaFleteBucaramanga,
  ParadaRutaItem,
} from '@/core/services/logistica-rutas.service';

describe('LogisticaRutasService: Dominio de Fletes y Planificación de Rutas (Bucaramanga)', () => {
  // 1. ZONIFICACIÓN Y TARIFICACIÓN SUGERIDA
  describe('1. Matriz de Tarificación por Zonas del Área Metropolitana', () => {
    it('debe obtener la lista de zonas preconfiguradas del área metropolitana', () => {
      const zonas = LogisticaRutasService.obtenerZonasMetropolitanas();
      expect(zonas.length).toBeGreaterThanOrEqual(7);

      const municipios = new Set(zonas.map((z) => z.municipio));
      expect(municipios.has('Bucaramanga')).toBe(true);
      expect(municipios.has('Floridablanca')).toBe(true);
      expect(municipios.has('Girón')).toBe(true);
      expect(municipios.has('Piedecuesta')).toBe(true);
      expect(municipios.has('Lebrija')).toBe(true);
    });

    it('debe calcular la tarifa sugerida según zona y tipo de vehículo en enteros COP', () => {
      const zonaCanaveral: ZonaFleteBucaramanga = {
        id: 'zona-florida-canaveral',
        codigo: 'FLORIDA_CANAVERAL',
        nombre: 'Floridablanca - Cañaveral / El Bosque',
        municipio: 'Floridablanca',
        tarifaBaseMotocarro: 25000,
        tarifaBaseCamioneta: 50000,
        tarifaBaseTurbo: 95000,
        tiempoEstimadoMinutos: 40,
        activo: true,
      };

      const tarifaMoto = LogisticaRutasService.calcularTarifaSugerida(zonaCanaveral, TipoVehiculoTransporte.MOTOCARRO);
      const tarifaCamioneta = LogisticaRutasService.calcularTarifaSugerida(zonaCanaveral, TipoVehiculoTransporte.CAMIONETA);
      const tarifaTurbo = LogisticaRutasService.calcularTarifaSugerida(zonaCanaveral, TipoVehiculoTransporte.TURBO_NPR);

      expect(tarifaMoto).toBe(25000);
      expect(tarifaCamioneta).toBe(50000);
      expect(tarifaTurbo).toBe(95000);

      // Verificación de entero estricto COP
      expect(Math.trunc(tarifaMoto)).toBe(tarifaMoto);
      expect(Math.trunc(tarifaCamioneta)).toBe(tarifaCamioneta);
      expect(Math.trunc(tarifaTurbo)).toBe(tarifaTurbo);
    });

    it('debe retornar 0 si no se proporciona zona válida', () => {
      const tarifa = LogisticaRutasService.calcularTarifaSugerida(null as any, TipoVehiculoTransporte.CAMIONETA);
      expect(tarifa).toBe(0);
    });
  });

  // 2. RECOMENDACIÓN DE VEHÍCULO POR VOLUMEN Y PESO
  describe('2. Clasificación y Recomendación de Vehículo', () => {
    it('debe sugerir MOTOCARRO para herramientas ligeras y compactas (< 250 kg y < 1.0 m³)', () => {
      const vehiculo = LogisticaRutasService.recomendarVehiculo({
        pesoTotalKg: 45,
        volumenEstimadoM3: 0.3,
        requiereGruaOPluma: false,
      });

      expect(vehiculo).toBe(TipoVehiculoTransporte.MOTOCARRO);
    });

    it('debe sugerir CAMIONETA para equipos medianos (hasta 1,200 kg o hasta 3.5 m³)', () => {
      const vehiculoPorPeso = LogisticaRutasService.recomendarVehiculo({
        pesoTotalKg: 650,
        volumenEstimadoM3: 1.5,
        requiereGruaOPluma: false,
      });

      const vehiculoPorVolumen = LogisticaRutasService.recomendarVehiculo({
        pesoTotalKg: 200,
        volumenEstimadoM3: 2.2,
        requiereGruaOPluma: false,
      });

      expect(vehiculoPorPeso).toBe(TipoVehiculoTransporte.CAMIONETA);
      expect(vehiculoPorVolumen).toBe(TipoVehiculoTransporte.CAMIONETA);
    });

    it('debe sugerir TURBO_NPR para cargas pesadas (> 1,200 kg o > 3.5 m³ o con grúa requerida)', () => {
      const vehiculoPesado = LogisticaRutasService.recomendarVehiculo({
        pesoTotalKg: 2500,
        volumenEstimadoM3: 4.5,
        requiereGruaOPluma: false,
      });

      const vehiculoEspecial = LogisticaRutasService.recomendarVehiculo({
        pesoTotalKg: 300,
        volumenEstimadoM3: 1.0,
        requiereGruaOPluma: true,
      });

      expect(vehiculoPesado).toBe(TipoVehiculoTransporte.TURBO_NPR);
      expect(vehiculoEspecial).toBe(TipoVehiculoTransporte.TURBO_NPR);
    });
  });

  // 3. SECUENCIACIÓN Y REORDENAMIENTO DE PARADAS
  describe('3. Secuenciación y Optimización de Paradas de Transporte', () => {
    it('debe ordenar secuencialmente las paradas manteniendo índice 1..N sin huecos', () => {
      const paradasDesordenadas: Partial<ParadaRutaItem>[] = [
        { id: 'p3', ordenSecuencia: 5, direccionObra: 'Cra 33 # 48-10, Bucaramanga' },
        { id: 'p1', ordenSecuencia: 1, direccionObra: 'Autopista Floridablanca # 112' },
        { id: 'p2', ordenSecuencia: 8, direccionObra: 'Zona Industrial Chimitá Bodega 4' },
      ];

      const ordenadas = LogisticaRutasService.normalizarSecuenciaParadas(paradasDesordenadas as ParadaRutaItem[]);

      expect(ordenadas.length).toBe(3);
      expect(ordenadas[0].id).toBe('p1');
      expect(ordenadas[0].ordenSecuencia).toBe(1);

      expect(ordenadas[1].id).toBe('p3');
      expect(ordenadas[1].ordenSecuencia).toBe(2);

      expect(ordenadas[2].id).toBe('p2');
      expect(ordenadas[2].ordenSecuencia).toBe(3);
    });

    it('debe mover una parada a una nueva posición y reindexar el resto limpiamente', () => {
      const paradas: Partial<ParadaRutaItem>[] = [
        { id: 'p1', ordenSecuencia: 1 },
        { id: 'p2', ordenSecuencia: 2 },
        { id: 'p3', ordenSecuencia: 3 },
        { id: 'p4', ordenSecuencia: 4 },
      ];

      // Mover 'p4' al primer puesto (orden 1)
      const reordenadas = LogisticaRutasService.moverParada(paradas as ParadaRutaItem[], 'p4', 1);

      expect(reordenadas.map((p) => p.id)).toEqual(['p4', 'p1', 'p2', 'p3']);
      expect(reordenadas.map((p) => p.ordenSecuencia)).toEqual([1, 2, 3, 4]);
    });
  });

  // 4. CÁLCULO DE PROGRESO Y MÉTRICAS DE RUTA
  describe('4. Métricas de Avance de Hoja de Ruta', () => {
    it('debe calcular el progreso porcentual y conteo de estados de las paradas', () => {
      const paradas: Partial<ParadaRutaItem>[] = [
        { id: 'p1', estadoParada: 'COMPLETADA' },
        { id: 'p2', estadoParada: 'COMPLETADA' },
        { id: 'p3', estadoParada: 'EN_SITIO' },
        { id: 'p4', estadoParada: 'PENDIENTE' },
      ];

      const progreso = LogisticaRutasService.calcularProgresoRuta(paradas as ParadaRutaItem[]);

      expect(progreso.totalParadas).toBe(4);
      expect(progreso.completadas).toBe(2);
      expect(progreso.enSitio).toBe(1);
      expect(progreso.pendientes).toBe(1);
      expect(progreso.fallidas).toBe(0);
      expect(progreso.porcentajeAvance).toBe(50); // 2 de 4 = 50%
      expect(progreso.estaCompletada).toBe(false);
    });

    it('debe reportar 100% de avance cuando todas las paradas son completadas o fallidas', () => {
      const paradas: Partial<ParadaRutaItem>[] = [
        { id: 'p1', estadoParada: 'COMPLETADA' },
        { id: 'p2', estadoParada: 'COMPLETADA' },
        { id: 'p3', estadoParada: 'FALLIDA' }, // Intento fallido por cliente ausente
      ];

      const progreso = LogisticaRutasService.calcularProgresoRuta(paradas as ParadaRutaItem[]);

      expect(progreso.totalParadas).toBe(3);
      expect(progreso.completadas).toBe(2);
      expect(progreso.fallidas).toBe(1);
      expect(progreso.porcentajeAvance).toBe(100);
      expect(progreso.estaCompletada).toBe(true);
    });

    it('debe manejar rutas vacías retornando 0%', () => {
      const progreso = LogisticaRutasService.calcularProgresoRuta([]);
      expect(progreso.totalParadas).toBe(0);
      expect(progreso.porcentajeAvance).toBe(0);
      expect(progreso.estaCompletada).toBe(false);
    });
  });

  // 5. VALIDACIONES DEFENSIVAS DE EVIDENCIA EN OBRA
  describe('5. Validaciones de Evidencia Fotográfica y GPS', () => {
    it('debe validar coordenadas válidas para el Área Metropolitana de Bucaramanga', () => {
      // Coordenadas aproximadas de Bucaramanga: Lat ~6.9 a 7.3, Lng ~-73.3 a -73.0
      expect(LogisticaRutasService.esCoordenadaBucaramangaValida(7.1193, -73.1227)).toBe(true); // Bucaramanga centro
      expect(LogisticaRutasService.esCoordenadaBucaramangaValida(7.0622, -73.0864)).toBe(true); // Floridablanca
      expect(LogisticaRutasService.esCoordenadaBucaramangaValida(7.0682, -73.1698)).toBe(true); // Girón

      // Fuera del departamento / país
      expect(LogisticaRutasService.esCoordenadaBucaramangaValida(4.7110, -74.0721)).toBe(false); // Bogotá
      expect(LogisticaRutasService.esCoordenadaBucaramangaValida(0, 0)).toBe(false);
    });

    it('debe formatear el enlace a Google Maps a partir de coordenadas GPS', () => {
      const url = LogisticaRutasService.generarGoogleMapsUrl(7.1193, -73.1227);
      expect(url).toBe('https://www.google.com/maps/search/?api=1&query=7.1193,-73.1227');
    });
  });
});
