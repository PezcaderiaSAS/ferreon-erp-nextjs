import { IAlquilerRepository } from "../../core/domain/repositories/alquiler-repository.interface";
import { AlquilerEntity, AlquilerEstado } from "../../core/domain/entities/alquiler";
import { useAlquilerStore } from "../state/alquilerStore";
import { alquilerEntityToAlquilerUI, alquilerUIToAlquilerEntity } from "../../lib/mappers";

export class ZustandAlquilerRepository implements IAlquilerRepository {
  async save(alquiler: AlquilerEntity): Promise<AlquilerEntity> {
    const { addAlquiler } = useAlquilerStore.getState();
    
    const alq = alquiler as any;
    if (!alq.id) {
      alq.id = `ALQ-${Math.floor(1000 + Math.random() * 9000)}`;
      alq.consecutivo = Math.floor(1000 + Math.random() * 9000);
      alq.createdAt = new Date();
    }
    
    addAlquiler(alquilerEntityToAlquilerUI(alquiler));
    return alquiler;
  }

  async update(alquiler: AlquilerEntity): Promise<AlquilerEntity> {
    const { updateAlquiler } = useAlquilerStore.getState();
    (alquiler as any).updatedAt = new Date();
    updateAlquiler(alquilerEntityToAlquilerUI(alquiler));
    return alquiler;
  }

  async findById(id: string): Promise<AlquilerEntity | null> {
    const { alquileres } = useAlquilerStore.getState();
    const found = alquileres.find(a => a.id === id);
    return found ? alquilerUIToAlquilerEntity(found) : null;
  }

  async findByConsecutivo(consecutivo: number): Promise<AlquilerEntity | null> {
    const { alquileres } = useAlquilerStore.getState();
    const found = alquileres.find(a => a.consecutivo === consecutivo);
    return found ? alquilerUIToAlquilerEntity(found) : null;
  }

  async findByClienteId(clienteId: string): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres
      .filter(a => String(a.cliente_id) === clienteId)
      .map(alquilerUIToAlquilerEntity);
  }

  async findAll(): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres.map(alquilerUIToAlquilerEntity);
  }

  async findActivos(): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres
      .filter(a => a.estado === 'ACTIVO')
      .map(alquilerUIToAlquilerEntity);
  }

  async updateEstado(id: string, estado: string): Promise<void> {
    const { alquileres, updateAlquiler } = useAlquilerStore.getState();
    const alq = alquileres.find(a => a.id === id);
    if (alq) {
      const updated = { ...alq, estado: estado as AlquilerEstado };
      updateAlquiler(updated);
    }
  }

  async delete(id: string): Promise<void> {
    const { eliminarAlquiler } = useAlquilerStore.getState();
    await eliminarAlquiler(id);
  }
}
