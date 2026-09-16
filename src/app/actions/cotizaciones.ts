'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '../../lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface CotizacionItemInput {
  equipoId: string | number;
  nombre?: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
}

export interface CrearCotizacionInput {
  clienteId?: string | number | null;
  clienteNombre: string;
  clienteDocumento?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  fechaEmision?: string;
  fechaVencimiento?: string;
  obraNombre?: string;
  obraDireccion?: string;
  
  // Parámetros de Impuestos Seleccionables
  aplicaIva?: boolean;
  tasaIva?: number;
  aplicaRetefuente?: boolean;
  tasaRetefuente?: number;
  aplicaReteica?: boolean;
  tasaReteica?: number;

  valorTransporte?: number;
  depositoGarantia?: number;
  observaciones?: string;
  items: CotizacionItemInput[];
}

export interface ConvertirCotizacionInput {
  cotizacionId: string;
  idempotencyKey?: string;
  detallesLogistica?: string;
}

const CotizacionItemZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]),
  nombre: z.string().optional().nullable(),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  dias: z.coerce.number().int().min(1, 'La duración debe ser de al menos 1 día'),
  tarifaDiaria: z.coerce.number().min(0, 'La tarifa diaria debe ser mayor o igual a cero'),
}).passthrough();

const CrearCotizacionZodSchema = z.object({
  clienteId: z.union([z.string(), z.number()]).nullable().optional(),
  clienteNombre: z.string().min(2, 'El nombre del cliente o razón social es obligatorio'),
  clienteDocumento: z.string().optional().nullable(),
  clienteTelefono: z.string().optional().nullable(),
  clienteEmail: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  fechaEmision: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
  obraNombre: z.string().optional().nullable(),
  obraDireccion: z.string().optional().nullable(),

  aplicaIva: z.boolean().default(true),
  tasaIva: z.coerce.number().min(0).default(19.0),
  aplicaRetefuente: z.boolean().default(false),
  tasaRetefuente: z.coerce.number().min(0).default(2.5),
  aplicaReteica: z.boolean().default(false),
  tasaReteica: z.coerce.number().min(0).default(0.966),

  valorTransporte: z.coerce.number().min(0).default(0),
  depositoGarantia: z.coerce.number().min(0).default(0),
  observaciones: z.string().optional().nullable(),
  items: z.array(CotizacionItemZodSchema).min(1, 'Debe incluir al menos un equipo en la cotización'),
}).passthrough();

/**
 * Genera un código consecutivo amigable y correlativo único (ej: COT-1001)
 */
async function generarConsecutivoCotizacion(supabase: any): Promise<string> {
  try {
    const { count, error } = await supabase
      .from('cotizaciones')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    const siguiente = (count || 0) + 1;
    return `COT-${String(siguiente).padStart(4, '0')}`;
  } catch (err) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `COT-${randomSuffix}`;
  }
}

/**
 * Server Action: Crear Cotización de Obra con Desglose Tributario Seleccionable
 */
