/**
 * FacturacionRecurrenteService — Dominio de Cortes Periódicos y Cuentas de Cobro Pro-Rata
 * ---------------------------------------------------------------------------------------
 * Proyecto: Alquileres System (FerreOn ERP)
 * Implementa el cálculo de días devengados de maquinaria en obra dentro de ventanas de corte,
 * liquidación con exactitud bancaria (Integer Math en COP) y plantillas de cobro para WhatsApp.
 */

export interface PeriodoCorteFechas {
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string;    // YYYY-MM-DD
}

export interface DetalleEquipoCorte {
  equipoId?: string | number;
  nombre: string;
  cantidad: number;
  tarifaDiaria: number;
  diasFacturables: number;
  subtotal: number;
}

export interface LiquidacionCorteAlquiler {
  alquilerId: string | number;
  numeroContrato: string;
  clienteNombre: string;
  clienteDocumento?: string | null;
  clienteTelefono?: string | null;
  obraNombre?: string | null;
  fechaInicioContrato: string;
  fechaFinContrato?: string | null;
  diasFacturablesPeriodo: number;
  fechaDesdeEfectiva: string;
  fechaHastaEfectiva: string;
  items: DetalleEquipoCorte[];
  subtotal: number;
  aplicaIva: boolean;
  valorIva: number;
  aplicaRetenciones: boolean;
  valorRetefuente: number;
  valorReteica: number;
  totalNeto: number;
  esFacturable: boolean;
}

export interface ResumenLoteCortesPeriodicos {
  periodo: PeriodoCorteFechas;
  liquidaciones: LiquidacionCorteAlquiler[];
  totalContratosFacturables: number;
  totalMontoFacturable: number;
  totalDiasMaquinariaEnObra: number;
}

/**
 * Normaliza una fecha a string YYYY-MM-DD ignorando husos horarios
 */
function parsearFechaLocal(fechaIso: string): Date {
  const parteFecha = fechaIso.split('T')[0];
  const [año, mes, día] = parteFecha.split('-').map(Number);
  return new Date(año, mes - 1, día);
}

