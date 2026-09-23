'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import {
  ComprasTransaccionalService,
  ItemCompraParam,
} from '@/core/services/compras-transaccional.service';

/**
 * Revalidación segura compatible con Server Actions y tests unitarios
 */
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignorado en entorno de pruebas unitarias sin RequestStore de Next.js
  }
}

// ----------------------------------------------------------------------------
// Interfaces y DTOs de Entrada
// ----------------------------------------------------------------------------

export interface ItemCompraInput {
  equipoId: number | string;
  cantidad: number;
  precioUnitario: number;
}

export interface CrearCompraInput {
  numeroOrden?: string;
  proveedorId?: string;
  proveedorNombre: string;
  proveedorNit?: string;
  proveedorTelefono?: string;
  proveedorEmail?: string;
  fechaCompra?: string;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  modoIngreso?: 'INMEDIATO' | 'ORDEN_RECEPCION';
  remisionProveedor?: string;
  fleteTotal?: number;
  observaciones?: string;
  aplicaIva?: boolean;
  aplicaRetefuente?: boolean;
  porcentajeRetefuente?: number;
  aplicaReteica?: boolean;
  porcentajeReteica?: number;
  items: ItemCompraInput[];
}

export interface RecibirMercanciaInput {
  compraId: string;
  remisionFactura?: string;
  observacionesBodega?: string;
  idempotencyKey?: string;
}

export interface CompraDetalleUI {
  id: string;
  equipo_id: number;
  equipo_nombre?: string;
  cantidad: number;
  cantidad_recibida?: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CompraUI {
  id: string;
  numero_orden: string;
  proveedor_id?: string;
  proveedor_nombre: string;
  proveedor_nit?: string;
  proveedor_telefono?: string;
  proveedor_email?: string;
  fecha_compra: string;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO';
  subtotal: number;
  impuestos: number;
  total: number;
  aplica_iva?: boolean;
  valor_iva?: number;
  aplica_retefuente?: boolean;
  porcentaje_retefuente?: number;
  valor_retefuente?: number;
  aplica_reteica?: boolean;
  porcentaje_reteica?: number;
  valor_reteica?: number;
  neto_pagar: number;
  estado: string;
  observaciones?: string;
  remision_factura_proveedor?: string;
  fecha_recepcion_bodega?: string;
  bodeguero_id?: string;
  transaction_id?: string;
  created_at: string;
  detalles?: CompraDetalleUI[];
}

// ----------------------------------------------------------------------------
// Esquemas de Validación Zod
// ----------------------------------------------------------------------------

const ItemCompraZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1 unidad'),
  precioUnitario: z.coerce.number().min(0, 'El precio unitario no puede ser negativo'),
}).passthrough();

const CrearCompraZodSchema = z.object({
  numeroOrden: z.string().optional().nullable(),
  proveedorId: z.string().optional().nullable(),
  proveedorNombre: z.string().min(2, 'El nombre del proveedor es obligatorio'),
  proveedorNit: z.string().optional().nullable(),
  proveedorTelefono: z.string().optional().nullable(),
  proveedorEmail: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  fechaCompra: z.string().optional().nullable(),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'CREDITO']),
  modoIngreso: z.enum(['INMEDIATO', 'ORDEN_RECEPCION']).optional().default('INMEDIATO'),
  remisionProveedor: z.string().optional().nullable(),
  fleteTotal: z.coerce.number().min(0).optional().default(0),
  observaciones: z.string().optional().nullable(),
  aplicaIva: z.boolean().optional().default(false),
  aplicaRetefuente: z.boolean().optional().default(false),
  porcentajeRetefuente: z.coerce.number().min(0).optional().default(0),
  aplicaReteica: z.boolean().optional().default(false),
  porcentajeReteica: z.coerce.number().min(0).optional().default(0),
  items: z.array(ItemCompraZodSchema).min(1, 'Debe incluir al menos un equipo en la compra'),
}).passthrough();

const RecibirMercanciaZodSchema = z.object({
  compraId: z.string().uuid('ID de compra inválido'),
  remisionFactura: z.string().optional().nullable(),
  observacionesBodega: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
}).passthrough();

