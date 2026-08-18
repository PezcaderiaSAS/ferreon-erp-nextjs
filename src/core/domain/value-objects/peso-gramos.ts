/**
 * Value Object Domain: PesoGramos
 * Encapsula la regla de negocio de conversión estricta entre Kilos (UI/Entrada) 
 * y Gramos Enteros (Almacenamiento en DB Supabase PostgreSQL bigint).
 */
export class PesoGramos {
  private constructor(public readonly gramos: bigint) {
    if (gramos < BigInt(0)) {
      throw new Error("El peso en gramos no puede ser negativo.");
    }
  }

  static fromGramos(gramos: bigint | number): PesoGramos {
    return new PesoGramos(BigInt(gramos));
  }

  static fromKilos(kilos: number): PesoGramos {
    if (isNaN(kilos) || kilos < 0) {
      throw new Error("El peso en kilos debe ser un número mayor o igual a 0.");
    }
    return new PesoGramos(BigInt(Math.round(kilos * 1000)));
  }

  toKilos(): number {
    return Number(this.gramos) / 1000;
  }
}
