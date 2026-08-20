import { Equipo } from '../../../domain/entities/equipo';
import { EquipoRepository } from '../../../domain/repositories/EquipoRepository';

export class CrearEquipoUseCase {
  constructor(private readonly equipoRepository: EquipoRepository) {}

  async execute(dto: {
    sku: string;
    nombre: string;
    categoria: string;
  }): Promise<Equipo> {

    return await this.equipoRepository.crear({
      sku: dto.sku,
      nombre: dto.nombre,
      categoria: dto.categoria,
      tarifaDiaria: 45000,
      estado: 'Disponible'
    });
  }
}
