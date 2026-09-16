'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { calcularLiquidacionSubcontratacion } from '@/core/services/liquidacion-subcontratacion.service';

export interface SubcontratacionItemInput {
  equipoId?: string | number;
  descripcionItem: string;
  cantidad: number;
  diasPactados: number;
  costoDiarioUnitario: number;
  tarifaDiariaCliente?: number;
  alquilerDetalleId?: string | number;
}

export interface CrearSubcontratacionInput {
  proveedorId: string;
  proveedorNombre: string;
  proveedorNit: string;
  proveedorTelefono?: string;
  fechaRecepcionEstimada: string;
  fechaDevolucionEstimada: string;
  alquilerId?: string | number;
  depositoGarantiaProveedor?: number;
  observaciones?: string;
  items: SubcontratacionItemInput[];
}

const SubcontratacionItemZodSchema = z.object({
  equipoId: z.union([z.string(), z.number()]).optional().nullable(),
  descripcionItem: z.string().min(2, 'La descripción del ítem es requerida'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  diasPactados: z.coerce.number().int().min(1, 'Los días pactados deben ser al menos 1'),
  costoDiarioUnitario: z.coerce.number().min(0, 'El costo diario no puede ser negativo'),
  tarifaDiariaCliente: z.coerce.number().min(0).optional().default(0),
  alquilerDetalleId: z.union([z.string(), z.number()]).optional().nullable(),
}).passthrough();

const CrearSubcontratacionZodSchema = z.object({
  proveedorId: z.string().min(1, 'Debe seleccionar un proveedor aliado'),
  proveedorNombre: z.string().min(2, 'El nombre del proveedor es requerido'),
  proveedorNit: z.string().min(3, 'El NIT del proveedor es requerido'),
  proveedorTelefono: z.string().optional().nullable(),
  fechaRecepcionEstimada: z.string().min(1, 'La fecha estimada de recepción es requerida'),
  fechaDevolucionEstimada: z.string().min(1, 'La fecha estimada de devolución es requerida'),
  alquilerId: z.union([z.string(), z.number()]).optional().nullable(),
  depositoGarantiaProveedor: z.coerce.number().min(0).optional().default(0),
  observaciones: z.string().optional().nullable(),
  items: z.array(SubcontratacionItemZodSchema).min(1, 'Debe incluir al menos un equipo en la orden de subcontratación'),
}).passthrough();

const CambiarEstadoSubcontratacionZodSchema = z.object({
  subcontratacionId: z.string().min(1, 'ID de subcontratación requerido'),
  nuevoEstado: z.enum([
    'ORDENADA', 'RECIBIDA_EN_BODEGA', 'EN_CLIENTE', 'DEVUELTA_A_PROVEEDOR', 'CANCELADA',
    'BORRADOR', 'SOLICITADA', 'ACTIVA', 'DEVUELTA'
  ]),
  observaciones: z.string().optional(),
});

export async function crearSubcontratacionAction(input: CrearSubcontratacionInput) {
  const validation = validateActionInput(input, CrearSubcontratacionZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de subcontratación inválidos' };
  }
  const cleanInput = validation.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

  // 1. Calcular costo total estimado
  let costoTotalEstimado = 0;
  const itemsProcesados = cleanInput.items.map(item => {
    const subtotalLinea = item.cantidad * item.diasPactados * item.costoDiarioUnitario;
    costoTotalEstimado += subtotalLinea;
    return {
      equipo_id: item.equipoId ? (typeof item.equipoId === 'string' ? parseInt(item.equipoId, 10) || null : item.equipoId) : null,
      descripcion_item: item.descripcionItem,
      cantidad: item.cantidad,
      dias_pactados: item.diasPactados,
      costo_diario_unitario: item.costoDiarioUnitario,
      tarifa_diaria_cliente: item.tarifaDiariaCliente || 0,
      subtotal_costo: subtotalLinea,
      alquiler_detalle_id: item.alquilerDetalleId ? (typeof item.alquilerDetalleId === 'string' ? parseInt(item.alquilerDetalleId, 10) || null : item.alquilerDetalleId) : null
    };
  });

  // Generar consecutivo amigable (SUB-XXXX)
  const consecutivo = `SUB-${Date.now().toString().slice(-4)}`;

  // 2. Insertar cabecera de subcontratación
  const { data: nuevaSub, error: errSub } = await supabase
    .from('subcontrataciones')
    .insert({
      consecutivo,
      alquiler_id: cleanInput.alquilerId ? (typeof cleanInput.alquilerId === 'string' ? parseInt(cleanInput.alquilerId, 10) || null : cleanInput.alquilerId) : null,
      proveedor_id: cleanInput.proveedorId,
      proveedor_nombre: cleanInput.proveedorNombre,
      proveedor_nit: cleanInput.proveedorNit,
      proveedor_telefono: cleanInput.proveedorTelefono,
      fecha_recepcion_estimada: cleanInput.fechaRecepcionEstimada,
      fecha_devolucion_estimada: cleanInput.fechaDevolucionEstimada,
      costo_total_estimado: costoTotalEstimado,
      deposito_garantia_proveedor: cleanInput.depositoGarantiaProveedor || 0,
      observaciones: cleanInput.observaciones || '',
      estado: 'ORDENADA',
      creado_por: userIdentifier
    })
    .select()
    .single();

  if (errSub || !nuevaSub) {
    console.error('Error insertando subcontratación:', errSub);
    return { success: false, error: `Error al registrar subcontratación: ${errSub?.message || 'Error desconocido'}` };
  }

  // 3. Insertar detalles
  const detallesConId = itemsProcesados.map(d => ({
    ...d,
    subcontratacion_id: nuevaSub.id
  }));

  const { error: errDetalles } = await supabase
    .from('subcontrataciones_detalles')
    .insert(detallesConId);

  if (errDetalles) {
    console.error('Error insertando detalles de subcontratación:', errDetalles);
    // Rollback manual de la cabecera si fallan los detalles
    await supabase.from('subcontrataciones').delete().eq('id', nuevaSub.id);
    return { success: false, error: `Error al registrar ítems subcontratados: ${errDetalles.message}` };
  }

  // 4. Registro de Auditoría Forense
  AuditLogger.logAsync({
    modulo: 'SUBCONTRATACIONES',
    accion: 'CREAR_ORDEN_SUBCONTRATACION',
    descripcion: `Orden de subcontratación ${consecutivo} creada con proveedor ${cleanInput.proveedorNombre}. Costo estimado: $${costoTotalEstimado.toLocaleString('es-CO')}`,
    entidadId: nuevaSub.id,
    detalles: {
      consecutivo,
      proveedorId: cleanInput.proveedorId,
      proveedorNombre: cleanInput.proveedorNombre,
      alquilerId: cleanInput.alquilerId,
      itemsCount: cleanInput.items.length,
      costoTotalEstimado
    },
    userId: user?.id,
    userEmail: user?.email
  });

  revalidatePath('/subcontrataciones');
  revalidatePath('/alquileres');
  revalidatePath('/bodega');

  return { success: true, data: { ...nuevaSub, detalles: itemsProcesados } };
}

export async function obtenerSubcontratacionesAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('subcontrataciones')
      .select('*, subcontrataciones_detalles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener subcontrataciones:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Excepción al obtener subcontrataciones:', err);
    return { success: false, error: err.message || 'Error inesperado', data: [] };
  }
}