// ----------------------------------------------------------------------------
// Server Actions Delgadas
// ----------------------------------------------------------------------------

/**
 * Server Action: Registro de Compras de Maquinaria y Sincronización WMS
 */
export async function crearCompraAction(input: CrearCompraInput) {
  try {
    const validation = validateActionInput(input, CrearCompraZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de compra inválidos' };
    }
    const cleanInput = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;
    const userEmail = user?.email;

    const supabaseAdmin = createAdminSupabaseClient();
    let tenantId: string | null = null;
    if (userId) {
      const { data: empUser } = await supabaseAdmin
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('estado', 'ACTIVO')
        .maybeSingle();
      tenantId = empUser?.empresa_id || null;
    }

    // Delegación al servicio de dominio puro
    const result = await ComprasTransaccionalService.registrarCompra(supabaseAdmin, {
      ...cleanInput,
      proveedorNombre: String(cleanInput.proveedorNombre || ''),
      metodoPago: cleanInput.metodoPago,
      items: cleanInput.items as ItemCompraParam[],
      tenantId,
      userId,
      userEmail,
    });

    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Error al procesar la compra' };
    }

    const { compraId, numeroOrden, total, netoPagar, estado, transactionId, nuevaCompraObjeto } = result.data;

    // Actualizar caché Redis
    const cacheKeyCompras = `compras:${tenantId || 'global'}`;
    if (redis) {
      try {
        const cachedRaw = await redis.get<string>(cacheKeyCompras);
        const lista: CompraUI[] = cachedRaw
          ? (typeof cachedRaw === 'string' ? JSON.parse(cachedRaw) : cachedRaw)
          : [];
        lista.unshift(nuevaCompraObjeto);
        await redis.set(cacheKeyCompras, JSON.stringify(lista.slice(0, 100)), { ex: 86400 });
        await redis.del('cache:equipos');
      } catch (redisErr) {
        console.warn('[crearCompraAction] Error actualizando Redis:', redisErr);
      }
    }

    // Auditoría Inmutable
    AuditLogger.logAsync({
      modulo: 'BODEGA',
      accion: 'REGISTRAR_COMPRA',
      descripcion: `Compra registrada: ${numeroOrden} por valor de $${total.toLocaleString('es-CO')} (Modo: ${cleanInput.modoIngreso})`,
      entidadId: compraId,
      detalles: {
        numeroOrden,
        proveedor: cleanInput.proveedorNombre,
        metodoPago: cleanInput.metodoPago,
        modoIngreso: cleanInput.modoIngreso,
        total,
        netoPagar,
        transactionId,
      },
      userId,
      userEmail,
    });

    safeRevalidatePath('/compras');
    safeRevalidatePath('/bodega');
    safeRevalidatePath('/facturacion');
    safeRevalidatePath('/');

    return {
      success: true,
      data: {
        compraId,
        numeroOrden,
        total,
        netoPagar,
        estado,
        transactionId,
      },
    };
  } catch (error: any) {
    console.error('[crearCompraAction Exception]:', error);
    return { success: false, error: error.message || 'Error inesperado al registrar compra' };
  }
}

/**
 * Server Action: Confirmar Recepción Física de Mercancía en Bodega
 */
export async function recibirMercanciaEnBodegaAction(input: RecibirMercanciaInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validation = validateActionInput(input, RecibirMercanciaZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de recepción inválidos' };
    }
    const clean = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();

    // Delegación al servicio de dominio puro
    const result = await ComprasTransaccionalService.recibirMercancia(supabaseAdmin, {
      compraId: clean.compraId,
      remisionFactura: clean.remisionFactura,
      observacionesBodega: clean.observacionesBodega,
      userId,
    });

    if (!result.success) {
      return { success: false, error: result.error || 'Error al procesar recepción en bodega' };
    }

    // Invalidar caché Redis
    if (redis) {
      try {
        await redis.del('cache:equipos');
        const keys = await redis.keys('compras:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (redisErr) {
        console.warn('[recibirMercanciaEnBodegaAction] Error invalidando Redis:', redisErr);
      }
    }

    AuditLogger.logAsync({
      modulo: 'BODEGA',
      accion: 'RECEPCION_MERCANCIA',
      descripcion: `Mercancía recibida en bodega para compra ID: ${clean.compraId}`,
      entidadId: clean.compraId,
      detalles: {
        compraId: clean.compraId,
        remision: clean.remisionFactura,
        rpcRes: result.data,
      },
      userId,
      userEmail: user?.email,
    });

    safeRevalidatePath('/compras');
    safeRevalidatePath('/bodega');
    safeRevalidatePath('/');

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[recibirMercanciaEnBodegaAction Exception]:', error);
    return { success: false, error: error.message || 'Error inesperado al recibir mercancía' };
  }
}

