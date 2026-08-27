import { describe, it, expect, vi } from "vitest";
import { AuditLogEntity } from "../../src/core/domain/entities/audit-log";
import { 
  RegistrarAuditoriaUseCase, 
  ConsultarAuditoriaUseCase 
} from "../../src/core/application/use-cases/audit-use-cases";
import { IAuditRepository } from "../../src/core/domain/repositories/audit-repository.interface";

describe("Domain & Application: Enterprise Audit Logging", () => {
  it("debe instanciar correctamente un registro inmutable de auditoría", () => {
    const log = new AuditLogEntity({
      userId: "USR-002",
      userNombre: "Carlos Gómez",
      userEmail: "bodega@ferreon.com",
      userRol: "OPERADOR_BODEGA",
      modulo: "BODEGA",
      accion: "AJUSTAR_STOCK",
      entidadId: "EQ-01",
      descripcion: "Ajuste de stock físico para MEZCLADORA 2 BULTOS (+5 unidades)",
      detalles: {
        campo: "stockTotal",
        valorAnterior: 5,
        valorNuevo: 10,
      },
    });

    expect(log.id).toBeDefined();
    expect(String(log.id).startsWith("AUD-")).toBe(true);
    expect(log.timestamp).toBeInstanceOf(Date);
    expect(log.userRol).toBe("OPERADOR_BODEGA");
    expect(log.modulo).toBe("BODEGA");
    expect(log.accion).toBe("AJUSTAR_STOCK");
    expect(log.detalles?.valorAnterior).toBe(5);
    expect(log.detalles?.valorNuevo).toBe(10);
    expect(log.ipAddress).toBe("127.0.0.1");
  });

  it("debe registrar y consultar eventos de auditoría mediante Casos de Uso", async () => {
    const memoriaLogs: AuditLogEntity[] = [];

    const mockRepo: IAuditRepository = {
      record: vi.fn().mockImplementation((log) => {
        memoriaLogs.push(log);
        return Promise.resolve(log);
      }),
      findAll: vi.fn().mockImplementation((filters) => {
        let res = [...memoriaLogs];
        if (filters?.modulo && filters.modulo !== "TODOS") {
          res = res.filter((l) => l.modulo === filters.modulo);
        }
        return Promise.resolve(res);
      }),
      findById: vi.fn(),
    };

    const registrarUseCase = new RegistrarAuditoriaUseCase(mockRepo);
    const consultarUseCase = new ConsultarAuditoriaUseCase(mockRepo);

    await registrarUseCase.execute({
      userId: "USR-001",
      userNombre: "Roberto Silva",
      userEmail: "admin@ferreon.com",
      userRol: "SUPERADMIN",
      modulo: "SEGURIDAD",
      accion: "LOGIN",
      descripcion: "Inicio de sesión exitoso desde navegador",
    });

    await registrarUseCase.execute({
      userId: "USR-003",
      userNombre: "Luisa Peña",
      userEmail: "cartera@ferreon.com",
      userRol: "FACTURACION_CARTERA",
      modulo: "CARTERA",
      accion: "REGISTRAR_PAGO",
      entidadId: "PAG-101",
      descripcion: "Abono de $450.000 COP a contrato ALQ-1001",
    });

    const todos = await consultarUseCase.execute();
    expect(todos.length).toBe(2);

    const soloCartera = await consultarUseCase.execute({ modulo: "CARTERA" });
    expect(soloCartera.length).toBe(1);
    expect(soloCartera[0].accion).toBe("REGISTRAR_PAGO");
  });
});
