import { PesoGramos } from "../value-objects/peso-gramos";
import { BaseAuditableEntity } from "./base-auditable.entity";

export class EquipoEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string,
    public codigo: string,
    public nombre: string,
    public categoria: string,
    public tarifaDiaria: number,
    public pesoGramos: PesoGramos,
    public stockTotal: number,
    public stockDisponible: number,
    public stockEnObra: number = 0,
    public activo: boolean = true,
    public stockMantenimiento: number = 0,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.sanitizar();
    this.validarBalanceStock();
  }

  sanitizar(): void {
    if (this.codigo) this.codigo = this.codigo.trim().toUpperCase();
    if (this.nombre) this.nombre = this.nombre.trim().toUpperCase();
    if (this.categoria) this.categoria = this.categoria.trim().toUpperCase();
  }

  validarBalanceStock(): void {
    if (this.stockTotal < 0 || this.stockDisponible < 0 || this.stockEnObra < 0 || (this.stockMantenimiento || 0) < 0) {
      throw new Error("Las cantidades de stock no pueden ser negativas.");
    }
    const suma = this.stockDisponible + this.stockEnObra + (this.stockMantenimiento || 0);
    if (suma !== this.stockTotal) {
      throw new Error(
        `Inconsistencia en balance de stock: Disponible (${this.stockDisponible}) + En Obra (${this.stockEnObra}) + Mantenimiento (${this.stockMantenimiento || 0}) != Total (${this.stockTotal})`
      );
    }
  }

  validarInvariantes(): void {
    this.validarBalanceStock();
  }

  get pesoKilos(): number {
    return this.pesoGramos.toKilos();
  }

  alquilar(cantidad: number): void {
    this.despachar(cantidad);
  }

  despachar(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a alquilar debe ser mayor a cero.");
    }
    if (this.stockDisponible < cantidad) {
      throw new Error(`Stock insuficiente para '${this.nombre}'. Disponible: ${this.stockDisponible}, Solicitado: ${cantidad}.`);
    }
    this.stockDisponible -= cantidad;
    this.stockEnObra += cantidad;
    this.updatedAt = new Date();
  }

  devolver(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a devolver debe ser mayor a cero.");
    }
    if (this.stockEnObra < cantidad) {
      throw new Error(`Inconsistencia: intentando devolver ${cantidad} pero solo hay ${this.stockEnObra} en obra.`);
    }
    this.stockEnObra -= cantidad;
    this.stockDisponible += cantidad;
    this.updatedAt = new Date();
  }

  override softDelete(userId: string = "sistema"): void {
    if (this.stockEnObra > 0) {
      throw new Error(`No se puede eliminar el equipo '${this.nombre}' porque tiene ${this.stockEnObra} unidades en obra.`);
    }
    super.softDelete(userId);
    this.activo = false;
  }

  override restore(): void {
    super.restore();
    this.activo = true;
  }
}
