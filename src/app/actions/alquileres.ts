'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '../../lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import {
  AlquilerTransaccionalService,
  ItemAlquilerCalculoInput,
  DevolucionItemParams,
} from '@/core/services/alquiler-transaccional.service';

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

export interface AlquilerItemInput {
  itemId: string | number;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  esSubcontratado?: boolean | null;
  proveedorSubcontratadoId?: string | null;
  costoDiarioProveedor?: number | null;
}

export interface CrearAlquilerInput {
  clienteId: string | number;
  clienteNombre?: string;
  fechaRegistro?: string;
  fleteEntrega: number;
  fleteRecogida: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: AlquilerItemInput[];
  estado?: string;
  idempotency_key?: string;
}

export interface EditarAlquilerInput {
  alquilerId: string | number;
  clienteId?: string | number;
  clienteNombre?: string;
  fechaRegistro?: string;
  fleteEntrega: number;
  fleteRecogida: number;
  deposito: number;
  garantiaMonto: number;
  garantiaTipo: string;
  observaciones?: string;
  detallesLogistica?: string;
  items: AlquilerItemInput[];
  estado?: string;
}

export interface DevolucionItemInput {
  detalleId: string | number;
  cantidadDevuelta: number;
  costoDano?: number;
}

export interface ProcesarDevolucionInput {
  alquilerId: string | number;
  devoluciones: DevolucionItemInput[];
}

export interface AprobarCotizacionInput {
  alquilerId: string | number;
  fleteEntrega?: number;
  fleteRecogida?: number;
  deposito?: number;
  fechaInicioGlobal?: string;
}

export interface RegistrarAbonoInput {
  alquilerId: string | number;
  montoAbono: number;
  metodoPago?: string;
  referencia?: string;
}

// ----------------------------------------------------------------------------
// Esquemas de Validación Zod
// ----------------------------------------------------------------------------

const AlquilerItemZodSchema = z.object({
  itemId: z.union([z.string(), z.number()]),
  nombreItem: z.string().optional().nullable(),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  tarifaAplicada: z.coerce.number().min(0, 'La tarifa debe ser mayor o igual a cero'),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFinEstimada: z.string().min(1, 'Fecha estimada de fin requerida'),
  esSubcontratado: z.boolean().optional().nullable(),
  proveedorSubcontratadoId: z.string().optional().nullable(),
  costoDiarioProveedor: z.coerce.number().min(0).optional().nullable(),
}).passthrough();

const CrearAlquilerZodSchema = z.object({
  clienteId: z.union([z.string(), z.number()]),
  clienteNombre: z.string().optional().nullable(),
  fechaRegistro: z.string().optional().nullable(),
  fleteEntrega: z.coerce.number().min(0).default(0),
  fleteRecogida: z.coerce.number().min(0).default(0),
  deposito: z.coerce.number().min(0).default(0),
  garantiaMonto: z.coerce.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().optional().nullable(),
  detallesLogistica: z.string().optional().nullable(),
  items: z.array(AlquilerItemZodSchema).min(1, 'Debe incluir al menos un equipo en el contrato'),
  estado: z.string().optional().nullable(),
  idempotency_key: z.string().optional().nullable(),
}).passthrough();

const EditarAlquilerZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  clienteId: z.union([z.string(), z.number()]).optional().nullable(),
  clienteNombre: z.string().optional().nullable(),
  fechaRegistro: z.string().optional().nullable(),
  fleteEntrega: z.coerce.number().min(0).default(0),
  fleteRecogida: z.coerce.number().min(0).default(0),
  deposito: z.coerce.number().min(0).default(0),
  garantiaMonto: z.coerce.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().optional().nullable(),
  detallesLogistica: z.string().optional().nullable(),
  items: z.array(AlquilerItemZodSchema).min(1, 'Debe incluir al menos un equipo'),
  estado: z.string().optional().nullable(),
}).passthrough();

const DevolucionItemZodSchema = z.object({
  detalleId: z.union([z.string(), z.number()]),
  cantidadDevuelta: z.coerce.number().int().min(1, 'La cantidad devuelta debe ser al menos 1'),
  costoDano: z.coerce.number().min(0).default(0),
});

const ProcesarDevolucionZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  devoluciones: z.array(DevolucionItemZodSchema).min(1, 'Debe especificar al menos un ítem devuelto'),
}).passthrough();

// ----------------------------------------------------------------------------
// Controladores Server Actions Delgados
// ----------------------------------------------------------------------------

/**
 * Server Action: Despacho y Creación de Contrato de Alquiler
 */
