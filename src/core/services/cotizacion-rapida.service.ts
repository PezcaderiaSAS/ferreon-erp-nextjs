/**
 * CotizacionRapidaService — Dominio y Cálculos Comerciales para Alquileres System
 * --------------------------------------------------------------------------------
 * Procesa cálculos con exactitud bancaria (Integer Math en COP), métricas de pipeline
 * comercial, filtrado reactivo y construcción de mensajes interactivos de WhatsApp.
 */

export interface CotizacionItemCalculo {
  equipoId?: string | number;
  nombre?: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  stockDisponible?: number;
}

export interface ImpuestosCotizacionConfig {
  aplicaIva: boolean;
  tasaIva: number; // Ej: 19.0
  aplicaRetefuente: boolean;
  tasaRetefuente: number; // Ej: 2.5
  aplicaReteica: boolean;
  tasaReteica: number; // Ej: 0.966
}

export interface ResumenFinancieroCotizacion {
  subtotal: number;
  valorIva: number;
  valorRetefuente: number;
  valorReteica: number;
  valorTransporte: number;
  depositoGarantia: number;
  total: number;
}

export interface RawCotizacionComercial {
  id: string;
  consecutivo: string;
  cliente_id?: number | null;
  cliente_nombre: string;
  cliente_documento?: string | null;
  cliente_telefono?: string | null;
  cliente_email?: string | null;
  fecha_emision: string;
  fecha_vencimiento?: string | null;
  obra_nombre?: string | null;
  obra_direccion?: string | null;
  subtotal: number;
  total: number;
  estado: string; // BORRADOR, ENVIADA, PENDIENTE, APROBADA, CONVERTIDA, RECHAZADA, VENCIDA
  alquiler_id?: number | null;
  detalles?: any[];
  cotizaciones_detalles?: any[];
  created_at?: string;
}

export interface KPIsPipelineCotizaciones {
  totalCotizaciones: number;
  totalMontoCotizado: number;
  cotizacionesVigentes: number;
  cotizacionesConvertidas: number;
  cotizacionesAprobadas: number;
  tasaConversionPorcentaje: number;
}

/**
 * 1. Cálculo Riguroso de Totales e Impuestos (Integer Math COP)
 */
export function calcularTotalesCotizacion(
  items: CotizacionItemCalculo[],
  impuestos: ImpuestosCotizacionConfig,
  valorTransporte = 0,
  depositoGarantia = 0
): ResumenFinancieroCotizacion {
  let subtotal = 0;

  for (const item of items) {
    const cant = Math.max(0, Number(item.cantidad) || 0);
    const dias = Math.max(0, Number(item.dias) || 0);
    const tarifa = Math.max(0, Number(item.tarifaDiaria) || 0);
    subtotal += Math.round(cant * dias * tarifa);
  }

  const valorIva = impuestos.aplicaIva
    ? Math.round(subtotal * (Math.max(0, Number(impuestos.tasaIva) || 0) / 100))
    : 0;

  const valorRetefuente = impuestos.aplicaRetefuente
    ? Math.round(subtotal * (Math.max(0, Number(impuestos.tasaRetefuente) || 0) / 100))
    : 0;

  const valorReteica = impuestos.aplicaReteica
    ? Math.round(subtotal * (Math.max(0, Number(impuestos.tasaReteica) || 0) / 100))
    : 0;

  const transporteEntero = Math.max(0, Math.round(Number(valorTransporte) || 0));
  const depositoEntero = Math.max(0, Math.round(Number(depositoGarantia) || 0));

  // Total Neto = Subtotal + Transporte + IVA - Retefuente - ReteICA
  const total = Math.max(0, subtotal + transporteEntero + valorIva - valorRetefuente - valorReteica);

  return {
    subtotal,
    valorIva,
    valorRetefuente,
    valorReteica,
    valorTransporte: transporteEntero,
    depositoGarantia: depositoEntero,
    total,
  };
}

/**
 * 2. Cálculo de KPIs del Pipeline Comercial de Cotizaciones
 */
