import { BaseAuditableEntity } from "./base-auditable.entity";

export type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "NEQUI" | "DAVIPLATA" | "CHEQUE";
export type TipoPago = "ABONO_ALQUILER" | "PAGO_DANOS" | "OTROS";

export class PagoEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string,
    public readonly consecutivoRecibo: number,
    public readonly alquilerId: string,
    public readonly clienteId: string,
    public readonly clienteNombre: string,
    public monto: number,
    public metodoPago: MetodoPago,
    public tipoPago: TipoPago = "ABONO_ALQUILER",
    public comprobanteReferencia?: string,
    public notas?: string,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    if (this.monto <= 0) {
      throw new Error("El monto del pago debe ser mayor a cero.");
    }
  }
}
