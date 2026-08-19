import { AlquilerEntity } from "../../domain/entities/alquiler";
import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";
import { PesoGramos } from "../../domain/value-objects/peso-gramos";

export interface ItemEditarAlquilerDTO {
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  pesoKilos: number;
  diasContratados: number;
  fechaInicio: string;
  fechaFin?: string;
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
      const pesoGramos = PesoGramos.fromKilos(item.pesoKilos);
      const subtotalLinea = item.cantidad * item.tarifaAplicada * item.diasContratados;

      return {
        itemId: item.itemId,
        nombreItem: item.nombreItem,
        cantidad: item.cantidad,
        tarifaAplicada: item.tarifaAplicada,
        pesoGramos,
        diasContratados: item.diasContratados,
        subtotalLinea,
        costoDano: 0,
        devuelto: false,
        cantidadDevuelta: 0,
        fechaInicio: new Date(item.fechaInicio),
        fechaFin: item.fechaFin ? new Date(item.fechaFin) : undefined,
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
