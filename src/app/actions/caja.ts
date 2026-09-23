'use server';

import { 
  createServerSupabaseClient, 
  createAdminSupabaseClient, 
  resolveEmpresaId,
  verificarConexionSupabase,
  SupabaseHealthResult
} from '../../infrastructure/persistence/supabase/server';
import { revalidatePath } from 'next/cache';
import { invalidateTenantCache } from '@/lib/redis';
import { z } from 'zod';
import { AuditLogger } from '@/lib/security/audit-logger';
import { ConteoDenominaciones } from '@/core/services/calculoCajaArqueo';
import { CajaTransaccionalService } from '@/core/services/caja-transaccional.service';

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

/**
 * Server Action para validar la conectividad en vivo con Supabase
 */
export async function verificarConexionSupabaseAction(): Promise<SupabaseHealthResult> {
  try {
    return await verificarConexionSupabase();
  } catch (err: any) {
    return {
      ok: false,
      latenciaMs: 0,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      timestamp: new Date().toISOString(),
      error: err.message || 'Error inesperado al validar conexión con Supabase.'
    };
  }
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN ZOD (Defensa en Profundidad)
// ============================================================================

const AbrirCajaZodSchema = z.object({
  montoApertura: z.coerce.number().min(0, 'El monto de apertura no puede ser negativo'),
  observaciones: z.string().optional().nullable(),
  idempotencyKey: z.string().optional()
});

const MovimientoCajaZodSchema = z.object({
  sesionCajaId: z.string().uuid('ID de sesión de caja inválido'),
  tipo: z.enum(['INGRESO', 'EGRESO'], { errorMap: () => ({ message: 'El tipo debe ser INGRESO o EGRESO' }) }),
  monto: z.coerce.number().positive('El monto debe ser un valor positivo mayor a 0'),
  concepto: z.string().min(3, 'El concepto debe tener al menos 3 caracteres'),
  beneficiario: z.string().optional().nullable(),
  comprobante: z.string().optional().nullable(),
  idempotencyKey: z.string().optional()
});

const CerrarCajaZodSchema = z.object({
  sesionCajaId: z.string().uuid('ID de sesión de caja inválido'),
  montoCierreFisico: z.coerce.number().min(0, 'El monto de cierre no puede ser negativo'),
  arqueoDetalle: z.any().optional().nullable(),
  motivoDescuadre: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  idempotencyKey: z.string().optional()
});

// ============================================================================
// SERVER ACTIONS DELGADAS: CAJA Y PUNTO DE VENTA (POS)
// ============================================================================

/**
 * Consulta la sesión de caja actualmente ABIERTA para el usuario autenticado
 */
export async function obtenerSesionActivaAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'No se detectó una sesión autenticada.',
        sesion: null,
        resumen: null,
        movimientos: [],
        pagosEfectivo: [],
      };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    return await CajaTransaccionalService.obtenerSesionActiva(admin, user.id, empresaId);
  } catch (err: any) {
    console.error('[obtenerSesionActivaAction Error]:', err);
    return {
      success: false,
      error: err.message || 'Error al obtener sesión activa.',
      sesion: null,
      resumen: null,
      movimientos: [],
      pagosEfectivo: [],
    };
  }
}

/**
 * Server Action: Apertura de Sesión de Caja
 */
export async function abrirSesionCajaAction(input: {
  montoApertura: number;
  observaciones?: string;
  idempotencyKey?: string;
}) {
  try {
    const parsed = AbrirCajaZodSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de apertura inválidos' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Debes iniciar sesión para abrir una caja.' };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    const result = await CajaTransaccionalService.abrirSesion(admin, {
      userId: user.id,
      empresaId,
      montoApertura: parsed.data.montoApertura,
      observaciones: parsed.data.observaciones,
      userEmail: user.email,
    });

    if (!result.success || !result.sesion) {
      return result;
    }

    // Auditoría Inmutable
    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: 'APERTURA_CAJA',
      entidadId: result.sesion.id,
      descripcion: `Apertura de sesión de caja con base inicial de $${result.montoAperturaEntero.toLocaleString('es-CO')} COP`,
      detalles: {
        sesionId: result.sesion.id,
        montoApertura: result.montoAperturaEntero,
        observaciones: parsed.data.observaciones
      }
    });

    try {
      await invalidateTenantCache(empresaId, ['caja']);
    } catch {}

    safeRevalidatePath('/caja');
    return { success: true, sesion: result.sesion };
  } catch (err: any) {
    console.error('[abrirSesionCajaAction Error]:', err);
    return { success: false, error: err.message || 'Error inesperado al abrir la caja.' };
  }
}

/**
 * Server Action: Registrar Movimiento Menor en Efectivo (Ingreso / Egreso)
 */
