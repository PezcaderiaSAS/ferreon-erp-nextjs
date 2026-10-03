/**
 * DashboardTransaccionalService - Dominio Puro y Centro de Control Operativo
 * Alquileres System (FerreOn ERP & WMS)
 * 
 * Reglas de Dominio:
 * 1. Cálculos matemáticos inmutables en una sola pasada O(N).
 * 2. Cero operaciones de coma flotante engañosas en moneda (enteros en COP).
 * 3. Clasificación estricta de eventos de calendario (Despachos, Devoluciones, Cobranzas, Mantenimientos).
 */

import {
  type DashboardKPIs,
  type EventoCalendario,
  type TareaOperativa,
  type AlertaSistema,
  type DashboardPayload
} from '@/core/types/dashboard';

export interface RawAlquilerDashboard {
  id: string;
  numero_contrato?: string;
  consecutivo?: number;
  estado: string; // ACTIVO, ACTIVO_EN_OBRA, COTIZACION, FINALIZADO, CANCELADO
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  cliente_nombre?: string;
  total: number;
  saldo_pendiente?: number;
  total_pagado?: number;
  detalles?: Array<{ equipo_nombre: string; cantidad: number }>;
}

export interface RawEquipoDashboard {
  id: string;
  nombre: string;
  codigo?: string;
  estado: string; // DISPONIBLE, ALQUILADO, MANTENIMIENTO, BAJA
  stock_total: number;
  stock_disponible: number;
}

export interface RawDevolucionDashboard {
  id: string;
  alquiler_id: string;
  fecha_devolucion: string;
  estado: string;
}

export interface ProcesarDashboardParams {
  alquileres: RawAlquilerDashboard[];
  equipos: RawEquipoDashboard[];
  devoluciones?: RawDevolucionDashboard[];
  tareasManuales?: TareaOperativa[];
  fechaHoy?: string; // Formato YYYY-MM-DD (por defecto hoy)
}

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD
 */
