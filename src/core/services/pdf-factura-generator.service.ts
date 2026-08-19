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
  pesoKilos: number;
}

export interface DocumentoPDFPayload {
  tipo: "COTIZACION" | "CONTRATO" | "CUENTA_COBRO";
  consecutivo: number;
  fechaEmision: string;
  fechaInicioGeneral: string;
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
  pesoTotalKilos: number;
  observaciones?: string;
  empresa?: EmpresaConfig;
}

export class EnterprisePDFService {
  /**
   * Genera el documento HTML corporativo en tamaño CARTA (Letter)
   * con Logo de la empresa, datos fiscales, notas bancarias y formato $40.000.
   */
  static generarHTMLDocumento(payload: DocumentoPDFPayload): string {
    const emp = payload.empresa || DEFAULT_EMPRESA_CONFIG;
    const totalFletes = (payload.fleteEntrega || 0) + (payload.fleteRecogida || 0);
    const totalEnLetras = numeroALetras(payload.totalPagar);

    const tituloDoc =
      payload.tipo === "COTIZACION"
        ? "COTIZACIÓN COMERCIAL"
        : payload.tipo === "CONTRATO"
        ? "CONTRATO DE ALQUILER & REMISIÓN"
        : "CUENTA DE COBRO OFICIAL";

    const badgePrefijo =
      payload.tipo === "COTIZACION" ? "COT" : payload.tipo === "CONTRATO" ? "ALQ" : "CC";

    const badgeColor =
      payload.tipo === "COTIZACION" ? "#0284c7" : payload.tipo === "CONTRATO" ? "#059669" : "#4f46e5";

    const badgeBg =
      payload.tipo === "COTIZACION" ? "#f0f9ff" : payload.tipo === "CONTRATO" ? "#ecfdf5" : "#eef2ff";

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tituloDoc} #${badgePrefijo}-${payload.consecutivo} - ${emp.razonSocial}</title>
  <style>
    @page { 
      size: letter portrait; 
      margin: 10mm 12mm; 
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
      color: #1e293b; 
      line-height: 1.35; 
      margin: 0; 
      padding: 16px; 
      font-size: 9.5pt; 
      background: #f8fafc; 
    }
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 26px 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 16px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #0369a1;
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
      align-items: center; 
      border-bottom: 2px solid ${badgeColor}; 
      padding-bottom: 12px; 
      margin-bottom: 14px; 
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .company-logo {
      max-height: 52px;
      max-width: 150px;
      object-fit: contain;
    }
    .company-title { 
      font-size: 16pt; 
      font-weight: 900; 
      color: #0f172a; 
      margin: 0; 
      letter-spacing: -0.5px; 
    }
    .company-sub { 
      font-size: 8.5pt; 
      color: #64748b; 
      font-weight: 600; 
      display: block; 
      margin-top: 1px; 
    }
    .doc-badge { 
      background: ${badgeBg}; 
      border: 1px solid ${badgeColor}40; 
      color: ${badgeColor}; 
      padding: 6px 14px; 
      border-radius: 8px; 
      text-align: right; 
    }
    .doc-badge h2 { 
      margin: 0; 
      font-size: 12pt; 
      font-weight: 800; 
    }
    .grid-info { 
      display: grid; 
      grid-template-columns: 1.2fr 1fr; 
      gap: 14px; 
      margin-bottom: 14px; 
      background: #f8fafc; 
      padding: 10px 14px; 
      border-radius: 8px; 
      border: 1px solid #e2e8f0; 
    }
    .info-block h4 { 
      margin: 0 0 4px 0; 
      color: #475569; 
      font-size: 8pt; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    .info-block p { 
      margin: 2px 0; 
      font-size: 9pt; 
    }
    .logistica-box { 
      background: #f1f5f9; 
      border-left: 3px solid ${badgeColor}; 
      padding: 8px 12px; 
      border-radius: 4px; 
      margin-bottom: 14px; 
      font-size: 9pt; 
      color: #334155; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 14px; 
    }
    th { 
      background: #0f172a; 
      color: #ffffff; 
      text-align: left; 
      padding: 6px 8px; 
      font-size: 8pt; 
      text-transform: uppercase; 
      font-weight: 700; 
    }
    td { 
      padding: 6px 8px; 
      border-bottom: 1px solid #e2e8f0; 
      font-size: 8.5pt; 
    }
    tr:nth-child(even) { 
      background-color: #f8fafc; 
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-area { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-top: 10px; 
    }
    .conditions-box { 
      width: 48%; 
      font-size: 7.5pt; 
      color: #475569; 
      line-height: 1.35; 
      background: #f8fafc; 
      padding: 8px 10px; 
      border-radius: 6px; 
      border: 1px solid #e2e8f0; 
    }
    .totals-table { 
      width: 46%; 
      border-collapse: collapse; 
    }
    .totals-table td { 
      padding: 4px 6px; 
      border: none; 
      font-size: 9pt; 
    }
    .total-row { 
      font-size: 11pt; 
      font-weight: 900; 
      color: ${badgeColor}; 
      border-top: 2px solid #0f172a !important; 
    }
    .letras-box {
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
    }
    .bank-box {
      margin-top: 10px;
      padding: 8px 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      font-size: 8pt;
      color: #1e40af;
      line-height: 1.3;
    }
    .signatures { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 40px; 
      margin-top: 25px; 
      padding-top: 10px; 
    }
    .sig-line { 
      border-top: 1px solid #94a3b8; 
      text-align: center; 
      padding-top: 4px; 
      font-size: 8pt; 
      font-weight: bold; 
      color: #475569; 
    }
    .footer { 
      margin-top: 20px; 
      padding-top: 8px; 
      border-top: 1px dashed #cbd5e1; 
      font-size: 7.5pt; 
      color: #94a3b8; 
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
      <button class="btn btn-secondary" onclick="window.close()">Cerrar Visor</button>
      <button class="btn btn-primary" onclick="window.print()">Guardar como PDF / Imprimir</button>
    </div>

    <div class="header">
      <div class="brand-section">
        ${emp.logoBase64 ? `<img src="${emp.logoBase64}" alt="Logo Empresa" class="company-logo" />` : ''}
        <div>
          <h1 class="company-title">${emp.razonSocial}</h1>
          <span class="company-sub">NIT: ${emp.nit} • Tel: ${emp.telefono} • ${emp.direccion}, ${emp.ciudad}</span>
        </div>
      </div>
      <div class="doc-badge">
        <h2>${tituloDoc}</h2>
        <div><strong># ${badgePrefijo}-${payload.consecutivo}</strong></div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Fecha Emisión: ${payload.fechaEmision}</div>
      </div>
    </div>

    <div class="grid-info">
      <div class="info-block">
        <h4>Información del Cliente Contratante</h4>
        <p><strong>${payload.clienteNombre}</strong></p>
        <p>NIT/Cédula: <strong>${payload.clienteNit}</strong></p>
        <p>Teléfono: ${payload.clienteTelefono || 'N/A'}</p>
        <p>Dirección: ${payload.clienteDireccion || 'N/A'}</p>
      </div>
      <div class="info-block">
        <h4>Condiciones Generales del Documento</h4>
        <p>Fecha Inicio General: <strong>${payload.fechaInicioGeneral}</strong></p>
        <p>Peso Total de Carga: <strong>${payload.pesoTotalKilos.toFixed(3)} Kg</strong></p>
        ${payload.garantiaMonto ? `<p>Garantía: <strong>${formatearMonedaCOP(payload.garantiaMonto)} (${payload.garantiaTipo || 'Efectivo'})</strong></p>` : ''}
        <p>Formato de Hoja: <strong>Tamaño Carta (Letter)</strong></p>
      </div>
    </div>

    ${payload.detallesLogistica ? `
    <div class="logistica-box">
      <strong>🚚 Registro de Despacho & Transporte:</strong> ${payload.detallesLogistica}
    </div>` : ''}

    <table>
      <thead>
        <tr>
          <th class="text-center" style="width: 25px;">#</th>
          <th>Equipo / Maquinaria</th>
          <th class="text-center" style="width: 45px;">Cant.</th>
          <th class="text-center" style="width: 75px;">Desde</th>
          <th class="text-center" style="width: 75px;">Hasta</th>
          <th class="text-center" style="width: 45px;">Días</th>
          <th class="text-right" style="width: 80px;">Tarifa/Día</th>
          <th class="text-right" style="width: 90px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${payload.items.map((it, idx) => `
          <tr>
            <td class="text-center">${idx + 1}</td>
            <td><strong>${it.nombre}</strong> <span style="color:#64748b; font-size:7.5pt;">(${it.pesoKilos.toFixed(1)} Kg)</span></td>
            <td class="text-center"><strong>${it.cantidad}</strong></td>
            <td class="text-center">${it.fechaInicio}</td>
            <td class="text-center">${it.fechaFin}</td>
            <td class="text-center"><strong>${it.dias}</strong></td>
            <td class="text-right">${formatearMonedaCOP(it.tarifaDiaria)}</td>
            <td class="text-right"><strong>${formatearMonedaCOP(it.subtotal)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="conditions-box">
        <strong>TÉRMINOS Y CONDICIONES DE SERVICIO:</strong>
        <p style="margin: 4px 0 0 0;">${emp.notasFacturaPDF || 'Horario de corte 5:00 PM. Devolución en óptimas condiciones.'}</p>
      </div>

      <table class="totals-table">
        <tr>
          <td>Subtotal Equipos:</td>
          <td class="text-right"><strong>${formatearMonedaCOP(payload.subtotalEquipos)}</strong></td>
        </tr>
        ${totalFletes > 0 ? `
        <tr>
          <td>Fletes (Llevar + Recoger):</td>
          <td class="text-right"><strong>+ ${formatearMonedaCOP(totalFletes)}</strong></td>
        </tr>` : ''}
        ${(payload.costosDano || 0) > 0 ? `
        <tr>
          <td>Recargo por Averías:</td>
          <td class="text-right" style="color: #dc2626;"><strong>+ ${formatearMonedaCOP(payload.costosDano || 0)}</strong></td>
        </tr>` : ''}
        ${payload.depositoAplicado > 0 ? `
        <tr>
          <td>Depósito Aplicado:</td>
          <td class="text-right" style="color: #059669;"><strong>- ${formatearMonedaCOP(payload.depositoAplicado)}</strong></td>
        </tr>` : ''}
        <tr class="total-row">
          <td><strong>TOTAL A PAGAR:</strong></td>
          <td class="text-right"><strong>${formatearMonedaCOP(payload.totalPagar)}</strong></td>
        </tr>
      </table>
    </div>

    <div class="letras-box">
      ${totalEnLetras}
    </div>

    ${emp.cuentaBancariaInfo ? `
    <div class="bank-box">
      <strong>🏦 Instrucciones de Pago y Transferencia:</strong><br>
      ${emp.cuentaBancariaInfo}
    </div>` : ''}

    <div class="signatures">
      <div class="sig-line">
        Por ${emp.razonSocial}<br>
        <span style="font-size: 7pt; font-weight: normal; color: #64748b;">Despachador Responsable</span>
      </div>
      <div class="sig-line">
        Por el CLIENTE CONTRATANTE<br>
        <span style="font-size: 7pt; font-weight: normal; color: #64748b;">Firma, Cédula y Sello de Recibido</span>
      </div>
    </div>

    <div class="footer">
      Documento oficial emitido por <strong>${emp.razonSocial}</strong> (${emp.nit}) • ${emp.email} • ${emp.telefono}
    </div>
  </div>
</body>
</html>
    `;
  }
}
