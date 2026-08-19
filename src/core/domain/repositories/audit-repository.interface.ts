import { AuditLogEntity, AuditModuloType, AuditActionType } from "../entities/audit-log";

export interface AuditFilterOptions {
  modulo?: AuditModuloType | "TODOS";
  accion?: AuditActionType | "TODOS";
  userId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  searchQuery?: string;
  limit?: number;
}

export interface IAuditRepository {
  record(log: AuditLogEntity): Promise<AuditLogEntity>;
  findAll(options?: AuditFilterOptions): Promise<AuditLogEntity[]>;
  findById(id: string): Promise<AuditLogEntity | null>;
}
