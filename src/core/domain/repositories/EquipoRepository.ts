import { Equipo } from '../entities/Equipo';

export interface EquipoRepository {
  obtenerTodos(): Promise<Equipo[]>;
  crear(equipo: Omit<Equipo, 'id' | 'creado_en'>): Promise<Equipo>;
}