export function obtenerFechaHoyLocal(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea un número como moneda colombiana (COP)
 */
export function formatearMonedaCOP(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * 1. Calcula los 4 KPIs principales en vivo
 */
export function calcularKPIsDashboard(
  alquileres: RawAlquilerDashboard[],
  equipos: RawEquipoDashboard[],
  fechaHoy: string = obtenerFechaHoyLocal()
): DashboardKPIs {
  // 1. Equipos y Utilización de Flota
  const equiposTotal = equipos.reduce((acc, eq) => acc + (eq.stock_total || 0), 0);
  
  // Equipos en obra: calcular stock alquilado según equipos marcados como ALQUILADO
  const equiposEnObra = equipos.reduce((acc, eq) => {
    if (eq.estado === 'ALQUILADO') {
      const enUso = Math.max(0, (eq.stock_total || 0) - (eq.stock_disponible || 0));
      return acc + enUso;
    }
    return acc;
  }, 0);

  const utilizacionFlotaPct = equiposTotal > 0 ? Math.round((equiposEnObra / equiposTotal) * 100) : 0;

  // 2. Contratos Activos y Cotizaciones
  let contratosActivos = 0;
  let cotizacionesPendientes = 0;
  let devolucionesPendientesHoy = 0;
  let devolucionesVencidas = 0;
  let carteraPendienteTotalCOP = 0;
  let carteraMoraCOP = 0;

  for (const a of alquileres) {
    const esActivo = a.estado === 'ACTIVO' || a.estado === 'ACTIVO_EN_OBRA';
    const esCotizacion = a.estado === 'COTIZACION';

    if (esActivo) {
      contratosActivos++;

      const saldo = Math.max(0, a.saldo_pendiente || 0);
      carteraPendienteTotalCOP += saldo;

      if (a.fecha_fin === fechaHoy) {
        devolucionesPendientesHoy++;
      } else if (a.fecha_fin < fechaHoy) {
        devolucionesVencidas++;
        carteraMoraCOP += saldo;
      }
    } else if (esCotizacion) {
      cotizacionesPendientes++;
    }
  }

  return {
    equiposEnObra,
    equiposTotal,
    utilizacionFlotaPct,
    contratosActivos,
    cotizacionesPendientes,
    devolucionesPendientesHoy,
    devolucionesVencidas,
    carteraPendienteTotalCOP,
    carteraMoraCOP
  };
}

/**
 * 2. Genera los eventos para el Calendario Operativo Multi-Flujo
 */
export function generarEventosCalendario(
  alquileres: RawAlquilerDashboard[],
  equipos: RawEquipoDashboard[],
  fechaHoy: string = obtenerFechaHoyLocal()
): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];

  // Recorrer alquileres para eventos de Despacho, Devolución y Cobranza
  for (const a of alquileres) {
    const contratoCodigo = a.numero_contrato || `#ALQ-${a.id.slice(0, 5)}`;
    const cliente = a.cliente_nombre || 'Cliente Particular';
    const primerEquipo = a.detalles?.[0]?.equipo_nombre || 'Maquinaria';

    // Despachos de alquiler (en fecha_inicio)
    if (a.fecha_inicio && a.estado !== 'CANCELADO') {
      const esHoy = a.fecha_inicio === fechaHoy;
      eventos.push({
        id: `evt-despacho-${a.id}`,
        tipo: 'ALQUILER_DESPACHO',
        titulo: `Despacho ${contratoCodigo} — ${primerEquipo}`,
        descripcion: `Entrega programada para ${cliente}. Total: ${formatearMonedaCOP(a.total)}`,
        fecha: a.fecha_inicio,
        fechaFin: a.fecha_fin,
        monto: a.total,
        estado: a.estado,
        referenciaId: a.id,
        clienteNombre: cliente,
        equipoNombre: primerEquipo,
        urgencia: esHoy ? 'ALTA' : 'MEDIA',
        enlaceModulo: `/alquileres?id=${a.id}`
      });
    }

    // Devoluciones y Retornos (en fecha_fin) para contratos activos
    const esActivo = a.estado === 'ACTIVO' || a.estado === 'ACTIVO_EN_OBRA';
    if (esActivo && a.fecha_fin) {
      const vencida = a.fecha_fin < fechaHoy;
      const esHoy = a.fecha_fin === fechaHoy;

      eventos.push({
        id: `evt-devolucion-${a.id}`,
        tipo: 'DEVOLUCION',
        titulo: `Retorno ${contratoCodigo} — ${primerEquipo}`,
        descripcion: vencida
          ? `Devolución VENCIDA desde ${a.fecha_fin}. Cliente: ${cliente}`
          : `Retorno de maquinaria previsto para hoy. Cliente: ${cliente}`,
        fecha: a.fecha_fin,
        monto: a.saldo_pendiente,
        estado: a.estado,
        referenciaId: a.id,
        clienteNombre: cliente,
        equipoNombre: primerEquipo,
        urgencia: vencida ? 'CRITICA' : esHoy ? 'ALTA' : 'MEDIA',
        enlaceModulo: `/devoluciones?alquilerId=${a.id}`
      });

      // Si tiene saldo pendiente, marcar también vencimiento de cobranza
      if ((a.saldo_pendiente || 0) > 0) {
        eventos.push({
          id: `evt-cobranza-${a.id}`,
          tipo: 'COBRANZA_VENCIMIENTO',
          titulo: `Vencimiento Cobro ${contratoCodigo} — ${formatearMonedaCOP(a.saldo_pendiente || 0)}`,
          descripcion: `Saldo por recaudar de ${cliente}`,
          fecha: a.fecha_fin,
          monto: a.saldo_pendiente,
          estado: 'PENDIENTE_PAGO',
          referenciaId: a.id,
          clienteNombre: cliente,
          urgencia: vencida ? 'CRITICA' : 'MEDIA',
          enlaceModulo: `/facturacion?alquilerId=${a.id}`
        });
      }
    }
  }

  // Mantenimientos preventivos o correctivos de equipos
  for (const eq of equipos) {
    if (eq.estado === 'MANTENIMIENTO') {
      eventos.push({
        id: `evt-mant-${eq.id}`,
        tipo: 'MANTENIMIENTO',
        titulo: `Mantenimiento en Taller: ${eq.nombre}`,
        descripcion: `Equipo en revisión técnica. Código: ${eq.codigo || 'S/C'}`,
        fecha: fechaHoy,
        estado: 'EN_TALLER',
        referenciaId: eq.id,
        equipoNombre: eq.nombre,
        urgencia: 'MEDIA',
        enlaceModulo: `/bodega?id=${eq.id}`
      });
    }
  }

  return eventos;
}

