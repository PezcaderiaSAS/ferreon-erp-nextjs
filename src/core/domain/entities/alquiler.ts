import { PesoGramos } from "../value-objects/peso-gramos";
import { BaseAuditableEntity } from "./base-auditable.entity";

export type AlquilerEstado = 'COTIZACION' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';

export interface ItemAlquilerDetalle {
  id?: string;
  itemId: string;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  pesoGramos: PesoGramos;
  diasContratados: number;
  subtotalLinea: number;
  costoDano?: number;
  devuelto?: boolean;
  cantidadDevuelta?: number;
  fechaInicio: Date;
  fechaFin?: Date;
}

export class AlquilerEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string | undefined,
    public readonly consecutivo: number | undefined,
    public readonly clienteId: string,
    public clienteNombre: string | undefined,
    public estado: AlquilerEstado,
    public subtotalEquipos: number,
    public fleteEntrega: number,
    public fleteRecogida: number,
    public subtotalGeneral: number,
    public total: number,
    public deposito: number,
    public garantiaMonto: number,
    public garantiaTipo: string,
    public garantiaEstado: string,
    public observacionesGenerales: string | undefined,
    public detallesLogistica: string | undefined,
    public creadoPor: string | undefined,
    public readonly detalles: ItemAlquilerDetalle[] = [],
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.calcularTotales();
  }

  calcularTotales(): void {
    const items = this.detalles || [];
    this.subtotalEquipos = items.reduce((acc, item) => acc + item.subtotalLinea, 0);
    const totalFletes = (this.fleteEntrega || 0) + (this.fleteRecogida || 0);
    this.subtotalGeneral = this.subtotalEquipos + totalFletes;
    this.total = Math.max(0, this.subtotalGeneral - (this.deposito || 0));
  }

  calcularPesoTotalGramos(): bigint {
    const items = this.detalles || [];
    return items.reduce((acc, item) => acc + (item.pesoGramos.gramos * BigInt(item.cantidad)), BigInt(0));
  }

  calcularPesoTotalKilos(): number {
    const totalGramos = this.calcularPesoTotalGramos();
    return Number(totalGramos) / 1000;
  }

  activar(): void {
    if (this.estado === 'FINALIZADO' || this.estado === 'CANCELADO') {
      throw new Error(`No se puede activar un alquiler en estado ${this.estado}.`);
    }
    this.estado = 'ACTIVO';
    this.updatedAt = new Date();
  }

  finalizar(): void {
    this.estado = 'FINALIZADO';
    this.garantiaEstado = 'Liberada';
    this.updatedAt = new Date();
  }

  cancelar(): void {
    this.estado = 'CANCELADO';
    this.garantiaEstado = 'Anulada';
    this.updatedAt = new Date();
  }

  override softDelete(userId: string = "sistema"): void {
    if (this.estado === "ACTIVO") {
      throw new Error("No se puede eliminar un contrato en estado ACTIVO. Primero debe recibir las devoluciones o cancelarlo.");
    }
    super.softDelete(userId);
  }
}
