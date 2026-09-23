/**
 * Servicio Transaccional de Dominio Puro para Subcontrataciones & Tercerización
 * Alquileres System - FerreOn ERP SaaS
 * 
 * Funciones puras $O(N)$, determinísticas, sin efectos secundarios, sin I/O o dependencias de UI.
 */

import { SubcontratacionUI } from '@/infrastructure/state/subcontratacionStore';

export type EstadoVariant = 'blue' | 'amber' | 'purple' | 'emerald' | 'rose' | 'slate';

export interface SubcontratacionEnriquecida extends SubcontratacionUI {
  isVencida: boolean;
  estadoVariant: EstadoVariant;
  estadoLabel: string;
  margenBrutoEstimado: number;
  margenPct: number;
}

export interface KPIsSubcontrataciones {
  totalRegistros: number;
  totalActivas: number;
  totalEnBodega: number;
  totalDevueltas: number;
  totalLiquidadas: number;
  totalSolicitadas: number;
  costoTotalActivo: number;
  ingresoTotalActivo: number;
  margenTotalActivo: number;
  margenPct: string;
}

export interface PayloadItemOrdenPDF {
  descripcion: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  subtotal: number;
}

export interface PayloadOrdenPDF {
  consecutivo: string;
  proveedorNombre: string;
  proveedorNit: string;
  proveedorContacto: string;
  costoTotalEstimado: number;
  ingresoTotalEstimado: number;
  margenPct: number;
  observaciones: string;
  items: PayloadItemOrdenPDF[];
}

export type FiltroEstadoSubcontratacion = 
  | 'TODOS'
  | 'SOLICITADA'
  | 'ACTIVA'
  | 'RECIBIDA_EN_BODEGA'
  | 'DEVUELTA'
  | 'DEVUELTA_A_PROVEEDOR'
  | 'LIQUIDADA'
  | string;

/**
 * Normaliza cadenas de texto eliminando diacríticos/acentos y convirtiendo a minúsculas
 */
export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return '';
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Evalúa si una orden de subcontratación se encuentra vencida respecto a una fecha de corte (YYYY-MM-DD)
 */
export function esOrdenVencida(
  sub: SubcontratacionUI, 
  fechaCorte: string = new Date().toISOString().split('T')[0]
): boolean {
  const estado = (sub.estado || '').toUpperCase();
  if (
    estado === 'LIQUIDADA' || 
    estado === 'DEVUELTA' || 
    estado === 'DEVUELTA_A_PROVEEDOR' || 
    estado === 'CANCELADA'
  ) {
    return false;
  }

  const fechaDev = sub.fechaDevolucionEstimada || (sub as any).fecha_devolucion_estimada;
  if (!fechaDev) return false;

  const fechaDevStr = fechaDev.split('T')[0];
  return fechaDevStr < fechaCorte;
}

/**
 * Mapeo de estados a labels legibles y variantes cromáticas de badge
 */
export function resolverEstadoBadge(estadoRaw: string | undefined): { label: string; variant: EstadoVariant } {
  const estado = (estadoRaw || '').toUpperCase();
  switch (estado) {
    case 'ACTIVA':
      return { label: 'En Obra', variant: 'blue' };
    case 'SOLICITADA':
      return { label: 'Solicitada', variant: 'slate' };
    case 'RECIBIDA_EN_BODEGA':
      return { label: 'En Bodega', variant: 'amber' };
    case 'DEVUELTA':
    case 'DEVUELTA_A_PROVEEDOR':
      return { label: 'Devuelta a Aliado', variant: 'purple' };
    case 'LIQUIDADA':
      return { label: 'Liquidada', variant: 'emerald' };
    case 'CANCELADA':
      return { label: 'Cancelada', variant: 'rose' };
    default:
      return { label: estadoRaw || 'Desconocido', variant: 'slate' };
  }
}

/**
 * Enriquece una lista de subcontrataciones con cálculos de márgenes, vencimiento y etiquetas de estado.
 * Garantiza inmutabilidad estricta (no muta los objetos de entrada).
 */
export function enriquecerSubcontrataciones(
  subcontrataciones: SubcontratacionUI[],
  todayStr: string = new Date().toISOString().split('T')[0]
): SubcontratacionEnriquecida[] {
  return subcontrataciones.map((sub) => {
    const costo = Number(sub.costoTotalEstimado ?? (sub as any).costo_total_estimado ?? 0);
    const ingreso = Number(sub.ingresoTotalEstimado ?? (sub as any).ingreso_total_estimado ?? 0);
    const margenBrutoEstimado = ingreso - costo;
    const margenPct = ingreso > 0 ? (margenBrutoEstimado / ingreso) * 100 : 0;
    const isVencida = esOrdenVencida(sub, todayStr);
    const { label: estadoLabel, variant: estadoVariant } = resolverEstadoBadge(sub.estado);

    return {
      ...sub,
      isVencida,
      estadoVariant,
      estadoLabel,
      margenBrutoEstimado,
      margenPct,
    };
  });
}

/**
 * Calcula en un único recorrido O(N) los KPIs financieros y operativos de subcontratación
 */
