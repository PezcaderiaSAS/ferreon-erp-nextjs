import { ClienteEntity, HistorialAlquilerCliente, HistorialPagoCliente, EstadoCarteraCliente } from "../entities/cliente";

export interface HistorialCompletoCliente {
  cliente: ClienteEntity;
  alquileres: HistorialAlquilerCliente[];
  pagos: HistorialPagoCliente[];
  cartera: EstadoCarteraCliente;
}

export interface IClienteRepository {
  findById(id: string): Promise<ClienteEntity | null>;
  findByNit(nitCedula: string): Promise<ClienteEntity | null>;
  findAll(): Promise<ClienteEntity[]>;
  save(cliente: ClienteEntity): Promise<ClienteEntity>;
  update(cliente: ClienteEntity): Promise<ClienteEntity>;
  getHistorialCompleto(id: string): Promise<HistorialCompletoCliente | null>;
}