export function calcularKPIsPipelineCotizaciones(
  cotizaciones: RawCotizacionComercial[],
  fechaReferenciaIso = new Date().toISOString().split('T')[0]
): KPIsPipelineCotizaciones {
  const totalCotizaciones = cotizaciones.length;
  let totalMontoCotizado = 0;
  let cotizacionesVigentes = 0;
  let cotizacionesConvertidas = 0;
  let cotizacionesAprobadas = 0;

  for (const cot of cotizaciones) {
    const estado = (cot.estado || 'BORRADOR').toUpperCase();
    const monto = Math.max(0, Math.round(Number(cot.total) || 0));
    totalMontoCotizado += monto;

    if (estado === 'CONVERTIDA') {
      cotizacionesConvertidas++;
    } else if (estado === 'APROBADA') {
      cotizacionesAprobadas++;
      cotizacionesVigentes++;
    } else if (estado === 'BORRADOR' || estado === 'ENVIADA' || estado === 'PENDIENTE') {
      const vencimiento = cot.fecha_vencimiento;
      if (!vencimiento || vencimiento >= fechaReferenciaIso) {
        cotizacionesVigentes++;
      }
    }
  }

  const tasaConversionPorcentaje = totalCotizaciones > 0
    ? Math.round((cotizacionesConvertidas / totalCotizaciones) * 1000) / 10
    : 0;

  return {
    totalCotizaciones,
    totalMontoCotizado,
    cotizacionesVigentes,
    cotizacionesConvertidas,
    cotizacionesAprobadas,
    tasaConversionPorcentaje,
  };
}

/**
 * 3. Constructor de Mensaje y Enlace para Compartir por WhatsApp
 */
export function construirEnlaceWhatsAppCotizacion(params: {
  telefonoDestino?: string | null;
  clienteNombre: string;
  consecutivo: string;
  items: { nombre?: string; cantidad: number; dias: number }[];
  total: number;
  empresaNombre?: string;
  fechaVencimiento?: string | null;
}): { texto: string; url: string } {
  const empresa = params.empresaNombre || 'Alquileres System';
  const totalFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(params.total);

  const listaEquipos = params.items
    .map((it, idx) => `  ${idx + 1}. *${it.nombre || 'Equipo'}* x${it.cantidad} (${it.dias} días)`)
    .join('\n');

  const texto = [
    `👋 Hola *${params.clienteNombre}*, un cordial saludo de *${empresa}*.`,
    '',
    `📄 Le compartimos la cotización *#${params.consecutivo}*:`,
    listaEquipos || '  (Equipos en cotización)',
    '',
    `💰 *Valor Total:* ${totalFormateado}`,
    params.fechaVencimiento ? `⏳ *Vigencia de la oferta:* hasta el ${params.fechaVencimiento}` : '',
    '',
    'Para aprobar esta cotización o resolver cualquier inquietud, no dude en responder a este mensaje. ¡Quedamos a su servicio! 🚜🏗️'
  ].filter(Boolean).join('\n');

  const telLimpio = (params.telefonoDestino || '').replace(/\D/g, '');
  const telFormateado = telLimpio.startsWith('57')
    ? telLimpio
    : telLimpio.length === 10
      ? `57${telLimpio}`
      : telLimpio;

  const url = telFormateado
    ? `https://wa.me/${telFormateado}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;

  return { texto, url };
}

/**
 * 4. Filtrado Multicriterio de Cotizaciones
 */
export function filtrarCotizacionesComerciales(
  cotizaciones: RawCotizacionComercial[],
  filtroEstado: string,
  busqueda: string,
  fechaReferenciaIso = new Date().toISOString().split('T')[0]
): RawCotizacionComercial[] {
  const query = busqueda.trim().toLowerCase();

  return cotizaciones.filter((cot) => {
    // 1. Filtro por estado
    const estadoReal = (cot.estado || 'BORRADOR').toUpperCase();
    const esVencida =
      cot.fecha_vencimiento &&
      cot.fecha_vencimiento < fechaReferenciaIso &&
      estadoReal !== 'CONVERTIDA' &&
      estadoReal !== 'RECHAZADA';

    if (filtroEstado !== 'TODOS') {
      if (filtroEstado === 'VENCIDAS') {
        if (!esVencida) return false;
      } else if (filtroEstado === 'CONVERTIDAS') {
        if (estadoReal !== 'CONVERTIDA') return false;
      } else if (filtroEstado === 'APROBADAS') {
        if (estadoReal !== 'APROBADA') return false;
      } else if (filtroEstado === 'PENDIENTES') {
        if (estadoReal !== 'PENDIENTE' && estadoReal !== 'ENVIADA' && estadoReal !== 'BORRADOR') return false;
      } else if (estadoReal !== filtroEstado) {
        return false;
      }
    }

    // 2. Búsqueda por texto libre
    if (!query) return true;

    const consecutivo = (cot.consecutivo || '').toLowerCase();
    const cliente = (cot.cliente_nombre || '').toLowerCase();
    const nit = (cot.cliente_documento || '').toLowerCase();
    const obra = (cot.obra_nombre || '').toLowerCase();

    return (
      consecutivo.includes(query) ||
      cliente.includes(query) ||
      nit.includes(query) ||
      obra.includes(query)
    );
  });
}
