import { create } from 'zustand';
import { Equipo } from '../../core/domain/entities/equipo';

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
      tarifaDiaria: 45000,
      creado_en: new Date()
    },
    {
      id: '2',
      sku: 'EQ-002',
      nombre: 'Andamio Tubular 2x2m',
      categoria: 'Construcción',
      estado: 'En Alquiler',
      tarifaDiaria: 12000,
      creado_en: new Date()
    }
  ],
  agregarEquipo: (equipo) => set((state) => ({ equipos: [...state.equipos, equipo] })),
}));
