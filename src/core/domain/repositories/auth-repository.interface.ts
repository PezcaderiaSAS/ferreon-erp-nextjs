import { UsuarioEntity } from "../entities/usuario";

export interface IAuthRepository {
  findById(id: string): Promise<UsuarioEntity | null>;
  findByEmail(email: string): Promise<UsuarioEntity | null>;
  findAll(): Promise<UsuarioEntity[]>;
  save(usuario: UsuarioEntity): Promise<UsuarioEntity>;
  update(usuario: UsuarioEntity): Promise<UsuarioEntity>;
  delete(id: string): Promise<void>;
}
