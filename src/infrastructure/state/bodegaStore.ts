import { create } from 'zustand';
import { Equipo } from '../../core/domain/entities/Equipo';

interface BodegaState {
  equipos: Equipo[];
  agregarEquipo: (equipo: Equipo) => void;
  // Initialize with some mock data so the table isn't empty
}

export const useBodegaStore = create<BodegaState>((set) => ({
  equipos: [
    {
      id: '1',
      sku: 'EQ-001',
      nombre: 'Taladro Percutor 800W',
      categoria: 'Herramientas Eléctricas',
      estado: 'Disponible',
      peso_gramos: 2500,
      creado_en: new Date()
    },
    {
      id: '2',
      sku: 'EQ-002',
      nombre: 'Andamio Tubular 2x2m',
      categoria: 'Construcción',
      estado: 'En Alquiler',
      peso_gramos: 18000,
      creado_en: new Date()
    }
  ],
  agregarEquipo: (equipo) => set((state) => ({ equipos: [...state.equipos, equipo] })),
}));
