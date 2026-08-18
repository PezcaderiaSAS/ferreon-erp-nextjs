import { ClienteEntity } from "../../domain/entities/cliente";
import { IClienteRepository } from "../../domain/repositories/cliente-repository.interface";

export interface CrearClienteDTO {
  nitCedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export class CrearClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(dto: CrearClienteDTO): Promise<ClienteEntity> {
    const nitSanitizado = dto.nitCedula.trim().toUpperCase();
    const clienteExistente = await this.clienteRepo.findByNit(nitSanitizado);
    if (clienteExistente) {
      throw new Error(`Ya existe un cliente registrado con la identificación NIT/Cédula ${nitSanitizado}.`);
    }

    const cliente = new ClienteEntity(
      undefined,
      dto.nitCedula,
      dto.nombre,
      dto.telefono,
      dto.email,
      dto.direccion,
      true
    );

    return await this.clienteRepo.save(cliente);
  }
}
