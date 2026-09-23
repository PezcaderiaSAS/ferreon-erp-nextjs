/**
 * Servicio de Dominio: Gestión Transaccional de Caja, Arqueos y Movimientos
 * 
 * Centraliza la lógica de negocio para:
 * - Poka-Yoke de sesión activa única por cajero.
 * - Validación matemática en tiempo real para egresos de caja menor.
 * - Consolidación de cobros en efectivo y cálculo de saldo esperado.
 * - Cierre de caja, clasificación de descuadre y generación de asientos contables de ajuste.
 */

import {
  calcularBalanceSesionCaja,
  validarDisponibilidadEgreso,
  ConteoDenominaciones,
} from './calculoCajaArqueo';
import { generarAsientoAjusteDescuadre } from './arqueo-caja.service';

export interface AbrirSesionCajaParams {
  userId: string;
  empresaId: string;
  montoApertura: number;
  observaciones?: string | null;
  userEmail?: string | null;
}

export interface RegistrarMovimientoParams {
  userId: string;
  empresaId: string;
  sesionCajaId: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto: string;
  beneficiario?: string | null;
  comprobante?: string | null;
  userEmail?: string | null;
}

export interface CerrarSesionCajaParams {
  userId: string;
  empresaId: string;
  sesionCajaId: string;
  montoCierreFisico: number;
  arqueoDetalle?: ConteoDenominaciones | any;
  motivoDescuadre?: string | null;
  observaciones?: string | null;
  userEmail?: string | null;
}

export interface ListarHistorialFiltros {
  empresaId: string;
  desde?: string;
  hasta?: string;
  cajeroId?: string;
  limite?: number;
}

