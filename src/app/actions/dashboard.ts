'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, resolveEmpresaId } from '@/infrastructure/persistence/supabase/server';
import {
  procesarDashboardCompleto,
  type RawAlquilerDashboard,
  type RawEquipoDashboard,
  type RawDevolucionDashboard,
  type RawCotizacionDashboard,
  type RawFacturaDashboard,
  type RawPagoDashboard
} from '@/core/services/dashboard-transaccional.service';
import { type DashboardPayload, type TareaOperativa, type UrgenciaTarea } from '@/core/types/dashboard';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Modo test o entorno sin contexto de cache Next.js
  }
}

/**
 * Server Action: Consulta y Procesamiento integral de datos para el Dashboard
 */
export async function obtenerDashboardDataAction(empresaIdParam?: string): Promise<{
  success: boolean;
  data?: DashboardPayload;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesión no iniciada' };
    }

    const empresaId = empresaIdParam || (await resolveEmpresaId(user.id));

    // Ejecutar consultas en paralelo en Supabase (Alquileres, Equipos, Devoluciones, Tareas, Cotizaciones, Facturas y Pagos)
    const [alquileresRes, equiposRes, devolucionesRes, tareasRes, cotizacionesRes, facturasRes, pagosRes] = await Promise.all([
      supabase
        .from('alquileres')
        .select(`
          id,
          consecutivo,
          estado,
          total,
          saldo_pendiente,
          total_pagado,
          created_at,
          clientes ( id, nombre, nit_cedula ),
          alquiler_detalles (
            cantidad,
            fecha_inicio,
            fecha_fin,
            equipos ( id, nombre, codigo )
          )
        `)
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),

      supabase
        .from('equipos')
        .select('id, nombre, codigo, estado, stock_total, stock_disponible')
        .eq('empresa_id', empresaId)
        .order('nombre', { ascending: true }),

      supabase
        .from('devoluciones')
        .select('id, alquiler_id, fecha_devolucion, estado')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(30),

      supabase
        .from('dashboard_tareas')
        .select('id, titulo, subtexto, completada, urgencia, fecha_limite')
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .order('completada', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(30),

      supabase
        .from('cotizaciones')
        .select('id, consecutivo, cliente_nombre, fecha_emision, fecha_vencimiento, obra_nombre, total, subtotal, estado')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('facturas')
        .select('id, numero_consecutivo, tipo_documento, alquiler_id, total_pagar, estado_pago, created_at, clientes ( nombre )')
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('pagos')
        .select('id, alquiler_id, monto, metodo_pago, referencia, fecha, clientes ( nombre )')
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .order('fecha', { ascending: false })
        .limit(50)
    ]);

    // Mapear alquileres extrayendo fechas efectivas de los detalles
    const rawAlquileres: RawAlquilerDashboard[] = (alquileresRes.data || []).map((a: any) => {
      const clienteObj = Array.isArray(a.clientes) ? a.clientes[0] : a.clientes;
      const clienteNombre = clienteObj?.nombre || 'Cliente';

      let minFechaInicio = '';
      let maxFechaFin = '';

      const detalles = (a.alquiler_detalles || []).map((d: any) => {
        const eqObj = Array.isArray(d.equipos) ? d.equipos[0] : d.equipos;
        const fIni = d.fecha_inicio ? String(d.fecha_inicio).slice(0, 10) : '';
        const fFin = d.fecha_fin ? String(d.fecha_fin).slice(0, 10) : '';

        if (fIni && (!minFechaInicio || fIni < minFechaInicio)) minFechaInicio = fIni;
        if (fFin && (!maxFechaFin || fFin > maxFechaFin)) maxFechaFin = fFin;

        return {
          equipo_nombre: eqObj?.nombre || 'Equipo',
          cantidad: d.cantidad || 1
        };
      });

      const fechaInicio = minFechaInicio || (a.created_at ? String(a.created_at).slice(0, 10) : '');
      const fechaFin = maxFechaFin || fechaInicio;

      return {
        id: String(a.id),
        numero_contrato: a.consecutivo ? `CC-#${String(a.consecutivo).padStart(4, '0')}` : `#ALQ-${a.id}`,
        consecutivo: a.consecutivo,
        estado: a.estado || 'ACTIVO',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        cliente_nombre: clienteNombre,
        total: Number(a.total) || 0,
        saldo_pendiente: Number(a.saldo_pendiente) || 0,
        total_pagado: Number(a.total_pagado) || 0,
        detalles
      };
    });

    // Mapear equipos
    const rawEquipos: RawEquipoDashboard[] = (equiposRes.data || []).map((eq: any) => ({
      id: String(eq.id),
      nombre: eq.nombre,
      codigo: eq.codigo,
      estado: eq.estado || 'DISPONIBLE',
      stock_total: Number(eq.stock_total) || 0,
      stock_disponible: Number(eq.stock_disponible) || 0
    }));

    // Mapear devoluciones
    const rawDevoluciones: RawDevolucionDashboard[] = (devolucionesRes.data || []).map((d: any) => ({
      id: String(d.id),
      alquiler_id: String(d.alquiler_id),
      fecha_devolucion: d.fecha_devolucion ? d.fecha_devolucion.slice(0, 10) : '',
      estado: d.estado || 'PROCESADA'
    }));

    // Mapear tareas manuales persistidas
    const tareasManuales: TareaOperativa[] = (tareasRes.data || []).map((t: any) => ({
      id: String(t.id),
      titulo: t.titulo,
      tipo: 'MANUAL',
      completada: Boolean(t.completada),
      fechaLimite: t.fecha_limite ? String(t.fecha_limite).slice(0, 10) : undefined,
      urgencia: (t.urgencia === 'URGENTE' ? 'URGENTE' : 'NORMAL') as UrgenciaTarea,
      subtexto: t.subtexto || 'Tarea personalizada'
    }));

    // Mapear cotizaciones comerciales
    const rawCotizaciones: RawCotizacionDashboard[] = (cotizacionesRes.data || []).map((c: any) => ({
      id: String(c.id),
      consecutivo: String(c.consecutivo || ''),
      cliente_nombre: c.cliente_nombre || 'Cliente Particular',
      fecha_emision: c.fecha_emision ? String(c.fecha_emision).slice(0, 10) : '',
      fecha_vencimiento: c.fecha_vencimiento ? String(c.fecha_vencimiento).slice(0, 10) : undefined,
      total: Number(c.total) || 0,
      subtotal: Number(c.subtotal) || 0,
      estado: c.estado || 'ENVIADA',
      obra_nombre: c.obra_nombre || undefined
    }));

    // Mapear facturas y cuentas de cobro
    const rawFacturas: RawFacturaDashboard[] = (facturasRes.data || []).map((f: any) => {
      const clienteObj = Array.isArray(f.clientes) ? f.clientes[0] : f.clientes;
      return {
        id: String(f.id),
        numero_consecutivo: Number(f.numero_consecutivo) || 0,
        tipo_documento: f.tipo_documento || 'CUENTA_COBRO',
        total_pagar: Number(f.total_pagar) || 0,
        estado_pago: f.estado_pago || 'EMITIDA',
        fecha: f.created_at ? String(f.created_at).slice(0, 10) : '',
        cliente_nombre: clienteObj?.nombre || undefined,
        alquiler_id: f.alquiler_id ? String(f.alquiler_id) : undefined
      };
    });

    // Mapear pagos
    const rawPagos: RawPagoDashboard[] = (pagosRes.data || []).map((p: any) => {
      const clienteObj = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
      return {
        id: String(p.id),
        monto: Number(p.monto) || 0,
        metodo_pago: p.metodo_pago || 'TRANSFERENCIA',
        fecha: p.fecha ? String(p.fecha).slice(0, 10) : '',
        cliente_nombre: clienteObj?.nombre || undefined,
        alquiler_id: p.alquiler_id ? String(p.alquiler_id) : undefined
      };
    });

    // Procesar mediante el servicio de dominio puro
    const payload = procesarDashboardCompleto({
      alquileres: rawAlquileres,
      equipos: rawEquipos,
      devoluciones: rawDevoluciones,
      tareasManuales,
      cotizaciones: rawCotizaciones,
      facturas: rawFacturas,
      pagos: rawPagos
    });

    return { success: true, data: payload };
  } catch (err: any) {
    console.error('[obtenerDashboardDataAction Error]:', err);
    return {
      success: false,
      error: err?.message || 'Error al procesar datos del dashboard'
    };
  }
}