function formatearFechaIso(d: Date): string {
  const año = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const día = String(d.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}

/**
 * 1. Cálculo de Días Facturables mediante Intersección Cronológica Estricta
 */
export function calcularDiasFacturablesEnPeriodo(
  inicioContratoIso: string,
  finContratoIso: string | null | undefined,
  inicioCorteIso: string,
  finCorteIso: string
): { diasFacturables: number; fechaDesde: string; fechaHasta: string; estaEnRango: boolean } {
  if (!inicioContratoIso || !inicioCorteIso || !finCorteIso) {
    return { diasFacturables: 0, fechaDesde: '', fechaHasta: '', estaEnRango: false };
  }

  const dateInicioCorte = parsearFechaLocal(inicioCorteIso);
  const dateFinCorte = parsearFechaLocal(finCorteIso);

  if (dateFinCorte < dateInicioCorte) {
    return { diasFacturables: 0, fechaDesde: '', fechaHasta: '', estaEnRango: false };
  }

  const dateInicioContrato = parsearFechaLocal(inicioContratoIso);
  // Si el contrato no tiene fecha fin, asumimos que continúa abierto
  const dateFinContrato = finContratoIso ? parsearFechaLocal(finContratoIso) : new Date(2099, 11, 31);

  // Intersección: inicioEfectivo = max(inicioCorte, inicioContrato)
  const inicioEfectivo = dateInicioCorte > dateInicioContrato ? dateInicioCorte : dateInicioContrato;
  // finEfectivo = min(finCorte, finContrato)
  const finEfectivo = dateFinCorte < dateFinContrato ? dateFinCorte : dateFinContrato;

  if (finEfectivo < inicioEfectivo) {
    return {
      diasFacturables: 0,
      fechaDesde: formatearFechaIso(inicioEfectivo),
      fechaHasta: formatearFechaIso(finEfectivo),
      estaEnRango: false,
    };
  }

  const diffMs = finEfectivo.getTime() - inicioEfectivo.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return {
    diasFacturables: Math.max(0, dias),
    fechaDesde: formatearFechaIso(inicioEfectivo),
    fechaHasta: formatearFechaIso(finEfectivo),
    estaEnRango: dias > 0,
  };
}

/**
 * 2. Liquidación Pro-Rata de un Contrato de Alquiler para un Periodo de Corte
 */
export function calcularCortePeriodicoAlquiler(
  alquiler: any,
  periodo: PeriodoCorteFechas,
  opciones?: { aplicaIva?: boolean; aplicaRetenciones?: boolean }
): LiquidacionCorteAlquiler {
  const inicioContrato = alquiler.fecha_inicio || alquiler.fechaInicio || alquiler.fecha_inicio_contrato || alquiler.created_at || '';
  const finContrato = alquiler.fecha_fin || alquiler.fechaFin || alquiler.fecha_fin_contrato || null;

  const interseccion = calcularDiasFacturablesEnPeriodo(
    inicioContrato,
    finContrato,
    periodo.fechaInicio,
    periodo.fechaFin
  );

  const diasFacturables = interseccion.diasFacturables;

  // Extraer ítems del contrato (detalles de maquinaria)
  const detallesRaw = Array.isArray(alquiler.detalles)
    ? alquiler.detalles
    : Array.isArray(alquiler.alquiler_detalles)
      ? alquiler.alquiler_detalles
      : [];

  let subtotal = 0;
  const itemsCorte: DetalleEquipoCorte[] = [];

  if (detallesRaw.length > 0) {
    for (const det of detallesRaw) {
      const cantidad = Math.max(1, Number(det.cantidad) || 1);
      const tarifaDiaria = Math.max(0, Number(det.tarifa_diaria ?? det.tarifaDiaria ?? det.precio_unitario ?? 0));
      const subtotalItem = Math.round(cantidad * tarifaDiaria * diasFacturables);
      subtotal += subtotalItem;

      itemsCorte.push({
        equipoId: det.equipo_id ?? det.equipoId,
        nombre: det.equipos?.nombre || det.equipo_nombre || det.nombre || 'Equipo en Obra',
        cantidad,
        tarifaDiaria,
        diasFacturables,
        subtotal: subtotalItem,
      });
    }
  } else {
    // Si no tiene array de detalles desagregado, liquidamos por tarifa global pro-rata
    const totalContrato = Number(alquiler.total || alquiler.subtotal || 0);
    const diasTotalesContrato = Math.max(1, Number(alquiler.dias || 30));
    const tarifaDiariaProrrateada = Math.round(totalContrato / diasTotalesContrato);
    const subtotalCalculado = Math.round(tarifaDiariaProrrateada * diasFacturables);
    subtotal += subtotalCalculado;

    itemsCorte.push({
      nombre: 'Alquiler de Maquinaria y Equipos en Obra (Global)',
      cantidad: 1,
      tarifaDiaria: tarifaDiariaProrrateada,
      diasFacturables,
      subtotal: subtotalCalculado,
    });
  }

  // Parámetros de Impuestos
  const aplicaIva = opciones?.aplicaIva ?? (alquiler.aplica_iva ?? true);
  const aplicaRetenciones = opciones?.aplicaRetenciones ?? (alquiler.aplica_retefuente ?? false);

  const valorIva = aplicaIva ? Math.round(subtotal * 0.19) : 0;
  const valorRetefuente = aplicaRetenciones ? Math.round(subtotal * 0.025) : 0;
  const valorReteica = aplicaRetenciones ? Math.round(subtotal * 0.00966) : 0;

  const totalNeto = Math.max(0, subtotal + valorIva - valorRetefuente - valorReteica);
  const esFacturable = diasFacturables > 0 && totalNeto > 0;

  return {
    alquilerId: alquiler.id,
    numeroContrato: alquiler.numero_contrato || alquiler.consecutivo || `ALQ-${alquiler.id}`,
    clienteNombre: alquiler.cliente_nombre || alquiler.clienteNombre || 'Cliente de Obra',
    clienteDocumento: alquiler.cliente_documento || alquiler.clienteNit || null,
    clienteTelefono: alquiler.cliente_telefono || alquiler.clienteTelefono || null,
    obraNombre: alquiler.obra_nombre || alquiler.detallesLogistica || null,
    fechaInicioContrato: inicioContrato.split('T')[0],
    fechaFinContrato: finContrato ? finContrato.split('T')[0] : null,
    diasFacturablesPeriodo: diasFacturables,
    fechaDesdeEfectiva: interseccion.fechaDesde,
    fechaHastaEfectiva: interseccion.fechaHasta,
    items: itemsCorte,
    subtotal,
    aplicaIva,
    valorIva,
    aplicaRetenciones,
    valorRetefuente,
    valorReteica,
    totalNeto,
    esFacturable,
  };
}

/**
 * 3. Previsualización de un Lote de Cortes para Múltiples Contratos Activos
 */
export function previsualizarLoteCortesPeriodicos(
  contratos: any[],
  periodo: PeriodoCorteFechas,
  opciones?: { aplicaIva?: boolean; aplicaRetenciones?: boolean }
): ResumenLoteCortesPeriodicos {
  const liquidaciones: LiquidacionCorteAlquiler[] = [];
  let totalMontoFacturable = 0;
  let totalDiasMaquinariaEnObra = 0;
  let totalContratosFacturables = 0;

  for (const c of contratos) {
    // Solo procesar contratos activos o activos en obra
    const estado = (c.estado || '').toUpperCase();
    if (estado !== 'ACTIVO' && estado !== 'ACTIVO_EN_OBRA') {
      continue;
    }

    const liq = calcularCortePeriodicoAlquiler(c, periodo, opciones);
    if (liq.esFacturable) {
      liquidaciones.push(liq);
      totalContratosFacturables++;
      totalMontoFacturable += liq.totalNeto;
      totalDiasMaquinariaEnObra += liq.diasFacturablesPeriodo;
    }
  }

  return {
    periodo,
    liquidaciones,
    totalContratosFacturables,
    totalMontoFacturable,
    totalDiasMaquinariaEnObra,
  };
}

/**
 * 4. Constructor de Mensaje y Enlace para Enviar Cuenta de Cobro por WhatsApp
 */
export function construirMensajeWhatsAppCuentaCobro(params: {
  telefonoDestino?: string | null;
  clienteNombre: string;
  consecutivoDocumento: string; // ej: CC-PER-0104 o FAC-REC-0104
  numeroContrato: string;
  obraNombre?: string | null;
  fechaDesde: string;
  fechaHasta: string;
  diasFacturados: number;
  total: number;
  empresaNombre?: string;
  itemsResumen?: { nombre: string; cantidad: number }[];
}): { texto: string; url: string } {
  const empresa = params.empresaNombre || 'Alquileres System';
  const totalFormateado = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(params.total);

  const listaMaquinaria = (params.itemsResumen || [])
    .map((it, idx) => `  ${idx + 1}. *${it.nombre}* (Cant: ${it.cantidad})`)
    .join('\n');

  const texto = [
    `👋 Estimado(a) *${params.clienteNombre}*, un cordial saludo de *${empresa}*.`,
    '',
    `📄 Adjuntamos el corte periódico y *Cuenta de Cobro #${params.consecutivoDocumento}*:`,
    `📋 *Contrato:* ${params.numeroContrato}`,
    params.obraNombre ? `🏗️ *Obra / Proyecto:* ${params.obraNombre}` : '',
    `⏱️ *Periodo de Uso:* del ${params.fechaDesde} al ${params.fechaHasta} (${params.diasFacturados} días devengados)`,
    listaMaquinaria ? `\n🚜 *Maquinaria en Obra:*\n${listaMaquinaria}` : '',
    '',
    `💰 *Valor a Pagar:* ${totalFormateado}`,
    '',
    'Agradecemos tramitar su liquidación y pago a la mayor brevedad. Para enviar su comprobante o resolver cualquier inquietud, estamos atentos a este canal. ¡Gracias por confiar en nosotros! 🚜🏗️'
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
