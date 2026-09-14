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
import { 
  calcularTotalFisicoArqueo, 
  calcularBalanceSesionCaja, 
  validarDisponibilidadEgreso,
  ConteoDenominaciones
} from '@/core/services/calculoCajaArqueo';

/**
 * Server Action para validar la conectividad en vivo con Supabase,
 * garantizando que la base de datos esté lista para persistir registros.
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
// SERVER ACTIONS: GESTIÓN INTEGRAL DE CAJA Y PUNTO DE VENTA (POS)
// ============================================================================

/**
 * Consulta la sesión de caja actualmente ABIERTA para el usuario autenticado en su empresa activa,
 * junto con el consolidado en tiempo real de cobros en efectivo y movimientos menores.
 */
export async function obtenerSesionActivaAction() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No se detectó una sesión autenticada.', sesion: null };
    }

    const empresaId = await resolveEmpresaId(user.id);
    const admin = createAdminSupabaseClient();

    // 1. Buscar sesión abierta para este usuario y empresa
    const { data: sesion, error: sesionError } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (sesionError) {
      console.error('[Caja] Error al consultar sesión activa:', sesionError);
      return { success: false, error: 'Error al consultar la sesión de caja activa.', sesion: null };
    }

    if (!sesion) {
      return { 
        success: true, 
        sesion: null, 
        resumen: null, 
        movimientos: [], 
        pagosEfectivo: [] 
      };
    }

    // 2. Consultar pagos registrados en EFECTIVO vinculados a esta sesión
    const { data: pagos, error: pagosError } = await admin
      .from('pagos')
      .select('id, consecutivo, monto, efectivo_recibido, cambio_entregado, fecha_pago, alquiler_id, cliente_id, clientes (nombre)')
      .eq('sesion_caja_id', sesion.id);

    if (pagosError) {
      console.warn('[Caja] Error consultando pagos de la sesión:', pagosError);
    }

    // 3. Consultar movimientos de caja menor (ingresos y egresos)
    const { data: movimientos, error: movsError } = await admin
      .from('movimientos_caja')
      .select('*')
      .eq('sesion_caja_id', sesion.id)
      .order('created_at', { ascending: false });

    if (movsError) {
      console.warn('[Caja] Error consultando movimientos de caja:', movsError);
    }

    const listaPagos = pagos || [];
    const listaMovimientos = movimientos || [];

    const totalCobrosEfectivo = listaPagos.reduce((acc, p) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = listaMovimientos
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = listaMovimientos
      .filter(m => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);

    const montoApertura = Math.round(Number(sesion.monto_apertura) || 0);
    const saldoEsperado = montoApertura + totalCobrosEfectivo + totalIngresos - totalEgresos;

    return {
      success: true,
      sesion,
      resumen: {
        montoApertura,
        totalCobrosEfectivo,
        cantidadPagos: listaPagos.length,
        totalIngresos,
        totalEgresos,
        saldoEsperado
      },
      movimientos: listaMovimientos,
      pagosEfectivo: listaPagos
    };
  } catch (err: any) {
    console.error('[Caja] Error crítico en obtenerSesionActivaAction:', err);
    return { success: false, error: err.message || 'Error interno de servidor.', sesion: null };
  }
}

