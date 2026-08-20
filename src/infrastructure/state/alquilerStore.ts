import { create } from 'zustand';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';

interface AlquilerStore {
  alquileres: AlquilerEntity[];
  setAlquileres: (alquileres: AlquilerEntity[]) => void;
  addAlquiler: (alquiler: AlquilerEntity) => void;
  updateAlquiler: (alquiler: AlquilerEntity) => void;
  removeAlquiler: (id: string) => void;
}

// Datos iniciales de prueba para mostrar en la tabla (como estaban en el page.tsx original)
const ALQUILERES_INICIALES: AlquilerEntity[] = [];

export const useAlquilerStore = create<AlquilerStore>((set) => ({
  alquileres: ALQUILERES_INICIALES,
  setAlquileres: (alquileres) => set({ alquileres }),
  addAlquiler: (alquiler) => set((state) => ({ alquileres: [...state.alquileres, alquiler] })),
  updateAlquiler: (alquiler) => set((state) => ({
    alquileres: state.alquileres.map((a) => a.id === alquiler.id ? alquiler : a)
  })),
  removeAlquiler: (id) => set((state) => ({
    alquileres: state.alquileres.filter((a) => a.id !== id)
  }))
}));
