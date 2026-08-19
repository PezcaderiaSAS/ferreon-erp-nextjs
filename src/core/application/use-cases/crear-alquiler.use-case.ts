import { AlquilerEntity, AlquilerEstado } from "../../domain/entities/alquiler";
import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";
import { PesoGramos } from "../../domain/value-objects/peso-gramos";

export interface ItemCrearAlquilerDTO {
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  pesoKilos: number;
  diasContratados: number;
  fechaInicio: string;
  fechaFin?: string;
}

export interface CrearAlquilerDTO {
  clienteId: string;
  clienteNombre?: string;
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
      detalles
    );

    return await this.alquilerRepo.save(alquiler);
  }
}
