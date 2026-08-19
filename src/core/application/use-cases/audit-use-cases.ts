import { AuditLogEntity, AuditModuloType, AuditActionType, AuditDetalleCambio } from "../../domain/entities/audit-log";
import { IAuditRepository, AuditFilterOptions } from "../../domain/repositories/audit-repository.interface";
import { RoleType } from "../../domain/entities/usuario";

export interface RegistrarAuditoriaDTO {
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
}

export class RegistrarAuditoriaUseCase {
  constructor(private auditRepo: IAuditRepository) {}

  async execute(dto: RegistrarAuditoriaDTO): Promise<AuditLogEntity> {
    const log = new AuditLogEntity(dto);
    return await this.auditRepo.record(log);
  }
}

export class ConsultarAuditoriaUseCase {
  constructor(private auditRepo: IAuditRepository) {}

  async execute(filters?: AuditFilterOptions): Promise<AuditLogEntity[]> {
    return await this.auditRepo.findAll(filters);
  }
}
