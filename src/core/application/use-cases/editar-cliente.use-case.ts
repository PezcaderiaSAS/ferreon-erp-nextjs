import { ClienteEntity } from "../../domain/entities/cliente";
import { IClienteRepository } from "../../domain/repositories/cliente-repository.interface";

export interface EditarClienteDTO {
  id: string;
  nitCedula: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  activo?: boolean;
}

export class EditarClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(dto: EditarClienteDTO): Promise<ClienteEntity> {
    const clienteExistente = await this.clienteRepo.findById(dto.id);
    if (!clienteExistente) {
      throw new Error(`El cliente con ID ${dto.id} no existe en el sistema.`);
    }

    const nitSanitizado = dto.nitCedula.trim().toUpperCase();
    if (nitSanitizado !== clienteExistente.nitCedula) {
      const otroConNit = await this.clienteRepo.findByNit(nitSanitizado);
      if (otroConNit && otroConNit.id !== dto.id) {
        throw new Error(`Ya existe otro cliente registrado con la identificación ${nitSanitizado}.`);
      }
    }

    clienteExistente.nitCedula = dto.nitCedula;
    clienteExistente.nombre = dto.nombre;
    clienteExistente.telefono = dto.telefono;
    clienteExistente.email = dto.email;
    clienteExistente.direccion = dto.direccion;
    if (dto.activo !== undefined) {
      clienteExistente.activo = dto.activo;
    }

    clienteExistente.sanitizarDatos();
    return await this.clienteRepo.update(clienteExistente);
  }
}