export async function registrarMovimientoCajaAction(input: {
  sesionCajaId: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto: string;
  beneficiario?: string;
  comprobante?: string;
  idempotencyKey?: string;
}) {
  try {
    const parsed = MovimientoCajaZodSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de movimiento inválidos' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Debes iniciar sesión para registrar movimientos de caja.' };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    const result = await CajaTransaccionalService.registrarMovimiento(admin, {
      userId: user.id,
      empresaId,
      sesionCajaId: parsed.data.sesionCajaId,
      tipo: parsed.data.tipo,
      monto: parsed.data.monto,
      concepto: parsed.data.concepto,
      beneficiario: parsed.data.beneficiario,
      comprobante: parsed.data.comprobante,
      userEmail: user.email,
    });

    if (!result.success || !result.movimiento) {
      return result;
    }

    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: parsed.data.tipo === 'EGRESO' ? 'EGRESO_CAJA_MENOR' : 'INGRESO_CAJA_MENOR',
      entidadId: result.movimiento.id,
      descripcion: `${parsed.data.tipo}: $${result.montoEntero.toLocaleString('es-CO')} - ${parsed.data.concepto}`,
      detalles: {
        sesionId: result.sesionId,
        tipo: parsed.data.tipo,
        monto: result.montoEntero,
        concepto: parsed.data.concepto,
        beneficiario: parsed.data.beneficiario
      }
    });

    try {
      await invalidateTenantCache(empresaId, ['caja']);
    } catch {}

    safeRevalidatePath('/caja');
    return { success: true, movimiento: result.movimiento };
  } catch (err: any) {
    console.error('[registrarMovimientoCajaAction Error]:', err);
    return { success: false, error: err.message || 'Error inesperado al registrar el movimiento.' };
  }
}

/**
 * Server Action: Resumen Consolidado de Arqueo para Cierre
 */
export async function obtenerResumenArqueoCajaAction(sesionCajaId: string) {
  try {
    const admin = createAdminSupabaseClient();
    return await CajaTransaccionalService.obtenerResumenArqueo(admin, sesionCajaId);
  } catch (err: any) {
    console.error('[obtenerResumenArqueoCajaAction Error]:', err);
    return { success: false, error: err.message || 'Error al obtener resumen de arqueo.' };
  }
}

/**
 * Server Action: Cierre Formal e Inmutable de Sesión de Caja
 */
export async function cerrarSesionCajaAction(input: {
  sesionCajaId: string;
  montoCierreFisico: number;
  arqueoDetalle?: ConteoDenominaciones | any;
  motivoDescuadre?: string;
  observaciones?: string;
  idempotencyKey?: string;
}) {
  try {
    const parsed = CerrarCajaZodSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos de cierre inválidos' };
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Debes iniciar sesión para cerrar la caja.' };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    const result = await CajaTransaccionalService.cerrarSesion(admin, {
      userId: user.id,
      empresaId,
      sesionCajaId: parsed.data.sesionCajaId,
      montoCierreFisico: parsed.data.montoCierreFisico,
      arqueoDetalle: parsed.data.arqueoDetalle,
      motivoDescuadre: parsed.data.motivoDescuadre,
      observaciones: parsed.data.observaciones,
      userEmail: user.email,
    });

    if (!result.success || !result.sesion) {
      return result;
    }

    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: 'CIERRE_CAJA',
      entidadId: result.sesion.id,
      descripcion: `Cierre de sesión de caja: Físico $${result.montoFisico.toLocaleString('es-CO')} vs Sistema $${result.balance.saldoEsperado.toLocaleString('es-CO')} (${result.balance.clasificacionDescuadre})`,
      detalles: {
        sesionId: result.sesion.id,
        montoApertura: result.sesion.monto_apertura,
        saldoEsperado: result.balance.saldoEsperado,
        montoFisico: result.montoFisico,
        diferencia: result.balance.diferencia,
        clasificacion: result.balance.clasificacionDescuadre,
        motivoDescuadre: parsed.data.motivoDescuadre
      }
    });

    try {
      await invalidateTenantCache(empresaId, ['caja']);
    } catch {}

    safeRevalidatePath('/caja');
    return { success: true, sesion: result.sesion, balance: result.balance };
  } catch (err: any) {
    console.error('[cerrarSesionCajaAction Error]:', err);
    return { success: false, error: err.message || 'Error inesperado al cerrar la sesión de caja.' };
  }
}

/**
 * Server Action: Listar Historial de Sesiones de Caja
 */
export async function listarHistorialSesionesCajaAction(filtros?: {
  desde?: string;
  hasta?: string;
  cajeroId?: string;
  limite?: number;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Debes iniciar sesión para consultar el historial.', historial: [], sesiones: [] };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    return await CajaTransaccionalService.listarHistorial(admin, {
      empresaId,
      desde: filtros?.desde,
      hasta: filtros?.hasta,
      cajeroId: filtros?.cajeroId,
      limite: filtros?.limite,
    });
  } catch (err: any) {
    console.error('[listarHistorialSesionesCajaAction Error]:', err);
    return { success: false, error: err.message || 'Error inesperado al consultar historial.', historial: [], sesiones: [] };
  }
}