/**
 * Server Action: Consulta de Compras con Ítems para SSR / RSC y Caché
 */
export async function obtenerComprasAction(limite = 50): Promise<{ success: boolean; data?: CompraUI[]; error?: string }> {
  try {
    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const userId = user?.id;

    const supabaseAdmin = createAdminSupabaseClient();
    let tenantId: string | null = null;
    if (userId) {
      const { data: empUser } = await supabaseAdmin
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', userId)
        .eq('estado', 'ACTIVO')
        .maybeSingle();
      tenantId = empUser?.empresa_id || null;
    }

    const cacheKeyCompras = `compras:${tenantId || 'global'}`;

    // 1. Intentar consultar base de datos
    try {
      const { data: compras, error } = await supabaseAdmin
        .from('compras')
        .select(`
          *,
          compras_detalles (
            id,
            equipo_id,
            cantidad,
            precio_unitario,
            subtotal,
            equipos (
              id,
              nombre,
              codigo
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limite);

      if (!error && compras) {
        const comprasFormateadas: CompraUI[] = compras.map((c: any) => ({
          id: c.id,
          numero_orden: c.numero_orden,
          proveedor_id: c.proveedor_id,
          proveedor_nombre: c.proveedor_nombre,
          proveedor_nit: c.proveedor_nit,
          proveedor_telefono: c.proveedor_telefono,
          proveedor_email: c.proveedor_email,
          fecha_compra: c.fecha_compra,
          metodo_pago: c.metodo_pago,
          subtotal: Number(c.subtotal || 0),
          impuestos: Number(c.impuestos || 0),
          total: Number(c.total || 0),
          aplica_iva: Boolean(c.aplica_iva),
          valor_iva: Number(c.valor_iva || c.impuestos || 0),
          aplica_retefuente: Boolean(c.aplica_retefuente),
          porcentaje_retefuente: Number(c.porcentaje_retefuente || 0),
          valor_retefuente: Number(c.valor_retefuente || 0),
          aplica_reteica: Boolean(c.aplica_reteica),
          porcentaje_reteica: Number(c.porcentaje_reteica || 0),
          valor_reteica: Number(c.valor_reteica || 0),
          neto_pagar: Number(c.neto_pagar || c.total || 0),
          estado: c.estado,
          observaciones: c.observaciones,
          transaction_id: c.transaction_id,
          created_at: c.created_at,
          detalles: (c.compras_detalles || []).map((d: any) => ({
            id: d.id,
            equipo_id: d.equipo_id,
            equipo_nombre: d.equipos?.nombre || `Equipo #${d.equipo_id}`,
            cantidad: d.cantidad,
            precio_unitario: Number(d.precio_unitario),
            subtotal: Number(d.subtotal),
          })),
        }));

        if (redis) {
          try {
            await redis.set(cacheKeyCompras, JSON.stringify(comprasFormateadas), { ex: 3600 });
          } catch {}
        }

        return { success: true, data: comprasFormateadas };
      }
    } catch (dbErr) {
      console.warn('[obtenerComprasAction] Consultando caché por fallback:', dbErr);
    }

    // 2. Fallback en caché de Redis
    if (redis) {
      try {
        const cached = await redis.get<string>(cacheKeyCompras);
        if (cached) {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (Array.isArray(parsed)) {
            return { success: true, data: parsed as CompraUI[] };
          }
        }
      } catch {}
    }

    return { success: true, data: [] };
  } catch (error: any) {
    console.error('[obtenerComprasAction Error]:', error);
    return { success: false, data: [], error: error.message || 'Error al obtener compras' };
  }
}
