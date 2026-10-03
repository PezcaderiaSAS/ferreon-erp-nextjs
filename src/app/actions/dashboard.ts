'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '@/infrastructure/persistence/supabase/server';
import {
  procesarDashboardCompleto,
  type RawAlquilerDashboard,
  type RawEquipoDashboard,
  type RawDevolucionDashboard
} from '@/core/services/dashboard-transaccional.service';
import { type DashboardPayload, type TareaOperativa } from '@/core/types/dashboard';

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

    // Ejecutar consultas en paralelo en Supabase
    const [alquileresRes, equiposRes, devolucionesRes] = await Promise.all([
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
        .limit(20)
    ]);

    // Mapear alquileres
    const rawAlquileres: RawAlquilerDashboard[] = (alquileresRes.data || []).map((a: any) => {
      // Extraer cliente
      const clienteObj = Array.isArray(a.clientes) ? a.clientes[0] : a.clientes;
      const clienteNombre = clienteObj?.nombre || 'Cliente';

      // Extraer items
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

    // Procesar mediante el servicio de dominio puro
    const payload = procesarDashboardCompleto({
      alquileres: rawAlquileres,
      equipos: rawEquipos,
      devoluciones: rawDevoluciones
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
 * Server Action: Crear Tarea Manual Rápida
 */
export async function crearTareaManualAction(
  titulo: string,
  fechaLimite?: string
): Promise<{ success: boolean; data?: TareaOperativa; error?: string }> {
  try {
    if (!titulo || titulo.trim().length === 0) {
      return { success: false, error: 'El título de la tarea es obligatorio' };
    }

    const nuevaTarea: TareaOperativa = {
      id: `task-manual-${Date.now()}`,
      titulo: titulo.trim(),
      tipo: 'MANUAL',
      completada: false,
      fechaLimite: fechaLimite || undefined,
      urgencia: 'NORMAL',
      subtexto: 'Tarea manual personalizada'
    };

    return { success: true, data: nuevaTarea };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error al crear tarea manual' };
  }
}