export class CajaTransaccionalService {
  /**
   * Obtiene la sesión de caja actualmente ABIERTA para un usuario y su consolidado en tiempo real.
   */
  public static async obtenerSesionActiva(admin: any, userId: string, empresaId: string) {
    const { data: sesion, error: sesionError } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('usuario_id', userId)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (sesionError) {
      console.error('[CajaTransaccionalService] Error consultando sesión activa:', sesionError);
      return {
        success: false,
        error: 'Error al consultar la sesión de caja activa.',
        sesion: null,
        resumen: null,
        movimientos: [],
        pagosEfectivo: [],
      };
    }

    if (!sesion) {
      return {
        success: true,
        sesion: null,
        resumen: null,
        movimientos: [],
        pagosEfectivo: [],
      };
    }

    // Pagos en efectivo
    const { data: pagos } = await admin
      .from('pagos')
      .select('id, consecutivo, monto, efectivo_recibido, cambio_entregado, fecha_pago, alquiler_id, cliente_id, clientes (nombre)')
      .eq('sesion_caja_id', sesion.id);

    // Movimientos de caja menor
    const { data: movimientos } = await admin
      .from('movimientos_caja')
      .select('*')
      .eq('sesion_caja_id', sesion.id)
      .order('created_at', { ascending: false });

    const listaPagos = pagos || [];
    const listaMovimientos = movimientos || [];

    const totalCobrosEfectivo = listaPagos.reduce((acc: number, p: any) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = listaMovimientos
      .filter((m: any) => m.tipo === 'INGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = listaMovimientos
      .filter((m: any) => m.tipo === 'EGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);

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
        saldoEsperado,
      },
      movimientos: listaMovimientos,
      pagosEfectivo: listaPagos,
    };
  }

  /**
   * Abre una nueva sesión de caja previa validación Poka-Yoke (solo una sesión abierta por cajero).
   */
  public static async abrirSesion(admin: any, params: AbrirSesionCajaParams) {
    // POKA-YOKE: Verificar que el usuario no tenga ya una caja abierta
    const { data: existente } = await admin
      .from('sesiones_caja')
      .select('id, fecha_apertura')
      .eq('usuario_id', params.userId)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (existente) {
      return {
        success: false,
        error: 'Poka-Yoke: Ya tienes una sesión de caja ABIERTA actualmente. Debes realizar el cierre antes de iniciar una nueva.',
      };
    }

    const montoAperturaEntero = Math.round(params.montoApertura);

    const { data: nuevaSesion, error: insertError } = await admin
      .from('sesiones_caja')
      .insert([{
        tenant_id: params.userId,
        empresa_id: params.empresaId,
        usuario_id: params.userId,
        estado: 'ABIERTA',
        monto_apertura: montoAperturaEntero,
        observaciones: params.observaciones?.trim() || null,
        fecha_apertura: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError || !nuevaSesion?.id) {
      console.error('[CajaTransaccionalService] Error al insertar sesión:', insertError);
      return {
        success: false,
        error: `Fallo de persistencia en Supabase: ${insertError?.message || 'No se confirmó el ID de la sesión creada.'}`,
      };
    }

    return { success: true, sesion: nuevaSesion, montoAperturaEntero };
  }

  /**
   * Registra un movimiento menor en efectivo validando disponibilidad previa para egresos.
   */
  public static async registrarMovimiento(admin: any, params: RegistrarMovimientoParams) {
    const { data: sesion, error: sesionError } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('id', params.sesionCajaId)
      .single();

    if (sesionError || !sesion) {
      return { success: false, error: 'No se encontró la sesión de caja especificada.' };
    }

    if (sesion.estado !== 'ABIERTA') {
      return { success: false, error: 'Esta sesión de caja ya se encuentra CERRADA. No se permiten nuevos movimientos.' };
    }

    const montoEntero = Math.round(params.monto);

    if (params.tipo === 'EGRESO') {
      const { data: pagos } = await admin
        .from('pagos')
        .select('monto')
        .eq('sesion_caja_id', sesion.id);

      const { data: movsPrevios } = await admin
        .from('movimientos_caja')
        .select('tipo, monto')
        .eq('sesion_caja_id', sesion.id);

      const totalCobros = (pagos || []).reduce((acc: number, p: any) => acc + Math.round(Number(p.monto) || 0), 0);
      const totalIngresos = (movsPrevios || [])
        .filter((m: any) => m.tipo === 'INGRESO')
        .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);
      const totalEgresosPrevios = (movsPrevios || [])
        .filter((m: any) => m.tipo === 'EGRESO')
        .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);

      const validacion = validarDisponibilidadEgreso({
        montoApertura: Number(sesion.monto_apertura) || 0,
        totalCobrosEfectivo: totalCobros,
        totalIngresosCaja: totalIngresos,
        totalEgresosPrevios: totalEgresosPrevios,
        montoEgresoSolicitado: montoEntero,
      });

      if (!validacion.esValido) {
        return { success: false, error: validacion.error || 'Saldo insuficiente en caja para autorizar el egreso.' };
      }
    }

    const { data: nuevoMovimiento, error: insertError } = await admin
      .from('movimientos_caja')
      .insert([{
        tenant_id: params.userId,
        empresa_id: params.empresaId,
        sesion_caja_id: sesion.id,
        usuario_id: params.userId,
        tipo: params.tipo,
        monto: montoEntero,
        concepto: params.concepto.trim(),
        beneficiario: params.beneficiario?.trim() || null,
        comprobante: params.comprobante?.trim() || null,
      }])
      .select()
      .single();

    if (insertError || !nuevoMovimiento?.id) {
      console.error('[CajaTransaccionalService] Error al registrar movimiento:', insertError);
      return {
        success: false,
        error: `Fallo de persistencia en Supabase: ${insertError?.message || 'No se confirmó el ID del movimiento.'}`,
      };
    }

    return { success: true, movimiento: nuevoMovimiento, montoEntero, sesionId: sesion.id };
  }

  /**
   * Obtiene el consolidado de arqueo para la pantalla de cierre.
   */
  public static async obtenerResumenArqueo(admin: any, sesionCajaId: string) {
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

    const totalCobrosEfectivo = listaPagos.reduce((acc: number, p: any) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = listaMovs
      .filter((m: any) => m.tipo === 'INGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = listaMovs
      .filter((m: any) => m.tipo === 'EGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);

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
      movimientos: listaMovs,
    };
  }

  /**
   * Cierra formalmente la sesión de caja calculando descuadres y asientos de ajuste.
   */
  public static async cerrarSesion(admin: any, params: CerrarSesionCajaParams) {
    const { data: sesion, error: sErr } = await admin
      .from('sesiones_caja')
      .select('*')
      .eq('id', params.sesionCajaId)
      .single();

    if (sErr || !sesion) {
      return { success: false, error: 'No se encontró la sesión de caja para cerrar.' };
    }

    if (sesion.estado === 'CERRADA') {
      return { success: false, error: 'Esta sesión de caja ya fue CERRADA anteriormente.' };
    }

    const { data: pagos } = await admin
      .from('pagos')
      .select('monto')
      .eq('sesion_caja_id', sesion.id);

    const { data: movs } = await admin
      .from('movimientos_caja')
      .select('tipo, monto')
      .eq('sesion_caja_id', sesion.id);

    const totalCobros = (pagos || []).reduce((acc: number, p: any) => acc + Math.round(Number(p.monto) || 0), 0);
    const totalIngresos = (movs || [])
      .filter((m: any) => m.tipo === 'INGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);
    const totalEgresos = (movs || [])
      .filter((m: any) => m.tipo === 'EGRESO')
      .reduce((acc: number, m: any) => acc + Math.round(Number(m.monto) || 0), 0);

    const montoFisico = Math.round(params.montoCierreFisico);

    const balance = calcularBalanceSesionCaja({
      montoApertura: Number(sesion.monto_apertura) || 0,
      totalCobrosEfectivo: totalCobros,
      totalIngresosCaja: totalIngresos,
      totalEgresosCaja: totalEgresos,
      montoFisicoContado: montoFisico,
    });

    if (balance.requiereJustificacion && (!params.motivoDescuadre || params.motivoDescuadre.trim().length < 3)) {
      return {
        success: false,
        error: `Se detectó un descuadre (${balance.clasificacionDescuadre}) de $${Math.abs(balance.diferencia).toLocaleString('es-CO')} COP. Se requiere justificar el motivo del descuadre obligatoriamente.`,
      };
    }

    const fechaCierre = new Date().toISOString();
    const { data: sesionCerrada, error: updateErr } = await admin
      .from('sesiones_caja')
      .update({
        estado: 'CERRADA',
        fecha_cierre: fechaCierre,
        monto_cierre_sistema: balance.saldoEsperado,
        monto_cierre_real: montoFisico,
        diferencia: balance.diferencia,
        desglose_efectivo: params.arqueoDetalle || null,
        motivo_descuadre: params.motivoDescuadre?.trim() || null,
        observaciones: params.observaciones?.trim() || sesion.observaciones,
      })
      .eq('id', sesion.id)
      .select()
      .single();

    if (updateErr || !sesionCerrada) {
      console.error('[CajaTransaccionalService] Error actualizando sesión a CERRADA:', updateErr);
      return {
        success: false,
        error: `Error al persistir el cierre en la base de datos: ${updateErr?.message || 'No se confirmó el cierre.'}`,
      };
    }

    // Registro contable de ajuste si hay descuadre
    if (balance.diferencia !== 0) {
      try {
        const { data: accounts } = await admin.from('financial_accounts').select('id, name');
        if (accounts && accounts.length > 0) {
          const asientoAjuste = generarAsientoAjusteDescuadre({
            sesionCajaId: sesion.id,
            diferencia: balance.diferencia,
            cuentas: accounts,
          });

          if (asientoAjuste.entries.length > 0) {
            const { data: txn } = await admin
              .from('transactions')
              .insert([{
                description: asientoAjuste.description,
                reference_id: asientoAjuste.referenceId,
                created_by: params.userId,
                idempotency_key: `ajuste_caja_${sesion.id}_${Date.now()}`,
                timestamp: fechaCierre,
              }])
              .select('id')
              .single();

            if (txn) {
              const entriesPayload = asientoAjuste.entries.map((e) => ({
                transaction_id: txn.id,
                account_id: e.accountId,
                amount: e.amount,
              }));
              await admin.from('journal_entries').insert(entriesPayload);
            }
          }
        }
      } catch (contableErr) {
        console.warn('[CajaTransaccionalService] Aviso al asentar ajuste contable:', contableErr);
      }
    }

    return {
      success: true,
      sesion: sesionCerrada,
      balance,
      montoFisico,
    };
  }

  /**
   * Consulta el historial paginado de sesiones de caja de la empresa.
   */
  public static async listarHistorial(admin: any, filtros: ListarHistorialFiltros) {
    let query = admin
      .from('sesiones_caja')
      .select('*')
      .eq('empresa_id', filtros.empresaId)
      .order('fecha_apertura', { ascending: false });

    if (filtros.cajeroId) {
      query = query.eq('usuario_id', filtros.cajeroId);
    }

    if (filtros.desde) {
      query = query.gte('fecha_apertura', `${filtros.desde}T00:00:00Z`);
    }

    if (filtros.hasta) {
      query = query.lte('fecha_apertura', `${filtros.hasta}T23:59:59Z`);
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite);
    } else {
      query = query.limit(30);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[CajaTransaccionalService] Error listando historial de cajas:', error);
      return { success: false, error: 'Error al consultar el historial de cajas.', historial: [], sesiones: [] };
    }

    return { success: true, historial: data || [], sesiones: data || [] };
  }
}
