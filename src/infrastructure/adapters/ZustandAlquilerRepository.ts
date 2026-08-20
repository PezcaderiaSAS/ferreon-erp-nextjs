import { IAlquilerRepository } from "../../core/domain/repositories/alquiler-repository.interface";
import { AlquilerEntity, AlquilerEstado } from "../../core/domain/entities/alquiler";
import { useAlquilerStore } from "../state/alquilerStore";

export class ZustandAlquilerRepository implements IAlquilerRepository {
  async save(alquiler: AlquilerEntity): Promise<AlquilerEntity> {
    const { alquileres, addAlquiler } = useAlquilerStore.getState();
    
    // We cannot reassign read-only properties directly on the class if they are declared readonly.
    // However, for this mock implementation, we'll bypass it with casting since we're just creating IDs.
    const alq = alquiler as any;
    if (!alq.id) {
      alq.id = `ALQ-${Math.floor(1000 + Math.random() * 9000)}`;
      alq.consecutivo = Math.floor(1000 + Math.random() * 9000);
      alq.createdAt = new Date();
    }
    
    addAlquiler(alquiler);
    return alquiler;
  }

  async update(alquiler: AlquilerEntity): Promise<AlquilerEntity> {
    const { updateAlquiler } = useAlquilerStore.getState();
    alquiler.updatedAt = new Date();
    updateAlquiler(alquiler);
    return alquiler;
  }

  async findById(id: string): Promise<AlquilerEntity | null> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres.find(a => a.id === id) || null;
  }

  async findByConsecutivo(consecutivo: number): Promise<AlquilerEntity | null> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres.find(a => a.consecutivo === consecutivo) || null;
  }

  async findByClienteId(clienteId: string): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres.filter(a => a.clienteId === clienteId);
  }

  async findAll(): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres;
  }

  async findActivos(): Promise<AlquilerEntity[]> {
    const { alquileres } = useAlquilerStore.getState();
    return alquileres.filter(a => a.estado === 'ACTIVO');
  }

  async updateEstado(id: string, estado: string): Promise<void> {
    const { alquileres, updateAlquiler } = useAlquilerStore.getState();
    const alq = alquileres.find(a => a.id === id);
    if (alq) {
      alq.estado = estado as AlquilerEstado;
      alq.updatedAt = new Date();
      updateAlquiler(alq);
    }
  }

  async delete(id: string): Promise<void> {
    const { removeAlquiler } = useAlquilerStore.getState();
    removeAlquiler(id);
  }
}
