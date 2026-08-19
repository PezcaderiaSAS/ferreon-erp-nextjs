import { BaseAuditableEntity } from "./base-auditable.entity";

export type RoleType = 
  | "SUPERADMIN" 
  | "ADMIN" 
  | "OPERADOR_BODEGA" 
  | "FACTURACION_CARTERA" 
  | "CONSULTOR_AUDITOR";

export type Permission =
  | "dashboard:view"
  | "alquileres:read"
  | "alquileres:create"
  | "alquileres:edit"
  | "alquileres:delete"
  | "bodega:read"
  | "bodega:create"
  | "bodega:edit"
  | "bodega:adjust_stock"
  | "bodega:bulk_import"
  | "devoluciones:read"
  | "devoluciones:process"
  | "facturacion:read"
  | "facturacion:emit"
  | "cartera:read"
  | "cartera:collect"
  | "clientes:read"
  | "clientes:manage"
  | "configuracion:manage"
  | "auditoria:read"
  | "usuarios:manage";

export class UsuarioEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string,
    public nombre: string,
    public email: string,
    public rol: RoleType,
    public avatarUrl?: string,
    public activo: boolean = true,
    public ultimoAcceso?: Date,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.sanitizar();
    this.validarInvariantes();
  }

  sanitizar(): void {
    if (this.nombre) this.nombre = this.nombre.trim();
    if (this.email) this.email = this.email.trim().toLowerCase();
  }

  validarInvariantes(): void {
    if (!this.id) throw new Error("El ID de usuario es obligatorio.");
    if (!this.nombre) throw new Error("El nombre de usuario es obligatorio.");
    if (!this.email || !this.email.includes("@")) {
      throw new Error("El correo electrónico de usuario no es válido.");
    }
  }

  registrarAcceso(): void {
    this.ultimoAcceso = new Date();
    this.updatedAt = new Date();
  }

  desactivar(motivoUserId: string = "sistema"): void {
    this.activo = false;
    this.updatedAt = new Date();
    this.deletedBy = motivoUserId;
  }
}