/**
 * 3. Genera el resumen inteligente de Tareas del Sistema
 */
export function generarTareasSistema(
  alquileres: RawAlquilerDashboard[],
  fechaHoy: string = obtenerFechaHoyLocal()
): TareaOperativa[] {
  const tareas: TareaOperativa[] = [];

  for (const a of alquileres) {
    const contrato = a.numero_contrato || `#ALQ-${a.id.slice(0, 5)}`;
    const cliente = a.cliente_nombre || 'Cliente';
    const primerEquipo = a.detalles?.[0]?.equipo_nombre || 'Maquinaria';
    const esActivo = a.estado === 'ACTIVO' || a.estado === 'ACTIVO_EN_OBRA';

    // 1. Devoluciones vencidas (urgencia máxima)
    if (esActivo && a.fecha_fin < fechaHoy) {
      tareas.push({
        id: `task-sys-ret-venc-${a.id}`,
        titulo: `Procesar devolución vencida de ${primerEquipo} (${cliente})`,
        tipo: 'SISTEMA',
        completada: false,
        fechaLimite: a.fecha_fin,
        urgencia: 'URGENTE',
        enlaceModulo: `/devoluciones?alquilerId=${a.id}`,
        subtexto: `Vencida desde ${a.fecha_fin} • Contrato ${contrato}`
      });
    }

    // 2. Devoluciones programadas para hoy
    if (esActivo && a.fecha_fin === fechaHoy) {
      tareas.push({
        id: `task-sys-ret-hoy-${a.id}`,
        titulo: `Recepción y chequeo de retorno hoy: ${primerEquipo}`,
        tipo: 'SISTEMA',
        completada: false,
        fechaLimite: fechaHoy,
        urgencia: 'URGENTE',
        enlaceModulo: `/devoluciones?alquilerId=${a.id}`,
        subtexto: `Retorno pactado para hoy • ${cliente}`
      });
    }

    // 3. Despachos programados para hoy
    if (a.fecha_inicio === fechaHoy && a.estado !== 'CANCELADO' && a.estado !== 'FINALIZADO') {
      tareas.push({
        id: `task-sys-desp-${a.id}`,
        titulo: `Confirmar despacho y acta de salida: ${primerEquipo}`,
        tipo: 'SISTEMA',
        completada: false,
        fechaLimite: fechaHoy,
        urgencia: 'URGENTE',
        enlaceModulo: `/alquileres?id=${a.id}`,
        subtexto: `Despacho de hoy • Cliente: ${cliente}`
      });
    }

    // 4. Cobranza en mora alta
    if (esActivo && a.fecha_fin < fechaHoy && (a.saldo_pendiente || 0) > 0) {
      tareas.push({
        id: `task-sys-cobr-${a.id}`,
        titulo: `Gestión de cobro cartera vencida (${formatearMonedaCOP(a.saldo_pendiente || 0)}): ${cliente}`,
        tipo: 'SISTEMA',
        completada: false,
        fechaLimite: a.fecha_fin,
        urgencia: 'URGENTE',
        enlaceModulo: `/facturacion?alquilerId=${a.id}`,
        subtexto: `Saldo pendiente ${contrato}`
      });
    }

    // 5. Cotizaciones por formalizar
    if (a.estado === 'COTIZACION') {
      tareas.push({
        id: `task-sys-cot-${a.id}`,
        titulo: `Seguimiento a cotización ${contrato} (${cliente})`,
        tipo: 'SISTEMA',
        completada: false,
        fechaLimite: a.fecha_inicio,
        urgencia: 'NORMAL',
        enlaceModulo: `/alquileres?id=${a.id}`,
        subtexto: `Monto cotizado: ${formatearMonedaCOP(a.total)}`
      });
    }
  }

  // Limitar tareas de sistema a las 8 más críticas para mantener la interfaz ágil
  return tareas.slice(0, 8);
}