export async function crearAlquilerAction(input: CrearAlquilerInput) {
  const validation = validateActionInput(input, CrearAlquilerZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de alquiler inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';
  const empresaId = await resolveEmpresaId(user?.id);

  // Delegación pura al Servicio de Dominio
  const result = await AlquilerTransaccionalService.despacharContrato(supabase, {
    clienteId: cleanInput.clienteId,
    clienteNombre: cleanInput.clienteNombre || undefined,
    fechaRegistro: cleanInput.fechaRegistro || undefined,
    fleteEntrega: cleanInput.fleteEntrega,
    fleteRecogida: cleanInput.fleteRecogida,
    deposito: cleanInput.deposito,
    garantiaMonto: cleanInput.garantiaMonto,
    garantiaTipo: cleanInput.garantiaTipo,
    observaciones: cleanInput.observaciones || undefined,
    detallesLogistica: cleanInput.detallesLogistica || undefined,
    items: cleanInput.items as ItemAlquilerCalculoInput[],
    estado: cleanInput.estado || 'ACTIVO',
    idempotencyKey: cleanInput.idempotency_key || null,
    empresaId,
    userIdentifier,
  });

  if (!result.success) {
    return result;
  }

  // Si la petición es un duplicado idempotente, retornar registro existente sin duplicar auditoría
  if (result.idempotent) {
    return result;
  }

  // Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'CREAR_ALQUILER',
    descripcion: `Contrato creado para cliente ID ${cleanInput.clienteId} con ${cleanInput.items.length} ítems.`,
    entidadId: result.data?.id || undefined,
    detalles: {
      clienteId: cleanInput.clienteId,
      fleteEntrega: cleanInput.fleteEntrega,
      fleteRecogida: cleanInput.fleteRecogida,
      deposito: cleanInput.deposito,
      itemsCount: cleanInput.items.length,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Invalidación de Caché y Revalidación de Rutas
  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cacheErr) {
    console.warn('[crearAlquilerAction] Cache clear error:', cacheErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath('/subcontrataciones');
  safeRevalidatePath('/bodega');
  return result;
}

/**
 * Server Action: Edición Atómica de Contrato de Alquiler
 */
export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const validation = validateActionInput(input, EditarAlquilerZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de edición inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';
  const empresaId = await resolveEmpresaId(user?.id);

  // Delegación pura al Servicio de Dominio
  const result = await AlquilerTransaccionalService.editarContrato(supabase, {
    alquilerId: cleanInput.alquilerId,
    clienteId: cleanInput.clienteId || '',
    fleteEntrega: cleanInput.fleteEntrega,
    fleteRecogida: cleanInput.fleteRecogida,
    deposito: cleanInput.deposito,
    garantiaMonto: cleanInput.garantiaMonto,
    garantiaTipo: cleanInput.garantiaTipo,
    observaciones: cleanInput.observaciones || undefined,
    detallesLogistica: cleanInput.detallesLogistica || undefined,
    items: cleanInput.items as ItemAlquilerCalculoInput[],
    empresaId,
    userIdentifier,
  });

  if (!result.success) {
    return result;
  }

  // Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'EDITAR_ALQUILER',
    descripcion: `Contrato ID ${cleanInput.alquilerId} actualizado con reconciliación de inventario.`,
    entidadId: cleanInput.alquilerId,
    detalles: { alquilerId: cleanInput.alquilerId, itemsCount: cleanInput.items.length },
    userId: user?.id,
    userEmail: user?.email,
  });

  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cErr) {
    console.warn('[editarAlquilerAction] Cache clear error:', cErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath('/subcontrataciones');
  safeRevalidatePath('/bodega');
  return result;
}

/**
 * Server Action: Devolución Atómica y Reingreso a Bodega
 */
export async function procesarDevolucionAction(input: ProcesarDevolucionInput) {
  const validation = validateActionInput(input, ProcesarDevolucionZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de devolución inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empresaId = await resolveEmpresaId(user?.id);

  // Delegación pura al Servicio de Dominio
  const result = await AlquilerTransaccionalService.devolverContrato(supabase, {
    alquilerId: cleanInput.alquilerId,
    devoluciones: cleanInput.devoluciones as unknown as DevolucionItemParams[],
    empresaId,
  });

  if (!result.success) {
    return result;
  }

  // Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'DEVOLUCIONES',
    accion: 'PROCESAR_DEVOLUCION',
    descripcion: `Devolución procesada para contrato ID ${cleanInput.alquilerId} con ${cleanInput.devoluciones.length} ítem(s).`,
    entidadId: cleanInput.alquilerId,
    detalles: {
      alquilerId: cleanInput.alquilerId,
      devoluciones: cleanInput.devoluciones,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[procesarDevolucionAction] Cache clear error:', cErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath('/bodega');
  return result;
}

/**
 * Server Action: Aprobación de Cotización y Conversión a Contrato Activo
 */
export async function aprobarCotizacionAction(input: AprobarCotizacionInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  // 1. Obtener detalles
  const { data: detalles, error: detErr } = await supabase
    .from('alquiler_detalles')
    .select('equipo_id, cantidad, es_subcontratado')
    .eq('alquiler_id', numericAlquilerId);

  if (detErr) return { success: false, error: 'Error al consultar detalles de cotización.' };
  if (!detalles || detalles.length === 0) return { success: false, error: 'La cotización no tiene equipos asociados.' };

  // 2. Validación y Bloqueo Pesimista por ítem
  for (const det of detalles) {
    if (det.es_subcontratado) continue;

    const { data: rpcSuccess, error: rpcErr } = await supabase.rpc('reducir_stock_seguro', {
      p_equipo_id: det.equipo_id,
      p_cantidad_requerida: det.cantidad,
    });

    if (rpcErr || !rpcSuccess) {
      return {
        success: false,
        error: `Error de concurrencia al alquilar equipo ID: ${det.equipo_id}. Posible Overbooking: ${rpcErr?.message || 'Stock Insuficiente.'}`,
      };
    }
  }

  // 3. Activar contrato
  const { data: alqActual } = await supabase
    .from('alquileres')
    .select('subtotal_equipos, flete_entrega, flete_recogida, deposito, total')
    .eq('id', numericAlquilerId)
    .single();

  const fleteEntregaFinal = input.fleteEntrega !== undefined ? Number(input.fleteEntrega) : Number(alqActual?.flete_entrega || 0);
  const fleteRecogidaFinal = input.fleteRecogida !== undefined ? Number(input.fleteRecogida) : Number(alqActual?.flete_recogida || 0);
  const subtotalEquipos = Number(alqActual?.subtotal_equipos || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntregaFinal + fleteRecogidaFinal;
  const depositoFinal = input.deposito !== undefined ? Number(input.deposito) : Number(alqActual?.deposito || 0);
  const totalFinal = subtotalGeneral;
  const saldoPendienteFinal = Math.max(0, totalFinal - depositoFinal);

  const { error: updErr } = await supabase
    .from('alquileres')
    .update({
      estado: 'ACTIVO',
      flete_entrega: fleteEntregaFinal,
      flete_recogida: fleteRecogidaFinal,
      subtotal_general: subtotalGeneral,
      total: totalFinal,
      deposito: depositoFinal,
      saldo_pendiente: saldoPendienteFinal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', numericAlquilerId);

  if (updErr) return { success: false, error: `Error al activar contrato: ${updErr.message}` };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cErr) {
    console.warn('[aprobarCotizacionAction] Cache clear error:', cErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath('/bodega');
  safeRevalidatePath('/cotizaciones');
  return { success: true };
}

/**
 * Server Action: Registro de Abonos Parciales
 */
export async function registrarAbonoAction(input: RegistrarAbonoInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  const { data: alq, error: alqErr } = await supabase
    .from('alquileres')
    .select('id, deposito, total, saldo_pendiente')
    .eq('id', numericAlquilerId)
    .single();

  if (alqErr || !alq) {
    return { success: false, error: 'Error al consultar el contrato para el abono.' };
  }

  const monto = Number(input.montoAbono);
  if (isNaN(monto) || monto <= 0) {
    return { success: false, error: 'Monto de abono inválido.' };
  }

  const nuevoDeposito = (Number(alq.deposito) || 0) + monto;
  const nuevoSaldoPendiente = Math.max(0, (Number(alq.total) || 0) - nuevoDeposito);

  const { error: updErr } = await supabase
    .from('alquileres')
    .update({
      deposito: nuevoDeposito,
      saldo_pendiente: nuevoSaldoPendiente,
      updated_at: new Date().toISOString(),
    })
    .eq('id', numericAlquilerId);

  if (updErr) {
    return { success: false, error: 'Error al actualizar el saldo en base de datos.' };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres']);
  } catch (cErr) {
    console.warn('[registrarAbonoAction] Cache clear error:', cErr);
  }

  safeRevalidatePath('/alquileres');
  return { success: true, data: { nuevoDeposito, nuevoSaldoPendiente } };
}

/**
 * Server Action: Consulta de Alquileres para React Server Components (RSC)
 */
export async function obtenerAlquileresAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const empresaId = await resolveEmpresaId(user?.id);

    const { data, error } = await supabase
      .from('alquileres')
      .select(`
        *,
        clientes ( id, nombre, nit_cedula, telefono, direccion, email ),
        alquiler_detalles ( *, equipos ( id, nombre, codigo, tarifa_diaria ) )
      `)
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[obtenerAlquileresAction] Error fetching alquileres:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('[obtenerAlquileresAction] Exception:', err);
    return { success: false, error: err?.message || 'Error al obtener alquileres', data: [] };
  }
}
