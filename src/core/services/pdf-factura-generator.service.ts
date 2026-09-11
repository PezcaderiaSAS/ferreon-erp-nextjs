import { numeroALetras, formatearMonedaCOP } from "../utils/numero-a-letras";
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from "../domain/entities/empresa-config";
import { resolveCompanyTheme } from "../domain/theme/theme-tokens";


export interface DetalleItemPDF {
  cantidad: number;
  nombre: string;
  codigo?: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  tarifaDiaria: number;
  subtotal: number;
  pesoKilos?: number;
}

export type FormatoPapelPDF = "LETTER" | "A5";

export interface DocumentoPDFPayload {
  tipo: "COTIZACION" | "CONTRATO" | "CUENTA_COBRO" | "FACTURA";
  consecutivo: number | string;
  fechaEmision: string;
  fechaVencimiento?: string;
  fechaInicioGeneral?: string;
  clienteNombre: string;
  clienteNit: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  obraNombre?: string;
  obraDireccion?: string;
  detallesLogistica?: string;
  garantiaTipo?: string;
  garantiaMonto?: number;
  items: DetalleItemPDF[];
  subtotalEquipos: number;
  subtotalEquiposEstimado?: number;
  subtotal_equipos?: number;
  fleteEntrega: number;
  fleteRecogida: number;
  subtotalGeneral: number;
  subtotal_general?: number;
  costosDano?: number;
  clientes?: any;
  cliente?: any;
  detalles?: any[];
  alquiler_detalles?: any[];

  // Impuestos seleccionables
  aplicaIva?: boolean;
  tasaIva?: number;
  valorIva?: number;
  aplicaRetefuente?: boolean;
  tasaRetefuente?: number;
  valorRetefuente?: number;
  aplicaReteica?: boolean;
  tasaReteica?: number;
  valorReteica?: number;

  depositoAplicado: number;
  totalPagar: number;
  saldoPendiente?: number;
  pesoTotalKilos?: number;
  observaciones?: string;
  empresa?: EmpresaConfig;
  formatoPapel?: FormatoPapelPDF;
}

