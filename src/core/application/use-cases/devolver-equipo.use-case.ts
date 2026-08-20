import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";
import { IEquipoRepository } from "../../domain/repositories/equipo-repository.interface";

export interface ItemDevolucionDTO {
  itemId: string;
  cantidadDevuelta: number;
  costoDano?: number;
  observacionDano?: string;
}

export interface RegistrarDevolucionDTO {
  alquilerId: string;
  fechaDevolucion: string;
  items: ItemDevolucionDTO[];
}

export class DevolverEquipoUseCase {
  constructor(
    private readonly alquilerRepo: IAlquilerRepository,
    private readonly equipoRepo: IEquipoRepository
  ) {}

  async execute(dto: RegistrarDevolucionDTO): Promise<void> {
    const alquiler = await this.alquilerRepo.findById(dto.alquilerId);
    if (!alquiler) {
      throw new Error(`El contrato de alquiler con ID '${dto.alquilerId}' no existe.`);
    }

    if (alquiler.estado === "FINALIZADO" || alquiler.estado === "CANCELADO") {
      throw new Error(`No se pueden registrar devoluciones en un contrato ${alquiler.estado}.`);
    }

    const devolucionDate = new Date(dto.fechaDevolucion);

    for (const itemDev of dto.items) {
      const detalle = alquiler.detalles.find((d) => d.itemId === itemDev.itemId);
      if (!detalle) {
        throw new Error(`El equipo con ID '${itemDev.itemId}' no pertenece a este contrato.`);
      }

      const devueltosActuales = detalle.cantidadDevuelta || 0;
      if (devueltosActuales + itemDev.cantidadDevuelta > detalle.cantidad) {
        throw new Error(
          `No se pueden devolver más unidades de las contratadas. Contratadas: ${detalle.cantidad}, Devueltas: ${devueltosActuales + itemDev.cantidadDevuelta}.`
        );
      }

      detalle.cantidadDevuelta = devueltosActuales + itemDev.cantidadDevuelta;
      if (detalle.cantidadDevuelta === detalle.cantidad) {
        detalle.devuelto = true;
      }
      
      // Calculate actual days elapsed between fechaInicio and fechaDevolucion
      const start = new Date(detalle.fechaInicio);
      const msDiff = devolucionDate.getTime() - start.getTime();
      let diasReales = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (diasReales <= 0) diasReales = 1;

      // Update actual return date
      detalle.fechaDevolucionReal = devolucionDate;

      // NOTE: In a full billing system, we would log the 'diasReales' and generate an invoice.
      // We could store the final calculated subtotal directly if needed.

      if (itemDev.costoDano && itemDev.costoDano > 0) {
        detalle.costoDano = (detalle.costoDano || 0) + itemDev.costoDano;
      }

      // Reingresar unidades al stock disponible en bodega
      const equipo = await this.equipoRepo.findById(itemDev.itemId);
      if (equipo) {
        equipo.devolver(itemDev.cantidadDevuelta);
        await this.equipoRepo.update(equipo);
      }
    }

    // Verificar si todos los ítems fueron devueltos
    const todosDevueltos = alquiler.detalles.every((d) => d.devuelto);
    if (todosDevueltos) {
      alquiler.finalizar();
    }

    await this.alquilerRepo.update(alquiler);
  }
}
