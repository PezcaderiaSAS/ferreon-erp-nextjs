/**
 * Servicio Puro de Dominio: Facturación, Cartera CXC y Cobros
 * Proyecto: Alquileres System (FerreOn ERP & WMS)
 * 
 * Centraliza la lógica de negocio para:
 * - Mapeo y evaluación de contratos de alquiler a Facturas comerciales.
 * - Clasificación de estados de cartera (Pagada, Pendiente, Vencida).
 * - Agregación de KPIs financieros exactos (Ingresos, Por Cobrar, Vencido).
 * - Filtrado y búsqueda reactiva con normalización de diacríticos y mayúsculas.
 * - Construcción de payloads estructurados para el motor de facturas PDF oficiales.
 */

import { AlquilerUI } from '@/infrastructure/state/alquilerStore';
import { DocumentoPDFPayload } from './pdf-factura-generator.service';

export type EstadoFactura = 'Pagada' | 'Pendiente' | 'Vencida';

export type FiltroEstadoFactura = 'Todas' | 'Pagadas' | 'Pendientes' | 'Vencidas';

export interface FacturaUI {
  id: string;
  cliente: string;
  fechaEmision: string;
  vencimiento: string;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: EstadoFactura;
  alquilerOriginal: AlquilerUI;
}

export interface KPIsFacturacion {
  ingresosMes: number;
  porCobrar: number;
  vencido: number;
}

/**
 * Normaliza un texto eliminando diacríticos/tildes y espacios redundantes
 * para búsqueda insensible a acentos y mayúsculas.
 */
