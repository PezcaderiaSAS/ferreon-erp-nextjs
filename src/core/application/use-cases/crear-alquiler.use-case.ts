import { AlquilerEntity, AlquilerEstado } from "../../domain/entities/alquiler";
import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";

export interface ItemCrearAlquilerDTO {
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

export interface CrearAlquilerDTO {
  clienteId: string;
  clienteNombre?: string;
  fechaRegistro?: string; // Optional manual override of creation date
  estado?: AlquilerEstado;
  fleteEntrega?: number;
  fleteRecogida?: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo?: string;
  observaciones?: string;
  detallesLogistica?: string;
  creadoPor?: string;
  items: ItemCrearAlquilerDTO[];
}

export class CrearAlquilerUseCase {
  constructor(private readonly alquilerRepo: IAlquilerRepository) {}

  async execute(dto: CrearAlquilerDTO): Promise<AlquilerEntity> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error("Debe incluir al menos un ítem en el alquiler.");
    }

    const detalles = dto.items.map((item) => {
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      
      // Calculate estimated days, min 1 day
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

    const alquiler = new AlquilerEntity(
      undefined,
      undefined,
      dto.clienteId,
      dto.clienteNombre,
      dto.estado || 'ACTIVO',
      0,
      dto.fleteEntrega || 0,
      dto.fleteRecogida || 0,
      0,
      0,
      dto.deposito || 0,
      dto.garantiaMonto || 0,
      dto.garantiaTipo || 'Efectivo',
      'Activa',
      dto.observaciones,
      dto.detallesLogistica,
      dto.creadoPor,
      detalles,
      dto.fechaRegistro ? new Date(dto.fechaRegistro) : new Date()
    );

    return await this.alquilerRepo.save(alquiler);
  }
}
