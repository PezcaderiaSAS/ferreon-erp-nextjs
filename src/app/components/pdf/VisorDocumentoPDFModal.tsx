'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Printer, Download, ExternalLink, X, FileText, CheckCircle, Copy } from 'lucide-react';
import { EnterprisePDFService, DocumentoPDFPayload, FormatoPapelPDF } from '@/core/services/pdf-factura-generator.service';
import { useEmpresaStore } from '@/infrastructure/state/empresaStore';

export interface VisorDocumentoPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  documento: DocumentoPDFPayload;
}

export function VisorDocumentoPDFModal({
  isOpen,
  onClose,
  documento,
}: VisorDocumentoPDFModalProps) {
  const { config: empresaConfig } = useEmpresaStore();
  const [formato, setFormato] = useState<FormatoPapelPDF>('LETTER');
  const [copiado, setCopiado] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const payloadCompleto: DocumentoPDFPayload = {
    ...documento,
    empresa: documento.empresa || empresaConfig,
    formatoPapel: formato,
  };

  const htmlContent = EnterprisePDFService.generarHTMLDocumento(payloadCompleto);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(htmlContent);
        win.document.close();
        win.print();
      }
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    } else {
      alert('Por favor autorice ventanas emergentes para abrir el documento.');
    }
  };

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const tituloBadge =
    documento.tipo === 'COTIZACION'
      ? `Cotización #${documento.consecutivo}`
      : documento.tipo === 'FACTURA'
      ? `Factura #${documento.consecutivo}`
      : `Contrato #${documento.consecutivo}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visor-pdf-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* BARRA SUPERIOR DE ACCIONES */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-salmon/20 text-brand-salmonLight rounded-lg">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="visor-pdf-title" className="text-base font-bold text-white tracking-tight">
                  Visor Oficial de Documentos
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  {tituloBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cliente: <span className="text-slate-200 font-medium">{documento.clienteNombre}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Papel */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFormato('LETTER')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  formato === 'LETTER'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Carta (Letter)
              </button>
              <button
                type="button"
                onClick={() => setFormato('A5')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  formato === 'A5'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Media Carta (A5)
              </button>
            </div>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            {/* Abrir en Pestaña / PDF */}
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Abrir en pestaña nueva para guardar como PDF"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Pestaña</span>
            </button>

            {/* Cerrar */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
              aria-label="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENEDOR DEL IFRAME DE PREVISUALIZACIÓN */}
        <div className="flex-1 w-full bg-slate-100 p-2 sm:p-4 overflow-auto flex justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={htmlContent}
            title={`Documento ${documento.consecutivo}`}
            className="w-full h-full max-w-4xl bg-white shadow-md rounded-lg border border-slate-300"
          />
        </div>

        {/* BARRA INFERIOR DE ESTADO Y SEGURIDAD */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Documento generado con certificación de integridad y desglose tributario</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{documento.empresa?.razonSocial || 'FerreOn S.A.S.'}</span>
            <span>•</span>
            <button
              type="button"
              onClick={handleCopiarEnlace}
              className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
            >
              {copiado ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiado ? 'Enlace copiado' : 'Copiar URL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
