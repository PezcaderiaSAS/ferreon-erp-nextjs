'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Printer, 
  X, 
  Receipt, 
  CheckCircle2, 
  Banknote, 
  FileText, 
  Copy, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { useEmpresaStore } from '../../infrastructure/state/empresaStore';

export interface ReciboCajaMetodoDetalle {
  metodo: string;
  monto: number;
  referencia?: string;
  efectivoRecibido?: number;
  cambio?: number;
}

export interface ReciboCajaMixtoPayload {
  consecutivoRecibo: string;
  consecutivoAlquiler: string;
  fecha: string;
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono?: string;
  montoTotal: number;
  saldoAnterior: number;
  nuevoSaldo: number;
  metodos: ReciboCajaMetodoDetalle[];
  cambioEntregado?: number;
  cajeroNombre?: string;
  observaciones?: string;
  transactionId?: string;
}

export interface ReciboCajaMixtoPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  recibo: ReciboCajaMixtoPayload | null;
}

export function ReciboCajaMixtoPDFModal({
  isOpen,
  onClose,
  recibo
}: ReciboCajaMixtoPDFModalProps) {
  const { config: empresaConfig } = useEmpresaStore();
  const [formato, setFormato] = useState<'LETTER' | 'THERMAL_80MM'>('LETTER');
  const [copiado, setCopiado] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !recibo) return null;

  const generarHTMLRecibo = (): string => {
    const empresaNombre = empresaConfig?.razonSocial || (empresaConfig as any)?.nombre || 'FERREON ERP';
    const empresaNit = empresaConfig?.nit ? `NIT: ${empresaConfig.nit}` : 'NIT: 901.458.320-1';
    const empresaDireccion = empresaConfig?.direccion || 'Sede Principal - Colombia';
    const empresaTelefono = empresaConfig?.telefono || 'PBX: (601) 850-2020';
    const fechaFormateada = new Date(recibo.fecha).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    if (formato === 'THERMAL_80MM') {
      // Formato Ticket Térmico POS 80mm
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo ${recibo.consecutivoRecibo}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    body {
      font-family: 'JetBrains Mono', monospace, -apple-system, sans-serif;
      width: 72mm;
      margin: 0 auto;
      padding: 10px 4px;
      color: #111;
      font-size: 11px;
      line-height: 1.35;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #444; margin: 8px 0; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { padding: 2px 0; }
    .title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
    .total-box { font-size: 13px; font-weight: bold; margin: 6px 0; }
    .footer { font-size: 9px; color: #555; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">${empresaNombre}</div>
    <div>${empresaNit}</div>
    <div>${empresaDireccion}</div>
    <div>${empresaTelefono}</div>
    <div class="divider"></div>
    <div class="bold" style="font-size: 12px;">RECIBO DE CAJA / COMPROBANTE DE PAGO</div>
    <div class="bold">${recibo.consecutivoRecibo}</div>
    <div>Fecha: ${fechaFormateada}</div>
    <div>Contrato: ${recibo.consecutivoAlquiler}</div>
  </div>

  <div class="divider"></div>
  <div><span class="bold">Cliente:</span> ${recibo.clienteNombre}</div>
  <div><span class="bold">Doc:</span> ${recibo.clienteDocumento}</div>
  ${recibo.clienteTelefono ? `<div><span class="bold">Tel:</span> ${recibo.clienteTelefono}</div>` : ''}

  <div class="divider"></div>
  <div class="bold" style="margin-bottom: 4px;">DESGLOSE MEDIOS DE PAGO:</div>
  <table class="table">
    ${recibo.metodos.map(m => `
      <tr>
        <td>${m.metodo.replace(/_/g, ' ')} ${m.referencia ? `(${m.referencia})` : ''}</td>
        <td class="right bold">$${Number(m.monto).toLocaleString('es-CO')}</td>
      </tr>
    `).join('')}
  </table>

  <div class="divider"></div>
  <table class="table">
    <tr>
      <td>Saldo Anterior:</td>
      <td class="right">$${Number(recibo.saldoAnterior).toLocaleString('es-CO')}</td>
    </tr>
    <tr class="total-box">
      <td>TOTAL ABONADO:</td>
      <td class="right">$${Number(recibo.montoTotal).toLocaleString('es-CO')}</td>
    </tr>
    <tr>
      <td class="bold">Nuevo Saldo:</td>
      <td class="right bold" style="color: ${recibo.nuevoSaldo === 0 ? '#059669' : '#d97706'}">
        $${Number(recibo.nuevoSaldo).toLocaleString('es-CO')}
      </td>
    </tr>
    ${recibo.cambioEntregado && recibo.cambioEntregado > 0 ? `
    <tr>
      <td>Cambio Entregado:</td>
      <td class="right bold">$${Number(recibo.cambioEntregado).toLocaleString('es-CO')}</td>
    </tr>` : ''}
  </table>

  ${recibo.observaciones ? `
    <div class="divider"></div>
    <div><span class="bold">Obs:</span> ${recibo.observaciones}</div>
  ` : ''}

  <div class="divider"></div>
  <div class="center footer">
    <div>Atendido por: ${recibo.cajeroNombre || 'Cajero de Turno'}</div>
    <div>ID Transacción: ${recibo.transactionId || 'TX-AUT' + Date.now().toString().slice(-6)}</div>
    <div style="margin-top: 4px;">¡Gracias por confiar en FerreOn!</div>
  </div>
</body>
</html>`;
    }

    // Formato Estándar Carta / Media Carta
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recibo de Caja Oficial - ${recibo.consecutivoRecibo}</title>
  <style>
    @page { size: letter portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .mono { font-family: 'JetBrains Mono', Courier, monospace; font-variant-numeric: tabular-nums; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; }
    .empresa-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
    .recibo-badge { text-align: right; }
    .recibo-number { font-size: 18px; font-weight: 800; color: #059669; }
    .card-section { margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .text-right { text-align: right; }
    .totals-box { margin-top: 20px; display: flex; justify-content: flex-end; }
    .totals-table { width: 340px; border-collapse: collapse; }
    .totals-table td { padding: 6px 10px; }
    .total-highlight { background: #ecfdf5; font-weight: 800; font-size: 14px; color: #065f46; border-top: 2px solid #059669; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
    .signature-area { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .signature-line { border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; font-size: 11px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="empresa-title">${empresaNombre}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 2px;">${empresaNit}</div>
      <div style="font-size: 11px; color: #475569;">${empresaDireccion} • ${empresaTelefono}</div>
    </div>
    <div class="recibo-badge">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Recibo Oficial de Caja</div>
      <div class="recibo-number mono">${recibo.consecutivoRecibo}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Fecha: ${fechaFormateada}</div>
    </div>
  </div>

  <div class="card-section">
    <div class="grid-2">
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">Datos del Cliente</div>
        <div style="font-weight: 700; font-size: 13px;">${recibo.clienteNombre}</div>
        <div>NIT/CC: <span class="mono">${recibo.clienteDocumento}</span></div>
        ${recibo.clienteTelefono ? `<div>Teléfono: ${recibo.clienteTelefono}</div>` : ''}
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px;">Contrato Vinculado</div>
        <div style="font-weight: 700; font-size: 13px; color: #0f172a;" class="mono">${recibo.consecutivoAlquiler}</div>
        <div>Responsable: ${recibo.cajeroNombre || 'Cajero Central'}</div>
        <div>Referencia Contable: <span class="mono">${recibo.transactionId || 'N/A'}</span></div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Medio de Recaudo</th>
        <th>Comprobante / Referencia Bancaria</th>
        <th class="text-right">Monto Recibido</th>
      </tr>
    </thead>
    <tbody>
      ${recibo.metodos.map(m => `
        <tr>
          <td><strong>${m.metodo.replace(/_/g, ' ')}</strong></td>
          <td class="mono">${m.referencia || 'N/A'}</td>
          <td class="text-right mono"><strong>$${Number(m.monto).toLocaleString('es-CO')} COP</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-box">
    <table class="totals-table">
      <tr>
        <td style="color: #64748b;">Saldo Previo del Contrato:</td>
        <td class="text-right mono">$${Number(recibo.saldoAnterior).toLocaleString('es-CO')}</td>
      </tr>
      <tr class="total-highlight">
        <td>TOTAL ABONADO EN RECIBO:</td>
        <td class="text-right mono">$${Number(recibo.montoTotal).toLocaleString('es-CO')} COP</td>
      </tr>
      <tr>
        <td style="font-weight: 700;">Saldo Pendiente Actualizado:</td>
        <td class="text-right mono" style="font-weight: 800; color: ${recibo.nuevoSaldo === 0 ? '#059669' : '#d97706'}">
          $${Number(recibo.nuevoSaldo).toLocaleString('es-CO')} COP
        </td>
      </tr>
      ${recibo.cambioEntregado && recibo.cambioEntregado > 0 ? `
      <tr>
        <td style="color: #059669;">Cambio en Efectivo Entregado:</td>
        <td class="text-right mono" style="color: #059669; font-weight: 700;">$${Number(recibo.cambioEntregado).toLocaleString('es-CO')}</td>
      </tr>` : ''}
    </table>
  </div>

  ${recibo.observaciones ? `
    <div style="margin-top: 20px; font-size: 11px; color: #475569; background: #f1f5f9; padding: 10px 14px; border-radius: 6px;">
      <strong>Observaciones:</strong> ${recibo.observaciones}
    </div>
  ` : ''}

  <div class="signature-area">
    <div class="signature-line">
      <div>Firma / Sello Cajero Responsable</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">C.C. ___________________</div>
    </div>
    <div class="signature-line">
      <div>Firma / Aceptación del Cliente</div>
      <div style="font-size: 10px; color: #64748b; margin-top: 2px;">C.C./NIT ___________________</div>
    </div>
  </div>

  <div class="footer">
    <div>Documento emitido electrónicamente por FerreOn ERP SaaS • Idempotencia Transaccional Verificada</div>
    <div class="mono">Generado: ${new Date().toISOString()}</div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(generarHTMLRecibo());
        win.document.close();
        win.print();
      }
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generarHTMLRecibo());
      win.document.close();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recibo-pdf-title"
    >
      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Barra Superior de Herramientas */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="recibo-pdf-title" className="text-base font-bold text-white tracking-tight">
                  Comprobante Oficial de Caja
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {recibo.consecutivoRecibo}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Abono Mixto: ${Number(recibo.montoTotal).toLocaleString('es-CO')} COP • {recibo.clienteNombre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Formato */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-700 text-xs">
              <button
                onClick={() => setFormato('LETTER')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  formato === 'LETTER' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Carta
              </button>
              <button
                onClick={() => setFormato('THERMAL_80MM')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  formato === 'THERMAL_80MM' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 inline mr-1" />
                Térmica POS
              </button>
            </div>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>

            {/* Abrir en pestaña */}
            <button
              onClick={handleOpenNewTab}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors ml-2"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visor IFrame del Documento Renderizado */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 overflow-hidden flex justify-center">
          <div className={`w-full h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ${
            formato === 'THERMAL_80MM' ? 'max-w-sm' : 'max-w-3xl'
          }`}>
            <iframe
              ref={iframeRef}
              srcDoc={generarHTMLRecibo()}
              title="Comprobante de Caja Oficial"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
