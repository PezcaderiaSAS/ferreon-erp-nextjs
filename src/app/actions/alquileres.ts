'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toSafeUUID(val: any): string | null {
  if (typeof val === 'string' && UUID_REGEX.test(val.trim())) {
    return val.trim();
  }
  return null;
}

function toSafeISOString(val: any): string {
  if (!val) return new Date().toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

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
  items: z.array(AlquilerItemZodSchema).min(1, 'Debe incluir al menos un equipo en el contrato'),
  estado: z.string().optional().nullable(),
}).passthrough();

const DevolucionItemZodSchema = z.object({
  detalleId: z.union([z.string(), z.number()]),
  cantidadDevuelta: z.coerce.number().int().min(1, 'La cantidad devuelta debe ser al menos 1'),
  costoDano: z.coerce.number().min(0).default(0),
}).passthrough();

const ProcesarDevolucionZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
  devoluciones: z.array(DevolucionItemZodSchema).min(1, 'Debe incluir al menos una devolución'),
}).passthrough();

const AprobarCotizacionZodSchema = z.object({
  alquilerId: z.union([z.string(), z.number()]),
}).passthrough();

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
  const empresaId = await resolveEmpresaId(user?.id);

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

    const provId = item.proveedorSubcontratadoId || (item as any).proveedorId || null;
    const costoSub = Number(item.costoDiarioProveedor || (item as any).costoSubcontrato || 0);

    return {
      equipo_id: typeof item.itemId === 'string' ? parseInt(item.itemId, 10) : item.itemId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      fecha_inicio: item.fechaInicio,
      fecha_fin: item.fechaFinEstimada,
      es_subcontratado: Boolean(item.esSubcontratado),
      proveedor_subcontratado_id: provId,
      proveedor_id: provId,
      costo_diario_proveedor: costoSub,
      costo_subcontratacion_diario: costoSub
    };
  });

  const fleteEntrega = Number(cleanInput.fleteEntrega || 0);
  const fleteRecogida = Number(cleanInput.fleteRecogida || 0);
  const subtotalGeneral = subtotalEquipos + fleteEntrega + fleteRecogida;
  const deposito = Number(cleanInput.deposito || 0);
  const total = subtotalGeneral;

  const payload = {
    empresa_id: empresaId,
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

  // 3.1 Si hay ítems subcontratados con proveedor, registrar automáticamente la orden de subcontratación
  const subItems = cleanInput.items.filter(it => it.esSubcontratado && it.proveedorSubcontratadoId);
  if (subItems.length > 0 && data?.id) {
    try {
      const provMap = new Map<string, typeof subItems>();
      for (const it of subItems) {
        const pId = it.proveedorSubcontratadoId!;
        if (!provMap.has(pId)) provMap.set(pId, []);
        provMap.get(pId)!.push(it);
      }

      for (const [provId, groupItems] of Array.from(provMap.entries())) {
        const { data: provData } = await supabase
          .from('proveedores')
          .select('nombre, nit, telefono, contacto')
          .eq('id', provId)
          .maybeSingle();

        const fechaMin = groupItems.reduce((min, it) => it.fechaInicio < min ? it.fechaInicio : min, groupItems[0].fechaInicio);
        const fechaMax = groupItems.reduce((max, it) => it.fechaFinEstimada > max ? it.fechaFinEstimada : max, groupItems[0].fechaFinEstimada);

        let costoTotal = 0;
        let ingresoTotal = 0;
        const detallesPayload = groupItems.map(it => {
          const start = new Date(it.fechaInicio);
          const end = new Date(it.fechaFinEstimada);
          const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const costo = (it.costoDiarioProveedor || 0) * it.cantidad * dias;
          const ingreso = (it.tarifaAplicada || 0) * it.cantidad * dias;
          costoTotal += costo;
          ingresoTotal += ingreso;
          return {
            equipo_id: typeof it.itemId === 'string' ? parseInt(it.itemId, 10) : it.itemId,
            equipo_nombre: it.nombreItem || 'Equipo Subcontratado',
            cantidad: it.cantidad,
            dias_contratados: dias,
            tarifa_diaria_proveedor: it.costoDiarioProveedor || 0,
            tarifa_diaria_cliente: it.tarifaAplicada || 0,
            margen_bruto_estimado: ingreso - costo,
          };
        });

        const consecutivo = `SUB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: nuevaSub } = await supabase
          .from('subcontrataciones')
          .insert({
            empresa_id: (data as any)?.empresa_id || undefined,
            consecutivo,
            alquiler_id: data.id,
            proveedor_id: provId,
            proveedor_nombre: provData?.nombre || 'Proveedor Aliado',
            proveedor_nit: provData?.nit || 'N/A',
            proveedor_telefono: provData?.telefono || null,
            proveedor_contacto: provData?.contacto || null,
            fecha_recepcion_estimada: fechaMin,
            fecha_devolucion_estimada: fechaMax,
            estado: 'SOLICITADA',
            costo_total_estimado: costoTotal,
            ingreso_total_estimado: ingresoTotal,
            margen_bruto_estimado: ingresoTotal - costoTotal,
            deposito_garantia_proveedor: 0,
            creado_por: userIdentifier
          })
          .select()
          .single();

        if (nuevaSub?.id) {
          await supabase
            .from('subcontrataciones_detalles')
            .insert(detallesPayload.map(d => ({
              ...d,
              subcontratacion_id: nuevaSub.id,
              empresa_id: (nuevaSub as any).empresa_id
            })));

          await supabase
            .from('alquiler_detalles')
            .update({ subcontratacion_id: nuevaSub.id })
            .eq('alquiler_id', data.id)
            .eq('es_subcontratado', true)
            .eq('proveedor_subcontratado_id', provId);
        }
      }
    } catch (subErr) {
      console.warn('[crearAlquilerAction] No se pudo auto-generar subcontratacion:', subErr);
    }
  }

  // 4. Invalidar Caché Multi-Tenant
  try {
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cacheErr) {
    console.warn('[crearAlquilerAction] Error al invalidar caché:', cacheErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/subcontrataciones');
  revalidatePath('/bodega');
  return { success: true, data };
}

export async function editarAlquilerAction(input: EditarAlquilerInput) {
  const validation = validateActionInput(input, EditarAlquilerZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de edición de alquiler inválidos' };
  }
  const cleanInput = validation.data;

  const numericAlquilerId = typeof cleanInput.alquilerId === 'string' 
    ? (parseInt(cleanInput.alquilerId.replace(/\D/g, ''), 10) || parseInt(cleanInput.alquilerId, 10))
    : cleanInput.alquilerId;

  if (!numericAlquilerId || isNaN(Number(numericAlquilerId))) {
    return { success: false, error: 'ID de contrato de alquiler inválido para edición.' };
  }

  const supabase = await createServerSupabaseClient();

  // 1. Calcular subtotales
  let subtotalEquipos = 0;
  const itemsProcesados = cleanInput.items.map(item => {
    const start = new Date(toSafeISOString(item.fechaInicio));
    const end = new Date(toSafeISOString(item.fechaFinEstimada));
    const diffMs = end.getTime() - start.getTime();
    let dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const tarifa = Number(item.tarifaAplicada || 0);
    const cant = Number(item.cantidad || 1);
    const subtotalLinea = tarifa * cant * dias;
    subtotalEquipos += subtotalLinea;

    const rawItemId = String(item.itemId || '').trim();
    const equipoId = parseInt(rawItemId.replace(/\D/g, ''), 10) || parseInt(rawItemId, 10);

    return {
      equipo_id: isNaN(equipoId) ? item.itemId : equipoId,
      cantidad: cant,
      tarifa_aplicada: tarifa,
      dias_contratados: dias,
      subtotal_linea: subtotalLinea,
      fecha_inicio: toSafeISOString(item.fechaInicio),
      fecha_fin: toSafeISOString(item.fechaFinEstimada),
      es_subcontratado: Boolean(item.esSubcontratado),
      proveedor_id: toSafeUUID(item.proveedorSubcontratadoId),
      costo_subcontratacion_diario: Number(item.costoDiarioProveedor || 0),
      nombreItem: item.nombreItem || ''
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
    garantia_monto: Number(cleanInput.garantiaMonto || 0),
    garantia_tipo: cleanInput.garantiaTipo || 'Efectivo',
    observaciones: cleanInput.observaciones || '',
    detalles_logistica: cleanInput.detallesLogistica || '',
    estado: cleanInput.estado || 'ACTIVO',
    updated_at: new Date().toISOString()
  };

  if (cleanInput.clienteId && cleanInput.clienteId !== 'undefined' && cleanInput.clienteId !== 'null') {
    const rawVal = String(cleanInput.clienteId).trim();
    const parsed = parseInt(rawVal.replace(/\D/g, ''), 10) || parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updatePayload.cliente_id = parsed;
    }
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
      .select('id, equipo_id, cantidad, es_subcontratado')
      .eq('alquiler_id', numericAlquilerId);

    // 3.1 Revertir stock anterior de equipos propios únicamente
    if (detallesPrevios && detallesPrevios.length > 0) {
      for (const dp of detallesPrevios) {
        if (dp.es_subcontratado) continue; // No alterar stock propio para ítems subcontratados
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

    // 3.2 Insertar nuevos detalles y descontar nuevo inventario propio
    for (const it of itemsProcesados) {
      if (!it.es_subcontratado) {
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
      }

      const { error: insertDetError } = await supabase
        .from('alquiler_detalles')
        .insert([{
          alquiler_id: numericAlquilerId,
          equipo_id: it.equipo_id,
          cantidad: it.cantidad,
          tarifa_aplicada: it.tarifa_aplicada,
          dias_contratados: it.dias_contratados,
          subtotal_linea: it.subtotal_linea,
          fecha_inicio: toSafeISOString(it.fecha_inicio),
          fecha_fin: toSafeISOString(it.fecha_fin),
          devuelto: false,
          cantidad_devuelta: 0,
          costo_dano: 0,
          es_subcontratado: it.es_subcontratado,
          proveedor_id: toSafeUUID(it.proveedor_id),
          costo_subcontratacion_diario: it.costo_subcontratacion_diario,
          empresa_id: cabeceraData?.empresa_id
        }]);

      if (insertDetError) {
        console.error('[editarAlquilerAction] Error insertando detalle:', insertDetError);
      }
    }
  } catch (detError: any) {
    console.error('Error al sincronizar detalles en editarAlquilerAction:', detError);
  }

  // 3.3 Sincronizar subcontrataciones si existen ítems tercerizados
  const subItems = itemsProcesados.filter(it => it.es_subcontratado && toSafeUUID(it.proveedor_id));
  if (subItems.length > 0 && numericAlquilerId) {
    try {
      const provMap = new Map<string, typeof subItems>();
      for (const it of subItems) {
        const pId = toSafeUUID(it.proveedor_id)!;
        if (!provMap.has(pId)) provMap.set(pId, []);
        provMap.get(pId)!.push(it);
      }

      for (const [provId, groupItems] of Array.from(provMap.entries())) {
        const { data: provData } = await supabase
          .from('proveedores')
          .select('nombre, nit, telefono, contacto')
          .eq('id', provId)
          .maybeSingle();

        const fechaMin = groupItems.reduce((min, it) => it.fecha_inicio < min ? it.fecha_inicio : min, groupItems[0].fecha_inicio);
        const fechaMax = groupItems.reduce((max, it) => it.fecha_fin > max ? it.fecha_fin : max, groupItems[0].fecha_fin);

        let costoTotal = 0;
        let ingresoTotal = 0;
        const detallesPayload = groupItems.map(it => {
          const start = new Date(toSafeISOString(it.fecha_inicio));
          const end = new Date(toSafeISOString(it.fecha_fin));
          const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          const costo = (it.costo_subcontratacion_diario || 0) * it.cantidad * dias;
          const ingreso = (it.tarifa_aplicada || 0) * it.cantidad * dias;
          costoTotal += costo;
          ingresoTotal += ingreso;
          return {
            equipo_id: it.equipo_id,
            equipo_nombre: it.nombreItem || 'Equipo Subcontratado',
            cantidad: it.cantidad,
            costo_unitario_diario: it.costo_subcontratacion_diario || 0,
            precio_alquiler_diario: it.tarifa_aplicada,
            dias,
            costo_total_linea: costo,
            ingreso_total_linea: ingreso,
            margen_bruto_linea: ingreso - costo,
          };
        });

        const ordenSubcontratacion = {
          alquiler_id: numericAlquilerId,
          proveedor_id: provId,
          proveedor_nombre: provData?.nombre || 'Aliado Comercial Externo',
          proveedor_nit: provData?.nit || 'S/N',
          proveedor_telefono: provData?.telefono || provData?.contacto || '',
          estado: 'ACTIVA',
          fecha_inicio: toSafeISOString(fechaMin),
          fecha_fin_estimada: toSafeISOString(fechaMax),
          costo_total_estimado: costoTotal,
          ingreso_total_estimado: ingresoTotal,
          margen_bruto_estimado: ingresoTotal - costoTotal,
          detalles_equipos: detallesPayload,
          observaciones: `Orden generada/actualizada automáticamente desde Contrato #${numericAlquilerId}`,
          empresa_id: cabeceraData?.empresa_id
        };

        await supabase
          .from('subcontrataciones')
          .upsert([ordenSubcontratacion], { onConflict: 'alquiler_id,proveedor_id' });
      }
    } catch (subErr) {
      console.warn('[editarAlquilerAction] Advertencia al sincronizar subcontrataciones:', subErr);
    }
  }

  // 4. Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cErr) {
    console.warn('[editarAlquilerAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/subcontrataciones');
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
    .select('equipo_id, cantidad, es_subcontratado')
    .eq('alquiler_id', numericAlquilerId);

  if (detErr) return { success: false, error: 'Error al consultar detalles de cotización.' };
  if (!detalles || detalles.length === 0) return { success: false, error: 'La cotización no tiene equipos asociados.' };

  // 2 y 3. Validación Pesimista y Descuento Atómico (RPC - Optimistic Locking)
  // Utilizamos el candado SQL 'reducir_stock_seguro' para asegurar que nadie más tome el equipo propio
  for (const det of detalles) {
    // Si el ítem es subcontratado con aliado externo, no consume activos propios de bodega
    if (det.es_subcontratado) {
      continue;
    }

    const { data: rpcSuccess, error: rpcErr } = await supabase.rpc('reducir_stock_seguro', {
      p_equipo_id: det.equipo_id,
      p_cantidad_requerida: det.cantidad
    });

    if (rpcErr || !rpcSuccess) {
      return { 
        success: false, 
        error: `Error de concurrencia al alquilar equipo ID: ${det.equipo_id}. Posible Overbooking: ${rpcErr?.message || 'Stock Insuficiente.'}`
      };
    }
  }

  // 4. Actualizar estado del alquiler a ACTIVO y sincronizar fletes / depósitos ajustados
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

  const updatePayload: any = { 
    estado: 'ACTIVO',
    flete_entrega: fleteEntregaFinal,
    flete_recogida: fleteRecogidaFinal,
    subtotal_general: subtotalGeneral,
    total: totalFinal,
    deposito: depositoFinal,
    saldo_pendiente: saldoPendienteFinal,
    updated_at: new Date().toISOString()
  };

  const { error: updErr } = await supabase
    .from('alquileres')
    .update(updatePayload)
    .eq('id', numericAlquilerId);

  if (updErr) return { success: false, error: `Error al activar el contrato: ${updErr.message}` };

  // 5. Invalidar Caché Multi-Tenant
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await invalidateTenantCache(user?.id, ['alquileres', 'equipos', 'subcontrataciones']);
  } catch (cErr) {
    console.warn('[aprobarCotizacionAction] Cache clear error:', cErr);
  }

  revalidatePath('/alquileres');
  revalidatePath('/bodega');
  revalidatePath('/cotizaciones');
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
