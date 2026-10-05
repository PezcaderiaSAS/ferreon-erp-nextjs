import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  RangoMaestria,
  ProgresoGamificationState,
  registrarCompletitudMision,
  evaluarDesbloqueoInsignias,
  calcularRangoMaestria,
  RANGOS_MAESTRIA_CONFIG,
  CATALOGO_INSIGNIAS,
} from '@/core/services/gamification.service';

export interface DetalleCelebracion {
  tipo: 'LEVEL_UP' | 'INSIGNIA' | 'MISION';
  titulo: string;
  mensaje: string;
  icono: string;
  puntosGanados?: number;
}

export interface GamificationState extends ProgresoGamificationState {
  // Estados de Interfaz
  isAcademiaModalOpen: boolean;
  isGuiaBotonesOpen: boolean;
  moduloFiltroGuia: string;
  celebracionActiva: boolean;
  detalleCelebracion: DetalleCelebracion | null;

  // Acciones de Gamificación
  completarMision: (misionId: string, xpRecompensa?: number) => void;
  completarTour: (tourId: string, xpRecompensa?: number) => void;
  desbloquearInsignia: (insigniaId: string) => void;
  setAcademiaModalOpen: (open: boolean) => void;
  setGuiaBotonesOpen: (open: boolean, modulo?: string) => void;
  cerrarCelebracion: () => void;
  resetProgreso: () => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Estado Inicial
      xpTotal: 0,
      rangoActual: 'APRENDIZ_TALLER',
      misionesCompletadas: [],
      toursCompletados: [],
      insigniasDesbloqueadas: [],

      isAcademiaModalOpen: false,
      isGuiaBotonesOpen: false,
      moduloFiltroGuia: 'Todos',
      celebracionActiva: false,
      detalleCelebracion: null,

      // Completar Misión con XP e Insignias
      completarMision: (misionId: string, xpRecompensa = 100) => {
        const state = get();
        if (state.misionesCompletadas.includes(misionId)) return;

        const resultado = registrarCompletitudMision(
          {
            xpTotal: state.xpTotal,
            rangoActual: state.rangoActual,
            misionesCompletadas: state.misionesCompletadas,
            toursCompletados: state.toursCompletados,
            insigniasDesbloqueadas: state.insigniasDesbloqueadas,
          },
          misionId,
          xpRecompensa
        );

        // Actualizar insignias desbloqueadas
        const nuevasInsigniasActualizadas = Array.from(
          new Set([...state.insigniasDesbloqueadas, ...resultado.nuevasInsignias])
        );

        // Determinar celebración
        let detalleCelebracion: DetalleCelebracion | null = null;
        if (resultado.huboSubidaNivel) {
          const configRango = RANGOS_MAESTRIA_CONFIG.find(
            (r) => r.rango === resultado.rangoActual
          );
          detalleCelebracion = {
            tipo: 'LEVEL_UP',
            titulo: `¡Subiste de Nivel! ${configRango?.icono || '⭐'}`,
            mensaje: `Has alcanzado el rango de ${configRango?.nombre || resultado.rangoActual}`,
            icono: configRango?.icono || '⭐',
            puntosGanados: xpRecompensa,
          };
        } else if (resultado.nuevasInsignias.length > 0) {
          const primerLogro = CATALOGO_INSIGNIAS.find(
            (i) => i.id === resultado.nuevasInsignias[0]
          );
          detalleCelebracion = {
            tipo: 'INSIGNIA',
            titulo: '¡Nueva Insignia Desbloqueada!',
            mensaje: primerLogro ? primerLogro.titulo : 'Completaste un hito de la Academia',
            icono: primerLogro ? primerLogro.icono : '🏅',
            puntosGanados: xpRecompensa,
          };
        } else {
          detalleCelebracion = {
            tipo: 'MISION',
            titulo: '¡Misión Cumplida! + ' + xpRecompensa + ' XP',
            mensaje: 'Sigue avanzando en tu aprendizaje para convertirte en Gerente de Maquinaria.',
            icono: '🎉',
            puntosGanados: xpRecompensa,
          };
        }

        set({
          xpTotal: resultado.xpTotal,
          rangoActual: resultado.rangoActual,
          misionesCompletadas: resultado.misionesCompletadas,
          insigniasDesbloqueadas: nuevasInsigniasActualizadas,
          celebracionActiva: true,
          detalleCelebracion,
        });
      },

