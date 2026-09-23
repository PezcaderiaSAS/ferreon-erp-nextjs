'use server';

import { createServerSupabaseClient, resolveEmpresaId } from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '../../lib/redis';
import { AuditLogger } from '@/lib/security/audit-logger';
import { ContratoSegmentadoZodSchema, ContratoSegmentadoInput } from '@/core/validations/alquiler-segmentado.schema';

export interface ActionStandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  path?: string;
  details?: Record<string, any>;
  idempotent?: boolean;
}

/**
 * Revalidación defensiva compatible con Server Actions y tests unitarios
 */
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Silenciado en entornos de prueba fuera del RequestStore de Next.js
  }
}

/**
 * Server Action: Despacho y Creación de Contratos Segmentados y Concurrentes
 * ID: SPEC-2026-WMS-CONCURRENT-RENTALS-001 / TAREA-05
 */
export async function crearAlquilerSegmentadoAction(rawInput: unknown): Promise<ActionStandardResponse> {
  const ACTION_FILE = 'src/app/actions/alquiler-segmentado.ts';

  // ==========================================================================
  // BLOQUE 1: Validación Estructural Dual-Layer con Zod
  // ==========================================================================
  let cleanInput: ContratoSegmentadoInput;
  try {
    const parsed = ContratoSegmentadoZodSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const issuePath = firstIssue.path.join('.');
      return {
        success: false,
        error: 'ERR_VALIDATION_ZOD',
        message: `Fallo de validación en campo [${issuePath}]: ${firstIssue.message}`,
        path: `${ACTION_FILE}:37#ZodValidation`,
        details: { issues: parsed.error.issues }
      };
    }
    cleanInput = parsed.data;
  } catch (zodErr: any) {
    return {
      success: false,
      error: 'ERR_ZOD_EXCEPTION',
      message: `Error no controlado en validación Zod: ${zodErr.message}`,
      path: `${ACTION_FILE}:46#ZodCatch`,
    };
  }

  // ==========================================================================
  // BLOQUE 2: Autenticación e Inspección de Tenant Multi-Empresa
  // ==========================================================================
  let supabase: any;
  let empresaId: string;
  let userIdentifier: string = 'SISTEMA_OPERADOR';
  let userId: string | undefined;

  try {
    supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'ERR_UNAUTHORIZED',
        message: 'Sesión no autorizada o expirada en Alquileres System.',
        path: `${ACTION_FILE}:63#AuthInspection`,
      };
    }

    userId = user.id;
    userIdentifier = user.email || user.id;
    empresaId = await resolveEmpresaId(user.id);

    if (!empresaId) {
      return {
        success: false,
        error: 'ERR_TENANT_NOT_RESOLVED',
        message: 'No se pudo resolver el identificador de empresa (Tenant ID) para este usuario.',
        path: `${ACTION_FILE}:73#ResolveEmpresaId`,
      };
    }
  } catch (authException: any) {
    return {
      success: false,
      error: 'ERR_AUTH_INFRASTRUCTURE',
      message: `Fallo en capa de autenticación de Supabase: ${authException.message}`,
      path: `${ACTION_FILE}:80#AuthCatch`,
    };
  }

  // ==========================================================================
  // BLOQUE 3: Ejecución Transaccional Atómica (RPC con SELECT ... FOR UPDATE)
  // ==========================================================================
  try {
    const totalEquipos = cleanInput.items.reduce((acc, it) => acc + it.subtotalLinea, 0);
    const totalGeneral = totalEquipos + cleanInput.fleteEntrega + cleanInput.fleteRecogida;

    const payloadRPC = {
      empresa_id: empresaId,
      cliente_id: cleanInput.clienteId,
      estado: cleanInput.estado,
      idempotency_key: cleanInput.idempotency_key || null,
      subtotal_equipos: totalEquipos,
      flete_entrega: cleanInput.fleteEntrega,
      flete_recogida: cleanInput.fleteRecogida,
      subtotal_general: totalGeneral,
      total: totalGeneral,
      deposito: cleanInput.deposito,
      garantia_monto: cleanInput.garantiaMonto,
      garantia_tipo: cleanInput.garantiaTipo,
      observaciones: cleanInput.observaciones || null,
      detalles_logistica: cleanInput.detallesLogistica || null,
      creado_por: userIdentifier,
      items: cleanInput.items.map((it, idx) => ({
        linea_numero: it.lineaNumero || idx + 1,
        equipo_id: it.itemId,
        cantidad: it.cantidad,
        tarifa_aplicada: it.tarifaAplicada,
        tarifa_personalizada: it.tarifaPersonalizada,
        dias_contratados: it.diasContratados,
        subtotal_linea: it.subtotalLinea,
        subtotal_personalizado: it.subtotalPersonalizado,
        fecha_inicio: it.fechaInicio,
        fecha_fin: it.fechaFinEstimada,
        es_subcontratado: it.esSubcontratado,
        proveedor_subcontratado_id: it.proveedorSubcontratadoId || null,
        costo_diario_proveedor: it.costoDiarioProveedor || 0,
      }))
    };

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'alquiler_despachar_segmentado_concurrente_v1',
      { p_payload: payloadRPC }
    );

    if (rpcError) {
      const msg = rpcError.message || '';
      let code = 'ERR_POSTGREST_RPC';

      if (msg.includes('ERR_OVERBOOKING_CONCURRENTE')) {
        code = 'ERR_OVERBOOKING_CONCURRENTE';
      } else if (msg.includes('ERR_FECHAS_INVALIDAS')) {
        code = 'ERR_FECHAS_INVALIDAS';
      } else if (msg.includes('ERR_ITEM_NOT_FOUND')) {
        code = 'ERR_ITEM_NOT_FOUND';
      } else if (msg.includes('ERR_TENANT_NOT_FOUND')) {
        code = 'ERR_TENANT_NOT_FOUND';
      }

      return {
        success: false,
        error: code,
        message: msg,
        path: `${ACTION_FILE}:145#PostgrestRpcExecution`,
        details: { rpcCode: rpcError.code, hint: rpcError.hint, details: rpcError.details }
      };
    }

    // ==========================================================================
    // BLOQUE 4: Auditoría Inmutable e Invalidación Granular de Caché
    // ==========================================================================
    AuditLogger.logAsync({
      modulo: 'ALQUILERES',
      accion: 'CREAR_ALQUILER',
      descripcion: `Contrato segmentado consecutivo #${rpcData.consecutivo} registrado con ${cleanInput.items.length} líneas temporales.`,
      entidadId: String(rpcData.id),
      detalles: {
        clienteId: cleanInput.clienteId,
        consecutivo: rpcData.consecutivo,
        total: totalGeneral,
        lineasCount: cleanInput.items.length
      },
      userId,
      userEmail: userIdentifier,
      empresaId
    });

    try {
      await invalidateTenantCache(empresaId, ['alquileres']);
    } catch (err) {
      console.warn('[RedisCache] Advertencia al invalidar caché:', err);
    }

    safeRevalidatePath('/alquileres');

    return {
      success: true,
      data: rpcData,
      idempotent: Boolean(rpcData.idempotent)
    };

  } catch (fatalException: any) {
    return {
      success: false,
      error: 'ERR_UNHANDLED_SERVER_EXCEPTION',
      message: `Fallo general no controlado en el servidor: ${fatalException.message}`,
      path: `${ACTION_FILE}:185#FatalCatch`,
      details: { stack: fatalException.stack }
    };
  }
}
