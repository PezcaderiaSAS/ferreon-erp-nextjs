/**
 * IdempotencyManager
 * 
 * Utilidad para gestionar llaves de idempotencia en el cliente (Frontend).
 * Evita el doble envío de formularios o acciones destructivas (Zero-Latency).
 * Utiliza una política FIFO (First In, First Out) con un límite máximo
 * para evitar fugas de memoria en sesiones prolongadas.
 */
export class IdempotencyManager {
  private static instance: IdempotencyManager;
  private keys: Set<string>;
  private readonly MAX_KEYS = 50;

  private constructor() {
    this.keys = new Set<string>();
  }

  public static getInstance(): IdempotencyManager {
    if (!IdempotencyManager.instance) {
      IdempotencyManager.instance = new IdempotencyManager();
    }
    return IdempotencyManager.instance;
  }

  /**
   * Genera una nueva llave criptográfica única.
   */
  public generateKey(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Verifica si una llave ya fue procesada.
   * Si no ha sido procesada, la registra y retorna true (permitir operación).
   * Si ya existe, retorna false (bloquear operación).
   */
  public processKey(key: string): boolean {
    if (this.keys.has(key)) {
      return false; // Bloquear, ya se procesó
    }

    this.keys.add(key);

    // Política FIFO: si excedemos el límite, eliminamos la llave más antigua
    if (this.keys.size > this.MAX_KEYS) {
      const firstKey = this.keys.values().next().value;
      if (firstKey) {
        this.keys.delete(firstKey);
      }
    }

    return true; // Permitir operación
  }

  /**
   * Remueve una llave (útil si la operación falló y queremos permitir reintento)
   */
  public removeKey(key: string): void {
    this.keys.delete(key);
  }

  /**
   * Limpia todas las llaves (útil al cerrar sesión)
   */
  public clear(): void {
    this.keys.clear();
  }
}

// Exportar una instancia por defecto para facilitar el uso
export const idempotencyManager = IdempotencyManager.getInstance();
