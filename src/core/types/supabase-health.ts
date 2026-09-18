export interface SupabaseHealthResult {
  ok: boolean;
  latenciaMs: number;
  url: string;
  timestamp: string;
  empresaId?: string;
  detalles?: {
    servicioUrlConfigurado: boolean;
    serviceKeyConfigurada: boolean;
    anonKeyConfigurada: boolean;
  };
  error?: string;
}
