import { BaseAuditableEntity } from "./base-auditable.entity";

export interface HistorialAlquilerCliente {
  id: string | number;
  consecutivo: number;
  fechaInicio: Date;
  estado: string;
  total: number;
  saldoPendiente: number;
}

export interface HistorialPagoCliente {
  id: string | number;
  consecutivoRecibo: number;
  alquilerId: string;
  fechaPago: Date;
  monto: number;
  metodoPago: string;
}

export interface EstadoCarteraCliente {
  totalAlquiladoHistorico: number;
  totalPagadoHistorico: number;
  saldoCarteraVigente: number;
  alquileresMoraCount: number;
  estadoGeneral: 'AL_DIA' | 'EN_MORA' | 'BLOQUEADO';
}

export class ClienteEntity extends BaseAuditableEntity {
  constructor(
    public readonly id: string | number,
    public nitCedula: string,
    public nombre: string,
    public telefono?: string,
    public email?: string,
    public direccion?: string,
    public activo: boolean = true,
    createdAt?: Date,
    updatedAt?: Date,
    deletedAt?: Date | null,
    deletedBy?: string | null
  ) {
    super(createdAt, updatedAt, deletedAt, deletedBy);
    this.sanitizarDatos();
  }

  sanitizarDatos(): void {
    if (this.nitCedula) this.nitCedula = this.nitCedula.trim().toUpperCase();
    if (this.nombre) this.nombre = this.nombre.trim().toUpperCase();
    if (this.email) this.email = this.email.trim().toLowerCase();
    if (this.direccion) this.direccion = this.direccion.trim();
    if (this.telefono) this.telefono = this.telefono.trim();
  }

  sanitizar(): void {
    this.sanitizarDatos();
  }

  override softDelete(userId: string = "sistema"): void {
    super.softDelete(userId);
    this.activo = false;
  }

  override restore(): void {
    super.restore();
    this.activo = true;
  }
}

export interface Cliente { 
  id: string | number; 
  nit: string; 
  nombre: string; 
  contacto: string; 
  email?: string;
  direccion?: string;
  nivel_riesgo: 'Bajo' | 'Medio' | 'Alto'; 
  creado_en: Date; 
}

