'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';

export interface KardexItemUI {
  id: string | number;
  equipo_id: string | number;
  tipo_movimiento: string;
  cantidad_delta: number;
  stock_resultante: number;
  motivo: string;
  usuario_id: string;
  created_at: string;
}

/**
 * Server Action para consultar el historial inmutable de movimientos en Kardex de un equipo específico.
 * Retorna las transacciones ordenadas cronológicamente (más recientes primero).
 */
export async function obtenerKardexEquipoAction(equipoId: string | number, limite = 50) {
  try {
    const supabase = await createServerSupabaseClient();
    const numericEquipoId = typeof equipoId === 'string' ? parseInt(equipoId, 10) : equipoId;

    const { data, error } = await supabase
      .from('kardex_inventario')
      .select('*')
      .eq('equipo_id', numericEquipoId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('[Kardex Server Action] Error consultando kardex_inventario:', error);
      return { success: false, error: `Error al consultar kardex: ${error.message}` };
    }

    return { success: true, data: (data || []) as KardexItemUI[] };
  } catch (err: any) {
    console.error('[Kardex Server Action Exception]:', err);
    return { success: false, error: err.message || 'Error inesperado al consultar kardex' };
  }
}
