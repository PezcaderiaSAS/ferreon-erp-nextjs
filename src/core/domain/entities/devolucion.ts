import { BaseAuditableEntity } from "./base-auditable.entity";

export interface ItemDevolucionDetalle {
  equipoId: string;
  nombreEquipo?: string;
  cantidadDevuelta: number;
  cantidadDanada: number;
  costoCobrado: number; // Costo adicional cobrado por el daño/retraso
}

export class DevolucionEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string,
    public readonly consecutivo: number,
    public readonly alquilerId: string,
    public readonly fechaDevolucion: Date,
    public readonly usuarioRecepcionId: string,
    public readonly usuarioRecepcionNombre: string,
    public detalles: ItemDevolucionDetalle[] = [],
    public notas: string = "",
    public totalCobradoPorDanos: number = 0,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.totalCobradoPorDanos = this.detalles.reduce((acc, item) => acc + (item.costoCobrado || 0), 0);
  }
}
