import { AlquilerEntity } from "../../domain/entities/alquiler";
import { IAlquilerRepository } from "../../domain/repositories/alquiler-repository.interface";
import { PesoGramos } from "../../domain/value-objects/peso-gramos";

export interface CrearAlquilerDTO {
  clienteId: string;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo?: string;
  observaciones?: string;
  creadoPor?: string;
  items: Array<{
    itemId: string;
    cantidad: number;
    tarifaAplicada: number;
    pesoKilos: number;
    diasContratados: number;
    fechaInicio: string;
  }>;
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
        cantidad: item.cantidad,
        tarifaAplicada: item.tarifaAplicada,
        pesoGramos,
        subtotalLinea,
        costoDano: 0,
        fechaInicio: new Date(item.fechaInicio),
      };
    });

    const alquiler = new AlquilerEntity(
      undefined,
      undefined,
      dto.clienteId,
      'ACTIVO',
      0,
      0,
      dto.deposito || 0,
      dto.garantiaMonto || 0,
      dto.garantiaTipo || 'Efectivo',
      'Activa',
      dto.observaciones,
      dto.creadoPor,
      detalles
    );

    alquiler.calcularTotales();
    return await this.alquilerRepo.save(alquiler);
  }
}
