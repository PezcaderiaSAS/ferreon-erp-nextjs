import { RoleType } from "./usuario";

export type AuditActionType =
  | "LOGIN"
  | "LOGOUT"
  | "CREAR_EQUIPO"
  | "EDITAR_EQUIPO"
  | "AJUSTAR_STOCK"
  | "CARGA_MASIVA_EQUIPOS"
  | "CREAR_ALQUILER"
  | "EDITAR_ALQUILER"
  | "FINALIZAR_ALQUILER"
  | "PROCESAR_DEVOLUCION"
  | "EMITIR_FACTURA"
  | "REGISTRAR_PAGO"
  | "CREAR_CLIENTE"
  | "EDITAR_CONFIGURACION";

export type AuditModuloType =
  | "SEGURIDAD"
  | "BODEGA"
  | "ALQUILERES"
  | "DEVOLUCIONES"
  | "FACTURACION"
  | "CARTERA"
  | "CLIENTES"
  | "CONFIGURACION";

export interface AuditDetalleCambio {
  campo?: string;
  valorAnterior?: any;
  valorNuevo?: any;
  descripcion?: string;
  metadata?: Record<string, any>;
}

export class AuditLogEntity {
  public readonly id: string | number;
  public readonly timestamp: Date;
  public readonly userId: string;
  public readonly userNombre: string;
  public readonly userEmail: string;
  public readonly userRol: RoleType;
  public readonly modulo: AuditModuloType;
  public readonly accion: AuditActionType;
  public readonly entidadId?: string;
  public readonly descripcion: string;
  public readonly detalles?: AuditDetalleCambio;
  public readonly ipAddress?: string;

  constructor(params: {
    id?: string;
    timestamp?: Date;
    userId: string;
    userNombre: string;
    userEmail: string;
    userRol: RoleType;
    modulo: AuditModuloType;
    accion: AuditActionType;
    entidadId?: string;
    descripcion: string;
    detalles?: AuditDetalleCambio;
    ipAddress?: string;
  }) {
    this.id = params.id || "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    this.timestamp = params.timestamp || new Date();
    this.userId = params.userId;
    this.userNombre = params.userNombre;
    this.userEmail = params.userEmail;
    this.userRol = params.userRol;
    this.modulo = params.modulo;
    this.accion = params.accion;
    this.entidadId = params.entidadId;
    this.descripcion = params.descripcion;
    this.detalles = params.detalles;
    this.ipAddress = params.ipAddress || "127.0.0.1";
  }
}
