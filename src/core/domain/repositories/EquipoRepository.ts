import { Equipo } from '../entities/equipo';

export interface EquipoRepository {
  obtenerTodos(): Promise<Equipo[]>;
  crear(equipo: Omit<Equipo, 'id' | 'creado_en'>): Promise<Equipo>;
}
