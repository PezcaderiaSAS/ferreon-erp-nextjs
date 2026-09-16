"use client";

import React from 'react';
import { Shield, ArrowDownRight, ArrowUpRight, DollarSign, Wallet, AlertCircle } from 'lucide-react';
import { LiquidacionDevolucionResultado } from '@/core/services/liquidacion-devolucion.service';

interface LiquidacionGarantiaCardProps {
  liquidacion: LiquidacionDevolucionResultado;
  metodoPago: string;
  setMetodoPago: (metodo: string) => void;
  sesionCajaActiva: any | null;
}

export const LiquidacionGarantiaCard: React.FC<LiquidacionGarantiaCardProps> = ({
  liquidacion,
  metodoPago,
  setMetodoPago,
  sesionCajaActiva,
}) => {
  const { totalAlquilerLiquidado, totalDanos, totalReposiciones, depositoAplicado, saldoNeto, tipoResolucion } = liquidacion;
  const esReembolso = tipoResolucion === 'REEMBOLSO_CLIENTE';
  const esCobro = tipoResolucion === 'COBRO_CLIENTE';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-100">Liquidación de Garantías & Caja</h4>
            <p className="text-xs text-slate-400">Compensación automática de depósito y cargos</p>
          </div>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          esReembolso 
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : esCobro
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-slate-800 text-slate-400'
        }`}>
          {esReembolso ? 'Reembolso al Cliente' : esCobro ? 'Cobro al Cliente' : 'Cuentas Saldadas'}
        </span>
      </div>

      {/* Grilla de desglose numérico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 font-medium block">Depósito Inicial</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">
            ${depositoAplicado.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 font-medium block">Alquiler Causado</span>
          <span className="text-sm sm:text-base font-bold text-slate-200">
            -${totalAlquilerLiquidado.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 font-medium block">Cargos por Daño</span>
          <span className="text-sm sm:text-base font-bold text-amber-400">
            -${totalDanos.toLocaleString('es-CO')}
          </span>
        </div>

        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
          <span className="text-[11px] text-slate-400 font-medium block">Reposiciones</span>
          <span className="text-sm sm:text-base font-bold text-rose-400">
            -${totalReposiciones.toLocaleString('es-CO')}
          </span>
        </div>
      </div>

      {/* Resultado Neto Destacado */}
      <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border ${
        esReembolso
          ? 'bg-emerald-950/40 border-emerald-500/30'
          : esCobro
          ? 'bg-rose-950/40 border-rose-500/30'
          : 'bg-slate-800 border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            esReembolso ? 'bg-emerald-500 text-slate-950' : esCobro ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {esReembolso ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs text-slate-300 block font-medium">
              {esReembolso ? 'Saldo neto a devolver al cliente:' : esCobro ? 'Excedente a pagar por el cliente:' : 'Saldo final:'}
            </span>
            <span className="text-xl sm:text-2xl font-black tracking-tight">
              ${Math.abs(saldoNeto).toLocaleString('es-CO')} COP
            </span>
          </div>
        </div>

        {/* Métodos de Pago y Caja */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMetodoPago('EFECTIVO')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-semibold transition-all ${
                metodoPago === 'EFECTIVO' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Efectivo (Caja)
            </button>
            <button
              type="button"
              onClick={() => setMetodoPago('TRANSFERENCIA')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-semibold transition-all ${
                metodoPago === 'TRANSFERENCIA' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transferencia
            </button>
          </div>
        </div>
      </div>

      {/* Alerta si seleccionó efectivo y no hay caja abierta */}
      {metodoPago === 'EFECTIVO' && saldoNeto !== 0 && (
        <div className={`text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 border ${
          sesionCajaActiva
            ? 'bg-emerald-900/20 text-emerald-300 border-emerald-800/40'
            : 'bg-amber-900/20 text-amber-300 border-amber-800/40'
        }`}>
          {sesionCajaActiva ? (
            <>
              <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Caja activa detectada. Se registrará un movimiento automático de <strong>{esReembolso ? 'EGRESO' : 'INGRESO'}</strong> en el turno actual.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>No hay un turno de caja abierto actualmente. Puedes abrir caja previamente o seleccionar <em>Transferencia</em>.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
