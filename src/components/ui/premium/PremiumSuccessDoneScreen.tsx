'use client';

import React, { useState } from 'react';
import {
  Check,
  Building2,
  ArrowRight,
  Receipt,
  FileText,
  RotateCcw,
  Sparkles,
  Download,
  Send,
  CalendarCheck2,
} from 'lucide-react';

interface SuccessScreenProps {
  systemBadge?: string;
  categoryPill?: string;
  title?: string;
  recipientName?: string;
  invoiceId?: string;
  amount?: string;
  onNextStep?: (step: string) => void;
  onResetDemo?: () => void;
}

export function PremiumSuccessDoneScreen({
  systemBadge = 'SUCCESS IS A SYSTEM · 01',
  categoryPill = 'Invoices / Alquileres',
  title = 'Factura de Alquiler Enviada',
  recipientName = 'Constructora San Martín & Co.',
  invoiceId = 'FAC-2026-0089',
  amount = '$2,450.00 USD',
  onNextStep,
  onResetDemo,
}: SuccessScreenProps) {
  const [selectedAction, setSelectedAction] = useState<string>('view_contract');
  const [copied, setCopied] = useState(false);

  const handleNextStepClick = () => {
    if (onNextStep) {
      onNextStep(selectedAction);
    } else {
      alert(`Ejecutando siguiente acción recomendada: ${selectedAction}`);
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(invoiceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative w-full rounded-2xl py-12 px-4 sm:px-8 flex flex-col items-center justify-center font-sans overflow-hidden border border-[#1e262b] shadow-2xl"
      style={{
        backgroundColor: '#080c0e',
        backgroundImage: 'radial-gradient(rgba(0, 230, 153, 0.07) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Insignia Superior de Sistema */}
      <div className="mb-6 px-3.5 py-1 rounded-full bg-[#00e699]/10 border border-[#00e699]/30 text-[#00e699] text-xs font-mono font-semibold tracking-wider flex items-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>{systemBadge}</span>
      </div>

      {/* Tarjeta Central Elevada */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#12181b] border border-[#1e262b] rounded-2xl p-6 sm:p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {/* Píldora de Categoría */}
        <div className="flex justify-center mb-6">
          <span className="px-3 py-1 rounded-full bg-[#1b2327] text-slate-300 text-xs font-medium border border-slate-700/60 flex items-center gap-1.5">
            <Receipt className="w-3 h-3 text-[#00e699]" />
            {categoryPill}
          </span>
        </div>

        {/* Ícono de Estado con Resplandor Neón */}
        <div
          className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-[#00e699] border-2 border-[#00e699] transition-transform hover:scale-105 duration-200"
          style={{
            backgroundColor: 'rgba(0, 230, 153, 0.12)',
            boxShadow: '0 0 24px rgba(0, 230, 153, 0.28)',
          }}
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </div>

        {/* Título de Confirmación */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          La transacción ha sido registrada y firmada en el libro contable de Alquileres System.
        </p>

        {/* Caja de Metadatos de la Transacción */}
        <div className="bg-[#0b0f12] border border-[#1e262b] rounded-xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-[#00e699]" />
              <span>Destinatario:</span>
            </div>
            <strong className="text-slate-200 font-semibold">{recipientName}</strong>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Comprobante:</span>
            </div>
            <button
              type="button"
              onClick={handleCopyHash}
              className="font-mono text-cyan-300 hover:underline text-[11px]"
              title="Copiar ID"
            >
              {copied ? '¡Copiado!' : invoiceId}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e262b]">
            <span className="text-slate-400">Total liquidado:</span>
            <span className="font-mono font-bold text-[#00e699] text-sm">{amount}</span>
          </div>
        </div>

        {/* Acciones de Siguiente Paso (Anti Dead-End UX) */}
        <div className="space-y-3">
          <div className="text-left">
            <label className="text-[11px] font-mono text-slate-400 block mb-1.5 uppercase tracking-wider">
              Acción inmediata recomendada (Next Step)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedAction('view_contract')}
                className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  selectedAction === 'view_contract'
                    ? 'bg-[#00e699]/10 border-[#00e699] text-[#00e699] font-medium'
                    : 'bg-[#161d21] border-[#1e262b] text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarCheck2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Ver Contrato</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAction('send_whatsapp')}
                className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  selectedAction === 'send_whatsapp'
                    ? 'bg-[#00e699]/10 border-[#00e699] text-[#00e699] font-medium'
                    : 'bg-[#161d21] border-[#1e262b] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">WhatsApp Link</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextStepClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00e699] to-[#00b377] hover:from-[#00f7a5] hover:to-[#00cc88] text-[#080c0e] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,230,153,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Continuar al siguiente paso</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Principio UX al Pie */}
      <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00e699]/15 border border-[#00e699]/30 text-[#00e699] font-mono text-xs shadow-sm">
        <span>done &ne; dead end</span>
      </div>
    </div>
  );
}