export class EnterprisePDFService {
  /**
   * Genera el documento HTML corporativo en tamaño CARTA (Letter) o A5
   * con Logo de la empresa, datos fiscales, notas bancarias y formato visual profesional.
   */
  static generarHTMLDocumento(payload: DocumentoPDFPayload): string {
    const emp = payload.empresa || DEFAULT_EMPRESA_CONFIG;
    const isA5 = payload.formatoPapel === "A5";
    
    // Extracción tolerante y defensiva de clientes
    const rawCliente = (payload as any).clientes || (payload as any).cliente;
    const clienteNombre = payload.clienteNombre || rawCliente?.nombre || "Consumidor Final";
    const rawNit = payload.clienteNit || (payload as any).clienteDocumento || rawCliente?.nit_cedula || rawCliente?.nit || (payload as any).nit_cedula || (payload as any).nit;
    const clienteNit = (rawNit && rawNit !== "Sin NIT" && rawNit !== "Sin Registrar") ? rawNit : (rawNit || "Sin Registrar");
    const rawTelefono = payload.clienteTelefono || rawCliente?.telefono || (payload as any).telefono;
    const clienteTelefono = (rawTelefono && rawTelefono !== "No registrado") ? rawTelefono : (rawTelefono || "No registrado");
    const clienteDireccion = payload.clienteDireccion || rawCliente?.direccion || (payload as any).direccion || "";
    const clienteEmail = payload.clienteEmail || rawCliente?.email || (payload as any).email || "";

    // Extracción tolerante y defensiva de ítems
    const rawItems = (payload.items && payload.items.length > 0)
      ? payload.items
      : ((payload as any).detalles && (payload as any).detalles.length > 0
        ? (payload as any).detalles
        : ((payload as any).alquiler_detalles || []));

    // Recalcular ítems de manera resiliente
    const itemsProcesados = rawItems.map((it: any) => {
      const fInicio = it.fechaInicio || it.fecha_inicio || payload.fechaEmision || new Date().toISOString();
      const fFin = it.fechaFin || it.fecha_fin || it.fechaFinEstimada || it.fecha_fin_estimada || fInicio;
      const diffMs = new Date(fFin).getTime() - new Date(fInicio).getTime();
      const diasCalculados = it.dias && Number(it.dias) > 0 
        ? Number(it.dias) 
        : (it.dias_contratados && Number(it.dias_contratados) > 0 
          ? Number(it.dias_contratados) 
          : Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
      const cant = Number(it.cantidad || 1);
      const tarifa = Number(it.tarifaDiaria ?? it.tarifa_aplicada ?? it.tarifaAplicada ?? it.valor_unitario ?? it.precioDiario ?? it.equipos?.tarifa_diaria ?? it.equipo?.tarifa_diaria ?? 0);
      const subtotalCalc = (it.subtotal !== undefined && Number(it.subtotal) > 0)
        ? Number(it.subtotal)
        : ((it.subtotal_linea !== undefined && Number(it.subtotal_linea) > 0)
          ? Number(it.subtotal_linea)
          : (it.subtotalLineaEstimado !== undefined && Number(it.subtotalLineaEstimado) > 0)
            ? Number(it.subtotalLineaEstimado)
            : cant * tarifa * diasCalculados);

      const nombreReal = it.nombre || it.nombreItem || it.equipos?.nombre || it.equipo?.nombre || "Equipo";
      const codigoReal = it.codigo || it.sku || it.equipos?.codigo || it.equipo?.codigo || "";

      return {
        ...it,
        nombre: nombreReal,
        codigo: codigoReal,
        cantidad: cant,
        dias: diasCalculados,
        tarifaDiaria: tarifa,
        subtotal: subtotalCalc,
        fechaInicioFormat: new Date(fInicio).toLocaleDateString("es-CO"),
        fechaFinFormat: new Date(fFin).toLocaleDateString("es-CO"),
      };
    });

    const subtotalEquiposCalc = itemsProcesados.reduce((acc: number, it: any) => acc + it.subtotal, 0);
    const subtotalEquipos = subtotalEquiposCalc > 0 
      ? subtotalEquiposCalc 
      : Number(payload.subtotalEquipos || (payload as any).subtotal_equipos || payload.subtotalEquiposEstimado || 0);

    const fleteEntrega = Number(payload.fleteEntrega ?? (payload as any).flete_entrega ?? (payload as any).valorTransporte ?? (payload as any).valor_transporte ?? (payload as any).costoEnvio ?? 0);
    const fleteRecogida = Number(payload.fleteRecogida ?? (payload as any).flete_recogida ?? (payload as any).costoRecoleccion ?? 0);
    const totalFletes = fleteEntrega + fleteRecogida;
    const deposito = Number(payload.depositoAplicado ?? (payload as any).deposito ?? (payload as any).deposito_garantia ?? (payload as any).depositoGarantia ?? (payload as any).totalPagado ?? 0);
    const garantiaMonto = Number(payload.garantiaMonto ?? (payload as any).garantia_monto ?? (payload as any).garantia ?? 0);
    const garantiaTipo = payload.garantiaTipo || (payload as any).garantia_tipo || 'Efectivo';
    const valorIva = payload.valorIva !== undefined ? payload.valorIva : (payload.aplicaIva ? Math.round(subtotalEquipos * ((payload.tasaIva || 19) / 100)) : 0);
    const valorRetefuente = payload.valorRetefuente !== undefined ? payload.valorRetefuente : (payload.aplicaRetefuente ? Math.round(subtotalEquipos * ((payload.tasaRetefuente || 2.5) / 100)) : 0);
    const valorReteica = payload.valorReteica !== undefined ? payload.valorReteica : (payload.aplicaReteica ? Math.round(subtotalEquipos * ((payload.tasaReteica || 0.966) / 100)) : 0);
    
    const totalGeneralCalc = subtotalEquipos + totalFletes + (payload.costosDano || 0) + valorIva - valorRetefuente - valorReteica;
    const totalGeneral = totalGeneralCalc > 0 
      ? totalGeneralCalc 
      : Number(payload.subtotalGeneral || (payload as any).total_general || (payload as any).total || payload.totalPagar || 0);

    const saldoPendiente = Math.max(0, totalGeneral - deposito);
    const montoParaLetras = saldoPendiente > 0 
      ? saldoPendiente 
      : (payload.saldoPendiente ? Number(payload.saldoPendiente) : (payload.totalPagar ? Number(payload.totalPagar) : totalGeneral));
    const totalEnLetras = numeroALetras(montoParaLetras);

    const fechaEmisionValid = payload.fechaEmision && !isNaN(new Date(payload.fechaEmision).getTime())
      ? new Date(payload.fechaEmision)
      : new Date();

    const tituloDoc =
      payload.tipo === "COTIZACION"
        ? "COTIZACIÓN COMERCIAL DE OBRA"
        : payload.tipo === "FACTURA"
        ? "FACTURA COMERCIAL DE VENTA"
        : payload.tipo === "CONTRATO"
        ? "CONTRATO DE ALQUILER"
        : "CUENTA DE COBRO";

    const badgePrefijo =
      payload.tipo === "COTIZACION"
        ? "COT"
        : payload.tipo === "FACTURA"
        ? "FAC"
        : payload.tipo === "CONTRATO"
        ? "ALQ"
        : "CC";

    const themeTokens = resolveCompanyTheme(emp);
    const badgeColor = themeTokens.base;
    const headerColor = themeTokens.dark;
    const badgeBg = themeTokens.badgeBg;
    const badgeText = themeTokens.badgeText;
    
    const consecutivoDisplay = payload.consecutivo ? `#${String(payload.consecutivo).padStart(5, "0")}` : "BORRADOR";


    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tituloDoc} ${badgePrefijo}-${payload.consecutivo} - ${emp.razonSocial}</title>
  <style>
    @page { 
      size: ${isA5 ? "A5 portrait" : "letter portrait"}; 
      margin: ${isA5 ? "8mm 10mm" : "10mm 12mm"}; 
    }
    * {
      box-sizing: border-box;
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      color: #0f172a; 
      line-height: 1.35; 
      margin: 0; 
      padding: ${isA5 ? "10px" : "16px"}; 
      font-size: ${isA5 ? "8pt" : "9.5pt"}; 
      background: #f8fafc; 
    }
    .document-container {
      max-width: ${isA5 ? "600px" : "800px"};
      margin: 0 auto;
      background: #ffffff;
      padding: ${isA5 ? "18px 20px" : "26px 30px"};
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .format-toggle {
      display: flex;
      gap: 6px;
      align-items: center;
      font-size: 8.5pt;
      font-weight: 600;
      color: #475569;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 8px;
      font-size: 8.5pt;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: ${themeTokens.base};
      color: ${themeTokens.textOnBase};
    }
    .btn-primary:hover {
      background: ${themeTokens.dark};
    }
    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #cbd5e1;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      border-bottom: 2px solid ${headerColor}; 
      padding-bottom: 12px; 
      margin-bottom: 14px; 
    }
    .brand-title { 
      font-size: ${isA5 ? "14pt" : "18pt"}; 
      font-weight: 900; 
      color: ${headerColor}; 
      margin: 0; 
      letter-spacing: -0.5px; 
    }
    .brand-sub { 
      font-size: ${isA5 ? "7.5pt" : "8.5pt"}; 
      color: #475569; 
      font-weight: 600; 
      display: block; 
      margin-top: 1px; 
    }
    .brand-meta {
      font-size: ${isA5 ? "6.8pt" : "7.5pt"};
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge { 
      background: ${badgeBg}; 
      border: 1px solid ${badgeColor}; 
      color: ${badgeText}; 
      padding: ${isA5 ? "4px 10px" : "6px 14px"}; 
      border-radius: 8px; 
      text-align: right; 
    }

    .doc-badge h2 { 
      margin: 0; 
      font-size: ${isA5 ? "10pt" : "12pt"}; 
      font-weight: 800; 
      color: ${headerColor};
    }
    .doc-badge p {
      margin: 2px 0 0 0;
      font-size: ${isA5 ? "6.8pt" : "7.5pt"};
      color: #475569;
    }
    .grid-info { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 10px; 
      margin-bottom: 12px; 
      background: #f8fafc; 
      padding: ${isA5 ? "8px 10px" : "10px 14px"}; 
      border-radius: 8px; 
      border: 1px solid #e2e8f0; 
    }
    .info-block h4 { 
      margin: 0 0 4px 0; 
      color: ${headerColor}; 
      font-size: ${isA5 ? "7pt" : "7.5pt"}; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
      font-weight: 800;
    }
    .info-block p { 
      margin: 2px 0; 
      font-size: ${isA5 ? "7.5pt" : "8.5pt"}; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 12px; 
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }
    th { 
      background: ${badgeColor}; 
      color: #ffffff; 
      text-align: left; 
      padding: ${isA5 ? "4px 6px" : "6px 8px"}; 
      font-size: ${isA5 ? "7pt" : "7.5pt"}; 
      text-transform: uppercase; 
      font-weight: 700; 
    }
    td { 
      padding: ${isA5 ? "4px 6px" : "5.5px 8px"}; 
      border-bottom: 1px solid #e2e8f0; 
      font-size: ${isA5 ? "7.2pt" : "8pt"}; 
    }
    tr:nth-child(even) { 
      background-color: #f8fafc; 
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .totals-area { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-top: 8px; 
      gap: 10px;
    }
    .conditions-box { 
      flex: 1.1; 
      font-size: ${isA5 ? "6.8pt" : "7.5pt"}; 
      color: #475569; 
      line-height: 1.35; 
      background: #f8fafc; 
      padding: ${isA5 ? "6px 8px" : "8px 10px"}; 
      border-radius: 6px; 
      border: 1px solid #e2e8f0; 
    }
    .totals-table { 
      flex: 0.9; 
      border-collapse: collapse; 
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .totals-table td { 
      padding: ${isA5 ? "3px 6px" : "4px 8px"}; 
      border-bottom: 1px solid #e2e8f0; 
      font-size: ${isA5 ? "7.5pt" : "8.5pt"}; 
    }
    .total-row { 
      font-size: ${isA5 ? "8.5pt" : "10pt"} !important; 
      font-weight: 900; 
      color: #ffffff; 
      background: ${badgeColor} !important;
    }
    .total-row td {
      color: #ffffff !important;
      border: none !important;
    }
    .letras-box {
      margin-top: 8px;
      padding: 6px 10px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      font-size: ${isA5 ? "7pt" : "8pt"};
      font-weight: 800;
      color: ${headerColor};
    }
    .bank-box {
      margin-top: 6px;
      padding: 6px 10px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-size: ${isA5 ? "6.8pt" : "7.5pt"};
      color: #1e40af;
      line-height: 1.3;
    }
    .signatures { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 30px; 
      margin-top: ${isA5 ? "16px" : "24px"}; 
      padding-top: 6px; 
    }
    .sig-line { 
      border-top: 1px solid #475569; 
      text-align: center; 
      padding-top: 3px; 
      font-size: ${isA5 ? "7pt" : "8pt"}; 
      font-weight: bold; 
      color: #334155; 
    }
    .sig-sub {
      font-size: ${isA5 ? "6.5pt" : "7pt"};
      color: #64748b;
      font-weight: normal;
    }
    .footer { 
      margin-top: 14px; 
      padding-top: 6px; 
      border-top: 1px dashed #cbd5e1; 
      font-size: ${isA5 ? "6pt" : "7pt"}; 
      color: #64748b; 
      text-align: center; 
    }
    @media print {
      body { 
        padding: 0; 
        background: #ffffff; 
      }
      .document-container {
        padding: 0;
        box-shadow: none;
        border: none;
        max-width: 100%;
      }
      .no-print { 
        display: none !important; 
      }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="toolbar no-print">
      <div class="format-toggle">
        <span>Formato de Papel:</span>
        <button class="btn btn-secondary" onclick="window.location.search = window.location.search.includes('format=A5') ? window.location.search.replace('format=A5', 'format=LETTER') : window.location.search + '&format=A5'">
          ${isA5 ? "📄 Cambiar a Tamaño Carta" : "📑 Cambiar a Media Carta (A5)"}
        </button>
      </div>
      <div>
        <button class="btn btn-primary" onclick="window.print()">
          <span>🖨️</span>
          <span>Imprimir Documento</span>
        </button>
      </div>
    </div>

    <div class="header">
      <div style="display: flex; flex-direction: row; align-items: center; gap: ${isA5 ? '10px' : '16px'}; max-width: 70%;">
        ${emp.logoBase64 && emp.logoBase64.startsWith('data:image/') ? `<img src="${emp.logoBase64}" alt="Logo" style="max-height: ${isA5 ? '42px' : '55px'}; max-width: ${isA5 ? '110px' : '150px'}; object-fit: contain;" />` : ''}
        <div>
          <h1 class="brand-title">${emp.razonSocial}</h1>
          <span class="brand-sub">Gestión y Alquiler de Maquinaria y Equipos para la Construcción</span>
          <div class="brand-meta">
            NIT: ${emp.nit} • Tel: ${emp.telefono} • ${emp.direccion}, ${emp.ciudad}
          </div>
        </div>
      </div>
      <div class="doc-badge">
        <h2>${tituloDoc}</h2>
        <p><strong>N°: ${consecutivoDisplay}</strong></p>
        <p>Fecha: ${fechaEmisionValid.toLocaleDateString("es-CO")}</p>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-block">
        <h4>Información del Cliente</h4>
        <p><strong>Razón Social:</strong> ${clienteNombre}</p>
        <p><strong>NIT / C.C.:</strong> ${clienteNit}</p>
        <p><strong>Teléfono:</strong> ${clienteTelefono}</p>
        ${clienteDireccion ? `<p><strong>Dirección:</strong> ${clienteDireccion}</p>` : ""}
        ${clienteEmail ? `<p><strong>Email:</strong> ${clienteEmail}</p>` : ""}
      </div>
      <div class="info-block">
        <h4>Logística y Respaldo</h4>
        <p><strong>Destino / Obra:</strong> ${payload.detallesLogistica || (payload as any).detalles_logistica || (payload as any).obraDireccion || (payload as any).obra_direccion || clienteDireccion || "Entrega en obra / bodega"}</p>
        <p><strong>Depósito / Anticipo:</strong> ${formatearMonedaCOP(deposito)}</p>
        <p><strong>Garantía (${garantiaTipo}):</strong> ${formatearMonedaCOP(garantiaMonto)}</p>
        ${payload.observaciones ? `<p><strong>Obs:</strong> ${payload.observaciones}</p>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Equipo / Maquinaria</th>
          <th class="text-center">Cant.</th>
          <th class="text-center">Desde</th>
          <th class="text-center">Hasta</th>
          <th class="text-center">Días</th>
          <th class="text-right">Tarifa / Día</th>
          <th class="text-right">Subtotal Est.</th>
        </tr>
      </thead>
      <tbody>
        ${itemsProcesados
          .map(
            (it) => `
          <tr>
            <td><strong>${it.nombre}</strong> ${it.codigo ? `<span style="color:#64748b; font-size:7pt;">(${it.codigo})</span>` : ""}</td>
            <td class="text-center font-bold">${it.cantidad}</td>
            <td class="text-center">${it.fechaInicioFormat}</td>
            <td class="text-center">${it.fechaFinFormat}</td>
            <td class="text-center font-bold">${it.dias}</td>
            <td class="text-right">${formatearMonedaCOP(it.tarifaDiaria)}</td>
            <td class="text-right font-bold">${formatearMonedaCOP(it.subtotal)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="conditions-box">
        <div class="letras-box">
          VALOR ESTIMADO EN LETRAS:<br/>
          <span>${totalEnLetras}</span>
        </div>
        <div class="bank-box">
          <strong>Cuentas para Abonos y Pagos:</strong><br/>
          ${emp.cuentaBancariaInfo}
        </div>
      </div>

      <table class="totals-table">
        <tr>
          <td>Subtotal Equipos:</td>
          <td class="text-right font-bold">${formatearMonedaCOP(subtotalEquiposCalc)}</td>
        </tr>
        ${fleteEntrega > 0 
          ? `<tr><td>Transporte / Flete Entrega en Obra:</td><td class="text-right font-bold">${formatearMonedaCOP(fleteEntrega)}</td></tr>` 
          : `<tr><td>Transporte Entrega:</td><td class="text-right text-slate-500" style="font-size:7pt;">$ 0 (Retiro en bodega)</td></tr>`
        }
        ${fleteRecogida > 0 
          ? `<tr><td>Transporte / Flete Retorno (Recogida):</td><td class="text-right font-bold">${formatearMonedaCOP(fleteRecogida)}</td></tr>` 
          : `<tr><td>Transporte Retorno:</td><td class="text-right text-slate-500" style="font-size:7pt;">$ 0 (Devolución en bodega)</td></tr>`
        }
        ${valorIva > 0 ? `<tr><td style="color:#1e40af;">(+) IVA (${payload.tasaIva || 19}%):</td><td class="text-right font-bold" style="color:#1e40af;">+ ${formatearMonedaCOP(valorIva)}</td></tr>` : ''}
        ${valorRetefuente > 0 ? `<tr><td style="color:#b45309;">(-) ReteFuente (${payload.tasaRetefuente || 2.5}%):</td><td class="text-right font-bold" style="color:#b45309;">- ${formatearMonedaCOP(valorRetefuente)}</td></tr>` : ''}
        ${valorReteica > 0 ? `<tr><td style="color:#047857;">(-) ReteICA (${payload.tasaReteica || 0.966}%):</td><td class="text-right font-bold" style="color:#047857;">- ${formatearMonedaCOP(valorReteica)}</td></tr>` : ''}
        ${
          payload.costosDano && payload.costosDano > 0
            ? `<tr>
                 <td style="color:#dc2626;">Costos por Daños / Averías:</td>
                 <td class="text-right font-bold" style="color:#dc2626;">+ ${formatearMonedaCOP(payload.costosDano)}</td>
               </tr>`
            : ""
        }
        <tr>
          <td style="color:${deposito > 0 ? '#dc2626' : '#64748b'}; font-weight:600;">
            (-) Anticipo / Depósito Recibido:
          </td>
          <td class="text-right font-bold font-mono" style="color:${deposito > 0 ? '#dc2626' : '#64748b'};">
            ${deposito > 0 ? `- ${formatearMonedaCOP(deposito)}` : '$ 0'}
          </td>
        </tr>
        ${garantiaMonto > 0 ? `<tr><td style="color:#64748b; font-size:7pt;">Garantía / Colateral (${garantiaTipo}):</td><td class="text-right font-mono" style="color:#64748b; font-size:7pt;">${formatearMonedaCOP(garantiaMonto)} (Respaldo)</td></tr>` : ''}
        <tr class="total-row">
          <td><strong>${payload.tipo === 'COTIZACION' ? 'TOTAL ESTIMADO:' : 'TOTAL NETO / SALDO PENDIENTE:'}</strong></td>
          <td class="text-right"><strong>${formatearMonedaCOP(saldoPendiente)}</strong></td>
        </tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-line">
        Firma Cliente / Receptor<br/>
        <span class="sig-sub">C.C. / NIT: ${payload.clienteNit || "____________________"}</span>
      </div>
      <div class="sig-line">
        ${emp.razonSocial}<br/>
        <span class="sig-sub">Firma Autorizada y Sello</span>
      </div>
    </div>

    <div class="footer">
      Documento oficial de control de alquiler expedido por ${emp.razonSocial}. Horario de corte: ${emp.notasFacturaPDF}
    </div>
  </div>
</body>
</html>
    `;
  }
}
