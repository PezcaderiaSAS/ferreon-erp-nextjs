'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '../../lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

export interface AlquilerItemInput {
  itemId: string | number;
  nombreItem?: string;
  cantidad: number;
  tarifaAplicada: number;
  fechaInicio: string;
  fechaFinEstimada: string;
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
}

const AlquilerItemZodSchema = z.object({
  itemId: z.union([z.string(), z.number()]),
  nombreItem: z.string().optional(),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  tarifaAplicada: z.number().min(0, 'La tarifa debe ser mayor o igual a cero'),
  fechaInicio: z.string().min(1, 'Fecha de inicio requerida'),
  fechaFinEstimada: z.string().min(1, 'Fecha estimada de fin requerida'),
});

const CrearAlquilerZodSchema = z.object({
  clienteId: z.union([z.string(), z.number()]),
  clienteNombre: z.string().optional(),
  fechaRegistro: z.string().optional(),
  fleteEntrega: z.number().min(0).default(0),
  fleteRecogida: z.number().min(0).default(0),
  deposito: z.number().min(0).default(0),
  garantiaMonto: z.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(AlquilerItemZodSchema).min(1, 'Debe incluir al menos un equipo en el contrato'),
  estado: z.string().optional(),
  idempotency_key: z.string().optional(),
});

const EditarAlquilerZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  clienteId: z.union([z.string(), z.number()]).optional(),
  clienteNombre: z.string().optional(),
  fechaRegistro: z.string().optional(),
  fleteEntrega: z.number().min(0).default(0),
  fleteRecogida: z.number().min(0).default(0),
  deposito: z.number().min(0).default(0),
  garantiaMonto: z.number().min(0).default(0),
  garantiaTipo: z.string().default('Efectivo'),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(AlquilerItemZodSchema).min(1, 'Debe incluir al menos un equipo en el contrato'),
  estado: z.string().optional(),
});

const DevolucionItemZodSchema = z.object({
  detalleId: z.union([z.string(), z.number()]),
  cantidadDevuelta: z.number().int().min(1, 'La cantidad devuelta debe ser al menos 1'),
  costoDano: z.number().min(0).optional(),
});

const ProcesarDevolucionZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  devoluciones: z.array(DevolucionItemZodSchema).min(1, 'Debe procesar al menos una devolución'),
});

export interface RegistrarAbonoInput {
  alquilerId: string | number;
  montoAbono: number;
  metodoPago?: string;
  referencia?: string;
}