export const normalizarTexto = (texto: string): string =>
  (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/**
 * Mapea la colección de contratos de alquiler a entidades FacturaUI,
 * calculando saldos, estados de vencimiento y orden cronológico descendente.
 */
export function mapearAlquileresAFacturas(alquileres: any[]): FacturaUI[] {
  if (!Array.isArray(alquileres)) return [];

  return alquileres
    .filter(a => a && a.estado !== 'CANCELADO')
    .map(a => {
      const saldo = Number(a.saldo_pendiente ?? a.saldoPendiente ?? 0);
      const total = Number(a.total || 0);
      const pagado = Number(a.total_pagado ?? a.totalPagado ?? 0);
      
      // Regla de determinación de estado
      let estado: EstadoFactura = 'Pendiente';
      if (saldo <= 0 || pagado >= total) {
        estado = 'Pagada';
      } else if (a.fecha_vencimiento) {
        const hoy = new Date();
        const vencimiento = new Date(a.fecha_vencimiento);
        if (hoy > vencimiento) {
          estado = 'Vencida';
        }
      }

      const clienteNombre = a.clienteNombre || (a.cliente_id ? `Cliente ${a.cliente_id}` : 'Consumidor Final');
      const fechaEmision = a.created_at ? new Date(a.created_at).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
      const vencimiento = a.fecha_vencimiento 
        ? new Date(a.fecha_vencimiento).toLocaleDateString('es-CO') 
        : 'Por definir';

      return {
        id: String(a.id || a.consecutivo || ''),
        cliente: clienteNombre,
        fechaEmision,
        vencimiento,
        total,
        totalPagado: pagado,
        saldoPendiente: saldo,
        estado,
        alquilerOriginal: a
      };
    })
    .sort((a, b) => {
      const fechaA = a.alquilerOriginal.created_at ? new Date(a.alquilerOriginal.created_at).getTime() : 0;
      const fechaB = b.alquilerOriginal.created_at ? new Date(b.alquilerOriginal.created_at).getTime() : 0;
      return fechaB - fechaA;
    });
}

/**
 * Filtra facturas por estado ('Todas', 'Pagadas', 'Pendientes', 'Vencidas')
 * y por término de búsqueda (insensible a tildes y mayúsculas/minúsculas).
 */
export function filtrarFacturas(
  facturas: FacturaUI[],
  filtroActivo: FiltroEstadoFactura,
  searchTerm: string
): FacturaUI[] {
  if (!Array.isArray(facturas)) return [];

  let result = facturas;

  if (filtroActivo !== 'Todas') {
    const mapaEstado: Record<string, EstadoFactura> = {
      Pagadas: 'Pagada',
      Pendientes: 'Pendiente',
      Vencidas: 'Vencida'
    };
    const target = mapaEstado[filtroActivo];
    if (target) {
      result = result.filter(f => f.estado === target);
    }
  }

  if (searchTerm && searchTerm.trim()) {
    const q = normalizarTexto(searchTerm);
    result = result.filter(f =>
      normalizarTexto(f.id).includes(q) ||
      normalizarTexto(f.cliente).includes(q)
    );
  }

  return result;
}

/**
 * Calcula con rigor matemático los KPIs de facturación y cartera.
 */
export function calcularKPIsFacturacion(facturas: FacturaUI[]): KPIsFacturacion {
  if (!Array.isArray(facturas)) {
    return { ingresosMes: 0, porCobrar: 0, vencido: 0 };
  }

  let ingresos = 0;
  let cobrar = 0;
  let vencidos = 0;

  facturas.forEach(f => {
    ingresos += Math.round(f.totalPagado || 0);
    if (f.estado === 'Pendiente') {
      cobrar += Math.round(f.saldoPendiente || 0);
    }
    if (f.estado === 'Vencida') {
      vencidos += Math.round(f.saldoPendiente || 0);
    }
  });

  return {
    ingresosMes: ingresos,
    porCobrar: cobrar,
    vencido: vencidos
  };
}

/**
 * Construye de forma limpia y robusta el payload para la generación de la factura oficial en PDF.
 */
export function construirPayloadFacturaPDF(
  factura: FacturaUI,
  empresaConfig: any
): DocumentoPDFPayload {
  const alq = factura.alquilerOriginal;
  const rawCliente = (alq as any).clientes || (alq as any).cliente;
  const detallesList = alq.detalles || (alq as any).alquiler_detalles || [];
  const subtotalCalc = alq.subtotal_general || alq.subtotal_equipos || factura.total;
  const valorIva = alq.valor_iva || (alq.aplica_iva ? Math.round(Number(subtotalCalc) * 0.19) : 0);
  const valorRetefuente = Number(alq.valor_retefuente || 0);
  const valorReteica = Number(alq.valor_reteica || 0);

  return {
    tipo: 'FACTURA',
    consecutivo: factura.id,
    fechaEmision: alq.created_at || new Date().toISOString(),
    fechaVencimiento: alq.fecha_vencimiento || factura.vencimiento,
    clienteNombre: factura.cliente || rawCliente?.nombre || 'Consumidor Final',
    clienteNit: (alq as any).clienteNit || (alq as any).clienteDocumento || rawCliente?.nit_cedula || rawCliente?.nit || 'Sin Registrar',
    clienteTelefono: (alq as any).clienteTelefono || rawCliente?.telefono || '',
    clienteEmail: (alq as any).clienteEmail || rawCliente?.email || '',
    detallesLogistica: alq.detalles_logistica || (alq as any).detallesLogistica || '',
    items: detallesList.map((d: any) => ({
      cantidad: Number(d.cantidad || 1),
      nombre: d.equipos?.nombre || d.equipo?.nombre || d.nombreItem || d.nombre || 'Equipo de Alquiler',
      codigo: d.equipos?.codigo || d.equipo?.codigo || d.codigo || '',
      fechaInicio: d.fecha_inicio || d.fechaInicio || (alq.created_at || new Date().toISOString()),
      fechaFin: d.fecha_fin || d.fechaFin || alq.fecha_vencimiento || new Date().toISOString(),
      dias: Number(d.dias_contratados || d.dias || 1),
      tarifaDiaria: Number(d.tarifa_aplicada ?? d.tarifaAplicada ?? d.tarifaDiaria ?? d.valor_unitario ?? 0),
      subtotal: Number(d.subtotal_linea ?? d.subtotal ?? 0),
    })),
    subtotalEquipos: Number(alq.subtotal_equipos || subtotalCalc),
    fleteEntrega: Number(alq.flete_entrega ?? alq.fleteEntrega ?? (alq as any).valor_transporte ?? 0),
    fleteRecogida: Number(alq.flete_recogida ?? alq.fleteRecogida ?? 0),
    subtotalGeneral: Number(subtotalCalc) + Number(alq.flete_entrega || 0) + Number(alq.flete_recogida || 0),
    aplicaIva: alq.aplica_iva ?? (valorIva > 0),
    tasaIva: 19,
    valorIva,
    aplicaRetefuente: alq.aplica_retefuente ?? (valorRetefuente > 0),
    tasaRetefuente: 2.5,
    valorRetefuente,
    aplicaReteica: alq.aplica_reteica ?? (valorReteica > 0),
    tasaReteica: 0.966,
    valorReteica,
    depositoAplicado: Number(factura.totalPagado ?? alq.deposito ?? 0),
    garantiaMonto: Number(alq.garantia_monto ?? alq.garantiaMonto ?? 0),
    garantiaTipo: alq.garantia_tipo || alq.garantiaTipo || 'Efectivo',
    totalPagar: Number(factura.total || 0),
    saldoPendiente: Number(factura.saldoPendiente || 0),
    observaciones: alq.observaciones || '',
    empresa: empresaConfig,
  };
}
