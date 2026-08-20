import { Equipo } from '../../domain/entities/Equipo';
import { EquipoRepository } from '../../domain/repositories/EquipoRepository';

export class CrearEquipoUseCase {
  constructor(private readonly equipoRepository: EquipoRepository) {}

  async execute(dto: {
    sku: string;
    nombre: string;
    categoria: string;
    peso_kilos: number; // The UI sends kilos
  }): Promise<Equipo> {
    // Domain rule: convert Kilos to Grams strictly to BIGINT equivalent
    const peso_gramos = Math.round(dto.peso_kilos * 1000);

    return await this.equipoRepository.crear({
      sku: dto.sku,
      nombre: dto.nombre,
      categoria: dto.categoria,
      estado: 'Disponible',
      peso_gramos: peso_gramos,
    });
  }
}
