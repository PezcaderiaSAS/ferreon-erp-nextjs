import { UsuarioEntity, RoleType, Permission } from "../../domain/entities/usuario";
import { IAuthRepository } from "../../domain/repositories/auth-repository.interface";
import { hasPermission } from "../../../lib/auth/rbac-matrix";

export interface IniciarSesionDTO {
  email: string;
}

export interface IniciarSesionResult {
  usuario: UsuarioEntity;
  token: string;
}

export class IniciarSesionUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(dto: IniciarSesionDTO): Promise<IniciarSesionResult> {
    const emailClean = dto.email.trim().toLowerCase();
    const usuario = await this.authRepo.findByEmail(emailClean);

    if (!usuario) {
      throw new Error(`No existe ningún usuario registrado con el correo '${emailClean}'.`);
    }

    if (!usuario.activo) {
      throw new Error(`La cuenta del usuario '${emailClean}' se encuentra desactivada.`);
    }

    usuario.registrarAcceso();
    await this.authRepo.update(usuario);

    const token = `sess_${usuario.id}_${Date.now()}`;
    return { usuario, token };
  }
}

export class VerificarPermisoUseCase {
  execute(rol: RoleType, permiso: Permission): boolean {
    return hasPermission(rol, permiso);
  }
}

export interface CrearUsuarioDTO {
  id?: string;
  nombre: string;
  email: string;
  rol: RoleType;
  avatarUrl?: string;
}

export class CrearUsuarioUseCase {
  constructor(private authRepo: IAuthRepository) {}

  async execute(dto: CrearUsuarioDTO): Promise<UsuarioEntity> {
    const yaExiste = await this.authRepo.findByEmail(dto.email.trim().toLowerCase());
    if (yaExiste) {
      throw new Error(`Ya existe un usuario con el correo '${dto.email}'.`);
    }

    const nuevoUsuario = new UsuarioEntity(
      dto.id || "USR-" + Date.now(),
      dto.nombre,
      dto.email,
      dto.rol,
      dto.avatarUrl,
      true
    );

    return await this.authRepo.save(nuevoUsuario);
  }
}
