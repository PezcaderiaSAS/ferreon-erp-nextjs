import { PesoGramos } from "../value-objects/peso-gramos";

export type AlquilerEstado = 'COTIZACION' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';

export interface ItemAlquilerDetalle {
  id?: string;
  itemId: string;
  cantidad: number;
  tarifaAplicada: number;
  pesoGramos: PesoGramos;
  subtotalLinea: number;
  costoDano?: number;
  fechaInicio: Date;
  fechaFin?: Date;
}

export class AlquilerEntity {
  constructor(
    public readonly id: string | undefined,
    public readonly consecutivo: number | undefined,
    public readonly clienteId: string,
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
  ) {}

  calcularTotales(): void {
    this.subtotal = this.detalles.reduce((acc, item) => acc + item.subtotalLinea, 0);
    this.total = Math.max(0, this.subtotal - this.deposito);
  }
}
