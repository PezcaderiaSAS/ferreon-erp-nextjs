import { useEffect } from 'react';
import { useTourStore } from '../infrastructure/state/tourStore';

/**
 * Hook para auto-iniciar un tour si el usuario no lo ha completado.
 * 
 * @param tourId - ID único del tour (ej. 'alquileres-core')
 * @param delay - Tiempo en ms antes de iniciar (útil para dejar cargar la UI)
 * @param forceMode - Si es true, el tour bloqueará botones de "Siguiente" forzando la interacción
 */
export function useAutoTour(tourId: string, delay: number = 800, forceMode: boolean = true) {
  const { toursCompleted, activeTour, startTour } = useTourStore();

  useEffect(() => {
    // Si ya completó el tour, o hay otro tour corriendo, no hacer nada
    if (toursCompleted[tourId] || activeTour) return;

    // Arrancar el tour tras un breve delay para permitir el montaje del DOM
    const timer = setTimeout(() => {
      // Doble check por seguridad en Strict Mode
      if (!useTourStore.getState().toursCompleted[tourId] && !useTourStore.getState().activeTour) {
        startTour(tourId, forceMode);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [tourId, delay, forceMode, toursCompleted, activeTour, startTour]);
}
