import { AlquilerEntity } from "../entities/alquiler";

export interface IAlquilerRepository {
  findById(id: string): Promise<AlquilerEntity | null>;
  findActivos(): Promise<AlquilerEntity[]>;
  save(alquiler: AlquilerEntity): Promise<AlquilerEntity>;
  updateEstado(id: string, estado: string): Promise<void>;
}
