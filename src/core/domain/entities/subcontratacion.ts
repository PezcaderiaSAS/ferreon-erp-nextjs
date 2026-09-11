import { BaseAuditableEntity } from './base-auditable.entity';

export type EstadoSubcontratacion = 
  | 'ORDENADA' 
  | 'RECIBIDA_EN_BODEGA' 
  | 'EN_CLIENTE' 
  | 'DEVUELTA_A_PROVEEDOR' 
  | 'CANCELADA';

export interface SubcontratacionDetalleItem {
  id?: string;
  equipoId?: string | number;
  descripcionItem: string;
  cantidad: number;
  diasPactados: number;
  costoDiarioUnitario: number;
  tarifaDiariaCliente: number;
  subtotalCosto: number;
  alquilerDetalleId?: string | number;
}

export class SubcontratacionEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string,
    public readonly consecutivo: string,
    public readonly proveedorId: string,
    public proveedorNombre: string,
    public proveedorNit: string,
    public proveedorTelefono: string | undefined,
    public fechaEmision: Date,
    public fechaRecepcionEstimada: Date,
    public fechaDevolucionEstimada: Date,
    public estado: EstadoSubcontratacion = 'ORDENADA',
    public alquilerId?: string | number,
    public items: SubcontratacionDetalleItem[] = [],
    public costoTotalEstimado: number = 0,
    public costoTotalReal: number = 0,
    public depositoGarantiaProveedor: number = 0,
    public observaciones?: string,
    public fechaRecepcionReal?: Date,
    public fechaDevolucionReal?: Date,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(createdAt, updatedAt);
    this.validarInvariantes();
  }

  validarInvariantes(): void {
    if (!this.proveedorNombre || this.proveedorNombre.trim().length === 0) {
      throw new Error('El nombre del proveedor es obligatorio en la subcontratación.');
    }
    if (!this.proveedorNit || this.proveedorNit.trim().length === 0) {
      throw new Error('El NIT del proveedor es obligatorio.');
    }
    if (this.fechaDevolucionEstimada < this.fechaRecepcionEstimada) {
      throw new Error('La fecha estimada de devolución al proveedor no puede ser menor a la de recepción.');
    }
    if (this.depositoGarantiaProveedor < 0) {
      throw new Error('El depósito de garantía al proveedor no puede ser negativo.');
    }
  }

  calcularCostoTotal(): number {
    return this.items.reduce((acc, item) => {
      const dias = Math.max(1, item.diasPactados || 1);
      const cant = Math.max(1, item.cantidad || 1);
      const costo = Number(item.costoDiarioUnitario || 0);
      return acc + (costo * cant * dias);
    }, 0);
  }

  calcularMargenEstimado(): { margenNominal: number; margenPorcentual: number } {
    const totalCosto = this.calcularCostoTotal();
    const totalCliente = this.items.reduce((acc, item) => {
      const dias = Math.max(1, item.diasPactados || 1);
      const cant = Math.max(1, item.cantidad || 1);
      const tarifa = Number(item.tarifaDiariaCliente || 0);
      return acc + (tarifa * cant * dias);
    }, 0);

    const margenNominal = totalCliente - totalCosto;
    const margenPorcentual = totalCliente > 0 ? (margenNominal / totalCliente) * 100 : 0;

    return {
      margenNominal,
      margenPorcentual: Math.round(margenPorcentual * 100) / 100
    };
  }
}
