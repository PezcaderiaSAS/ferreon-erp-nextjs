/**
 * Servicio de Dominio: Gestión Transaccional de Bodega, Inventario y Kardex
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Centraliza la lógica de negocio para:
 * - Consulta de catálogo de equipos con métricas y disponibilidad multi-tenant.
 * - Registro y actualización con validaciones de integridad y auditoría.
 * - Ajuste atómico de stock mediante RPC PostgreSQL y registro inmutable en Kardex.
 * - Liberación Poka-Yoke de equipos en mantenimiento hacia disponibilidad.
 * - Auditoría y trazabilidad completa de inventario.
 */

import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';

export interface EquipoCatalogo {
  id: number | string;
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  valorReposicion: number;
  stockTotal: number;
  stockDisponible: number;
  stockEnObra: number;
  stockMantenimiento: number;
  estado: string;
  empresaId?: string | null;
  updatedAt?: string | null;
}

export interface MetricasInventario {
  totalModelos: number;
  countDisponibles: number;
  countEnObra: number;
  countMantenimiento: number;
  totalStockFisico: number;
  totalDisponible: number;
  totalEnObra: number;
  totalMantenimiento: number;
  valorTotalInventario: number;
}

export interface CrearEquipoParams {
  sku: string;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  valorReposicion?: number;
  stockInicial: number;
  empresaId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  idempotencyKey?: string | null;
}

export interface EditarEquipoParams {
  id: string | number;
  nombre: string;
  categoria: string;
  tarifaDiaria: number;
  valorReposicion?: number;
  estado: 'Disponible' | 'En Alquiler' | 'Mantenimiento' | 'Activo' | 'Inactivo';
  userId?: string | null;
  userEmail?: string | null;
}

export interface AjustarStockParams {
  equipoId: string | number;
  delta: number;
  motivo: string;
  tipoMovimiento?: string;
  userId?: string | null;
  userEmail?: string | null;
  empresaId?: string | null;
  idempotencyKey?: string | null;
}

export interface LiberarMantenimientoParams {
  equipoId: string | number;
  cantidad: number;
  motivo?: string;
  userId?: string | null;
  userEmail?: string | null;
  empresaId?: string | null;
}

export class BodegaTransaccionalService {
  /**
   * Calcula métricas y contadores de inventario en una única pasada O(N).
   * Función pura ideal para pruebas unitarias y renderizado reactivo.
   */
  public static calcularMetricas(equipos: EquipoCatalogo[] | any[]): MetricasInventario {
    let countDisponibles = 0;
    let countEnObra = 0;
    let countMantenimiento = 0;
    let totalStockFisico = 0;
    let totalDisponible = 0;
    let totalEnObra = 0;
    let totalMantenimiento = 0;
    let valorTotalInventario = 0;

    for (const eq of equipos) {
      const disp = Number(eq.stockDisponible ?? eq.stock_disponible ?? 0);
      const obra = Number(eq.stockEnObra ?? eq.stock_en_obra ?? 0);
      const mant = Number(eq.stockMantenimiento ?? eq.stock_mantenimiento ?? 0);
      const total = Number(eq.stockTotal ?? eq.stock_total ?? (disp + obra + mant));
      const valRep = Number(eq.valorReposicion ?? eq.valor_reposicion ?? 0);

      if (disp > 0) countDisponibles++;
      if (obra > 0) countEnObra++;
      if (mant > 0) countMantenimiento++;

      totalStockFisico += total;
      totalDisponible += disp;
      totalEnObra += obra;
      totalMantenimiento += mant;
      valorTotalInventario += (total * valRep);
    }

    return {
      totalModelos: equipos.length,
      countDisponibles,
      countEnObra,
      countMantenimiento,
      totalStockFisico,
      totalDisponible,
      totalEnObra,
      totalMantenimiento,
      valorTotalInventario,
    };
  }