/**
 * Realiza la Apertura Formal de Sesión de Caja con Poka-Yoke anti-duplicidad.
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

    // POKA-YOKE: Verificar que el usuario NO tenga ya una caja abierta
    const { data: existente } = await admin
      .from('sesiones_caja')
      .select('id, fecha_apertura')
      .eq('usuario_id', user.id)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (existente) {
      return { 
        success: false, 
        error: 'Poka-Yoke: Ya tienes una sesión de caja ABIERTA actualmente. Debes realizar el cierre antes de iniciar una nueva.' 
      };
    }

    const montoAperturaEntero = Math.round(parsed.data.montoApertura);

    // Insertar nueva sesión
    const { data: nuevaSesion, error: insertError } = await admin
      .from('sesiones_caja')
      .insert([{
        tenant_id: user.id,
        empresa_id: empresaId,
        usuario_id: user.id,
        estado: 'ABIERTA',
        monto_apertura: montoAperturaEntero,
        observaciones: parsed.data.observaciones?.trim() || null,
        fecha_apertura: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertError || !nuevaSesion || !nuevaSesion.id) {
      console.error('[Caja] Error al insertar sesión de caja en Supabase:', insertError);
      return { 
        success: false, 
        error: `Fallo de persistencia en Supabase: ${insertError?.message || 'No se confirmó el ID de la sesión creada en la base de datos.'}` 
      };
    }

    // Doble verificación de campos críticos guardados
    if (Math.round(Number(nuevaSesion.monto_apertura)) !== montoAperturaEntero || nuevaSesion.estado !== 'ABIERTA') {
      console.error('[Caja] Discrepancia en datos persistidos de sesión:', nuevaSesion);
      return {
        success: false,
        error: 'Discrepancia de integridad: los datos confirmados por la base de datos no coinciden con la apertura solicitada.'
      };
    }

    // Registro forense en audit_logs
    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: 'APERTURA_CAJA',
      entidadId: nuevaSesion.id,
      descripcion: `Apertura de sesión de caja con base inicial de $${montoAperturaEntero.toLocaleString('es-CO')} COP`,
      detalles: {
        sesionId: nuevaSesion.id,
        montoApertura: montoAperturaEntero,
        observaciones: parsed.data.observaciones
      }
    });

    await invalidateTenantCache(empresaId, ['caja']);
    revalidatePath('/caja');

    return { success: true, sesion: nuevaSesion };
  } catch (err: any) {
    console.error('[Caja] Error crítico en abrirSesionCajaAction:', err);
    return { success: false, error: err.message || 'Error inesperado al abrir la caja.' };
  }
}

/**
 * Registra un movimiento menor en efectivo (Gasto Menor / Egreso o Inyección / Ingreso).
 * Ejecuta validación estricta de disponibilidad de saldo en caja para evitar saldos negativos.
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

    // 1. Validar que la sesión exista y esté ABIERTA
    const { data: sesion, error: sesionError } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('id', parsed.data.sesionCajaId)
      .single();

    if (sesionError || !sesion) {
      return { success: false, error: 'No se encontró la sesión de caja especificada.' };
    }

    if (sesion.estado !== 'ABIERTA') {
      return { success: false, error: 'Esta sesión de caja ya se encuentra CERRADA. No se permiten nuevos movimientos.' };
    }

    const montoEntero = Math.round(parsed.data.monto);

    // 2. Si es EGRESO, validar saldo disponible en tiempo real
    if (parsed.data.tipo === 'EGRESO') {
      const { data: pagos } = await admin
        .from('pagos')
        .select('monto')
        .eq('sesion_caja_id', sesion.id);

      const { data: movsPrevios } = await admin
        .from('movimientos_caja')
        .select('tipo, monto')
        .eq('sesion_caja_id', sesion.id);

      const totalCobros = (pagos || []).reduce((acc, p) => acc + Math.round(Number(p.monto) || 0), 0);
      const totalIngresos = (movsPrevios || [])
        .filter(m => m.tipo === 'INGRESO')
        .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);
      const totalEgresosPrevios = (movsPrevios || [])
        .filter(m => m.tipo === 'EGRESO')
        .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);

      const validacion = validarDisponibilidadEgreso({
        montoApertura: Number(sesion.monto_apertura) || 0,
        totalCobrosEfectivo: totalCobros,
        totalIngresosCaja: totalIngresos,
        totalEgresosPrevios: totalEgresosPrevios,
        montoEgresoSolicitado: montoEntero
      });

      if (!validacion.esValido) {
        return { success: false, error: validacion.error || 'Saldo insuficiente en caja para autorizar el egreso.' };
      }
    }

    // 3. Insertar el movimiento en movimientos_caja
    const { data: nuevoMovimiento, error: insertError } = await admin
      .from('movimientos_caja')
      .insert([{
        tenant_id: user.id,
        empresa_id: empresaId,
        sesion_caja_id: sesion.id,
        usuario_id: user.id,
        tipo: parsed.data.tipo,
        monto: montoEntero,
        concepto: parsed.data.concepto.trim(),
        beneficiario: parsed.data.beneficiario?.trim() || null,
        comprobante: parsed.data.comprobante?.trim() || null
      }])
      .select()
      .single();

    if (insertError || !nuevoMovimiento || !nuevoMovimiento.id) {
      console.error('[Caja] Error al registrar movimiento de caja en Supabase:', insertError);
      return { 
        success: false, 
        error: `Fallo de persistencia en Supabase: ${insertError?.message || 'No se confirmó el ID del movimiento registrado en la base de datos.'}` 
      };
    }

    // Doble verificación de monto y tipo en la persistencia
    if (Math.round(Number(nuevoMovimiento.monto)) !== montoEntero || nuevoMovimiento.tipo !== parsed.data.tipo) {
      console.error('[Caja] Discrepancia en datos persistidos del movimiento:', nuevoMovimiento);
      return {
        success: false,
        error: 'Discrepancia de integridad: el monto o tipo registrado en la base de datos difiere de la solicitud.'
      };
    }

    // Registro forense
    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: parsed.data.tipo === 'EGRESO' ? 'EGRESO_CAJA_MENOR' : 'INGRESO_CAJA_MENOR',
      entidadId: nuevoMovimiento.id,
      descripcion: `${parsed.data.tipo}: $${montoEntero.toLocaleString('es-CO')} - ${parsed.data.concepto}`,
      detalles: {
        sesionId: sesion.id,
        tipo: parsed.data.tipo,
        monto: montoEntero,
        concepto: parsed.data.concepto,
        beneficiario: parsed.data.beneficiario
      }
    });

    await invalidateTenantCache(empresaId, ['caja']);
    revalidatePath('/caja');

    return { success: true, movimiento: nuevoMovimiento };
  } catch (err: any) {
    console.error('[Caja] Error crítico en registrarMovimientoCajaAction:', err);
    return { success: false, error: err.message || 'Error inesperado al registrar el movimiento.' };
  }
}

/**
 * Consulta el resumen consolidado de arqueo para la pantalla de cierre.
 */
