import { describe, it, expect, vi } from "vitest";
import { ClienteEntity } from "../../src/core/domain/entities/cliente";
import { CrearClienteUseCase } from "../../src/core/application/use-cases/crear-cliente.use-case";
import { EditarClienteUseCase } from "../../src/core/application/use-cases/editar-cliente.use-case";
import { IClienteRepository } from "../../src/core/domain/repositories/cliente-repository.interface";

describe("Domain Entity & Use Cases: Cliente", () => {
  it("debe sanitizar el NIT y Nombre en MAYÚSCULAS LIMPIAS", () => {
    const cliente = new ClienteEntity(
      undefined,
      " 900123456-1 ",
      " construcciones & obras sas ",
      "3001234567",
      " CONTACto@OBRAS.COM "
    );

    expect(cliente.nitCedula).toBe("900123456-1");
    expect(cliente.nombre).toBe("CONSTRUCCIONES & OBRAS SAS");
    expect(cliente.email).toBe("contacto@obras.com");
  });

  it("debe rechazar la creación si el NIT ya existe", async () => {
    const mockRepo: IClienteRepository = {
      findById: vi.fn(),
      findByNit: vi.fn().mockResolvedValue(new ClienteEntity("CLI-1", "900123456-1", "EXISTENTE")),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      getHistorialCompleto: vi.fn(),
    };

    const useCase = new CrearClienteUseCase(mockRepo);

    await expect(
      useCase.execute({
        nitCedula: "900123456-1",
        nombre: "NUEVO CLIENTE",
      })
    ).rejects.toThrow("Ya existe un cliente registrado con la identificación NIT/Cédula 900123456-1.");
  });

  it("debe permitir editar los datos de un cliente existente", async () => {
    const clienteOriginal = new ClienteEntity("CLI-1", "900123456-1", "CLIENTE VIEJO");
    
    const mockSave = vi.fn().mockImplementation((c) => Promise.resolve(c));
    const mockRepo: IClienteRepository = {
      findById: vi.fn().mockResolvedValue(clienteOriginal),
      findByNit: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn(),
      update: mockSave,
      getHistorialCompleto: vi.fn(),
    };

    const useCase = new EditarClienteUseCase(mockRepo);

    const resultado = await useCase.execute({
      id: "CLI-1",
      nitCedula: "900123456-1",
      nombre: "CLIENTE ACTUALIZADO SAS",
      telefono: "3109876543",
    });

    expect(resultado.nombre).toBe("CLIENTE ACTUALIZADO SAS");
    expect(resultado.telefono).toBe("3109876543");
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});
