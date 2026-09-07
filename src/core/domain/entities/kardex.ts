export type TipoMovimientoKardex = 
  | 'INGRESO_COMPRA' 
  | 'BAJA_DANO' 
  | 'AJUSTE_AUDITORIA' 
  | 'ALQUILER_SALIDA' 
  | 'DEVOLUCION_ENTRADA';

export interface KardexEntity {
  id: string;
  equipo_id: number | string;
  tenant_id?: string;
  tipo_movimiento: TipoMovimientoKardex;
  cantidad_delta: number;
  stock_resultante: number;
  motivo?: string;
  referencia_documento?: string;
  usuario_id: string;
  creado_en?: string;
}