      // Completar Tour Guiado
      completarTour: (tourId: string, xpRecompensa = 80) => {
        const state = get();
        if (state.toursCompletados.includes(tourId)) return;

        const nuevosTours = [...state.toursCompletados, tourId];
        const nuevoXp = state.xpTotal + Math.max(0, xpRecompensa);
        const nuevoRango = calcularRangoMaestria(nuevoXp);

        const estadoIntermedio: ProgresoGamificationState = {
          xpTotal: nuevoXp,
          rangoActual: nuevoRango,
          misionesCompletadas: state.misionesCompletadas,
          toursCompletados: nuevosTours,
          insigniasDesbloqueadas: state.insigniasDesbloqueadas,
        };

        const nuevasInsignias = evaluarDesbloqueoInsignias(estadoIntermedio);
        const todasInsignias = Array.from(
          new Set([...state.insigniasDesbloqueadas, ...nuevasInsignias])
        );

        set({
          xpTotal: nuevoXp,
          rangoActual: nuevoRango,
          toursCompletados: nuevosTours,
          insigniasDesbloqueadas: todasInsignias,
          celebracionActiva: true,
          detalleCelebracion: {
            tipo: 'MISION',
            titulo: '¡Recorrido Guiado Completado! 🚀',
            mensaje: `Ganaste +${xpRecompensa} XP por dominar este módulo.`,
            icono: '🎯',
            puntosGanados: xpRecompensa,
          },
        });
      },

      desbloquearInsignia: (insigniaId: string) => {
        const state = get();
        if (state.insigniasDesbloqueadas.includes(insigniaId)) return;

        const logro = CATALOGO_INSIGNIAS.find((i) => i.id === insigniaId);
        const xpAdicional = logro ? logro.puntosXP : 50;
        const nuevoXp = state.xpTotal + xpAdicional;
        const nuevoRango = calcularRangoMaestria(nuevoXp);

        set({
          xpTotal: nuevoXp,
          rangoActual: nuevoRango,
          insigniasDesbloqueadas: [...state.insigniasDesbloqueadas, insigniaId],
          celebracionActiva: true,
          detalleCelebracion: {
            tipo: 'INSIGNIA',
            titulo: '¡Insignia Coleccionada!',
            mensaje: logro ? `${logro.titulo}: ${logro.descripcion}` : 'Nuevo hito alcanzado',
            icono: logro ? logro.icono : '🏅',
            puntosGanados: xpAdicional,
          },
        });
      },

      setAcademiaModalOpen: (open: boolean) => set({ isAcademiaModalOpen: open }),

      setGuiaBotonesOpen: (open: boolean, modulo = 'Todos') =>
        set({ isGuiaBotonesOpen: open, moduloFiltroGuia: modulo }),

      cerrarCelebracion: () =>
        set({ celebracionActiva: false, detalleCelebracion: null }),

      resetProgreso: () =>
        set({
          xpTotal: 0,
          rangoActual: 'APRENDIZ_TALLER',
          misionesCompletadas: [],
          toursCompletados: [],
          insigniasDesbloqueadas: [],
          celebracionActiva: false,
          detalleCelebracion: null,
        }),
    }),
    {
      name: 'alquileres-gamification-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        xpTotal: state.xpTotal,
        rangoActual: state.rangoActual,
        misionesCompletadas: state.misionesCompletadas,
        toursCompletados: state.toursCompletados,
        insigniasDesbloqueadas: state.insigniasDesbloqueadas,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).__gamificationStore = useGamificationStore;
}

