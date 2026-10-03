'use client';

import React, { useState } from 'react';
import { ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: string;
}

const DEFAULT_ACCORDION_ITEMS: AccordionItemData[] = [
  {
    id: '1',
    icon: <ShieldCheck className="w-4 h-4 text-[#6366f1]" />,
    title: 'Garantías y Depósitos en Alquiler',
    content:
      'Los depósitos de garantía se custodian en ledger segregado y son compensados o devueltos automáticamente al formalizar el acta de devolución sin averías.',
  },
  {
    id: '2',
    icon: <Truck className="w-4 h-4 text-[#6366f1]" />,
    title: 'Tiempos de Despacho y Fletes',
    content:
      'Los despachos en obra se coordinan en tramos matutinos con chequeo preoperativo firmado digitalmente en el visor de actas oficial.',
  },
  {
    id: '3',
    icon: <RefreshCw className="w-4 h-4 text-[#6366f1]" />,
    title: 'Devolución Parcial (Split-Line)',
    content:
      'Permite desincorporar maquinaria anticipadamente recalculando la tarifa diaria pactada sin penalidad sobre los días efectivamente utilizados.',
  },
];

export function PremiumAccordion({
  items = DEFAULT_ACCORDION_ITEMS,
}: {
  items?: AccordionItemData[];
}) {
  const [openIds, setOpenIds] = useState<string[]>(['1']);

  const toggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="w-full max-w-xl flex flex-col space-y-3">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div
            key={item.id}
            className="bg-white rounded-[16px] border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.07)] transition-all overflow-hidden"
          >
            {/* Header Trigger */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full p-4 sm:p-4.5 px-5 flex items-center justify-between text-left cursor-pointer transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-[10px] bg-[#6366f1]/10 flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                <span className="text-sm font-bold text-slate-800 tracking-tight">
                  {item.title}
                </span>
              </div>

              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isOpen
                    ? 'bg-[#6366f1] text-white rotate-0'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {isOpen ? '−' : '+'}
              </span>
            </button>

            {/* Collapsible Body */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-5 pt-0 pl-[68px] text-xs text-slate-600 leading-relaxed border-t border-slate-50">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
