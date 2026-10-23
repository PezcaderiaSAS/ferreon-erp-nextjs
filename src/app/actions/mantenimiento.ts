'use server';

import { createServerSupabaseClient, createAdminSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '@/lib/redis';
import { validateActionInput } from '@/lib/security/validation';
import { AuditLogger } from '@/lib/security/audit-logger';
import { RegistrarMantenimientoZodSchema, RegistrarMantenimientoInput } from '@/core/domain/schemas/mantenimientoSchemas';

/**
 * Server Action: Registra el mantenimiento preventivo o correctivo de un equipo,
 * resetea los contadores de desgaste (horómetros/días) y reintegra unidades a Disponible.
 */
export async function registrarMantenimientoPreventivoAction(input: RegistrarMantenimientoInput) {
  try {
    const validation = validateActionInput(input, RegistrarMantenimientoZodSchema);
    if (!validation.success) {
      return { success: false, error: validation.error || 'Datos de mantenimiento inválidos' };
    }
    const cleanInput = validation.data;

    const supabaseAuth = await createServerSupabaseClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión para registrar mantenimiento.' };
    }
    const empresaId = await resolveEmpresaId(user.id);
    const supabaseAdmin = createAdminSupabaseClient();

    const numericEquipoId = typeof cleanInput.equipoId === 'string'
      ? parseInt(cleanInput.equipoId, 10)
      : cleanInput.equipoId;

    // 1. Obtener estado actual del equipo
    const { data: equipo, error: fetchErr } = await supabaseAdmin
      .from('equipos')
      .select('*')
      .eq('id', numericEquipoId)
      .single();

    if (fetchErr || !equipo) {
      return { success: false, error: 'Equipo no encontrado para registrar mantenimiento.' };
    }

    const mantenimientoActual = Number(equipo.stock_mantenimiento || 0);
    const cantidadALiberar = Math.min(Number(cleanInput.cantidad || 0), mantenimientoActual);
    const nuevoMantenimiento = Math.max(0, mantenimientoActual - cantidadALiberar);
    const nuevoDisponible = Number(equipo.stock_disponible || 0) + cantidadALiberar;

    // Construir nuevo snapshot de mantenimiento
    const nowIso = new Date().toISOString();
    const registroService = {
      fecha: nowIso,
      observaciones: cleanInput.observaciones,
      costo: cleanInput.costoInsumos || 0,
      tecnico: cleanInput.tecnicoResponsable || user.email || 'Taller Central',
      unidadesPuestasAPunto: cantidadALiberar,
    };

    const updatePayload: Record<string, any> = {
      stock_mantenimiento: nuevoMantenimiento,
      stock_disponible: nuevoDisponible,
      updated_at: nowIso,
    };

    // 2. Actualizar en base de datos
    const { data: actualizado, error: updateErr } = await supabaseAdmin
      .from('equipos')
      .update(updatePayload)
      .eq('id', numericEquipoId)
      .select()
      .single();

    if (updateErr) {
      console.error('[registrarMantenimientoAction] Error en update:', updateErr);
      return { success: false, error: `Error al actualizar equipo: ${updateErr.message}` };
    }

    // 3. Registrar asiento inmutable en Kardex
    try {
      await supabaseAdmin.from('kardex_inventario').insert([{
        equipo_id: numericEquipoId,
        empresa_id: equipo.empresa_id || empresaId || null,
        tenant_id: equipo.empresa_id || empresaId || null,
        tipo_movimiento: 'MANTENIMIENTO_PREVENTIVO',
        cantidad_delta: cantidadALiberar,
        stock_resultante: nuevoDisponible,
        motivo: `Service Preventivo: ${cleanInput.observaciones} (Costo: $${cleanInput.costoInsumos || 0})`,
        usuario_id: user.id || null,
      }]);
    } catch (kardexErr) {
      console.warn('[registrarMantenimientoAction] Advertencia Kardex:', kardexErr);
    }

    // 4. Invalidar caché y auditar
    await invalidateTenantCache(empresaId, ['equipos', 'equipos_v2'], numericEquipoId);

    AuditLogger.logAsync({
      modulo: 'BODEGA',
      accion: 'MANTENIMIENTO_PREVENTIVO',
      descripcion: `Service preventivo registrado para equipo #${numericEquipoId} (${equipo.nombre}). Insumos: $${cleanInput.costoInsumos || 0}`,
      entidadId: numericEquipoId,
      detalles: { ...cleanInput, registroService },
      userId: user.id,
      userEmail: user.email,
    });

    revalidatePath('/bodega');
    revalidatePath('/dashboard');
    return { success: true, data: actualizado };
  } catch (err: any) {
    console.error('Error en registrarMantenimientoPreventivoAction:', err);
    return { success: false, error: err.message || 'Error inesperado al registrar mantenimiento preventivo.' };
  }
}
