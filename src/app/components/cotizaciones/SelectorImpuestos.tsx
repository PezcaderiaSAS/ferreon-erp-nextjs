'use client';

import React from 'react';
import { Percent, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

export interface ImpuestosConfig {
  aplicaIva: boolean;
  tasaIva: number;
  aplicaRetefuente: boolean;
  tasaRetefuente: number;
  aplicaReteica: boolean;
  tasaReteica: number;
}

export interface SelectorImpuestosProps {
  subtotal: number;
  config: ImpuestosConfig;
  onChange: (newConfig: ImpuestosConfig) => void;
  readOnly?: boolean;
  className?: string;
}

export function SelectorImpuestos({
  subtotal,
  config,
  onChange,
  readOnly = false,
  className = '',
}: SelectorImpuestosProps) {
  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(valor));
  };

  const valorIva = config.aplicaIva ? Math.round(subtotal * (config.tasaIva / 100)) : 0;
  const valorRetefuente = config.aplicaRetefuente ? Math.round(subtotal * (config.tasaRetefuente / 100)) : 0;
  const valorReteica = config.aplicaReteica ? Math.round(subtotal * (config.tasaReteica / 100)) : 0;
  const balanceImpuestos = valorIva - valorRetefuente - valorReteica;

  const handleToggleIva = () => {
    if (readOnly) return;
    onChange({
      ...config,
      aplicaIva: !config.aplicaIva,
    });
  };

  const handleToggleRetefuente = () => {
    if (readOnly) return;
    onChange({
      ...config,
      aplicaRetefuente: !config.aplicaRetefuente,
    });
  };

  const handleChangeTasaRetefuente = (tasa: number) => {
    if (readOnly) return;
    onChange({
      ...config,
      tasaRetefuente: tasa,
    });
  };

  const handleToggleReteica = () => {
    if (readOnly) return;
    onChange({
      ...config,
      aplicaReteica: !config.aplicaReteica,
    });
  };

  const handleChangeTasaReteica = (tasa: number) => {
    if (readOnly) return;
    onChange({
      ...config,
      tasaReteica: tasa,
    });
  };

  return (
    <div className={`bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100/70 text-blue-700 rounded-lg">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Parámetros Tributarios de Ley</h4>
            <p className="text-xs text-slate-500">Selecciona los impuestos y retenciones aplicables a esta operación</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md">
          Estatuto Tributario Col.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* CASILLA 1: IVA 19% */}
        <div
          className={`relative p-3.5 rounded-xl border transition-all ${
            config.aplicaIva
              ? 'bg-blue-50/60 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.aplicaIva}
              onChange={handleToggleIva}
              disabled={readOnly}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">IVA (19.0%)</span>
                {config.aplicaIva && (
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    +{formatearCOP(valorIva)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Impuesto sobre las ventas en alquiler de maquinaria.</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className="font-mono bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded">Cta 2408</span>
                <span>Pasivo por pagar</span>
              </div>
            </div>
          </label>
        </div>

        {/* CASILLA 2: RETEFUENTE (2.5% o 3.5%) */}
        <div
          className={`relative p-3.5 rounded-xl border transition-all ${
            config.aplicaRetefuente
              ? 'bg-amber-50/60 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.aplicaRetefuente}
              onChange={handleToggleRetefuente}
              disabled={readOnly}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 transition-colors"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">ReteFuente</span>
                {config.aplicaRetefuente && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    -{formatearCOP(valorRetefuente)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Retención practicada por empresas y agentes retenedores.</p>

              {config.aplicaRetefuente && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-600">Tarifa:</span>
                  <div className="inline-flex rounded-lg border border-amber-200 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChangeTasaRetefuente(2.5)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                        config.tasaRetefuente === 2.5
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2.5% (Declarante)
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChangeTasaRetefuente(3.5)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                        config.tasaRetefuente === 3.5
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3.5%
                    </button>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>

        {/* CASILLA 3: RETEICA (0.966% / 0.414% / 1.104%) */}
        <div
          className={`relative p-3.5 rounded-xl border transition-all ${
            config.aplicaReteica
              ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.aplicaReteica}
              onChange={handleToggleReteica}
              disabled={readOnly}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">ReteICA</span>
                {config.aplicaReteica && (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    -{formatearCOP(valorReteica)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Retención municipal sobre Industria y Comercio.</p>

              {config.aplicaReteica && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-600">Tarifa:</span>
                  <div className="inline-flex rounded-lg border border-emerald-200 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChangeTasaReteica(0.966)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                        config.tasaReteica === 0.966
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      9.66 x 1000
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleChangeTasaReteica(0.414)}
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                        config.tasaReteica === 0.414
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      4.14 x 1000
                    </button>
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Resumen Inmediato de Variación de Impuestos */}
      <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 bg-white/70 px-3 py-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <span>Subtotal Base: <strong className="font-mono text-slate-900">{formatearCOP(subtotal)}</strong></span>
          <span>Efecto Fiscal Neto: <strong className={`font-mono ${balanceImpuestos >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{balanceImpuestos >= 0 ? `+${formatearCOP(balanceImpuestos)}` : formatearCOP(balanceImpuestos)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cálculo matemático en tiempo real (0 ms)</span>
        </div>
      </div>
    </div>
  );
}
