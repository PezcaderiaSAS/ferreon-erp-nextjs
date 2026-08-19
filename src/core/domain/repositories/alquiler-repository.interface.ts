import { AlquilerEntity } from "../entities/alquiler";

export interface IAlquilerRepository {
  findById(id: string): Promise<AlquilerEntity | null>;
  findByConsecutivo(consecutivo: number): Promise<AlquilerEntity | null>;
  findByClienteId(clienteId: string): Promise<AlquilerEntity[]>;
  findAll(): Promise<AlquilerEntity[]>;
  findActivos(): Promise<AlquilerEntity[]>;
  save(alquiler: AlquilerEntity): Promise<AlquilerEntity>;
  update(alquiler: AlquilerEntity): Promise<AlquilerEntity>;
  updateEstado(id: string, estado: string): Promise<void>;
}
