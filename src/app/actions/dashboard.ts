'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient, resolveEmpresaId } from '@/infrastructure/persistence/supabase/server';
import {
  procesarDashboardCompleto,
  type RawAlquilerDashboard,
  type RawEquipoDashboard,
  type RawDevolucionDashboard
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

    // Ejecutar consultas en paralelo en Supabase (Alquileres, Equipos, Devoluciones y Tareas Manuales)
    const [alquileresRes, equiposRes, devolucionesRes, tareasRes] = await Promise.all([
      supabase
        .from('alquileres')
        .select(`
          id,
          numero_contrato,
          consecutivo,
          estado,
          fecha_inicio,
          fecha_fin,
          total,
          saldo_pendiente,
          clientes ( id, nombre, nit_cedula ),
          alquiler_detalles (
            cantidad,
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
        .limit(20),

      supabase
        .from('dashboard_tareas')
        .select('id, titulo, subtexto, completada, urgencia, fecha_limite')
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .order('completada', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    // Mapear alquileres
    const rawAlquileres: RawAlquilerDashboard[] = (alquileresRes.data || []).map((a: any) => {
      const clienteObj = Array.isArray(a.clientes) ? a.clientes[0] : a.clientes;
      const clienteNombre = clienteObj?.nombre || 'Cliente';

      const detalles = (a.alquiler_detalles || []).map((d: any) => {
        const eqObj = Array.isArray(d.equipos) ? d.equipos[0] : d.equipos;
        return {
          equipo_nombre: eqObj?.nombre || 'Equipo',
          cantidad: d.cantidad || 1
        };
      });

      return {
        id: String(a.id),
        numero_contrato: a.numero_contrato || (a.consecutivo ? `CC-#${String(a.consecutivo).padStart(4, '0')}` : undefined),
        consecutivo: a.consecutivo,
        estado: a.estado || 'ACTIVO',
        fecha_inicio: a.fecha_inicio ? a.fecha_inicio.slice(0, 10) : '',
        fecha_fin: a.fecha_fin ? a.fecha_fin.slice(0, 10) : '',
        cliente_nombre: clienteNombre,
        total: Number(a.total) || 0,
        saldo_pendiente: Number(a.saldo_pendiente) || 0,
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

    // Procesar mediante el servicio de dominio puro
    const payload = procesarDashboardCompleto({
      alquileres: rawAlquileres,
      equipos: rawEquipos,
      devoluciones: rawDevoluciones,
      tareasManuales
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