export async function crearCotizacionAction(input: CrearCotizacionInput) {
  const validation = validateActionInput(input, CrearCotizacionZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de cotización inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Cálculo Riguroso de Subtotales por Línea
  let subtotal = 0;
  const itemsCalculados = cleanInput.items.map(item => {
    const numericEquipoId = typeof item.equipoId === 'string' ? parseInt(item.equipoId, 10) : item.equipoId;
    const subtotalLinea = Math.round(item.cantidad * item.dias * item.tarifaDiaria);
    subtotal += subtotalLinea;

    return {
      equipo_id: numericEquipoId,
      cantidad: item.cantidad,
      dias: item.dias,
      tarifa_diaria: item.tarifaDiaria,
      subtotal: subtotalLinea
    };
  });

  // 2. Cálculo Tributario Exacto
  const valorIva = cleanInput.aplicaIva 
    ? Math.round(subtotal * (cleanInput.tasaIva / 100)) 
    : 0;
  
  const valorRetefuente = cleanInput.aplicaRetefuente 
    ? Math.round(subtotal * (cleanInput.tasaRetefuente / 100)) 
    : 0;

  const valorReteica = cleanInput.aplicaReteica 
    ? Math.round(subtotal * (cleanInput.tasaReteica / 100)) 
    : 0;

  const valorTransporte = Number(cleanInput.valorTransporte || 0);
  const depositoGarantia = Number(cleanInput.depositoGarantia || 0);

  // Total Neto = Subtotal + Transporte + IVA - Retenciones
  const total = subtotal + valorTransporte + valorIva - valorRetefuente - valorReteica;

  const consecutivo = await generarConsecutivoCotizacion(supabase);
  const numericClienteId = cleanInput.clienteId ? (typeof cleanInput.clienteId === 'string' ? parseInt(cleanInput.clienteId, 10) : cleanInput.clienteId) : null;

  // 3. Inserción en Tabla `cotizaciones`
  const { data: cotizacion, error: cotErr } = await supabase
    .from('cotizaciones')
    .insert([{
      consecutivo,
      cliente_id: numericClienteId,
      cliente_nombre: cleanInput.clienteNombre.trim(),
      cliente_documento: cleanInput.clienteDocumento?.trim() || '',
      cliente_telefono: cleanInput.clienteTelefono?.trim() || '',
      cliente_email: cleanInput.clienteEmail?.trim() || '',
      fecha_emision: cleanInput.fechaEmision || new Date().toISOString().split('T')[0],
      fecha_vencimiento: cleanInput.fechaVencimiento || null,
      obra_nombre: cleanInput.obraNombre?.trim() || '',
      obra_direccion: cleanInput.obraDireccion?.trim() || '',

      aplica_iva: cleanInput.aplicaIva,
      tasa_iva: cleanInput.tasaIva,
      valor_iva: valorIva,

      aplica_retefuente: cleanInput.aplicaRetefuente,
      tasa_retefuente: cleanInput.tasaRetefuente,
      valor_retefuente: valorRetefuente,

      aplica_reteica: cleanInput.aplicaReteica,
      tasa_reteica: cleanInput.tasaReteica,
      valor_reteica: valorReteica,

      subtotal,
      valor_transporte: valorTransporte,
      deposito_garantia: depositoGarantia,
      total,

      estado: 'BORRADOR',
      observaciones: cleanInput.observaciones || '',
      created_by: user?.id || null,
    }])
    .select()
    .single();

  if (cotErr || !cotizacion) {
    console.error('Error insertando cotización:', cotErr);
    return { success: false, error: `Error al crear cotización en BD: ${cotErr?.message || JSON.stringify(cotErr)}` };
  }

  // 4. Inserción de Detalles de Cotización
  const detallesPayload = itemsCalculados.map(it => ({
    cotizacion_id: cotizacion.id,
    equipo_id: it.equipo_id,
    cantidad: it.cantidad,
    dias: it.dias,
    tarifa_diaria: it.tarifa_diaria,
    subtotal: it.subtotal
  }));

  const { error: detErr } = await supabase
    .from('cotizaciones_detalles')
    .insert(detallesPayload);

  if (detErr) {
    console.error('Error insertando detalles de cotización:', detErr);
    // Intentar rollback de la cabecera para mantener consistencia
    await supabase.from('cotizaciones').delete().eq('id', cotizacion.id);
    return { success: false, error: `Error al guardar los ítems de la cotización: ${detErr.message}` };
  }

  // 5. Auditoría
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'CREAR_COTIZACION',
    descripcion: `Cotización ${consecutivo} creada para cliente ${cleanInput.clienteNombre}. Total: $${total.toLocaleString('es-CO')}`,
    entidadId: cotizacion.id,
    detalles: {
      consecutivo,
      clienteNombre: cleanInput.clienteNombre,
      subtotal,
      valorIva,
      valorRetefuente,
      valorReteica,
      total,
      itemsCount: itemsCalculados.length,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // 6. Invalidación de Caché y Revalidación
  try {
    await invalidateTenantCache(user?.id, ['cotizaciones', 'alquileres']);
  } catch (cErr) {
    console.warn('[crearCotizacionAction] Cache clear warning:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/cotizaciones');
  return { success: true, data: cotizacion };
}

/**
 * Server Action: Obtener Cotizaciones con Detalles y Relaciones
 */
export async function obtenerCotizacionesAction(filtros?: { estado?: string; clienteId?: string | number }) {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('cotizaciones')
      .select(`
        *,
        cotizaciones_detalles (
          id,
          equipo_id,
          cantidad,
          dias,
          tarifa_diaria,
          subtotal,
          equipos (
            id,
            nombre,
            codigo,
            categoria,
            stock_disponible
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (filtros?.estado && filtros.estado !== 'TODOS') {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.clienteId) {
      const numId = typeof filtros.clienteId === 'string' ? parseInt(filtros.clienteId, 10) : filtros.clienteId;
      query = query.eq('cliente_id', numId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error consultando cotizaciones:', error);
      return { success: false, error: `Error al consultar cotizaciones: ${error.message}` };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Excepción en obtenerCotizacionesAction:', err);
    return { success: false, error: err.message || 'Error inesperado al consultar cotizaciones' };
  }
}

/**
 * Server Action: Obtener una cotización específica por ID
 */
export async function obtenerCotizacionPorIdAction(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        cotizaciones_detalles (
          id,
          equipo_id,
          cantidad,
          dias,
          tarifa_diaria,
          subtotal,
          equipos (
            id,
            nombre,
            codigo,
            categoria,
            stock_disponible,
            precio_dia
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { success: false, error: `Cotización no encontrada: ${error?.message || ''}` };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al obtener la cotización' };
  }
}

/**
 * Server Action: Actualizar el estado de una cotización (BORRADOR, ENVIADA, APROBADA, RECHAZADA)
 */
export async function actualizarEstadoCotizacionAction(id: string, nuevoEstado: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cotizaciones')
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Error al actualizar estado de cotización: ${error.message}` };
    }

    AuditLogger.logAsync({
      modulo: 'ALQUILERES',
      accion: 'ACTUALIZAR_ESTADO_COTIZACION',
      descripcion: `Cotización ${data.consecutivo} cambió a estado ${nuevoEstado}`,
      entidadId: id,
      detalles: { nuevoEstado, consecutivo: data.consecutivo },
      userId: user?.id,
    });

    revalidatePath('/cotizaciones');
    revalidatePath('/alquileres');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar cotización' };
  }
}

/**
 * Server Action: CONVERSIÓN POKA-YOKE 1-CLIC DE COTIZACIÓN A CONTRATO DE ALQUILER
 * Ejecuta el procedimiento SQL atómico con bloqueo pesimista ordenado (ORDER BY id ASC FOR UPDATE)
 * en base de datos para prevenir sobreventas y deadlocks concurrentes de forma absoluta.
 */
export async function convertirCotizacionAContratoAction(input: ConvertirCotizacionInput) {
  try {
    if (!input.cotizacionId) {
      return { success: false, error: 'El ID de la cotización es obligatorio para la conversión.' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';
    const idempotencyKey = input.idempotencyKey || `conv_cot_${input.cotizacionId}_${Date.now()}`;

    // 1. Invocar el procedimiento SQL atómico en Supabase con bloqueo pesimista
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('convertir_cotizacion_a_alquiler_transaccional', {
      p_payload: {
        cotizacion_id: input.cotizacionId,
        idempotency_key: idempotencyKey,
        usuario_id: user?.id,
        detalles_logistica: input.detallesLogistica || ''
      }
    });

    if (rpcErr) {
      console.error('[convertirCotizacionAContratoAction] Error RPC Supabase:', rpcErr);
      const errMsg = rpcErr.message || '';

      if (errMsg.includes('STOCK_INSUFICIENTE')) {
        return {
          success: false,
          esErrorStock: true,
          error: `[POKA-YOKE INVENTARIO] ${errMsg.replace('STOCK_INSUFICIENTE:', '').trim()}. Puede derivar las unidades faltantes a Subcontratación con Proveedor Aliado o ajustar el pedido.`
        };
      }

      return {
        success: false,
        error: `Error al formalizar contrato en base de datos: ${errMsg}`
      };
    }

    const nuevoAlquilerId = rpcRes?.alquiler_id;
    const consecutivoAlquiler = rpcRes?.consecutivo;
    const consecutivoCotizacion = rpcRes?.cotizacion_consecutivo;

    // 2. Registro de Auditoría Inmutable
    AuditLogger.logAsync({
      modulo: 'ALQUILERES',
      accion: 'CONVERTIR_COTIZACION_A_CONTRATO',
      descripcion: `Cotización ${consecutivoCotizacion} convertida formalmente en Contrato ALQ-${consecutivoAlquiler || nuevoAlquilerId}. Idempotente: ${!!rpcRes?.idempotent}`,
      entidadId: String(nuevoAlquilerId),
      detalles: {
        cotizacionId: input.cotizacionId,
        alquilerId: nuevoAlquilerId,
        consecutivoAlquiler,
        consecutivoCotizacion,
        idempotencyKey,
        idempotente: !!rpcRes?.idempotent,
        total: rpcRes?.total
      },
      userId: user?.id,
      userEmail: user?.email,
    });

    // 3. Limpieza de Caché y Revalidación Reactiva de Rutas
    try {
      await invalidateTenantCache(user?.id, ['cotizaciones', 'alquileres', 'equipos']);
    } catch (cErr) {
      console.warn('[convertirCotizacionAContratoAction] Cache clear warning:', cErr);
    }

    revalidatePath('/alquileres');
    revalidatePath('/cotizaciones');
    revalidatePath('/bodega');

    return {
      success: true,
      data: {
        alquilerId: nuevoAlquilerId,
        consecutivo: consecutivoAlquiler,
        cotizacionConsecutivo: consecutivoCotizacion,
        idempotent: !!rpcRes?.idempotent
      }
    };
  } catch (err: any) {
    console.error('Excepción crítica en convertirCotizacionAContratoAction:', err);
    return {
      success: false,
      error: err.message || 'Error inesperado durante la formalización del contrato'
    };
  }
}
