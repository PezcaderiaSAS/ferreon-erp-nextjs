import { PesoGramos } from "../value-objects/peso-gramos";

export class EquipoEntity {
  constructor(
    public readonly id: string | undefined,
    public codigo: string,
    public nombre: string,
    public categoria: string,
    public tarifaDiaria: number,
    public pesoGramos: PesoGramos,
    public stockTotal: number,
    public stockDisponible: number,
    public stockEnObra: number = 0,
    public activo: boolean = true,
    public readonly createdAt?: Date
  ) {
    this.validarInvariantes();
  }

  validarInvariantes(): void {
    if (!this.codigo || !this.nombre) {
      throw new Error("El código y el nombre del equipo son obligatorios.");
    }
    if (this.tarifaDiaria < 0) {
      throw new Error("La tarifa diaria no puede ser negativa.");
    }
    if (this.stockTotal < 0 || this.stockDisponible < 0 || this.stockEnObra < 0) {
      throw new Error("Los valores de stock no pueden ser negativos.");
    }
    if (this.stockDisponible + this.stockEnObra > this.stockTotal) {
      throw new Error("La suma del stock disponible y en obra no puede superar el stock total.");
    }
    this.codigo = this.codigo.trim().toUpperCase();
    this.nombre = this.nombre.trim().toUpperCase();
    this.categoria = (this.categoria || "GENERAL").trim().toUpperCase();
  }

  alquilar(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a alquilar debe ser mayor a cero.");
    }
    if (cantidad > this.stockDisponible) {
      throw new Error(`Stock insuficiente para '${this.nombre}'. Disponible: ${this.stockDisponible}, Solicitado: ${cantidad}.`);
    }
    this.stockDisponible -= cantidad;
    this.stockEnObra += cantidad;
  }

  devolver(cantidad: number): void {
    if (cantidad <= 0) {
      throw new Error("La cantidad a devolver debe ser mayor a cero.");
    }
    if (cantidad > this.stockEnObra) {
      throw new Error(`No se pueden devolver más unidades de las alquiladas. En obra: ${this.stockEnObra}, Devueltas: ${cantidad}.`);
    }
    this.stockEnObra -= cantidad;
    this.stockDisponible += cantidad;
  }
}
