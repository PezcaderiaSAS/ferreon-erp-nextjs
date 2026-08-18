import { EquipoEntity } from "../entities/equipo";

export interface IEquipoRepository {
  findById(id: string): Promise<EquipoEntity | null>;
  findByCodigo(codigo: string): Promise<EquipoEntity | null>;
  findAll(): Promise<EquipoEntity[]>;
  save(equipo: EquipoEntity): Promise<EquipoEntity>;
  saveBulk(equipos: EquipoEntity[]): Promise<EquipoEntity[]>;
  update(equipo: EquipoEntity): Promise<EquipoEntity>;
  delete(id: string): Promise<boolean>;
}
