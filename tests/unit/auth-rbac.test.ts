import { describe, it, expect, vi } from "vitest";
import { UsuarioEntity } from "../../src/core/domain/entities/usuario";
import { 
  hasPermission, 
  PERMISOS_POR_ROL, 
  USUARIOS_DEMO 
} from "../../src/lib/auth/rbac-matrix";
import { 
  IniciarSesionUseCase, 
  CrearUsuarioUseCase 
} from "../../src/core/application/use-cases/auth-use-cases";
import { IAuthRepository } from "../../src/core/domain/repositories/auth-repository.interface";

describe("Domain & Application: Auth & RBAC Matrix", () => {
  it("debe validar las invariantes de UsuarioEntity", () => {
    const usuario = new UsuarioEntity(
      "USR-01",
      " Juan Pérez ",
      " JUAN@FERREON.COM ",
      "OPERADOR_BODEGA"
    );

    expect(usuario.nombre).toBe("Juan Pérez");
    expect(usuario.email).toBe("juan@ferreon.com");
    expect(usuario.rol).toBe("OPERADOR_BODEGA");
    expect(usuario.activo).toBe(true);

    expect(() => new UsuarioEntity("", "Nombre", "email@test.com", "ADMIN")).toThrow("El ID de usuario es obligatorio.");
    expect(() => new UsuarioEntity("U-1", "", "email@test.com", "ADMIN")).toThrow("El nombre de usuario es obligatorio.");
    expect(() => new UsuarioEntity("U-1", "Nombre", "correo-invalido", "ADMIN")).toThrow("El correo electrónico de usuario no es válido.");
  });

  it("debe verificar correctamente la matriz de permisos para cada rol", () => {
    // SUPERADMIN tiene todos los permisos
    expect(hasPermission("SUPERADMIN", "alquileres:create")).toBe(true);
    expect(hasPermission("SUPERADMIN", "bodega:bulk_import")).toBe(true);
    expect(hasPermission("SUPERADMIN", "usuarios:manage")).toBe(true);
    expect(hasPermission("SUPERADMIN", "auditoria:read")).toBe(true);

    // OPERADOR_BODEGA tiene permisos en bodega y devoluciones pero NO en facturación ni gestión de usuarios
    expect(hasPermission("OPERADOR_BODEGA", "bodega:create")).toBe(true);
    expect(hasPermission("OPERADOR_BODEGA", "bodega:adjust_stock")).toBe(true);
    expect(hasPermission("OPERADOR_BODEGA", "devoluciones:process")).toBe(true);
    expect(hasPermission("OPERADOR_BODEGA", "facturacion:emit")).toBe(false);
    expect(hasPermission("OPERADOR_BODEGA", "cartera:collect")).toBe(false);
    expect(hasPermission("OPERADOR_BODEGA", "usuarios:manage")).toBe(false);

    // FACTURACION_CARTERA tiene permisos en facturas y cartera pero NO en modificación de bodega
    expect(hasPermission("FACTURACION_CARTERA", "facturacion:emit")).toBe(true);
    expect(hasPermission("FACTURACION_CARTERA", "cartera:collect")).toBe(true);
    expect(hasPermission("FACTURACION_CARTERA", "bodega:create")).toBe(false);
    expect(hasPermission("FACTURACION_CARTERA", "bodega:adjust_stock")).toBe(false);

    // CONSULTOR_AUDITOR solo lectura y auditoría
    expect(hasPermission("CONSULTOR_AUDITOR", "auditoria:read")).toBe(true);
    expect(hasPermission("CONSULTOR_AUDITOR", "alquileres:read")).toBe(true);
    expect(hasPermission("CONSULTOR_AUDITOR", "alquileres:create")).toBe(false);
    expect(hasPermission("CONSULTOR_AUDITOR", "bodega:create")).toBe(false);
  });

  it("debe autenticar un usuario válido mediante IniciarSesionUseCase", async () => {
    const usuarioMock = new UsuarioEntity(
      "USR-100",
      "Carlos Bodega",
      "bodega@ferreon.com",
      "OPERADOR_BODEGA"
    );

    const mockRepo: IAuthRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockImplementation((email) => 
        email === "bodega@ferreon.com" ? Promise.resolve(usuarioMock) : Promise.resolve(null)
      ),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn().mockImplementation((u) => Promise.resolve(u)),
      delete: vi.fn(),
    };

    const useCase = new IniciarSesionUseCase(mockRepo);
    const result = await useCase.execute({ email: " bodega@ferreon.com " });

    expect(result.usuario.id).toBe("USR-100");
    expect(result.token).toContain("sess_USR-100");
    expect(result.usuario.ultimoAcceso).toBeDefined();
  });

  it("debe rechazar inicio de sesión si el usuario no existe o está inactivo", async () => {
    const usuarioInactivo = new UsuarioEntity(
      "USR-101",
      "Inactivo",
      "inactivo@ferreon.com",
      "OPERADOR_BODEGA",
      undefined,
      false // inactivo
    );

    const mockRepo: IAuthRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockImplementation((email) => {
        if (email === "inactivo@ferreon.com") return Promise.resolve(usuarioInactivo);
        return Promise.resolve(null);
      }),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new IniciarSesionUseCase(mockRepo);

    await expect(useCase.execute({ email: "noexiste@ferreon.com" })).rejects.toThrow(
      "No existe ningún usuario registrado con el correo 'noexiste@ferreon.com'."
    );

    await expect(useCase.execute({ email: "inactivo@ferreon.com" })).rejects.toThrow(
      "La cuenta del usuario 'inactivo@ferreon.com' se encuentra desactivada."
    );
  });

  it("debe registrar un nuevo usuario con CrearUsuarioUseCase", async () => {
    const mockRepo: IAuthRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation((u) => Promise.resolve(u)),
      update: vi.fn(),
      delete: vi.fn(),
    };

    const useCase = new CrearUsuarioUseCase(mockRepo);
    const nuevo = await useCase.execute({
      nombre: "Ana María Contadora",
      email: "ana@ferreon.com",
      rol: "FACTURACION_CARTERA",
    });

    expect(nuevo.email).toBe("ana@ferreon.com");
    expect(nuevo.rol).toBe("FACTURACION_CARTERA");
    expect(nuevo.activo).toBe(true);
  });
});
