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
 * Verifica existencias en bodega, bloquea atómicamente el inventario,
 * crea el contrato en `alquileres`, registra el movimiento en `kardex_inventario`
 * y marca la cotización como `CONVERTIDA`.
 */
export async function convertirCotizacionAContratoAction(input: ConvertirCotizacionInput) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userIdentifier = user?.email || user?.id || 'SISTEMA_OPERADOR';

    // 1. Obtener la cotización completa
    const { data: cotizacion, error: cotErr } = await supabase
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
            stock_disponible,
            stock_en_obra
          )
        )
      `)
      .eq('id', input.cotizacionId)
      .single();

    if (cotErr || !cotizacion) {
      return { success: false, error: 'Cotización no encontrada para conversión.' };
    }

    if (cotizacion.estado === 'CONVERTIDA') {
      return { 
        success: false, 
        error: `Esta cotización ya fue convertida previamente al Contrato #${cotizacion.alquiler_id || 'existente'}.` 
      };
    }

    const detalles = cotizacion.cotizaciones_detalles || [];
    if (detalles.length === 0) {
      return { success: false, error: 'La cotización no contiene ítems ni equipos para alquilar.' };
    }

    // 2. POKA-YOKE DE STOCK PESIMISTA:
    // Validar de forma estricta que todos los equipos tengan stock disponible suficiente
    for (const det of detalles) {
      const { data: eqActual, error: eqErr } = await supabase
        .from('equipos')
        .select('id, nombre, stock_disponible')
        .eq('id', det.equipo_id)
        .single();

      if (eqErr || !eqActual) {
        return { 
          success: false, 
          error: `Equipo ID ${det.equipo_id} no encontrado en inventario.` 
        };
      }

      if (eqActual.stock_disponible < det.cantidad) {
        return {
          success: false,
          error: `[POKA-YOKE INVENTARIO] Stock insuficiente para "${eqActual.nombre}". Disponible en bodega: ${eqActual.stock_disponible} unidad(es), requerido en cotización: ${det.cantidad}. Ajuste el pedido antes de formalizar el contrato.`
        };
      }
    }

    // 3. Asegurar existencia de Cliente en Base de Datos
    let clienteIdReal = cotizacion.cliente_id;
    if (!clienteIdReal) {
      // Si fue una cotización a prospecto rápido, asegurar cliente en tabla clientes
      const docClean = cotizacion.cliente_documento?.trim() || `PROSP-${Date.now().toString().slice(-6)}`;
      const { data: nuevoCli, error: cliErr } = await supabase
        .from('clientes')
        .insert([{
          nit_cedula: docClean,
          nombre: cotizacion.cliente_nombre.trim(),
          telefono: cotizacion.cliente_telefono?.trim() || '',
          email: cotizacion.cliente_email?.trim() || '',
          direccion: cotizacion.obra_direccion?.trim() || '',
          estado: 'Activo'
        }])
        .select()
        .single();

      if (cliErr) {
        console.warn('Advertencia al crear cliente on-the-fly desde cotización:', cliErr);
      } else if (nuevoCli) {
        clienteIdReal = nuevoCli.id;
      }
    }

    // 4. Preparar Payload Transaccional para Alquiler
    const hoy = new Date();
    const itemsPayload = detalles.map((d: any) => {
      const fInicio = hoy.toISOString();
      const fFin = new Date(hoy.getTime() + (d.dias * 24 * 60 * 60 * 1000)).toISOString();

      return {
        equipo_id: d.equipo_id,
        cantidad: d.cantidad,
        tarifa_aplicada: d.tarifa_diaria,
        dias_contratados: d.dias,
        subtotal_linea: d.subtotal,
        fecha_inicio: fInicio,
        fecha_fin: fFin
      };
    });

    const fleteEntrega = Number(cotizacion.valor_transporte || 0);
    const deposito = Number(cotizacion.deposito_garantia || 0);
    const totalContrato = Number(cotizacion.total || 0);

    const rpcPayload = {
      cliente_id: clienteIdReal,
      estado: 'ACTIVO',
      subtotal_equipos: Number(cotizacion.subtotal || 0),
      flete_entrega: fleteEntrega,
      flete_recogida: 0,
      subtotal_general: Number(cotizacion.subtotal || 0) + fleteEntrega,
      total: totalContrato,
      deposito: deposito,
      garantia_monto: deposito,
      garantia_tipo: 'Efectivo',
      observaciones: `Convertido automáticamente desde Cotización ${cotizacion.consecutivo}. ${cotizacion.observaciones || ''}`.trim(),
      detalles_logistica: cotizacion.obra_direccion || '',
      creado_por: userIdentifier,
      items: itemsPayload
    };

    // 5. Ejecutar creación atómica con la función SQL transaccional
    const { data: alqData, error: rpcErr } = await supabase.rpc('crear_alquiler_transaccional', {
      p_payload: rpcPayload
    });

    if (rpcErr || !alqData?.alquiler_id) {
      console.error('Error RPC al convertir cotización en contrato:', rpcErr);
      return { 
        success: false, 
        error: `Error al formalizar contrato en base de datos: ${rpcErr?.message || 'Error desconocido en transacción'}` 
      };
    }

    const nuevoAlquilerId = alqData.alquiler_id;
    const consecutivoAlquiler = alqData.consecutivo;

    // 6. Actualizar campos tributarios y referencia de cotización en el nuevo contrato
    await supabase
      .from('alquileres')
      .update({
        aplica_iva: cotizacion.aplica_iva,
        valor_iva: cotizacion.valor_iva,
        aplica_retefuente: cotizacion.aplica_retefuente,
        valor_retefuente: cotizacion.valor_retefuente,
        aplica_reteica: cotizacion.aplica_reteica,
        valor_reteica: cotizacion.valor_reteica,
        cotizacion_origen_id: cotizacion.id,
      })
      .eq('id', nuevoAlquilerId);

    // 7. Registrar Movimientos Inmutables en Kardex (SALIDA_ALQUILER)
    try {
      for (const d of detalles) {
        const { data: eqActual } = await supabase
          .from('equipos')
          .select('stock_disponible, tenant_id')
          .eq('id', d.equipo_id)
          .single();

        await adminSupabase.from('kardex_inventario').insert([{
          equipo_id: d.equipo_id,
          tenant_id: eqActual?.tenant_id || user?.id || null,
          tipo_movimiento: 'ALQUILER_SALIDA',
          cantidad_delta: -Math.abs(d.cantidad),
          stock_resultante: eqActual?.stock_disponible || 0,
          motivo: `Despacho por alquiler formalizado desde cotización ${cotizacion.consecutivo}`,
          referencia_documento: `ALQ-${consecutivoAlquiler || nuevoAlquilerId}`,
          usuario_id: user?.id || '00000000-0000-0000-0000-000000000000'
        }]);
      }
    } catch (kardexError) {
      console.warn('Advertencia al registrar en kardex_inventario:', kardexError);
    }

    // 8. Marcar la Cotización como CONVERTIDA y enlazar al Contrato
    await supabase
      .from('cotizaciones')
      .update({
        estado: 'CONVERTIDA',
        alquiler_id: nuevoAlquilerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', cotizacion.id);

    // 9. Auditoría Completa
    AuditLogger.logAsync({
      modulo: 'ALQUILERES',
      accion: 'CONVERTIR_COTIZACION_A_CONTRATO',
      descripcion: `Cotización ${cotizacion.consecutivo} convertida con éxito en Contrato ALQ-${consecutivoAlquiler || nuevoAlquilerId}. Total: $${totalContrato.toLocaleString('es-CO')}`,
      entidadId: nuevoAlquilerId,
      detalles: {
        cotizacionId: cotizacion.id,
        cotizacionConsecutivo: cotizacion.consecutivo,
        alquilerId: nuevoAlquilerId,
        consecutivoAlquiler,
        total: totalContrato,
        equiposCount: detalles.length
      },
      userId: user?.id,
      userEmail: user?.email,
    });

    // 10. Limpieza de Caché y Revalidación de Rutas
    try {
      await invalidateTenantCache(user?.id, ['cotizaciones', 'alquileres', 'equipos']);
    } catch (cErr) {
      console.warn('[convertirCotizacionAContratoAction] Cache clear error:', cErr);
    }

    revalidatePath('/alquileres');
    revalidatePath('/cotizaciones');
    revalidatePath('/bodega');

    return {
      success: true,
      data: {
        alquilerId: nuevoAlquilerId,
        consecutivo: consecutivoAlquiler,
        cotizacionConsecutivo: cotizacion.consecutivo
      }
    };
  } catch (err: any) {
    console.error('Excepción crítica en convertirCotizacionAContratoAction:', err);
    return {
      success: false,
      error: err.message || 'Error inesperado durante la conversión de cotización a contrato'
    };
  }
}