export async function crearAlquilerAction(input: CrearAlquilerInput) {
  const validation = validateActionInput(input, CrearAlquilerZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de alquiler inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  // 1. Calcular subtotales
  let subtotalEquipos = 0;
  const itemsPayload = cleanInput.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    const diffMs = end.getTime() - start.getTime();
    let dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const tarifa = Number(item.tarifaAplicada || 0);
    const cant = Number(item.cantidad || 1);
    const subtotalLinea = tarifa * cant * dias;
    subtotalEquipos += subtotalLinea;

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const fleteEntrega = Number(cleanInput.fleteEntrega || 0);
  const fleteRecogida = Number(cleanInput.fleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const deposito = Number(cleanInput.deposito || 0);
  const total = subtotalGeneral;

  const payload = {
    cliente_id: typeof cleanInput.clienteId === 'string' ? parseInt(cleanInput.clienteId, 10) : cleanInput.clienteId,
    estado: cleanInput.estado || 'ACTIVO',
    subtotal_equipos: subtotalEquipos,
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: deposito,
    garantia_monto: Number(cleanInput.garantiaMonto || 0),
    garantia_tipo: cleanInput.garantiaTipo || 'Efectivo',
    observaciones: cleanInput.observaciones || '',
    detalles_logistica: cleanInput.detallesLogistica || '',
    creado_por: userIdentifier,
    items: itemsPayload
  };

  // 2. Ejecutar Procedimiento RPC Transaccional con FOR UPDATE y Rollback Atómico
  const { data, error } = await supabase.rpc('crear_alquiler_transaccional', {
    p_payload: payload
  });

  if (error) {
    console.error('Error Supabase crear_alquiler_transaccional:', error);
    if (error.message && error.message.includes('Stock insuficiente')) {
      return { success: false, error: error.message };
    }
    return { success: false, error: `Error al crear contrato en BD: ${error.message || JSON.stringify(error)}` };
  }

  // 3. Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'ALQUILERES',
    accion: 'CREAR_ALQUILER',
    descripcion: `Contrato de alquiler creado para cliente ID ${cleanInput.clienteId} con ${cleanInput.items.length} items. Total: $${total.toLocaleString('es-CO')}`,
    entidadId: data?.id || undefined,
    detalles: {
      clienteId: cleanInput.clienteId,
      total,
      deposito,
      fleteEntrega,
      fleteRecogida,
      itemsCount: cleanInput.items.length,
    },
    userId: user?.id,
    userEmail: user?.email,
  });

  // 4. Invalidar Caché Multi-Tenant
  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[crearAlquilerAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const validation = validateActionInput(input, EditarAlquilerZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de edición de alquiler inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' ? parseInt(cleanInput.alquilerId, 10) : cleanInput.alquilerId;

  // 1. Calcular subtotales
  let subtotalEquipos = 0;
  const itemsProcesados = cleanInput.items.map(item => {
    const start = new Date(item.fechaInicio);
    const end = new Date(item.fechaFinEstimada);
    const diffMs = end.getTime() - start.getTime();
    let dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const tarifa = Number(item.tarifaAplicada || 0);
    const cant = Number(item.cantidad || 1);
    const subtotalLinea = tarifa * cant * dias;
    subtotalEquipos += subtotalLinea;

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      subtotal_linea: subtotalLinea,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada
    };
  });

  const fleteEntrega = Number(cleanInput.fleteEntrega || 0);
  const fleteRecogida = Number(cleanInput.fleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const deposito = Number(cleanInput.deposito || 0);
  const total = subtotalGeneral;
  const saldoPendiente = Math.max(0, total - deposito);

  // 2. Actualizar Cabecera de Alquiler
  const updatePayload: any = {
    flete_entrega: fleteEntrega,
    flete_recogida: fleteRecogida,
    subtotal_equipos: subtotalEquipos,
    subtotal_general: subtotalGeneral,
    total: total,
    deposito: deposito,
    saldo_pendiente: saldoPendiente,
    garantia_monto: Number(input.garantiaMonto || 0),
    garantia_tipo: input.garantiaTipo || 'Efectivo',
    observaciones: input.observaciones || '',
    detalles_logistica: input.detallesLogistica || '',
    estado: input.estado || 'ACTIVO',
    updated_at: new Date().toISOString()
  };

  if (input.clienteId) {
    updatePayload.cliente_id = typeof input.clienteId === 'string' ? parseInt(input.clienteId, 10) : input.clienteId;
  }

  const { data: cabeceraData, error: cabeceraError } = await supabase
    .from('alquileres')
    .update(updatePayload)
    .eq('id', numericAlquilerId)
    .select()
    .single();

  if (cabeceraError) {
    console.error('Error Supabase editarAlquilerAction cabecera:', cabeceraError);
    return { success: false, error: `Error al actualizar contrato en BD: ${cabeceraError.message}` };
  }

  // 3. Sincronizar Líneas Relacionales en alquiler_detalles y Stock
  try {
    const { data: detallesPrevios } = await supabase
      .from('alquiler_detalles')
      .select('id, equipo_id, cantidad')
      .eq('alquiler_id', numericAlquilerId);

    // 3.1 Revertir stock anterior de equipos
    if (detallesPrevios && detallesPrevios.length > 0) {
      for (const dp of detallesPrevios) {
        const { data: eq } = await supabase
          .from('equipos')
          .select('stock_disponible, stock_en_obra')
          .eq('id', dp.equipo_id)
          .single();

        if (eq) {
          await supabase
            .from('equipos')
            .update({
              stock_disponible: eq.stock_disponible + dp.cantidad,
              stock_en_obra: Math.max(0, eq.stock_en_obra - dp.cantidad),
              updated_at: new Date().toISOString()
            })
            .eq('id', dp.equipo_id);
        }
      }

      await supabase
        .from('alquiler_detalles')
        .delete()
        .eq('alquiler_id', numericAlquilerId);
    }

    // 3.2 Insertar nuevos detalles y descontar nuevo inventario
    for (const it of itemsProcesados) {
      const { data: eq } = await supabase
        .from('equipos')
        .select('stock_disponible, stock_en_obra')
        .eq('id', it.equipo_id)
        .single();

      if (eq) {
        await supabase
          .from('equipos')
          .update({
            stock_disponible: Math.max(0, eq.stock_disponible - it.cantidad),
            stock_en_obra: eq.stock_en_obra + it.cantidad,
            updated_at: new Date().toISOString()
          })
          .eq('id', it.equipo_id);
      }

      await supabase
        .from('alquiler_detalles')
        .insert([{
          alquiler_id: numericAlquilerId,
          equipo_id: it.equipo_id,
          cantidad: it.cantidad,
          tarifa_aplicada: it.tarifa_aplicada,
          dias_contratados: it.dias_contratados,
          subtotal_linea: it.subtotal_linea,
          fecha_inicio: it.fecha_inicio ? new Date(it.fecha_inicio).toISOString() : new Date().toISOString(),
          fecha_fin: it.fecha_fin ? new Date(it.fecha_fin).toISOString() : new Date().toISOString(),
          devuelto: false,
          cantidad_devuelta: 0,
          costo_dano: 0
        }]);
    }
  } catch (detError: any) {
    console.error('Error al sincronizar detalles en editarAlquilerAction:', detError);
  }

  // 4. Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[editarAlquilerAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data: cabeceraData };
}

export async function procesarDevolucionAction(input: ProcesarDevolucionInput) {
  const validation = validateActionInput(input, ProcesarDevolucionZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de devolución inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' ? parseInt(cleanInput.alquilerId, 10) : cleanInput.alquilerId;

  const payload = {
    alquiler_id: numericAlquilerId,
    devoluciones: cleanInput.devoluciones.map(d => ({
      detalle_id: typeof d.detalleId === 'string' ? parseInt(d.detalleId, 10) : d.detalleId,
      cantidad_devuelta: d.cantidadDevuelta,
      costo_dano: d.costoDano || 0
    }))
  };

  const { data, error } = await supabase.rpc('procesar_devolucion_alquiler', {
    p_payload: payload
  });

  if (error) {
    console.error('Error Supabase procesar_devolucion_alquiler:', error);
    return { success: false, error: `Error al procesar devolución en BD: ${error.message || JSON.stringify(error)}` };
  }

  // Registrar Evento de Auditoría
  AuditLogger.logAsync({
    modulo: 'DEVOLUCIONES',
    accion: 'PROCESAR_DEVOLUCION',
    descripcion: `Devolución procesada para contrato ID ${numericAlquilerId} con ${cleanInput.devoluciones.length} item(s)`,
    entidadId: numericAlquilerId,
    detalles: {
      alquilerId: numericAlquilerId,
      devoluciones: cleanInput.devoluciones,
    },
  });

  // Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[procesarDevolucionAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true, data };
}

export async function aprobarCotizacionAction(input: AprobarCotizacionInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  // 1. Obtener detalles del alquiler
  const { data: detalles, error: detErr } = await supabase
    .from('alquiler_detalles')
    .select('equipo_id, cantidad')
    .eq('alquiler_id', numericAlquilerId);

  if (detErr) return { success: false, error: 'Error al consultar detalles de cotización.' };
  if (!detalles || detalles.length === 0) return { success: false, error: 'La cotización no tiene equipos asociados.' };

  // 2 y 3. Validación Pesimista y Descuento Atómico (RPC - Optimistic Locking)
  // Utilizamos el candado SQL 'reducir_stock_seguro' para asegurar que nadie más tome el equipo
  for (const det of detalles) {
    const { data: rpcSuccess, error: rpcErr } = await supabase.rpc('reducir_stock_seguro', {
      p_equipo_id: det.equipo_id,
      p_cantidad_requerida: det.cantidad
    });

    if (rpcErr || !rpcSuccess) {
      // Poka-Yoke: En caso de error, el RPC aborta y Next.js recibe la excepción SQL.
      // Sería ideal hacer rollback de los que ya pasaron si esto fuera una transacción única.
      return { 
        success: false, 
        error: `Error de concurrencia al alquilar equipo ID: ${det.equipo_id}. Posible Overbooking: ${rpcErr?.message || 'Stock Insuficiente.'}`
      };
    }
  }

  // 4. Actualizar estado del alquiler a ACTIVO
  const { error: updErr } = await supabase
    .from('alquileres')
    .update({ 
      estado: 'ACTIVO',
      updated_at: new Date().toISOString()
    })
    .eq('id', numericAlquilerId);

  if (updErr) return { success: false, error: 'Error al activar el contrato.' };

  // 5. Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos']);
  } catch (cErr) {
    console.warn('[aprobarCotizacionAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  return { success: true };
}

export async function registrarAbonoAction(input: RegistrarAbonoInput) {
  const supabase = await createServerSupabaseClient();
  const numericAlquilerId = typeof input.alquilerId === 'string' ? parseInt(input.alquilerId, 10) : input.alquilerId;

  // 1. Obtener contrato actual
  const { data: alq, error: alqErr } = await supabase
    .from('alquileres')
    .select('id, deposito, total, saldo_pendiente')
    .eq('id', numericAlquilerId)
    .single();

  if (alqErr || !alq) {
    return { success: false, error: 'Error al consultar el contrato para el abono.' };
  }

  // 2. Cálculos
  const monto = Number(input.montoAbono);
  if (isNaN(monto) || monto <= 0) {
    return { success: false, error: 'Monto de abono inválido.' };
  }

  const nuevoDeposito = (Number(alq.deposito) || 0) + monto;
  const nuevoSaldoPendiente = Math.max(0, (Number(alq.total) || 0) - nuevoDeposito);

  // 3. Actualizar
  const { error: updErr } = await supabase
    .from('alquileres')
    .update({
      deposito: nuevoDeposito,
      saldo_pendiente: nuevoSaldoPendiente,
      updated_at: new Date().toISOString()
    })
    .eq('id', numericAlquilerId);

  if (updErr) {
    console.error('Error al registrar abono:', updErr);
    return { success: false, error: 'Error al actualizar el saldo en la base de datos.' };
  }

  // (Opcional) Aquí se podría insertar el registro histórico del pago en una tabla `pagos_recibidos`.
  
  // Novedad: Insertar en Ledger (Partida Doble)
  // Débito a Caja (+), Crédito a Ingresos por Alquileres (-)
  const { error: rpcErr } = await supabase.rpc('insert_transaction', {
    p_description: `Abono de ${input.metodoPago || 'Efectivo'} para alquiler #${numericAlquilerId}`,
    p_reference_id: alq.id || null, // idealmente el UUID del contrato real si estuviera, usando numericAlquilerId temporalmente
    p_created_by: null, // Asignar UUID del usuario autenticado si es necesario
    p_idempotency_key: crypto.randomUUID(), // En prod usar un derivado estable o pasarlo del frontend
    p_entries: [
      { account_id: "00000000-0000-0000-0000-000000000001", amount: monto }, // TODO: ID real de Caja
      { account_id: "00000000-0000-0000-0000-000000000002", amount: -monto } // TODO: ID real de Ingresos
    ]
  });

  if (rpcErr) {
    console.error('Error al insertar en ledger:', rpcErr);
    // No bloqueamos el flujo principal por ahora si falla, pero en rigor debería revertirse o hacerse en una sola transacción
  }

  // 4. Invalidar Caché
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres']);
  } catch (cErr) {
    console.warn('[registrarAbonoAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  return { success: true, data: { nuevoDeposito, nuevoSaldoPendiente } };
}
