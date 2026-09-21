'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { Redis } from '@upstash/redis';

// Tipos de entrada para Server Action
export interface ItemDevolucionActionInput {
  detalleId: number | string;
  cantidadDevuelta: number;
  estadoInspeccion: 'BUENO' | 'MANTENIMIENTO' | 'PERDIDA_TOTAL';
  costoReparacion?: number;
  valorReposicion?: number;
  descripcionDano?: string;
}

export interface ProcesarDevolucionAvanzadaInput {
  alquilerId: number | string;
  items: ItemDevolucionActionInput[];
  metodoPago?: string;
  sesionCajaId?: string;
  observaciones?: string;
  idempotencyKey?: string;
}

const ItemDevolucionZodSchema = z.object({
  detalleId: z.union([z.string(), z.number()]),
  cantidadDevuelta: z.coerce.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  estadoInspeccion: z.enum(['BUENO', 'MANTENIMIENTO', 'PERDIDA_TOTAL']).default('BUENO'),
  costoReparacion: z.coerce.number().min(0).optional().default(0),
  valorReposicion: z.coerce.number().min(0).optional().default(0),
  descripcionDano: z.string().optional().nullable(),
});

const ProcesarDevolucionAvanzadaZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  items: z.array(ItemDevolucionZodSchema).min(1, 'Debe incluir al menos un ítem devuelto'),
  metodoPago: z.string().optional().default('EFECTIVO'),
  sesionCajaId: z.string().uuid().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
});

/**
 * Invalidar caché multi-tenant en Redis
 */
async function invalidarCacheDevoluciones(tenantId?: string | null) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return;
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const prefix = tenantId ? `tenant:${tenantId}:` : '';
    await Promise.allSettled([
      redis.del(`${prefix}alquileres`),
      redis.del(`${prefix}equipos`),
      redis.del(`${prefix}subcontrataciones`),
      redis.del(`${prefix}devoluciones`),
      redis.del('cache:equipos')
    ]);
  } catch (err) {
    console.warn('[invalidarCacheDevoluciones] Fallo al limpiar caché en Redis:', err);
  }
}

/**
 * Server Action principal: Procesa la devolución avanzada con Split-Line, clasificación de stock,
 * liquidación de garantías, integración a Caja e Idempotencia garantizada.
 */