export async function cambiarEstadoSubcontratacionAction(input: { subcontratacionId: string; nuevoEstado: string; observaciones?: string }) {
  const validation = validateActionInput(input, CambiarEstadoSubcontratacionZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de cambio de estado inválidos' };
  }

  const supabase = await createServerSupabaseClient();
  const updatePayload: any = {
    estado: validation.data.nuevoEstado,
    updated_at: new Date().toISOString()
  };

  if (validation.data.nuevoEstado === 'RECIBIDA_EN_BODEGA') {
    updatePayload.fecha_recepcion_real = new Date().toISOString();
  } else if (validation.data.nuevoEstado === 'DEVUELTA_A_PROVEEDOR') {
    updatePayload.fecha_devolucion_real = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('subcontrataciones')
    .update(updatePayload)
    .eq('id', validation.data.subcontratacionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/subcontrataciones');
  revalidatePath('/bodega');

  return { success: true, data };
}

/**
 * Registra el retorno efectivo de la maquinaria al proveedor aliado,
 * congelando el cómputo de costos de subcontratación.
 */
export async function registrarRetornoAProveedorAction(input: {
  subcontratacionId: string;
  fechaRetornoReal?: string;
  observaciones?: string;
}) {
  const schema = z.object({
    subcontratacionId: z.string().min(1, 'ID de subcontratación requerido'),
    fechaRetornoReal: z.string().optional(),
    observaciones: z.string().optional(),
  });

  const validation = validateActionInput(input, schema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos inválidos' };
  }

  const supabase = await createServerSupabaseClient();
  const fechaRetorno = validation.data.fechaRetornoReal || new Date().toISOString();

  const { data, error } = await supabase
    .from('subcontrataciones')
    .update({
      estado: 'DEVUELTA_A_PROVEEDOR',
      fecha_devolucion_real: fechaRetorno,
      observaciones: validation.data.observaciones 
        ? `${validation.data.observaciones} (Retorno formal a proveedor registrado)` 
        : 'Retorno formal a proveedor registrado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', validation.data.subcontratacionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  AuditLogger.logAsync({
    modulo: 'SUBCONTRATACIONES',
    accion: 'RETORNO_A_PROVEEDOR',
    descripcion: `Maquinaria de orden ${data.consecutivo} devuelta formalmente al proveedor ${data.proveedor_nombre}.`,
    entidadId: data.id,
    detalles: {
      consecutivo: data.consecutivo,
      proveedor: data.proveedor_nombre,
      fechaRetorno,
    },
  });

  revalidatePath('/subcontrataciones');
  revalidatePath('/bodega');

  return { success: true, data };
}

/**
 * Liquida contablemente la orden de subcontratación, computa retenciones (IVA, ReteFuente, ReteICA)
 * y genera el asiento contable balanceado en el Ledger (Cuentas 2205 vs 6135).
 */
export async function liquidarSubcontratacionAction(input: {
  subcontratacionId: string;
  aplicaRetenciones?: boolean;
  tasaReteFuente?: number;
  tasaReteICA?: number;
  metodoPago?: string;
}) {
  const schema = z.object({
    subcontratacionId: z.string().min(1, 'ID de subcontratación requerido'),
    aplicaRetenciones: z.boolean().optional().default(true),
    tasaReteFuente: z.number().optional().default(0.025),
    tasaReteICA: z.number().optional().default(0.00966),
    metodoPago: z.string().optional().default('TRANSFERENCIA'),
  });

  const validation = validateActionInput(input, schema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de liquidación inválidos' };
  }

  const supabase = await createServerSupabaseClient();
  const { subcontratacionId, aplicaRetenciones, tasaReteFuente, tasaReteICA } = validation.data;

  // 1. Obtener la orden de subcontratación con sus detalles
  const { data: subcontratacion, error: subErr } = await supabase
    .from('subcontrataciones')
    .select(`
      *,
      subcontrataciones_detalles (*)
    `)
    .eq('id', subcontratacionId)
    .single();

  if (subErr || !subcontratacion) {
    return { success: false, error: subErr?.message || 'Orden de subcontratación no encontrada' };
  }

  const fechaRetorno = subcontratacion.fecha_devolucion_real || new Date().toISOString();
  const fechaRecepcion = subcontratacion.fecha_recepcion_real || subcontratacion.created_at;

  // 2. Liquidar mediante el servicio puro de dominio
  const liquidacion = calcularLiquidacionSubcontratacion(
    {
      id: subcontratacion.id,
      consecutivo: subcontratacion.consecutivo,
      proveedorId: subcontratacion.proveedor_id,
      proveedorNombre: subcontratacion.proveedor_nombre,
      proveedorNit: subcontratacion.proveedor_nit,
      fechaRecepcion,
      fechaRetornoProveedor: fechaRetorno,
    },
    (subcontratacion.subcontrataciones_detalles || []).map((d: any) => ({
      itemSubcontratacionId: d.id,
      equipoId: d.equipo_id,
      descripcionItem: d.descripcion_item,
      cantidad: d.cantidad,
      costoDiarioProveedor: Number(d.costo_diario_unitario) || 0,
      tarifaDiariaCliente: Number(d.tarifa_diaria_cliente) || 0,
    })),
    {
      aplicaRetenciones,
      tasaReteFuente,
      tasaReteICA,
    }
  );

  // 3. Crear asiento contable en transacciones y journal_entries
  let transaccionId: string | null = null;

  try {
    const { data: txData } = await supabase
      .from('transactions')
      .insert({
        empresa_id: subcontratacion.empresa_id,
        concepto: liquidacion.asientoContable.concepto,
        tipo: 'EGRESO_OPERATIVO',
        total: liquidacion.costoTotalProveedor,
        estado: 'ASENTADO',
      })
      .select('id')
      .single();

    if (txData?.id) {
      transaccionId = txData.id;

      // Insertar líneas contables en journal_entries
      const lineasJournal = liquidacion.asientoContable.lineas.map(l => ({
        transaction_id: txData.id,
        empresa_id: subcontratacion.empresa_id,
        account_code: l.cuentaCodigo,
        debit: l.naturaleza === 'DEBITO' ? l.monto : 0,
        credit: l.naturaleza === 'CREDITO' ? l.monto : 0,
        description: l.cuentaNombre,
      }));

      await supabase.from('journal_entries').insert(lineasJournal);
    }
  } catch (txErr) {
    console.warn('[liquidarSubcontratacionAction] Error generando asiento contable:', txErr);
  }

  // 4. Actualizar estado de subcontratación a LIQUIDADA
  const { data: subActualizada, error: upErr } = await supabase
    .from('subcontrataciones')
    .update({
      estado: 'LIQUIDADA',
      costo_final_liquidado: liquidacion.netoPagarProveedor,
      costo_total_real: liquidacion.costoTotalProveedor,
      retefuente_valor: liquidacion.valorReteFuente,
      reteica_valor: liquidacion.valorReteICA,
      asiento_contable_id: transaccionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subcontratacionId)
    .select()
    .single();

  if (upErr) {
    return { success: false, error: upErr.message };
  }

  AuditLogger.logAsync({
    modulo: 'SUBCONTRATACIONES',
    accion: 'LIQUIDAR_SUBCONTRATACION',
    descripcion: `Liquidada orden ${subcontratacion.consecutivo} a ${subcontratacion.proveedor_nombre}. Costo: $${liquidacion.costoTotalProveedor} COP, Neto: $${liquidacion.netoPagarProveedor} COP.`,
    entidadId: subcontratacion.id,
    detalles: {
      consecutivo: subcontratacion.consecutivo,
      proveedor: subcontratacion.proveedor_nombre,
      costoTotal: liquidacion.costoTotalProveedor,
      netoPagar: liquidacion.netoPagarProveedor,
      margenBruto: liquidacion.margenBruto,
      porcentajeMargen: liquidacion.porcentajeMargen,
      transaccionId,
    },
  });

  revalidatePath('/subcontrataciones');
  revalidatePath('/bodega');

  return {
    success: true,
    data: {
      subcontratacion: subActualizada,
      liquidacion,
      transaccionId,
    },
  };
}
