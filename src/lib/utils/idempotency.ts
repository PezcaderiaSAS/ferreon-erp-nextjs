/**
 * Generador y validador de llaves de Idempotencia para prevenir
 * transacciones duplicadas o doble click accidental.
 */

export function generateIdempotencyKey(prefix: string = 'tx'): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback para entornos donde randomUUID no esté disponible
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Gestor en memoria con recolección de basura (Garbage Collection)
 * Mantiene como máximo las últimas maxKeys llaves para evitar Memory Leaks.
 */
export class IdempotencyManager {
  private keys: Set<string>;
  private maxKeys: number;

  constructor(maxKeys: number = 50) {
    this.keys = new Set<string>();
    this.maxKeys = maxKeys;
  }

  /**
   * Verifica si una llave ya fue procesada.
   */
  public has(key: string): boolean {
    return this.keys.has(key);
  }

  /**
   * Registra una llave y purga las más antiguas si excede el límite.
   */
  public register(key: string): void {
    if (this.keys.size >= this.maxKeys) {
      // Eliminar el elemento más antiguo (primer elemento del Set)
      const oldestKey = this.keys.values().next().value;
      if (oldestKey) {
        this.keys.delete(oldestKey);
      }
    }
    this.keys.add(key);
  }

  /**
   * Limpia todas las llaves.
   */
  public clear(): void {
    this.keys.clear();
  }
}

export const defaultIdempotencyManager = new IdempotencyManager(50);