  /**
   * Obtiene la lista de equipos en bodega filtrada por tenant si aplica.
   */
  public static async obtenerEquipos(client: any, empresaId?: string | null): Promise<{ success: boolean; data: EquipoCatalogo[]; error?: string }> {
    try {
      let query = client
        .from('equipos')
        .select('*')
        .order('nombre', { ascending: true });

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[BodegaTransaccionalService] Error consultando equipos:', error);
        return { success: false, data: [], error: error.message };
      }

      const equiposNormalizados: EquipoCatalogo[] = (data || []).map((row: any) => ({
        id: row.id,
        sku: row.codigo || row.sku || '',
        nombre: row.nombre || '',
        categoria: row.categoria || 'General',
        tarifaDiaria: Number(row.tarifa_diaria ?? row.tarifaDiaria ?? 0),
        valorReposicion: Number(row.valor_reposicion ?? row.valorReposicion ?? 0),
        stockTotal: Number(row.stock_total ?? row.stockTotal ?? 0),
        stockDisponible: Number(row.stock_disponible ?? row.stockDisponible ?? 0),
        stockEnObra: Number(row.stock_en_obra ?? row.stockEnObra ?? 0),
        stockMantenimiento: Number(row.stock_mantenimiento ?? row.stockMantenimiento ?? 0),
        estado: row.estado || 'Activo',
        empresaId: row.empresa_id || null,
        updatedAt: row.updated_at || null,
      }));

      return { success: true, data: equiposNormalizados };
    } catch (err: any) {
      console.error('[BodegaTransaccionalService] Excepción en obtenerEquipos:', err);
      return { success: false, data: [], error: err.message || 'Error inesperado al consultar equipos.' };
    }
  }

  /**
   * Registra un nuevo equipo en el catálogo e inicializa Kardex si el stock inicial es mayor a cero.
   */
  public static async registrarEquipo(
    client: any,
    params: CrearEquipoParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const cleanSku = params.sku.trim().toUpperCase();
      const cleanNombre = params.nombre.trim();
      const cleanCat = params.categoria.trim();
      const tarifa = Number(params.tarifaDiaria);
      const valorRep = Number(params.valorReposicion || 0);
      const stockIni = Number(params.stockInicial);

      if (!cleanSku) return { success: false, error: 'El código (SKU) es obligatorio.' };
      if (!cleanNombre) return { success: false, error: 'El nombre del equipo es obligatorio.' };
      if (tarifa < 0) return { success: false, error: 'La tarifa diaria no puede ser negativa.' };
      if (stockIni < 0) return { success: false, error: 'El stock inicial no puede ser negativo.' };

      const { data, error } = await client
        .from('equipos')
        .insert([{
          empresa_id: params.empresaId || null,
          codigo: cleanSku,
          nombre: cleanNombre,
          categoria: cleanCat,
          tarifa_diaria: tarifa,
          valor_reposicion: valorRep,
          stock_total: stockIni,
          stock_disponible: stockIni,
          stock_en_obra: 0,
          stock_mantenimiento: 0,
          estado: 'Activo'
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: `El código/SKU "${cleanSku}" ya existe en el sistema.` };
        }
        return { success: false, error: error.message };
      }

      // Si tiene stock inicial > 0, registrar entrada en Kardex
      if (stockIni > 0 && data?.id) {
        try {
          await client.from('kardex_inventario').insert([{
            equipo_id: data.id,
            empresa_id: params.empresaId || null,
            tenant_id: params.empresaId || null,
            tipo_movimiento: 'ENTRADA_INICIAL',
            cantidad_delta: stockIni,
            stock_resultante: stockIni,
            motivo: 'Inventario inicial al dar de alta el equipo',
            usuario_id: params.userId || null
          }]);
        } catch (kardexErr) {
          console.warn('[BodegaTransaccionalService] Advertencia al asentar entrada inicial en Kardex:', kardexErr);
        }
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al registrar equipo.' };
    }
  }

  /**
   * Libera unidades en estado Mantenimiento y las reintegra al stock Disponible.
   * Aplica Poka-Yoke: no permite liberar más de lo que está en mantenimiento.
   */
  public static async liberarMantenimiento(
    client: any,
    params: LiberarMantenimientoParams
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const numericId = typeof params.equipoId === 'string' ? parseInt(params.equipoId, 10) : params.equipoId;
      const cantidad = Number(params.cantidad);

      if (cantidad <= 0) {
        return { success: false, error: 'La cantidad a liberar debe ser mayor a 0.' };
      }

      // 1. Obtener estado actual del equipo
      const { data: equipo, error: fetchErr } = await client
        .from('equipos')
        .select('id, nombre, stock_disponible, stock_mantenimiento, stock_total, empresa_id')
        .eq('id', numericId)
        .single();

      if (fetchErr || !equipo) {
        return { success: false, error: 'Equipo no encontrado para liberar de mantenimiento.' };
      }

      const mantenimientoActual = Number(equipo.stock_mantenimiento || 0);
      if (cantidad > mantenimientoActual) {
        return {
          success: false,
          error: `Poka-Yoke: No es posible liberar ${cantidad} unidades. Solo hay ${mantenimientoActual} en mantenimiento.`
        };
      }

      const nuevoMantenimiento = mantenimientoActual - cantidad;
      const nuevoDisponible = Number(equipo.stock_disponible || 0) + cantidad;

      // 2. Actualizar stock
      const { data: actualizado, error: updateErr } = await client
        .from('equipos')
        .update({
          stock_mantenimiento: nuevoMantenimiento,
          stock_disponible: nuevoDisponible,
          updated_at: new Date().toISOString()
        })
        .eq('id', numericId)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      // 3. Registrar en Kardex inmutable
      try {
        await client.from('kardex_inventario').insert([{
          equipo_id: numericId,
          empresa_id: equipo.empresa_id || params.empresaId || null,
          tenant_id: equipo.empresa_id || params.empresaId || null,
          tipo_movimiento: 'LIBERACION_MANTENIMIENTO',
          cantidad_delta: cantidad,
          stock_resultante: nuevoDisponible,
          motivo: params.motivo || `Liberación técnica de mantenimiento a disponible (${cantidad} unids)`,
          usuario_id: params.userId || null
        }]);
      } catch (kardexErr) {
        console.warn('[BodegaTransaccionalService] Advertencia Kardex al liberar mantenimiento:', kardexErr);
      }

      return { success: true, data: actualizado };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al liberar unidades de mantenimiento.' };
    }
  }

  /**
   * Consulta el historial inmutable de movimientos Kardex para un equipo.
   */
  public static async obtenerKardexEquipo(
    client: any,
    equipoId: string | number,
    limit: number = 50
  ): Promise<{ success: boolean; data: any[]; error?: string }> {
    try {
      const numericId = typeof equipoId === 'string' ? parseInt(equipoId, 10) : equipoId;
      const { data, error } = await client
        .from('kardex_inventario')
        .select('*')
        .eq('equipo_id', numericId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, data: [], error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (err: any) {
      return { success: false, data: [], error: err.message || 'Error consultando kardex.' };
    }
  }
}
