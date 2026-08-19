import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditLogEntity } from "../../../core/domain/entities/audit-log";

const auditLogSchema = z.object({
  userId: z.string(),
  userNombre: z.string(),
  userEmail: z.string(),
  userRol: z.enum(["SUPERADMIN", "ADMIN", "OPERADOR_BODEGA", "FACTURACION_CARTERA", "CONSULTOR_AUDITOR"]),
  modulo: z.enum(["SEGURIDAD", "BODEGA", "ALQUILERES", "DEVOLUCIONES", "FACTURACION", "CARTERA", "CLIENTES", "CONFIGURACION"]),
  accion: z.string(),
  entidadId: z.string().optional(),
  descripcion: z.string(),
  detalles: z.any().optional(),
  ipAddress: z.string().optional(),
});

// Memoria volátil para logs de auditoría en servidor
let auditLogsMemoria: any[] = [];

export async function GET() {
  return NextResponse.json({ logs: auditLogsMemoria, total: auditLogsMemoria.length });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const data = auditLogSchema.parse(json);

    const nuevoLog = new AuditLogEntity({
      userId: data.userId,
      userNombre: data.userNombre,
      userEmail: data.userEmail,
      userRol: data.userRol as any,
      modulo: data.modulo as any,
      accion: data.accion as any,
      entidadId: data.entidadId,
      descripcion: data.descripcion,
      detalles: data.detalles,
      ipAddress: data.ipAddress || "127.0.0.1",
    });

    auditLogsMemoria.unshift(nuevoLog);

    return NextResponse.json({ success: true, log: nuevoLog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al registrar log de auditoría." }, { status: 400 });
  }
}
