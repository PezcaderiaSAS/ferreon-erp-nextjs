'use server';

import { createServerSupabaseClient } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';

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
  equipoId: z.union([z.string(), z.number()]).optional(),
  descripcionItem: z.string().min(2, 'La descripción del ítem es requerida'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  diasPactados: z.number().int().min(1, 'Los días pactados deben ser al menos 1'),
  costoDiarioUnitario: z.number().min(0, 'El costo diario no puede ser negativo'),
  tarifaDiariaCliente: z.number().min(0).optional().default(0),
  alquilerDetalleId: z.union([z.string(), z.number()]).optional(),
});

const CrearSubcontratacionZodSchema = z.object({
  proveedorId: z.string().min(1, 'Debe seleccionar un proveedor aliado'),
  proveedorNombre: z.string().min(2, 'El nombre del proveedor es requerido'),
  proveedorNit: z.string().min(3, 'El NIT del proveedor es requerido'),
  proveedorTelefono: z.string().optional(),
  fechaRecepcionEstimada: z.string().min(1, 'La fecha estimada de recepción es requerida'),
  fechaDevolucionEstimada: z.string().min(1, 'La fecha estimada de devolución es requerida'),
  alquilerId: z.union([z.string(), z.number()]).optional(),
  depositoGarantiaProveedor: z.number().min(0).optional().default(0),
  observaciones: z.string().optional(),
  items: z.array(SubcontratacionItemZodSchema).min(1, 'Debe incluir al menos un equipo en la orden de subcontratación'),
});

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