export function calcularKPIsSubcontrataciones(
  subcontrataciones: SubcontratacionUI[]
): KPIsSubcontrataciones {
  let totalActivas = 0;
  let totalEnBodega = 0;
  let totalDevueltas = 0;
  let totalLiquidadas = 0;
  let totalSolicitadas = 0;
  let costoTotalActivo = 0;
  let ingresoTotalActivo = 0;

  for (let i = 0; i < subcontrataciones.length; i++) {
    const sub = subcontrataciones[i];
    const estado = (sub.estado || '').toUpperCase();

    if (estado === 'SOLICITADA') {
      totalSolicitadas++;
    } else if (estado === 'ACTIVA') {
      totalActivas++;
      costoTotalActivo += Number(sub.costoTotalEstimado ?? (sub as any).costo_total_estimado ?? 0);
      ingresoTotalActivo += Number(sub.ingresoTotalEstimado ?? (sub as any).ingreso_total_estimado ?? 0);
    } else if (estado === 'RECIBIDA_EN_BODEGA') {
      totalEnBodega++;
    } else if (estado === 'DEVUELTA' || estado === 'DEVUELTA_A_PROVEEDOR') {
      totalDevueltas++;
    } else if (estado === 'LIQUIDADA') {
      totalLiquidadas++;
    }
  }

  const margenTotalActivo = ingresoTotalActivo - costoTotalActivo;
  const margenPctCalculado = ingresoTotalActivo > 0
    ? ((margenTotalActivo / ingresoTotalActivo) * 100).toFixed(1)
    : '0.0';

  return {
    totalRegistros: subcontrataciones.length,
    totalActivas,
    totalEnBodega,
    totalDevueltas,
    totalLiquidadas,
    totalSolicitadas,
    costoTotalActivo,
    ingresoTotalActivo,
    margenTotalActivo,
    margenPct: margenPctCalculado,
  };
}

/**
 * Alias de compatibilidad
 */
export const calcularMetricasSubcontrataciones = calcularKPIsSubcontrataciones;

/**
 * Filtra la lista de subcontrataciones por estado y término de búsqueda (insensible a acentos)
 */
export function filtrarSubcontrataciones(
  subcontrataciones: SubcontratacionUI[],
  filtroEstado: FiltroEstadoSubcontratacion,
  terminoBusqueda: string
): SubcontratacionUI[] {
  const query = normalizarTexto(terminoBusqueda);
  const estadoFilter = (filtroEstado || 'TODOS').toUpperCase();

  return subcontrataciones.filter((sub) => {
    // 1. Filtro de estado
    if (estadoFilter !== 'TODOS') {
      const subEstado = (sub.estado || '').toUpperCase();
      if (estadoFilter === 'DEVUELTA_A_PROVEEDOR' || estadoFilter === 'DEVUELTA') {
        if (subEstado !== 'DEVUELTA' && subEstado !== 'DEVUELTA_A_PROVEEDOR') {
          return false;
        }
      } else if (subEstado !== estadoFilter) {
        return false;
      }
    }

    // 2. Filtro de búsqueda textual
    if (!query) return true;

    const consecutivo = normalizarTexto(sub.consecutivo);
    const proveedorNombre = normalizarTexto(sub.proveedorNombre || (sub as any).proveedor_nombre);
    const proveedorNit = normalizarTexto(sub.proveedorNit || (sub as any).proveedor_nit);
    const observaciones = normalizarTexto(sub.observaciones);

    if (
      consecutivo.includes(query) ||
      proveedorNombre.includes(query) ||
      proveedorNit.includes(query) ||
      observaciones.includes(query)
    ) {
      return true;
    }

    // Buscar en detalles de equipos si existen
    const detalles = sub.detalles || sub.subcontrataciones_detalles || (sub as any).detalles || [];
    for (let j = 0; j < detalles.length; j++) {
      const d = detalles[j];
      const desc = normalizarTexto(d.equipoNombre || d.descripcionItem || d.descripcion_item);
      const serial = normalizarTexto(d.serialProveedor || d.serial_proveedor);
      if (desc.includes(query) || serial.includes(query)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Transforma una orden de subcontratación en payload tipado para exportación / impresión de orden PDF
 */
export function construirPayloadOrdenPDF(sub: SubcontratacionUI): PayloadOrdenPDF {
  const costoTotalEstimado = Number(sub.costoTotalEstimado ?? (sub as any).costo_total_estimado ?? 0);
  const ingresoTotalEstimado = Number(sub.ingresoTotalEstimado ?? (sub as any).ingreso_total_estimado ?? 0);
  const margenTotal = ingresoTotalEstimado - costoTotalEstimado;
  const margenPct = ingresoTotalEstimado > 0
    ? (margenTotal / ingresoTotalEstimado) * 100
    : 0;

  const rawDetalles = sub.detalles || sub.subcontrataciones_detalles || (sub as any).detalles || [];
  const items: PayloadItemOrdenPDF[] = rawDetalles.map((d: any) => {
    const cantidad = Number(d.cantidad || 1);
    const dias = Number(d.diasContratados || d.dias_pactados || d.dias || 1);
    const tarifaDiaria = Number(d.tarifaDiariaProveedor || d.tarifa_diaria_proveedor || d.costo_diario_unitario || 0);
    const subtotal = d.subtotal_costo ? Number(d.subtotal_costo) : cantidad * dias * tarifaDiaria;
    const descripcion = d.equipoNombre || d.descripcionItem || d.descripcion_item || 'Equipo en subcontratación';

    return {
      descripcion,
      cantidad,
      dias,
      tarifaDiaria,
      subtotal,
    };
  });

  return {
    consecutivo: sub.consecutivo || '',
    proveedorNombre: sub.proveedorNombre || (sub as any).proveedor_nombre || '',
    proveedorNit: sub.proveedorNit || (sub as any).proveedor_nit || '',
    proveedorContacto: (sub as any).proveedorContacto || (sub as any).proveedor_contacto || '',
    costoTotalEstimado,
    ingresoTotalEstimado,
    margenPct,
    observaciones: sub.observaciones || '',
    items,
  };
}
