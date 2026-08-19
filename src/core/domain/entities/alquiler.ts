import { PesoGramos } from "../value-objects/peso-gramos";

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

export class AlquilerEntity {
  constructor(
    public readonly id: string | undefined,
    public readonly consecutivo: number | undefined,
    public readonly clienteId: string,
    public clienteNombre: string | undefined,
    public estado: AlquilerEstado,
    public subtotal: number,
    public total: number,
    public deposito: number,
    public garantiaMonto: number,
    public garantiaTipo: string,
    public garantiaEstado: string,
    public observacionesGenerales: string | undefined,
    public creadoPor: string | undefined,
    public readonly detalles: ItemAlquilerDetalle[],
    public readonly createdAt?: Date
  ) {
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.subtotal = this.detalles.reduce((acc, item) => acc + item.subtotalLinea, 0);
    this.total = Math.max(0, this.subtotal - this.deposito);
  }

  calcularPesoTotalGramos(): bigint {
    return this.detalles.reduce((acc, item) => acc + (item.pesoGramos.gramos * BigInt(item.cantidad)), BigInt(0));
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
  }

  finalizar(): void {
    this.estado = 'FINALIZADO';
    this.garantiaEstado = 'Liberada';
  }

  cancelar(): void {
    this.estado = 'CANCELADO';
    this.garantiaEstado = 'Anulada';
  }
}
