import { numeroALetras, formatearMonedaCOP } from "../utils/numero-a-letras";
import { EmpresaConfig, DEFAULT_EMPRESA_CONFIG } from "../domain/entities/empresa-config";

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
  tipo: "COTIZACION" | "CONTRATO" | "CUENTA_COBRO";
  consecutivo: number | string;
  fechaEmision: string;
  fechaInicioGeneral?: string;
  clienteNombre: string;
  clienteNit: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
  detallesLogistica?: string;
  garantiaTipo?: string;
  garantiaMonto?: number;
  items: DetalleItemPDF[];
  subtotalEquipos: number;
  fleteEntrega: number;
  fleteRecogida: number;
  subtotalGeneral: number;
  costosDano?: number;
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
    
    // Recalcular ítems de manera resiliente
    const itemsProcesados = (payload.items || []).map((it) => {
      const fInicio = it.fechaInicio || payload.fechaEmision || new Date().toISOString();
      const fFin = it.fechaFin || fInicio;
      const diffMs = new Date(fFin).getTime() - new Date(fInicio).getTime();
      const diasCalculados = it.dias && it.dias > 0 ? it.dias : Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const cant = Number(it.cantidad || 1);
      const tarifa = Number(it.tarifaDiaria || 0);
      const subtotalCalc = it.subtotal && it.subtotal > 0 ? it.subtotal : cant * tarifa * diasCalculados;

      return {
        ...it,
        cantidad: cant,
        dias: diasCalculados,
        tarifaDiaria: tarifa,
        subtotal: subtotalCalc,
        fechaInicioFormat: new Date(fInicio).toLocaleDateString("es-CO"),
        fechaFinFormat: new Date(fFin).toLocaleDateString("es-CO"),
      };
    });

    const subtotalEquiposCalc = itemsProcesados.reduce((acc, it) => acc + it.subtotal, 0);
    const fleteEntrega = Number(payload.fleteEntrega || 0);
    const fleteRecogida = Number(payload.fleteRecogida || 0);
    const totalFletes = fleteEntrega + fleteRecogida;
    const deposito = Number(payload.depositoAplicado || 0);
    const totalGeneral = subtotalEquiposCalc + totalFletes + (payload.costosDano || 0);
    const saldoPendiente = Math.max(0, totalGeneral - deposito);
    const totalEnLetras = numeroALetras(saldoPendiente);

    const tituloDoc =
      payload.tipo === "COTIZACION"
        ? "COTIZACIÓN COMERCIAL"
        : "CUENTA DE COBRO";

    const badgePrefijo =
      payload.tipo === "COTIZACION" ? "COT" : "CC";

    const isTeal = emp.paletaPDF === "TEAL";
    const isAzul = emp.paletaPDF === "AZUL";
    const badgeColor = isTeal ? "#0f766e" : isAzul ? "#1e40af" : "#f97316"; // Teal, Blue-800, Salmon (Orange-500)
    const badgeBg = isTeal ? "#f0fdf4" : isAzul ? "#eff6ff" : "#fff7ed";
    
    // Configuración secundaria
    const headerColor = isTeal ? "#0f766e" : isAzul ? "#1e40af" : "#ea580c"; // Un poco más oscuro para el texto
    
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
      background: #0f766e;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #115e59;
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
      border-bottom: 2px solid ${badgeColor}; 
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
      border: 1px solid #86efac; 
      color: #15803d; 
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
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${emp.logoBase64 ? `<img src="${emp.logoBase64}" alt="Logo" style="max-height: ${isA5 ? '40px' : '60px'}; object-fit: contain; align-self: flex-start;" />` : ''}
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
        <p>Fecha: ${new Date(payload.fechaEmision).toLocaleDateString("es-CO")}</p>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-block">
        <h4>Información del Cliente</h4>
        <p><strong>Razón Social:</strong> ${payload.clienteNombre || "Consumidor Final"}</p>
        <p><strong>NIT / C.C.:</strong> ${payload.clienteNit || "Sin Registrar"}</p>
        <p><strong>Teléfono:</strong> ${payload.clienteTelefono || "No registrado"}</p>
      </div>
      <div class="info-block">
        <h4>Logística y Respaldo</h4>
        <p><strong>Destino / Obra:</strong> ${payload.detallesLogistica || payload.clienteDireccion || "Entrega en bodega"}</p>
        <p><strong>Garantía (${payload.garantiaTipo || "Efectivo"}):</strong> ${formatearMonedaCOP(payload.garantiaMonto || 0)}</p>
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
        <tr>
          <td>Flete Entrega en Obra:</td>
          <td class="text-right">${formatearMonedaCOP(fleteEntrega)}</td>
        </tr>
        <tr>
          <td>Flete Retorno / Recogida:</td>
          <td class="text-right">${formatearMonedaCOP(fleteRecogida)}</td>
        </tr>
        ${
          payload.costosDano && payload.costosDano > 0
            ? `<tr>
                 <td style="color:#dc2626;">Costos por Daños / Averías:</td>
                 <td class="text-right font-bold" style="color:#dc2626;">+ ${formatearMonedaCOP(payload.costosDano)}</td>
               </tr>`
            : ""
        }
        <tr>
          <td>Anticipo / Depósito Aplicado:</td>
          <td class="text-right font-bold" style="color:#dc2626;">- ${formatearMonedaCOP(deposito)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>SALDO PENDIENTE:</strong></td>
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
