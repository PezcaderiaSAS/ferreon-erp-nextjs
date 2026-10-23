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

export interface UpdateRentalClientInput {
  alquilerId: string | number;
  clienteId: string | number;
  idempotencyKey?: string;
}

export interface ClienteNuevoPosInput {
  nit_cedula?: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface ItemPosInput {
  equipoId: string | number;
  cantidad: number;
  tarifaAplicada: number;
  diasCobro?: number;
  subtotalLinea?: number;
  fechaInicio?: string;
  fechaFinEstimada?: string;
}

export interface CrearAlquilerRapidoPosInput {
  clienteId?: string | number | null;
  clienteNuevo?: ClienteNuevoPosInput | null;
  items: ItemPosInput[];
  modoCobroDias?: 'CALENDARIO' | 'HABILES_LUNES_VIERNES' | 'HABILES_LUNES_SABADO';
  diasCobrables?: number;
  deposito?: number;
  fleteEntrega?: number;
  fleteRecogida?: number;
  garantiaMonto?: number;
  garantiaTipo?: string;
  observaciones?: string;
  detallesLogistica?: string;
  idempotencyKey?: string;
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

const UpdateRentalClientZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  clienteId: z.union([z.string(), z.number()]),
  idempotencyKey: z.string().optional().nullable(),
}).passthrough();