export async function obtenerResumenArqueoCajaAction(sesionCajaId: string) {
  try {
    const admin = createAdminSupabaseClient();

    const { data: sesion, error: sErr } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('id', sesionCajaId)
      .single();

    if (sErr || !sesion) {
      return { success: false, error: 'Sesión no encontrada.' };
    }

    const { data: pagos } = await admin
      .from('pagos')
      .select('id, consecutivo, monto, fecha_pago, clientes (nombre)')
      .eq('sesion_caja_id', sesion.id);

    const { data: movs } = await admin
      .from('movimientos_caja')
      .select('*')
      .eq('sesion_caja_id', sesion.id);

    const listaPagos = pagos || [];
    const listaMovs = movs || [];

    const totalCobrosEfectivo = listaPagos.reduce((acc, p) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = listaMovs
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = listaMovs
      .filter(m => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);

    const montoApertura = Math.round(Number(sesion.monto_apertura) || 0);
    const saldoEsperado = montoApertura + totalCobrosEfectivo + totalIngresos - totalEgresos;

    return {
      success: true,
      sesion,
      montoApertura,
      totalCobrosEfectivo,
      totalIngresos,
      totalEgresos,
      saldoEsperado,
      pagos: listaPagos,
      movimientos: listaMovs
    };
  } catch (err: any) {
    console.error('[Caja] Error en obtenerResumenArqueoCajaAction:', err);
    return { success: false, error: err.message || 'Error al obtener resumen de arqueo.' };
  }
}

/**
 * Cierre Formal de Sesión de Caja (Inmutable).
 * Ejecuta el cálculo exacto de descuadre y guarda el acta de arqueo.
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

    // 1. Verificar estado actual de la sesión
    const { data: sesion, error: sErr } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('id', parsed.data.sesionCajaId)
      .single();

    if (sErr || !sesion) {
      return { success: false, error: 'No se encontró la sesión de caja para cerrar.' };
    }

    if (sesion.estado === 'CERRADA') {
      return { success: false, error: 'Esta sesión de caja ya fue CERRADA anteriormente.' };
    }

    // 2. Consolidar cobros y movimientos para cálculo de balance
    const { data: pagos } = await admin
      .from('pagos')
      .select('monto')
      .eq('sesion_caja_id', sesion.id);

    const { data: movs } = await admin
      .from('movimientos_caja')
      .select('tipo, monto')
      .eq('sesion_caja_id', sesion.id);

    const totalCobros = (pagos || []).reduce((acc, p) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = (movs || [])
      .filter(m => m.tipo === 'INGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = (movs || [])
      .filter(m => m.tipo === 'EGRESO')
      .reduce((acc, m) => acc + Math.round(Number(m.monto) || 0), 0);

    const montoFisico = Math.round(parsed.data.montoCierreFisico);

    const balance = calcularBalanceSesionCaja({
      montoApertura: Number(sesion.monto_apertura) || 0,
      totalCobrosEfectivo: totalCobros,
      totalIngresosCaja: totalIngresos,
      totalEgresosCaja: totalEgresos,
      montoFisicoContado: montoFisico
    });

    if (balance.requiereJustificacion && (!parsed.data.motivoDescuadre || parsed.data.motivoDescuadre.trim().length < 3)) {
      return {
        success: false,
        error: `Se detectó un descuadre (${balance.clasificacionDescuadre}) de $${Math.abs(balance.diferencia).toLocaleString('es-CO')} COP. Se requiere justificar el motivo del descuadre obligatoriamente.`
      };
    }

    // 3. Ejecutar actualización atómica a estado CERRADA
    const fechaCierre = new Date().toISOString();
    const { data: sesionCerrada, error: updateErr } = await admin
      .from('sesiones_caja')
      .update({
        estado: 'CERRADA',
        monto_cierre: montoFisico,
        monto_esperado: balance.saldoEsperado,
        diferencia: balance.diferencia,
        motivo_descuadre: parsed.data.motivoDescuadre?.trim() || null,
        arqueo_detalle: parsed.data.arqueoDetalle || null,
        observaciones: parsed.data.observaciones?.trim() || sesion.observaciones,
        fecha_cierre: fechaCierre
      })
      .eq('id', sesion.id)
      .select()
      .single();

    if (updateErr || !sesionCerrada || !sesionCerrada.id || sesionCerrada.estado !== 'CERRADA') {
      console.error('[Caja] Error al cerrar sesión de caja en Supabase:', updateErr);
      return { 
        success: false, 
        error: `Fallo de persistencia en Supabase: ${updateErr?.message || 'La sesión no confirmó su estado CERRADA en la base de datos.'}` 
      };
    }

    // Doble verificación de balance persistido
    if (Math.round(Number(sesionCerrada.monto_cierre)) !== montoFisico) {
      console.error('[Caja] Discrepancia en monto de cierre persistido:', sesionCerrada);
      return {
        success: false,
        error: 'Discrepancia de integridad: el monto de cierre persistido no coincide con el conteo reportado.'
      };
    }

    // 4. Registro forense en audit_logs
    AuditLogger.logAsync({
      empresaId,
      userId: user.id,
      userNombre: user.email || 'Cajero',
      userEmail: user.email || 'cajero@ferreon.com',
      userRol: 'CAJERO',
      modulo: 'CAJA_POS',
      accion: 'CIERRE_CAJA',
      entidadId: sesion.id,
      descripcion: `Cierre de caja: Esperado $${balance.saldoEsperado.toLocaleString('es-CO')}, Físico $${montoFisico.toLocaleString('es-CO')} (${balance.clasificacionDescuadre})`,
      detalles: {
        sesionId: sesion.id,
        montoApertura: sesion.monto_apertura,
        totalCobros,
        totalIngresos,
        totalEgresos,
        saldoEsperado: balance.saldoEsperado,
        montoCierreFisico: montoFisico,
        diferencia: balance.diferencia,
        clasificacionDescuadre: balance.clasificacionDescuadre,
        motivoDescuadre: parsed.data.motivoDescuadre
      }
    });

    await invalidateTenantCache(empresaId, ['caja']);
    revalidatePath('/caja');

    return { 
      success: true, 
      sesion: sesionCerrada,
      balance
    };
  } catch (err: any) {
    console.error('[Caja] Error crítico en cerrarSesionCajaAction:', err);
    return { success: false, error: err.message || 'Error inesperado al cerrar la caja.' };
  }
}

/**
 * Consulta el historial de sesiones de caja de la empresa con filtros por fecha y paginación.
 */
export async function listarHistorialSesionesCajaAction(filtros?: {
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
}) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const empresaId = await resolveEmpresaId(user?.id);
    const admin = createAdminSupabaseClient();

    let query = admin
      .from('sesiones_caja')
      .select('*')
      .order('fecha_apertura', { ascending: false });

    if (filtros?.fechaDesde) {
      query = query.gte('fecha_apertura', filtros.fechaDesde);
    }
    if (filtros?.fechaHasta) {
      query = query.lte('fecha_apertura', filtros.fechaHasta);
    }

    const limite = filtros?.limite || 30;
    query = query.limit(limite);

    const { data: sesiones, error } = await query;

    if (error) {
      console.error('[Caja] Error listando historial de sesiones:', error);
      return { success: false, error: 'Error al consultar historial de cajas.', sesiones: [] };
    }

    return { success: true, sesiones: sesiones || [] };
  } catch (err: any) {
    console.error('[Caja] Error en listarHistorialSesionesCajaAction:', err);
    return { success: false, error: err.message || 'Error inesperado.', sesiones: [] };
  }
}
