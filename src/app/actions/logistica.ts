'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '@/infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '@/lib/redis';
import { z } from 'zod';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import {
  LogisticaRutasService,
  TipoVehiculoTransporte,
  ZonaFleteBucaramanga,
} from '@/core/services/logistica-rutas.service';

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

// ============================================================================
// ESQUEMAS ZOD DE VALIDACIÓN (Defensa en Profundidad)
// ============================================================================

export const VehiculoTipoSchema = z.enum(['MOTOCARRO', 'CAMIONETA', 'TURBO_NPR']);
export const RutaEstadoSchema = z.enum(['PROGRAMADA', 'EN_CARGUE', 'EN_RUTA', 'FINALIZADA', 'CANCELADA']);
export const ParadaTipoSchema = z.enum(['ENTREGA_DESPACHO', 'RECOGIDA_DEVOLUCION']);
export const ParadaEstadoSchema = z.enum(['PENDIENTE', 'EN_SITIO', 'COMPLETADA', 'FALLIDA']);

export const ParadaInputSchema = z.object({
  alquilerId: z.coerce.number().optional().nullable(),
  clienteId: z.coerce.number().optional().nullable(),
  tipoParada: ParadaTipoSchema.default('ENTREGA_DESPACHO'),
  direccionObra: z.string().min(5, 'La dirección de obra debe tener al menos 5 caracteres'),
  zonaId: z.string().uuid('ID de zona inválido').optional().nullable(),
  ordenSecuencia: z.coerce.number().int().positive().default(1),
  horaEstimada: z.string().optional().nullable(),
  receptorNombre: z.string().max(100).optional().nullable(),
  receptorTelefono: z.string().max(50).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const CrearRutaZodSchema = z.object({
  fechaProgramada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  vehiculoPlaca: z.string().min(5, 'Placa de vehículo inválida').max(10).toUpperCase(),
  vehiculoTipo: VehiculoTipoSchema.default('CAMIONETA'),
  conductorNombre: z.string().min(3, 'El nombre del conductor debe tener al menos 3 caracteres'),
  conductorTelefono: z.string().max(50).optional().nullable(),
  kilometrosEstimados: z.coerce.number().int().nonnegative().default(0),
  totalFletes: z.coerce.number().nonnegative().default(0),
  observaciones: z.string().optional().nullable(),
  paradas: z.array(ParadaInputSchema).default([]),
  idempotencyKey: z.string().optional(),
});

export const CambiarEstadoRutaZodSchema = z.object({
  rutaId: z.string().uuid('ID de ruta inválido'),
  nuevoEstado: RutaEstadoSchema,
});

export const ActualizarEstadoParadaZodSchema = z.object({
  paradaId: z.string().uuid('ID de parada inválido'),
  estadoParada: ParadaEstadoSchema,
  evidenciaFotos: z.array(z.string().url()).optional().default([]),
  latitud: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitud: z.coerce.number().min(-180).max(180).optional().nullable(),
  receptorNombre: z.string().max(100).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const CalcularFleteZodSchema = z.object({
  zonaId: z.string().uuid('ID de zona inválido'),
  vehiculoTipo: VehiculoTipoSchema,
});

export type CrearRutaInput = z.infer<typeof CrearRutaZodSchema>;
export type ActualizarEstadoParadaInput = z.infer<typeof ActualizarEstadoParadaZodSchema>;

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Consulta todas las zonas de flete del Área Metropolitana de Bucaramanga para el tenant
 */
export async function obtenerZonasFleteAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const { data, error } = await supabase
      .from('zonas_flete_bucaramanga')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('activo', true)
      .order('municipio', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[obtenerZonasFleteAction Error]:', error);
    return { success: false, error: error.message || 'Error al obtener zonas de flete' };
  }
}

/**
 * Consulta las rutas programadas con sus paradas para una fecha determinada
 */
export async function obtenerRutasDespachoAction(fecha?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    let query = supabase
      .from('rutas_despacho')
      .select(`
        *,
        ruta_paradas (
          *,
          zonas_flete_bucaramanga (id, nombre, municipio)
        )
      `)
      .eq('empresa_id', empresaId)
      .order('creado_en', { ascending: false });

    if (fecha) {
      query = query.eq('fecha_programada', fecha);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('[obtenerRutasDespachoAction Error]:', error);
    return { success: false, error: error.message || 'Error al obtener rutas de despacho' };
  }
}

/**
 * Consulta el detalle completo de una ruta específica
 */
export async function obtenerDetalleRutaAction(rutaId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const { data, error } = await supabase
      .from('rutas_despacho')
      .select(`
        *,
        ruta_paradas (
          *,
          zonas_flete_bucaramanga (id, nombre, municipio, tarifa_base_camioneta),
          alquileres (id, consecutivo, total, saldo_pendiente),
          clientes (id, nombre, telefono)
        )
      `)
      .eq('id', rutaId)
      .eq('empresa_id', empresaId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('[obtenerDetalleRutaAction Error]:', error);
    return { success: false, error: error.message || 'Error al obtener detalle de ruta' };
  }
}

/**
 * Crea una nueva ruta de despacho con sus paradas iniciales
 */
export async function crearRutaDespachoAction(input: CrearRutaInput) {
  const validation = validateActionInput(input, CrearRutaZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de ruta inválidos' };
  }
  const cleanInput = validation.data;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const fechaSinGuiones = cleanInput.fechaProgramada.replace(/-/g, '');
    const codigoRuta = `RUTA-${fechaSinGuiones}-${Math.floor(100 + Math.random() * 900)}`;

    const { data: ruta, error: errorRuta } = await supabase
      .from('rutas_despacho')
      .insert([{
        empresa_id: empresaId,
        codigo_ruta: codigoRuta,
        fecha_programada: cleanInput.fechaProgramada,
        vehiculo_placa: cleanInput.vehiculoPlaca.trim(),
        vehiculo_tipo: cleanInput.vehiculoTipo,
        conductor_nombre: cleanInput.conductorNombre.trim(),
        conductor_telefono: cleanInput.conductorTelefono?.trim() || null,
        kilometros_estimados: cleanInput.kilometrosEstimados,
        total_fletes: Math.trunc(cleanInput.totalFletes),
        observaciones: cleanInput.observaciones || null,
      }])
      .select()
      .single();

    if (errorRuta) throw errorRuta;

    if (cleanInput.paradas && cleanInput.paradas.length > 0) {
      const paradasPayload = cleanInput.paradas.map((p, idx) => ({
        empresa_id: empresaId,
        ruta_id: ruta.id,
        alquiler_id: p.alquilerId || null,
        cliente_id: p.clienteId || null,
        tipo_parada: p.tipoParada,
        orden_secuencia: p.ordenSecuencia || (idx + 1),
        direccion_obra: p.direccionObra.trim(),
        zona_id: p.zonaId || null,
        estado_parada: 'PENDIENTE',
        receptor_nombre: p.receptorNombre || null,
        receptor_telefono: p.receptorTelefono || null,
        observaciones: p.observaciones || null,
      }));

      const { error: errorParadas } = await supabase.from('ruta_paradas').insert(paradasPayload);
      if (errorParadas) throw errorParadas;
    }

    await AuditLogger.log({
      empresaId,
      userId: user.id,
      modulo: 'LOGISTICA',
      accion: 'CREAR_RUTA_DESPACHO',
      descripcion: `Creada ruta de despacho ${codigoRuta} con ${cleanInput.paradas.length} paradas`,
      entidadId: ruta.id,
      detalles: { codigoRuta, totalParadas: cleanInput.paradas.length },
    });

    await invalidateTenantCache(empresaId, ['logistica']);
    safeRevalidatePath('/logistica');

    return { success: true, data: ruta };
  } catch (error: any) {
    console.error('[crearRutaDespachoAction Error]:', error);
    return { success: false, error: error.message || 'Error al crear la ruta de despacho' };
  }
}

/**
 * Cambia el estado de una ruta de despacho (ej: EN_RUTA, FINALIZADA)
 */
export async function cambiarEstadoRutaAction(rutaId: string, nuevoEstado: string) {
  const validation = validateActionInput({ rutaId, nuevoEstado }, CambiarEstadoRutaZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Parámetros de estado inválidos' };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const { data, error } = await supabase
      .from('rutas_despacho')
      .update({ estado: validation.data.nuevoEstado, actualizado_en: new Date().toISOString() })
      .eq('id', rutaId)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw error;

    await AuditLogger.log({
      empresaId,
      userId: user.id,
      modulo: 'LOGISTICA',
      accion: 'CAMBIO_ESTADO_RUTA',
      descripcion: `Cambio de estado en ruta ${rutaId} a ${validation.data.nuevoEstado}`,
      entidadId: rutaId,
      detalles: { nuevoEstado: validation.data.nuevoEstado },
    });

    await invalidateTenantCache(empresaId, ['logistica']);
    safeRevalidatePath('/logistica');

    return { success: true, data };
  } catch (error: any) {
    console.error('[cambiarEstadoRutaAction Error]:', error);
    return { success: false, error: error.message || 'Error al cambiar estado de la ruta' };
  }
}

/**
 * Actualiza el estado de una parada (ej: COMPLETADA con fotos y GPS)
 */
export async function actualizarEstadoParadaAction(input: ActualizarEstadoParadaInput) {
  const validation = validateActionInput(input, ActualizarEstadoParadaZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Datos de actualización de parada inválidos' };
  }
  const cleanInput = validation.data;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const updatePayload: Record<string, any> = {
      estado_parada: cleanInput.estadoParada,
    };

    if (cleanInput.estadoParada === 'COMPLETADA') {
      updatePayload.hora_completada = new Date().toISOString();
      if (cleanInput.evidenciaFotos && cleanInput.evidenciaFotos.length > 0) {
        updatePayload.evidencia_fotos = cleanInput.evidenciaFotos;
      }
      if (cleanInput.latitud != null && cleanInput.longitud != null) {
        updatePayload.latitud = cleanInput.latitud;
        updatePayload.longitud = cleanInput.longitud;
      }
    }

    if (cleanInput.receptorNombre) updatePayload.receptor_nombre = cleanInput.receptorNombre.trim();
    if (cleanInput.observaciones) updatePayload.observaciones = cleanInput.observaciones.trim();

    const { data, error } = await supabase
      .from('ruta_paradas')
      .update(updatePayload)
      .eq('id', cleanInput.paradaId)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw error;

    await AuditLogger.log({
      empresaId,
      userId: user.id,
      modulo: 'LOGISTICA',
      accion: 'ACTUALIZAR_PARADA_RUTA',
      descripcion: `Actualizada parada ${cleanInput.paradaId} a estado ${cleanInput.estadoParada}`,
      entidadId: cleanInput.paradaId,
      detalles: { nuevoEstado: cleanInput.estadoParada, rutaId: data?.ruta_id },
    });

    await invalidateTenantCache(empresaId, ['logistica']);
    safeRevalidatePath('/logistica');

    return { success: true, data };
  } catch (error: any) {
    console.error('[actualizarEstadoParadaAction Error]:', error);
    return { success: false, error: error.message || 'Error al actualizar parada' };
  }
}

/**
 * Calcula la tarifa de flete para una zona de Bucaramanga y tipo de vehículo
 */
export async function calcularFleteAction(input: { zonaId: string; vehiculoTipo: TipoVehiculoTransporte }) {
  const validation = validateActionInput(input, CalcularFleteZodSchema);
  if (!validation.success) {
    return { success: false, error: validation.error || 'Parámetros de flete inválidos' };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    const empresaId = await resolveEmpresaId(user.id);
    const { data: zona, error } = await supabase
      .from('zonas_flete_bucaramanga')
      .select('*')
      .eq('id', validation.data.zonaId)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !zona) {
      return { success: false, error: 'Zona de flete no encontrada' };
    }

    const zonaTyped: ZonaFleteBucaramanga = {
      id: zona.id,
      codigo: zona.codigo,
      nombre: zona.nombre,
      municipio: zona.municipio,
      tarifaBaseMotocarro: Number(zona.tarifa_base_motocarro),
      tarifaBaseCamioneta: Number(zona.tarifa_base_camioneta),
      tarifaBaseTurbo: Number(zona.tarifa_base_turbo),
      tiempoEstimadoMinutos: zona.tiempo_estimado_minutos,
      activo: zona.activo,
    };

    const tarifa = LogisticaRutasService.calcularTarifaSugerida(
      zonaTyped,
      validation.data.vehiculoTipo as TipoVehiculoTransporte
    );

    return {
      success: true,
      data: {
        zonaId: zona.id,
        nombreZona: zona.nombre,
        municipio: zona.municipio,
        vehiculoTipo: validation.data.vehiculoTipo,
        tarifaFleteCop: tarifa,
      },
    };
  } catch (error: any) {
    console.error('[calcularFleteAction Error]:', error);
    return { success: false, error: error.message || 'Error al calcular flete' };
  }
}