import {
  CrearAlquilerRapidoPosZodSchema,
  ItemAdendaSchema,
  GenerarAdendaContratoZodSchema,
  ItemDevolucionPosZodSchema,
  ProcesarDevolucionPosZodSchema,
  type ItemAdendaInput,
  type GenerarAdendaContratoInput,
  type ItemDevolucionPosInput,
  type ProcesarDevolucionPosInput,
} from '@/core/domain/schemas/posSchemas';
export type {
  ItemAdendaInput,
  GenerarAdendaContratoInput,
  ItemDevolucionPosInput,
  ProcesarDevolucionPosInput,
};




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
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'subcontrataciones']);
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
    clienteNombre: cleanInput.clienteNombre || undefined,
    fleteEntrega: cleanInput.fleteEntrega,
    fleteRecogida: cleanInput.fleteRecogida,
    deposito: cleanInput.deposito,
    garantiaMonto: cleanInput.garantiaMonto,
    garantiaTipo: cleanInput.garantiaTipo,
    observaciones: cleanInput.observaciones || undefined,
    detallesLogistica: cleanInput.detallesLogistica || undefined,
    items: cleanInput.items as ItemAlquilerCalculoInput[],
    estado: cleanInput.estado || 'ACTIVO',
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
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'subcontrataciones']);
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
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos']);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autorizado. Debe iniciar sesión para aprobar cotizaciones.' };
  }
  const empresaId = await resolveEmpresaId(user.id);
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  // 1. Obtener contrato verificando pertenencia estricta al tenant
  const { data: alqActual, error: alqErr } = await supabase
    .from('alquileres')
    .select('subtotal_equipos, flete_entrega, flete_recogida, deposito, total')
    .eq('id', numericAlquilerId)
    .eq('empresa_id', empresaId)
    .single();

  if (alqErr || !alqActual) {
    return { success: false, error: 'Cotización no encontrada o no autorizada para su empresa.' };
  }

  // 2. Obtener detalles
  const { data: detalles, error: detErr } = await supabase
    .from('alquiler_detalles')
    .select('equipo_id, cantidad, es_subcontratado')
    .eq('alquiler_id', numericAlquilerId);

  if (detErr) return { success: false, error: 'Error al consultar detalles de cotización.' };
  if (!detalles || detalles.length === 0) return { success: false, error: 'La cotización no tiene equipos asociados.' };

  // 3. Validación y Bloqueo Pesimista por ítem
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

  // 4. Activar contrato
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
    .eq('id', numericAlquilerId)
    .eq('empresa_id', empresaId);

  if (updErr) return { success: false, error: `Error al activar contrato: ${updErr.message}` };

  try {
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'subcontrataciones']);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autorizado. Debe iniciar sesión para registrar abonos.' };
  }
  const empresaId = await resolveEmpresaId(user.id);
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  const { data: alq, error: alqErr } = await supabase
    .from('alquileres')
    .select('id, deposito, total, saldo_pendiente')
    .eq('id', numericAlquilerId)
    .eq('empresa_id', empresaId)
    .single();

  if (alqErr || !alq) {
    return { success: false, error: 'Error al consultar el contrato para el abono o no pertenece a su empresa.' };
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
    .eq('id', numericAlquilerId)
    .eq('empresa_id', empresaId);

  if (updErr) {
    return { success: false, error: 'Error al actualizar el saldo en base de datos.' };
  }

  try {
    await invalidateTenantCache(empresaId, ['alquileres']);
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

/**
 * Server Action: Cambio de Cliente en Alquiler Activo
 */
export async function updateRentalClientAction(input: UpdateRentalClientInput) {
  const validation = validateActionInput(input, UpdateRentalClientZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos inválidos' };
  }
  const cleanInput = validation.data;
  
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' ? parseInt(cleanInput.alquilerId, 10) : cleanInput.alquilerId;
  const numericClienteId = typeof cleanInput.clienteId === 'string' ? parseInt(cleanInput.clienteId, 10) : cleanInput.clienteId;

  const { data: { user } } = await supabase.auth.getUser();
  const empresaId = await resolveEmpresaId(user?.id);

  const { error: updErr } = await supabase
    .from('alquileres')
    .update({ 
      cliente_id: numericClienteId,
      updated_at: new Date().toISOString()
    })
    .eq('id', numericAlquilerId)
    .eq('empresa_id', empresaId);

  if (updErr) {
    return { success: false, error: `Error al cambiar de cliente: ${updErr.message}` };
  }

  // Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'EDITAR_ALQUILER',
    descripcion: `Cambio de titular para el alquiler ID ${numericAlquilerId}. Nuevo cliente ID: ${numericClienteId}.`,
    entidadId: numericAlquilerId.toString(),
    detalles: { alquilerId: numericAlquilerId, nuevoClienteId: numericClienteId },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Regeneración asíncrona del PDF en segundo plano (Zero-Latency for UI)
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/alquileres/${numericAlquilerId}/pdf`, { 
    method: 'POST' 
  }).catch(e => console.warn('[updateRentalClientAction] PDF regeneracion fallida en background:', e));

  try {
    await invalidateTenantCache(empresaId, ['alquileres']);
  } catch (cErr) {
    console.warn('[updateRentalClientAction] Cache clear error:', cErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath(`/alquileres/${numericAlquilerId}`);
  
  return { success: true };
}

/**
 * Server Action: Despacho Rápido en Modo Mostrador POS (<30 segundos)
 * Tarea: TASK-010-02 (SPEC-010)
 * Ejecuta validación Zod ultra-rápida, resolución atómica de cliente On-The-Fly,
 * reserva pesimista de stock y registro del depósito en caja.
 */
export async function crearAlquilerRapidoPosAction(
  input: CrearAlquilerRapidoPosInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  const validation = validateActionInput(input, CrearAlquilerRapidoPosZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de despacho POS inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'OPERADOR_POS';
  const empresaId = await resolveEmpresaId(user?.id);

  // Calcular subtotales con precisión matemática en enteros COP
  const subtotalEquipos = cleanInput.items.reduce((acc, it) => {
    const sub = it.subtotalLinea !== undefined && it.subtotalLinea !== null
      ? Math.round(Number(it.subtotalLinea))
      : Math.round(Number(it.cantidad) * Number(it.tarifaAplicada) * Number(it.diasCobro || 1));
    return acc + sub;
  }, 0);

  const fleteEntrega = Math.round(Number(cleanInput.fleteEntrega || 0));
  const fleteRecogida = Math.round(Number(cleanInput.fleteRecogida || 0));
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const total = subtotalGeneral;
  const deposito = Math.round(Number(cleanInput.deposito || 0));
  const garantiaMonto = Math.round(Number(cleanInput.garantiaMonto || 0));

  const modoCobro = cleanInput.modoCobroDias || 'CALENDARIO';
  const modoEtiqueta = modoCobro === 'HABILES_LUNES_VIERNES'
    ? ' [Modalidad: Días Hábiles L-V | Excluye festivos colombianos]'
    : modoCobro === 'HABILES_LUNES_SABADO'
    ? ' [Modalidad: Días Hábiles L-S | Estándar Obra | Excluye festivos colombianos]'
    : '';

  const observacionesFinales = (cleanInput.observaciones || 'Despacho Rápido Mostrador POS (<30s)') + modoEtiqueta;

  const payload = {
    empresa_id: empresaId,
    usuario_id: user?.id || null,
    idempotency_key: cleanInput.idempotencyKey || null,
    cliente_id: cleanInput.clienteId ? Number(cleanInput.clienteId) : null,
    cliente_nuevo: cleanInput.clienteNuevo || null,
    modo_cobro_dias: modoCobro,
    dias_cobrables: cleanInput.diasCobrables ?? null,
    subtotal_equipos: subtotalEquipos,
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: deposito,
    garantia_monto: garantiaMonto,
    garantia_tipo: cleanInput.garantiaTipo || 'Efectivo',
    observaciones: observacionesFinales,
    detalles_logistica: cleanInput.detallesLogistica || 'Entrega Inmediata en Mostrador',
    creado_por: userIdentifier,
    items: cleanInput.items.map((it) => {
      const cant = Math.max(1, Number(it.cantidad || 1));
      const tarifa = Math.max(0, Number(it.tarifaAplicada || 0));
      const dias = Math.max(1, Number(it.diasCobro || 1));
      const subtotal = it.subtotalLinea !== undefined && it.subtotalLinea !== null
        ? Math.round(Number(it.subtotalLinea))
        : Math.round(cant * tarifa * dias);

      const rawId = String(it.equipoId).replace(/\D/g, '');
      const equipoId = parseInt(rawId, 10) || Number(it.equipoId) || 0;

      return {
        equipo_id: equipoId,
        cantidad: cant,
        tarifa_aplicada: tarifa,
        dias_contratados: dias,
        subtotal_linea: subtotal,
        fecha_inicio: it.fechaInicio || new Date().toISOString().split('T')[0],
        fecha_fin: it.fechaFinEstimada || new Date(Date.now() + dias * 86400000).toISOString().split('T')[0],
      };
    }),
  };

  // Invocar la RPC de alto rendimiento en PostgreSQL
  let rpcResponse: { data: any; error: any } = await supabase.rpc('alquiler_crear_pos_rapido_v1', { p_payload: payload });

  // Fallback si la migración no está desplegada en el entorno de desarrollo actual
  if (rpcResponse.error && rpcResponse.error.code === '42883') {
    const fallbackItems = payload.items.map(it => ({
      itemId: it.equipo_id,
      cantidad: it.cantidad,
      tarifaAplicada: it.tarifa_aplicada,
      fechaInicio: it.fecha_inicio,
      fechaFinEstimada: it.fecha_fin,
    }));

    const fbResult = await AlquilerTransaccionalService.despacharContrato(supabase, {
      clienteId: payload.cliente_id || 1,
      fleteEntrega: payload.flete_entrega,
      fleteRecogida: payload.flete_recogida,
      deposito: payload.deposito,
      garantiaMonto: payload.garantia_monto,
      garantiaTipo: payload.garantia_tipo,
      observaciones: payload.observaciones,
      detallesLogistica: payload.detalles_logistica,
      items: fallbackItems,
      empresaId,
      userIdentifier,
      idempotencyKey: payload.idempotency_key,
    });

    if (!fbResult.success) {
      return fbResult;
    }

    rpcResponse = { data: fbResult.data, error: null };
  }

  if (rpcResponse.error) {
    const errMsg = rpcResponse.error.message || 'Error desconocido al registrar alquiler POS';
    return { success: false, error: errMsg };
  }

  const resultData = rpcResponse.data;

  // Registrar Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'CREAR_ALQUILER',
    descripcion: `Despacho POS <30s formalizado con éxito. Consecutivo: #${resultData?.consecutivo || resultData?.id}. Total: $${total}.`,
    entidadId: String(resultData?.id || ''),
    detalles: {
      consecutivo: resultData?.consecutivo,
      clienteId: resultData?.cliente_id,
      total,
      deposito,
      itemsCount: payload.items.length,
      movimientoCajaId: resultData?.movimiento_caja_id,
      modalidad: 'MOSTRADOR_POS_RAPIDO',
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Invalidación de Caché Multi-Tenant
  try {
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'caja']);
  } catch (cErr) {
    console.warn('[crearAlquilerRapidoPosAction] Error invalidando caché Redis:', cErr);
  }

  // Revalidación segura de rutas Next.js
  safeRevalidatePath('/alquileres');
  safeRevalidatePath('/pos');
  safeRevalidatePath('/inventario');
  safeRevalidatePath('/caja');

  return {
    success: true,
    data: resultData,
  };
}

/**
 * Server Action: Generar Adenda y Modificación In-Place de Contrato (v1.0 -> v1.1)
 * Tarea: TASK-010-10 (SPEC-010)
 * Invoca la RPC transaccional alquiler_generar_adenda_transaccional_v1 con bloqueo FOR UPDATE,
 * reversión y re-reserva pesimista de stock, snapshot inmutable de datos_previos y datos_nuevos,
 * y registro de depósito adicional en caja si aplica.
 */
export async function generarAdendaContratoAction(
  input: GenerarAdendaContratoInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  const validation = validateActionInput(input, GenerarAdendaContratoZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de adenda inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'OPERADOR_POS';
  const empresaId = await resolveEmpresaId(user?.id);

  const payload = {
    empresa_id: empresaId,
    usuario_id: user?.id || null,
    alquiler_id: cleanInput.alquilerId,
    motivo: cleanInput.motivo,
    dias_adicionales: cleanInput.diasAdicionales,
    monto_deposito_adicional: Math.round(Number(cleanInput.montoDepositoAdicional || 0)),
    metodo_pago: cleanInput.metodoPago,
    observaciones: cleanInput.observaciones || '',
    creado_por: userIdentifier,
    items: cleanInput.items.map((it) => {
      const subtotalLinea = it.subtotalLinea !== undefined && it.subtotalLinea !== null
        ? Math.round(Number(it.subtotalLinea))
        : Math.round(Number(it.cantidad) * Number(it.tarifaAplicada) * Number(it.diasCobro || 1));

      return {
        equipo_id: it.equipoId,
        cantidad: it.cantidad,
        tarifa_aplicada: it.tarifaAplicada,
        dias_contratados: it.diasCobro,
        subtotal_linea: subtotalLinea,
        fecha_inicio: it.fechaInicio || null,
        fecha_fin: it.fechaFinEstimada || null,
        es_subcontratado: Boolean(it.esSubcontratado),
      };
    }),
  };

  // 1. Invocar RPC Transaccional
  const rpcResponse = await supabase.rpc('alquiler_generar_adenda_transaccional_v1', {
    p_payload: payload,
  });

  if (rpcResponse.error) {
    const errMsg = rpcResponse.error.message || 'Error al generar adenda versionada';
    return { success: false, error: errMsg };
  }

  const resultData = rpcResponse.data;

  // 2. Registrar Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'GENERAR_ADENDA_ALQUILER',
    descripcion: `Adenda ${resultData?.numero_version || 'versionada'} formalizada para contrato #${resultData?.consecutivo || cleanInput.alquilerId}. Motivo: ${cleanInput.motivo}.`,
    entidadId: String(cleanInput.alquilerId),
    detalles: {
      alquilerId: cleanInput.alquilerId,
      consecutivo: resultData?.consecutivo,
      numeroVersion: resultData?.numero_version,
      adendaId: resultData?.adenda_id,
      motivo: cleanInput.motivo,
      montoAdicional: resultData?.monto_adicional,
      nuevoTotal: resultData?.nuevo_total,
      movimientoCajaId: resultData?.movimiento_caja_id,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // 3. Invalidar Caché Redis
  try {
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'caja']);
  } catch (cErr) {
    console.warn('[generarAdendaContratoAction] Error invalidando caché Redis:', cErr);
  }

  // 4. Revalidación segura de rutas Next.js
  safeRevalidatePath('/alquileres');
  safeRevalidatePath(`/alquileres/${cleanInput.alquilerId}`);
  safeRevalidatePath('/inventario');
  safeRevalidatePath('/caja');

  return {
    success: true,
    data: resultData,
  };
}

/**
 * Server Action: Devolución POS con Checklist de Averías & Liquidación de Garantía
 * Tarea: TASK-010-14 (SPEC-010)
 * Procesa inspección semafórica táctil, cruza cargos de averías contra el depósito en garantía,
 * y genera automáticamente el movimiento correspondiente en caja (EGRESO por reembolso o INGRESO por cobro).
 */
export async function procesarDevolucionPosAction(
  input: ProcesarDevolucionPosInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  const validation = validateActionInput(input, ProcesarDevolucionPosZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de devolución POS inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'OPERADOR_POS';
  const empresaId = await resolveEmpresaId(user?.id);

  const payload = {
    empresa_id: empresaId,
    usuario_id: user?.id || null,
    alquiler_id: cleanInput.alquilerId,
    metodo_pago: cleanInput.metodoPago,
    sesion_caja_id: cleanInput.sesionCajaId || null,
    observaciones: cleanInput.observaciones || 'Inspección de Devolución POS',
    recibido_por: userIdentifier,
    items: cleanInput.items.map((it) => ({
      detalle_id: it.detalleId,
      cantidad_devuelta: it.cantidadDevuelta,
      semaforo: it.semaforo,
      costo_limpieza: Math.round(Number(it.costoLimpieza || 0)),
      costo_reparacion: Math.round(Number(it.costoReparacion || 0)),
      valor_reposicion: Math.round(Number(it.valorReposicion || 0)),
      descripcion_dano: it.descripcionDano || '',
      desglose_averias: it.desgloseAverias || [],
    })),
  };

  const rpcResponse = await supabase.rpc('devolucion_pos_inspeccion_rapida_v1', {
    p_payload: payload,
  });

  if (rpcResponse.error) {
    const errMsg = rpcResponse.error.message || 'Error al procesar devolución POS';
    return { success: false, error: errMsg };
  }

  const resultData = rpcResponse.data;

  // Auditoría Inmutable
  AuditLogger.logAsync({
    modulo: 'DEVOLUCIONES',
    accion: 'PROCESAR_DEVOLUCION_AVANZADA',
    descripcion: `Devolución POS ${resultData?.consecutivo} formalizada para contrato #${cleanInput.alquilerId}. Resolución: ${resultData?.tipo_resolucion}.`,
    entidadId: String(cleanInput.alquilerId),
    detalles: {
      alquilerId: cleanInput.alquilerId,
      consecutivo: resultData?.consecutivo,
      tipoResolucion: resultData?.tipo_resolucion,
      saldoNeto: resultData?.saldo_neto,
      totalDanos: resultData?.total_danos,
      totalReposiciones: resultData?.total_reposiciones,
      movimientoCajaId: resultData?.movimiento_caja_id,
      contratoCerrado: resultData?.contrato_cerrado,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // Invalidación de Caché
  try {
    await invalidateTenantCache(empresaId, ['alquileres', 'equipos', 'caja']);
  } catch (cErr) {
    console.warn('[procesarDevolucionPosAction] Error invalidando caché Redis:', cErr);
  }

  safeRevalidatePath('/alquileres');
  safeRevalidatePath(`/alquileres/${cleanInput.alquilerId}`);
  safeRevalidatePath('/bodega');
  safeRevalidatePath('/inventario');
  safeRevalidatePath('/caja');

  return {
    success: true,
    data: resultData,
  };
}

/**
 * Server Action: Obtener Catálogo de Averías y Tarifas Estándar por Tenant
 */
export async function obtenerCatalogoAveriasAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const empresaId = await resolveEmpresaId(user?.id);

    const { data, error } = await supabase
      .from('catalogo_averias_equipos')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('categoria', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


