export interface DetalleItemPDF {
  cantidad: number;
  nombre: string;
  dias: number;
  tarifaDiaria: number;
  subtotal: number;
  pesoKilos: number;
}

export interface FacturaPDFPayload {
  numeroConsecutivo: number;
  fechaEmision: string;
  alquilerConsecutivo: number;
  clienteNombre: string;
  clienteNit: string;
  clienteDireccion: string;
  clienteTelefono: string;
  detallesLogistica?: string;
  items: DetalleItemPDF[];
  subtotalEquipos: number;
  fleteEntrega: number;
  fleteRecogida: number;
  subtotalGeneral: number;
  costosDano: number;
  depositoAplicado: number;
  totalPagar: number;
  observaciones?: string;
}

export class PDFFacturaGeneratorService {
  /**
   * Genera el documento HTML imprimible en alta definición con estándar A4
   * listo para imprimir o convertir en PDF con 100% de renglones y fletes.
   */
  static generarHTMLFactura(payload: FacturaPDFPayload): string {
    const totalFletes = (payload.fleteEntrega || 0) + (payload.fleteRecogida || 0);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cuenta de Cobro #CC-${payload.numeroConsecutivo} - Alquileres ERP</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 20px; font-size: 11pt; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
    .company-title { font-size: 20pt; font-weight: 900; color: #0f172a; margin: 0; }
    .company-sub { font-size: 10pt; color: #64748b; font-weight: 600; }
    .doc-badge { background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 6px 14px; border-radius: 8px; text-align: right; }
    .doc-badge h2 { margin: 0; font-size: 14pt; font-weight: 800; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .info-block h4 { margin: 0 0 6px 0; color: #475569; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-block p { margin: 2px 0; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 9pt; text-transform: uppercase; font-weight: 700; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-area { display: flex; justify-content: flex-end; margin-top: 10px; }
    .totals-table { width: 320px; border-collapse: collapse; }
    .totals-table td { padding: 5px 8px; border: none; }
    .total-row { font-size: 13pt; font-weight: 900; color: #0284c7; border-top: 2px solid #0f172a !important; }
    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 8.5pt; color: #64748b; text-align: center; }
    .logistica-box { background: #eef2ff; border: 1px solid #c7d2fe; padding: 8px 12px; border-radius: 6px; margin-bottom: 15px; font-size: 9.5pt; color: #3730a3; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="company-title">ALQUILERES ERP</h1>
      <span class="company-sub">Alquiler de Maquinaria y Equipos de Construcción</span>
    </div>
    <div class="doc-badge">
      <h2>CUENTA DE COBRO</h2>
      <div># CC-${payload.numeroConsecutivo}</div>
      <div style="font-size: 8.5pt; color: #64748b; margin-top: 3px;">Fecha: ${payload.fechaEmision}</div>
    </div>
  </div>

  <div class="grid-info">
    <div class="info-block">
      <h4>Datos del Cliente</h4>
      <p><strong>${payload.clienteNombre}</strong></p>
      <p>NIT/Cédula: ${payload.clienteNit}</p>
      <p>Teléfono: ${payload.clienteTelefono || 'N/A'}</p>
      <p>Dirección: ${payload.clienteDireccion || 'N/A'}</p>
    </div>
    <div class="info-block">
      <h4>Detalles del Contrato</h4>
      <p>Contrato Vinculado: <strong>ALQ-${payload.alquilerConsecutivo}</strong></p>
      <p>Moneda: <strong>Pesos Colombianos (COP)</strong></p>
      <p>Estado: <strong>Liquidado / Emitido</strong></p>
    </div>
  </div>

  ${payload.detallesLogistica ? `
  <div class="logistica-box">
    <strong>🚚 Registro de Despacho / Logística:</strong> ${payload.detallesLogistica}
  </div>` : ''}

  <table>
    <thead>
      <tr>
        <th class="text-center" style="width: 40px;">#</th>
        <th>Descripción del Equipo</th>
        <th class="text-center" style="width: 60px;">Cant.</th>
        <th class="text-center" style="width: 60px;">Días</th>
        <th class="text-right" style="width: 100px;">Tarifa / Día</th>
        <th class="text-right" style="width: 110px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${payload.items.map((it, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${it.nombre}</strong> (${it.pesoKilos.toFixed(2)} Kg)</td>
          <td class="text-center">${it.cantidad}</td>
          <td class="text-center">${it.dias}</td>
          <td class="text-right">$ ${it.tarifaDiaria.toLocaleString('es-CO')}</td>
          <td class="text-right"><strong>$ ${it.subtotal.toLocaleString('es-CO')}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-area">
    <table class="totals-table">
      <tr>
        <td>Subtotal Equipos:</td>
        <td class="text-right">$ ${payload.subtotalEquipos.toLocaleString('es-CO')}</td>
      </tr>
      ${totalFletes > 0 ? `
      <tr>
        <td>Fletes (Llevar + Recoger):</td>
        <td class="text-right">$ ${totalFletes.toLocaleString('es-CO')}</td>
      </tr>` : ''}
      ${payload.costosDano > 0 ? `
      <tr>
        <td>Recargos por Averías / Daños:</td>
        <td class="text-right" style="color: #dc2626;">+ $ ${payload.costosDano.toLocaleString('es-CO')}</td>
      </tr>` : ''}
      ${payload.depositoAplicado > 0 ? `
      <tr>
        <td>Depósito Aplicado a Favor:</td>
        <td class="text-right" style="color: #16a34a;">- $ ${payload.depositoAplicado.toLocaleString('es-CO')}</td>
      </tr>` : ''}
      <tr class="total-row">
        <td><strong>TOTAL NETO A PAGAR:</strong></td>
        <td class="text-right"><strong>$ ${payload.totalPagar.toLocaleString('es-CO')} COP</strong></td>
      </tr>
    </table>
  </div>

  <div class="footer">
    Documento oficial generado por <strong>Alquileres ERP</strong>. Corte de facturación 5:00 PM (hora de Bogotá).
    <br>Gracias por confiar en nuestros equipos y servicios.
  </div>
</body>
</html>
    `;
  }
}
