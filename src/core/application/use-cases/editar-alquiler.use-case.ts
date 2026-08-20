import { AlquilerEntity } from "../../domain/entities/alquiler";
import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";

export interface ItemEditarAlquilerDTO {
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

export interface EditarAlquilerDTO {
  alquilerId: string;
  fleteEntrega?: number;
  fleteRecogida?: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo?: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: ItemEditarAlquilerDTO[];
}

export class EditarAlquilerUseCase {
  constructor(private readonly alquilerRepo: IAlquilerRepository) {}

  async execute(dto: EditarAlquilerDTO): Promise<AlquilerEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error("Debe incluir al menos un ítem en el alquiler.");
    }

    const alquiler = await this.alquilerRepo.findById(dto.alquilerId);
    if (!alquiler) {
      throw new Error(`No se encontró el alquiler con ID ${dto.alquilerId}`);
    }

    const nuevosDetalles = dto.items.map((item) => {
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      
      const msDiff = end.getTime() - start.getTime();
      let diasEstimados = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (diasEstimados <= 0) diasEstimados = 1;

      const subtotalLineaEstimado = item.cantidad * item.tarifaAplicada * diasEstimados;

      return {
        itemId: item.itemId,
        nombreItem: item.nombreItem,
        cantidad: item.cantidad,
        tarifaAplicada: item.tarifaAplicada,
        fechaInicio: start,
        fechaFinEstimada: end,
        subtotalLineaEstimado,
        costoDano: 0,
        devuelto: false,
        cantidadDevuelta: 0,
      };
    });

    alquiler.actualizarContrato(
      nuevosDetalles,
      dto.fleteEntrega || 0,
      dto.fleteRecogida || 0,
      dto.deposito || 0,
      dto.garantiaMonto || 0,
      dto.garantiaTipo || 'Efectivo',
      dto.observaciones,
      dto.detallesLogistica
    );

    return await this.alquilerRepo.save(alquiler);
  }
}
