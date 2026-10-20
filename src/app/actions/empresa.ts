'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache, getTenantCache, setTenantCache } from '../../lib/redis';
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from '../../core/domain/entities/empresa-config';

/**
 * Obtiene la configuración corporativa persistida en Supabase para el tenant activo.
 * Cuenta con fallback a DEFAULT_EMPRESA_CONFIG y caché multi-tenant.
 */
export async function obtenerConfiguracionEmpresaAction(): Promise<{
  success: boolean;
  config?: EmpresaConfig;
  data?: EmpresaConfig;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: true, config: DEFAULT_EMPRESA_CONFIG, data: DEFAULT_EMPRESA_CONFIG };
    }

    const empresaId = await resolveEmpresaId(user.id);
    if (!empresaId) {
      return { success: true, config: DEFAULT_EMPRESA_CONFIG, data: DEFAULT_EMPRESA_CONFIG };
    }

    // 1. Intentar caché multi-tenant particionada por empresaId
    try {
      const cached = await getTenantCache<EmpresaConfig>(empresaId, 'empresa');
      if (cached) {
        return { success: true, config: cached, data: cached };
      }
    } catch (cErr) {
      console.warn('[obtenerConfiguracionEmpresaAction] Error leyendo caché:', cErr);
    }

    // 2. Localizar la empresa activa del usuario (estrictamente por su empresaId)
    const { data: empresaData, error: empErr } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .maybeSingle();

    if (empErr || !empresaData) {
      return { success: true, config: DEFAULT_EMPRESA_CONFIG, data: DEFAULT_EMPRESA_CONFIG };
    }

    // 3. Fusionar datos de la tabla con el JSONB configuracion
    const configJson = (typeof empresaData.configuracion === 'object' && empresaData.configuracion !== null)
      ? empresaData.configuracion
      : {};

    const configFinal: EmpresaConfig = {
      ...DEFAULT_EMPRESA_CONFIG,
      ...configJson,
      razonSocial: empresaData.nombre || configJson.razonSocial || DEFAULT_EMPRESA_CONFIG.razonSocial,
      nit: empresaData.nit || configJson.nit || DEFAULT_EMPRESA_CONFIG.nit,
    };

    // 4. Almacenar en caché temporal particionada por empresaId (300 segundos = 5 minutos)
    try {
      await setTenantCache(empresaId, 'empresa', configFinal, 300);
    } catch (cErr) {
      console.warn('[obtenerConfiguracionEmpresaAction] Error escribiendo caché:', cErr);
    }

    return { success: true, config: configFinal, data: configFinal };
  } catch (error: any) {
    console.error('[obtenerConfiguracionEmpresaAction] Error:', error);
    return { success: false, error: error.message || 'Error al obtener la configuración' };
  }
}

/**
 * Persiste la configuración corporativa (Logo Base64, Datos fiscales, Colores)
 * en la columna configuracion JSONB de la tabla empresas en Supabase.
 */
export async function guardarConfiguracionEmpresaAction(
  nuevaConfig: Partial<EmpresaConfig>
): Promise<{
  success: boolean;
  data?: EmpresaConfig;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'No autorizado. Debe iniciar sesión.' };
    }

    const empresaId = await resolveEmpresaId(user.id);
    if (!empresaId) {
      return { success: false, error: 'No se encontró una empresa activa vinculada al usuario' };
    }

    // 2. Obtener configuración previa para merge inmutable
    const { data: empresaActual } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    const configPrev = (empresaActual?.configuracion && typeof empresaActual.configuracion === 'object')
      ? empresaActual.configuracion
      : {};

    const configCombinada: EmpresaConfig = {
      ...DEFAULT_EMPRESA_CONFIG,
      ...configPrev,
      ...nuevaConfig,
    };

    // 3. Actualizar columnas principales y columna JSONB
    const updatePayload: any = {
      configuracion: configCombinada,
      updated_at: new Date().toISOString()
    };

    if (nuevaConfig.razonSocial) {
      updatePayload.nombre = nuevaConfig.razonSocial;
    }
    if (nuevaConfig.nit) {
      updatePayload.nit = nuevaConfig.nit;
    }

    const { error: updateError } = await supabase
      .from('empresas')
      .update(updatePayload)
      .eq('id', empresaId);

    if (updateError) {
      console.error('[guardarConfiguracionEmpresaAction] Supabase error:', updateError);
      return { success: false, error: `Error en BD: ${updateError.message}` };
    }

    // 4. Invalidar Caché de Tenant de forma atómica
    try {
      await invalidateTenantCache(empresaId, ['empresa', 'alquileres']);
    } catch (cErr) {
      console.warn('[guardarConfiguracionEmpresaAction] Error limpiando caché:', cErr);
    }

    revalidatePath('/configuracion');
    revalidatePath('/alquileres');

    return { success: true, data: configCombinada };
  } catch (error: any) {
    console.error('[guardarConfiguracionEmpresaAction] Error:', error);
    return { success: false, error: error.message || 'Error al guardar la configuración' };
  }
}
