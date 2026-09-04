import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TourState {
  toursCompleted: Record<string, boolean>;
  activeTour: string | null;
  currentStep: number;
  isForceMode: boolean;
  
  // Acciones
  startTour: (tourId: string, forceMode?: boolean) => void;
  nextStep: () => void;
  completeTour: () => void;
  skipTour: () => void;
  setForceMode: (isForced: boolean) => void;
  resetTours: () => void; // Utilidad para desarrollo o QA
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      toursCompleted: {},
      activeTour: null,
      currentStep: 0,
      isForceMode: true, // Por defecto asumimos Onboarding Forzado

      startTour: (tourId: string, forceMode = true) => set((state) => {
        // Prevenir re-iniciar si ya está activo el mismo
        if (state.activeTour === tourId) return state;
        
        return {
          activeTour: tourId,
          currentStep: 0,
          isForceMode: forceMode
        };
      }),

      nextStep: () => set((state) => ({
        currentStep: state.currentStep + 1
      })),

      completeTour: () => set((state) => {
        if (!state.activeTour) return state;
        
        return {
          toursCompleted: {
            ...state.toursCompleted,
            [state.activeTour]: true
          },
          activeTour: null,
          currentStep: 0
        };
      }),

      skipTour: () => set((state) => {
        if (!state.activeTour) return state;
        
        // Si el tour se salta por soft-lock o escape de emergencia,
        // decidimos marcarlo como completado para no molestar infinitamente,
        // o podríamos dejarlo en false. Por robustez, lo marcamos true.
        return {
          toursCompleted: {
            ...state.toursCompleted,
            [state.activeTour]: true
          },
          activeTour: null,
          currentStep: 0
        };
      }),

      setForceMode: (isForced: boolean) => set({ isForceMode: isForced }),
      
      resetTours: () => set({ toursCompleted: {}, activeTour: null, currentStep: 0 })
    }),
    {
      name: 'ferreon-tour-storage', // Nombre de la key en localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ toursCompleted: state.toursCompleted }), // Solo persistir el historial
    }
  )
);
