import { EquipoEntity } from "../../domain/entities/equipo";
import { IEquipoRepository } from "../../domain/repositories/equipo-repository.interface";

export interface CrearEquipoDTO {
  codigo: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  tarifaDiaria: number;
  stockTotal: number;
}

export interface CargaMasivaEquipoDTO {
  equipos: CrearEquipoDTO[];
}

export interface EditarEquipoDTO {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  tarifaDiaria: number;
  stockTotal: number;
  activo?: boolean;
}

export class CrearEquipoUseCase {
  constructor(private readonly equipoRepo: IEquipoRepository) {}

  async execute(dto: CrearEquipoDTO): Promise<EquipoEntity> {
    const codClean = dto.codigo.trim().toUpperCase();
    const existe = await this.equipoRepo.findByCodigo(codClean);
    if (existe) {
      throw new Error(`Ya existe un equipo registrado con el código '${codClean}'.`);
    }

    const equipo = new EquipoEntity(
      undefined,
      dto.codigo,
      dto.nombre,
      dto.categoria,
      dto.tarifaDiaria,
      dto.stockTotal,
      dto.stockTotal, // Stock disponible inicialmente igual al total
      0,
      true,
      0,
      dto.subcategoria || "GENERAL"
    );

    return await this.equipoRepo.save(equipo);
  }
}

export class CargaMasivaEquiposUseCase {
  constructor(private readonly equipoRepo: IEquipoRepository) {}

  async execute(dto: CargaMasivaEquipoDTO): Promise<EquipoEntity[]> {
    if (!dto.equipos || dto.equipos.length === 0) {
      throw new Error("Debe proporcionar al menos un equipo para la carga masiva.");
    }

    const nuevosEquipos: EquipoEntity[] = [];

    for (const item of dto.equipos) {
      const codClean = item.codigo.trim().toUpperCase();
      const existe = await this.equipoRepo.findByCodigo(codClean);
      if (existe) {
        throw new Error(`Conflicto en carga masiva: El código '${codClean}' ya existe.`);
      }

      const equipo = new EquipoEntity(
        undefined,
        item.codigo,
        item.nombre,
        item.categoria,
        item.tarifaDiaria,
        item.stockTotal,
        item.stockTotal,
        0,
        true,
        0,
        item.subcategoria || "GENERAL"
      );
      nuevosEquipos.push(equipo);
    }

    return await this.equipoRepo.saveBulk(nuevosEquipos);
  }
}

export class EditarEquipoUseCase {
  constructor(private readonly equipoRepo: IEquipoRepository) {}

  async execute(dto: EditarEquipoDTO): Promise<EquipoEntity> {
    const equipo = await this.equipoRepo.findById(dto.id);
    if (!equipo) {
      throw new Error(`El equipo con ID '${dto.id}' no existe.`);
    }

    const codClean = dto.codigo.trim().toUpperCase();
    if (codClean !== equipo.codigo) {
      const otroConCodigo = await this.equipoRepo.findByCodigo(codClean);
      if (otroConCodigo && otroConCodigo.id !== dto.id) {
        throw new Error(`Ya existe otro equipo con el código '${codClean}'.`);
      }
    }

    // Calcular la diferencia de stock total para ajustar el disponible
    const diferenciaStock = dto.stockTotal - equipo.stockTotal;
    const nuevoDisponible = equipo.stockDisponible + diferenciaStock;
    if (nuevoDisponible < 0) {
      throw new Error("No es posible reducir el stock total por debajo de las unidades en obra.");
    }

    equipo.codigo = dto.codigo;
    equipo.nombre = dto.nombre;
    equipo.categoria = dto.categoria;
    if (dto.subcategoria !== undefined) {
      equipo.subcategoria = dto.subcategoria;
    }
    equipo.tarifaDiaria = dto.tarifaDiaria;
    equipo.stockTotal = dto.stockTotal;
    equipo.stockDisponible = nuevoDisponible;
    if (dto.activo !== undefined) {
      equipo.activo = dto.activo;
    }

    equipo.sanitizar();
    equipo.validarInvariantes();
    return await this.equipoRepo.update(equipo);
  }
}