/**
 * 4. Genera el feed de Alertas del Sistema clasificadas por severidad
 */
export function generarAlertasFeed(
  alquileres: RawAlquilerDashboard[],
  equipos: RawEquipoDashboard[],
  fechaHoy: string = obtenerFechaHoyLocal()
): AlertaSistema[] {
  const alertas: AlertaSistema[] = [];

  // Alertas críticas de mora o vencimiento
  for (const a of alquileres) {
    const esActivo = a.estado === 'ACTIVO' || a.estado === 'ACTIVO_EN_OBRA';
    const contrato = a.numero_contrato || `#ALQ-${a.id.slice(0, 5)}`;
    const cliente = a.cliente_nombre || 'Cliente';

    if (esActivo && a.fecha_fin < fechaHoy) {
      alertas.push({
        id: `alert-mora-${a.id}`,
        tipo: 'CRITICA',
        titulo: `Contrato Vencido sin Retorno: ${contrato}`,
        mensaje: `${cliente} tiene equipo en obra con fecha límite vencida (${a.fecha_fin}). Saldo: ${formatearMonedaCOP(a.saldo_pendiente || 0)}.`,
        fecha: a.fecha_fin,
        enlace: `/devoluciones?alquilerId=${a.id}`
      });
    } else if (esActivo && a.fecha_fin === fechaHoy) {
      alertas.push({
        id: `alert-fin-hoy-${a.id}`,
        tipo: 'ADVERTENCIA',
        titulo: `Retorno Programado para Hoy: ${contrato}`,
        mensaje: `${cliente} debe retornar equipo hoy según contrato pactado.`,
        fecha: fechaHoy,
        enlace: `/devoluciones?alquilerId=${a.id}`
      });
    }
  }

  // Alertas de mantenimiento en taller
  const equiposEnTaller = equipos.filter((eq) => eq.estado === 'MANTENIMIENTO');
  if (equiposEnTaller.length > 0) {
    alertas.push({
      id: 'alert-mant-taller',
      tipo: 'ADVERTENCIA',
      titulo: `${equiposEnTaller.length} Equipo(s) en Mantenimiento`,
      mensaje: `Equipos en revisión técnica: ${equiposEnTaller.map((e) => e.nombre).slice(0, 3).join(', ')}.`,
      fecha: fechaHoy,
      enlace: '/bodega'
    });
  }

  // Alerta informativa general si no hay alertas críticas
  if (alertas.length === 0) {
    alertas.push({
      id: 'alert-info-operativo',
      tipo: 'INFO',
      titulo: 'Operaciones al Día',
      mensaje: 'No se registran contratos vencidos ni retornos en mora para el día de hoy.',
      fecha: fechaHoy
    });
  }

  return alertas;
}

/**
 * 5. Orquesta el procesamiento completo del Dashboard en una sola llamada
 */
export function procesarDashboardCompleto(params: ProcesarDashboardParams): DashboardPayload {
  const fechaHoy = params.fechaHoy || obtenerFechaHoyLocal();
  const alquileres = params.alquileres || [];
  const equipos = params.equipos || [];
  const tareasManuales = params.tareasManuales || [];

  const kpis = calcularKPIsDashboard(alquileres, equipos, fechaHoy);
  const eventos = generarEventosCalendario(alquileres, equipos, fechaHoy);
  const tareasSistema = generarTareasSistema(alquileres, fechaHoy);
  const alertas = generarAlertasFeed(alquileres, equipos, fechaHoy);

  // Unificar tareas manuales y del sistema
  const todasLasTareas = [...tareasSistema, ...tareasManuales];

  const mesActivo = fechaHoy.slice(0, 7); // YYYY-MM

  return {
    kpis,
    eventos,
    tareas: todasLasTareas,
    alertas,
    mesActivo
  };
}
