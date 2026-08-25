import { Equipo } from '../../core/domain/entities/equipo';
import { EquipoRepository } from '../../core/domain/repositories/EquipoRepository';
import { useBodegaStore } from '../state/bodegaStore';
import { equipoToEquipoUI, equipoUIToEquipo } from '../../lib/mappers';

export class ZustandEquipoRepository implements EquipoRepository {
  async obtenerTodos(): Promise<Equipo[]> {
    return useBodegaStore.getState().equipos.map(equipoUIToEquipo);
  }

  async crear(equipo: Omit<Equipo, 'id' | 'creado_en'>): Promise<Equipo> {
    const nuevoEquipo: Equipo = {
      ...equipo,
      id: Math.random().toString(36).substr(2, 9),
      creado_en: new Date(),
    };
    
    useBodegaStore.getState().agregarEquipo(equipoToEquipoUI(nuevoEquipo));
    return nuevoEquipo;
  }
}