/**
 * Server Action: Crear Tarea Manual Rápida con persistencia en Supabase
 */
export async function crearTareaManualAction(
  titulo: string,
  fechaLimite?: string,
  urgencia: UrgenciaTarea = 'NORMAL'
): Promise<{ success: boolean; data?: TareaOperativa; error?: string }> {
  try {
    if (!titulo || titulo.trim().length === 0) {
      return { success: false, error: 'El título de la tarea es obligatorio' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesión no iniciada' };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const subtexto = 'Tarea manual personalizada';

    const { data: inserted, error: insertError } = await supabase
      .from('dashboard_tareas')
      .insert({
        empresa_id: empresaId,
        user_id: user.id,
        titulo: titulo.trim(),
        subtexto,
        completada: false,
        urgencia: urgencia === 'URGENTE' ? 'URGENTE' : 'NORMAL',
        fecha_limite: fechaLimite || null
      })
      .select('id, titulo, subtexto, completada, urgencia, fecha_limite')
      .single();

    if (insertError) {
      console.error('[crearTareaManualAction Insert Error]:', insertError);
      return { success: false, error: insertError.message || 'Error al guardar la tarea' };
    }

    const nuevaTarea: TareaOperativa = {
      id: String(inserted.id),
      titulo: inserted.titulo,
      tipo: 'MANUAL',
      completada: Boolean(inserted.completada),
      fechaLimite: inserted.fecha_limite ? String(inserted.fecha_limite).slice(0, 10) : undefined,
      urgencia: (inserted.urgencia === 'URGENTE' ? 'URGENTE' : 'NORMAL') as UrgenciaTarea,
      subtexto: inserted.subtexto || subtexto
    };

    safeRevalidatePath('/dashboard');
    return { success: true, data: nuevaTarea };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al crear tarea manual' };
  }
}

/**
 * Server Action: Conmutar Estado de Tarea (Completada / Pendiente)
 */
export async function toggleTareaCompletadaAction(
  tareaId: string,
  completada: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!tareaId) {
      return { success: false, error: 'Identificador de tarea requerido' };
    }

    // Si es una tarea generada por el sistema en vuelo, no requiere update en base de datos
    if (tareaId.startsWith('task-sys-')) {
      return { success: true };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesión no iniciada' };
    }

    const empresaId = await resolveEmpresaId(user.id);

    const { error: updateError } = await supabase
      .from('dashboard_tareas')
      .update({
        completada,
        updated_at: new Date().toISOString()
      })
      .eq('id', tareaId)
      .eq('empresa_id', empresaId);

    if (updateError) {
      console.error('[toggleTareaCompletadaAction Error]:', updateError);
      return { success: false, error: updateError.message };
    }

    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al actualizar tarea' };
  }
}

/**
 * Server Action: Eliminar Tarea Manual (Soft-Delete)
 */
export async function eliminarTareaManualAction(
  tareaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!tareaId) {
      return { success: false, error: 'Identificador de tarea requerido' };
    }

    if (tareaId.startsWith('task-sys-')) {
      return { success: false, error: 'Las tareas del sistema son dinámicas y no se pueden eliminar manualmente' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sesión no iniciada' };
    }

    const empresaId = await resolveEmpresaId(user.id);

    const { error: deleteError } = await supabase
      .from('dashboard_tareas')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', tareaId)
      .eq('empresa_id', empresaId);

    if (deleteError) {
      console.error('[eliminarTareaManualAction Error]:', deleteError);
      return { success: false, error: deleteError.message };
    }

    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al eliminar tarea' };
  }
}