export async function procesarDevolucionAvanzadaAction(input: ProcesarDevolucionAvanzadaInput) {
  const validation = validateActionInput(input, ProcesarDevolucionAvanzadaZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de devolución inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'OPERADOR_SISTEMA';

  const numericAlquilerId = typeof cleanInput.alquilerId === 'string'
    ? parseInt(cleanInput.alquilerId, 10)
    : cleanInput.alquilerId;

  // 1. Preparar payload para la función RPC atómica en PostgreSQL
  const payloadRPC = {
    alquiler_id: numericAlquilerId,
    idempotency_key: cleanInput.idempotencyKey || null,
    recibido_por: userIdentifier,
    observaciones: cleanInput.observaciones || null,
    sesion_caja_id: cleanInput.sesionCajaId || null,
    metodo_pago: cleanInput.metodoPago || 'EFECTIVO',
    items: cleanInput.items.map(item => ({
      detalle_id: typeof item.detalleId === 'string' ? parseInt(item.detalleId, 10) : item.detalleId,
      cantidad_devuelta: item.cantidadDevuelta,
      estado_inspeccion: item.estadoInspeccion,
      costo_reparacion: item.costoReparacion || 0,
      valor_reposicion: item.valorReposicion || 0,
      descripcion_dano: item.descripcionDano || null
    }))
  };

  // 2. Ejecutar procedimiento almacenado atómico con bloqueo pesimista
  const { data: resultRPC, error: errRPC } = await supabase.rpc('procesar_devolucion_avanzada', {
    p_payload: payloadRPC
  });

  if (errRPC) {
    console.error('[procesarDevolucionAvanzadaAction] Error en RPC procesar_devolucion_avanzada:', errRPC);
    return { 
      success: false, 
      error: `Error al procesar devolución en base de datos: ${errRPC.message || JSON.stringify(errRPC)}` 
    };
  }

  // 3. Impacto en Caja (Sesión activa) si aplica resolución de saldo en efectivo
  const saldoNeto = Number(resultRPC?.saldo_neto) || 0;
  const tipoResolucion = resultRPC?.tipo_resolucion;

  if (cleanInput.sesionCajaId && cleanInput.metodoPago === 'EFECTIVO' && saldoNeto !== 0 && !resultRPC?.idempotent) {
    try {
      const { data: sesionActiva } = await supabase
        .from('sesiones_caja')
        .select('id, estado, empresa_id, usuario_id')
        .eq('id', cleanInput.sesionCajaId)
        .single();

      if (sesionActiva && sesionActiva.estado === 'ABIERTA') {
        const esReembolso = tipoResolucion === 'REEMBOLSO_CLIENTE';
        const tipoMov = esReembolso ? 'EGRESO' : 'INGRESO';
        const montoMov = Math.abs(saldoNeto);
        const motivoMov = esReembolso 
          ? `Reembolso garantía por devolución contrato ID ${numericAlquilerId} (${resultRPC.consecutivo})`
          : `Cobro excedente alquiler/daños por devolución contrato ID ${numericAlquilerId} (${resultRPC.consecutivo})`;

        const { data: nuevoMov } = await supabase
          .from('movimientos_caja')
          .insert({
            tenant_id: user?.id || null,
            empresa_id: sesionActiva.empresa_id,
            sesion_caja_id: cleanInput.sesionCajaId,
            usuario_id: user?.id || sesionActiva.usuario_id,
            tipo: tipoMov,
            monto: montoMov,
            concepto: motivoMov,
            beneficiario: 'CLIENTE',
            comprobante: resultRPC.consecutivo || 'DEV_GARANTIA'
          })
          .select('id')
          .single();

        // Enlazar movimiento de caja con la devolución
        if (nuevoMov?.id && resultRPC?.devolucion_id) {
          await supabase
            .from('devoluciones')
            .update({ movimiento_caja_id: nuevoMov.id })
            .eq('id', resultRPC.devolucion_id);
        }
      }
    } catch (cajaErr) {
      console.warn('[procesarDevolucionAvanzadaAction] Advertencia registrando movimiento en caja:', cajaErr);
    }
  }

  // 4. Registro de Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'DEVOLUCIONES',
    accion: 'PROCESAR_DEVOLUCION_AVANZADA',
    descripcion: `Devolución ${resultRPC?.consecutivo || ''} procesada para contrato ID ${numericAlquilerId}. Saldo neto: ${saldoNeto} COP (${tipoResolucion})`,
    entidadId: numericAlquilerId,
    detalles: {
      alquilerId: numericAlquilerId,
      consecutivoDevolucion: resultRPC?.consecutivo,
      devolucionId: resultRPC?.devolucion_id,
      saldoNeto,
      tipoResolucion,
      idempotente: resultRPC?.idempotent || false,
      finalizado: resultRPC?.finalizado || false,
      itemsCount: cleanInput.items.length
    }
  });

  // 5. Invalidar Caché Distribuida
  await invalidarCacheDevoluciones(user?.id);

  // 6. Revalidar rutas en Next.js
  revalidatePath('/devoluciones');
  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  revalidatePath('/subcontrataciones');
  revalidatePath('/caja');

  return {
    success: true,
    data: resultRPC
  };
}

/**
 * Obtiene el historial de devoluciones procesadas con soporte para filtrado por alquiler
 */
export async function obtenerHistorialDevolucionesAction(alquilerId?: number | string) {
  const supabase = await createServerSupabaseClient();
  
  let query = supabase
    .from('devoluciones')
    .select(`
      id,
      consecutivo,
      alquiler_id,
      fecha_devolucion,
      total_alquiler_liquidado,
      total_danos,
      total_reposiciones,
      deposito_aplicado,
      saldo_neto,
      tipo_resolucion,
      metodo_pago,
      recibido_por,
      observaciones,
      devolucion_detalles (
        id,
        equipo_id,
        cantidad_devuelta,
        estado_inspeccion,
        costo_reparacion,
        valor_reposicion,
        descripcion_dano,
        dias_efectivos_cobrados,
        tarifa_diaria_aplicada,
        subtotal_alquiler,
        equipos (nombre, codigo)
      ),
      alquileres (consecutivo, clientes (nombre, nit_cedula))
    `)
    .order('fecha_devolucion', { ascending: false });

  if (alquilerId) {
    const numId = typeof alquilerId === 'string' ? parseInt(alquilerId, 10) : alquilerId;
    query = query.eq('alquiler_id', numId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[obtenerHistorialDevolucionesAction] Error consultando devoluciones:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: data || []
  };
}
