"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Receipt, 
  Building2, 
  Calendar, 
  CreditCard, 
  User, 
  ArrowRightLeft
} from 'lucide-react';
import { useEmpresaStore } from '../../../infrastructure/state/empresaStore';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';

export interface ReciboData {
  pagoId: string | number;
  consecutivoRecibo: string;
  consecutivoAlquiler: string | number;
  clienteNombre: string;
  clienteDocumento?: string;
  clienteTelefono?: string;
  monto: number;
  metodoPago: string;
  saldoAnterior: number;
  nuevoSaldoPendiente: number;
  efectivoRecibido?: number;
  cambioEntregado?: number;
  fecha: string;
  registradoPor?: string;
  transactionId?: string | null;
}

export interface ReciboPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  recibo: ReciboData | null;
}

export function ReciboPagoModal({
  isOpen,
  onClose,
  recibo
}: ReciboPagoModalProps) {
  const { config } = useEmpresaStore();
  const { formatearMoneda } = useCurrencyFormatter();
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !recibo) return null;

  const handlePrint = () => {
    window.print();
  };

  const fechaFormateada = new Date(recibo.fecha).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Contenedor del Modal (En impresión toma el control) */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none print:w-full">
        
        {/* Barra superior de herramientas (Oculta al imprimir) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recibo de Caja Oficial</h3>
              <p className="text-[11px] text-slate-400">Comprobante de recaudo y partida doble asentada</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-salmon hover:bg-brand-salmonDark text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Recibo
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO DEL RECIBO (Imprimible) */}
        <div ref={printableRef} className="p-6 sm:p-8 space-y-6 text-slate-800 font-sans print:p-4">
          
          {/* Cabecera del Documento: Logo y Datos Empresa */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              {config.logoBase64 ? (
                <div className="h-10 w-32 relative mb-2">
                  <Image
                    src={config.logoBase64}
                    alt="Logo Empresa"
                    width={128}
                    height={40}
                    unoptimized
                    className="object-contain h-full w-full"
                  />
                </div>
              ) : (
                <div className="text-xl font-black tracking-tight text-slate-900">
                  {config.razonSocial || 'FerreOn ERP'}
                </div>
              )}
              <div className="text-xs text-slate-500">
                {config.nit && <span>NIT: {config.nit} • </span>}
                <span>{config.direccion || 'Sede Principal'}</span>
              </div>
              <div className="text-xs text-slate-500">
                {config.telefono && <span>Tel: {config.telefono} • </span>}
                {config.ciudad && <span>{config.ciudad}</span>}
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold tracking-wider">
                {recibo.consecutivoRecibo}
              </span>
              <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {fechaFormateada}
              </div>
              <div className="text-[10px] text-slate-500">
                Contrato: <strong className="text-slate-800">ALQ-{recibo.consecutivoAlquiler}</strong>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
            <div className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Recibido de:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
              <div>
                <span className="text-slate-500">Nombre / Razón Social: </span>
                <strong className="font-semibold">{recibo.clienteNombre}</strong>
              </div>
              {recibo.clienteDocumento && (
                <div>
                  <span className="text-slate-500">Documento / NIT: </span>
                  <span className="font-medium">{recibo.clienteDocumento}</span>
                </div>
              )}
              {recibo.clienteTelefono && (
                <div>
                  <span className="text-slate-500">Teléfono: </span>
                  <span>{recibo.clienteTelefono}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Medio de Pago: </span>
                <span className="font-semibold text-emerald-700">{recibo.metodoPago}</span>
              </div>
            </div>
          </div>

          {/* Liquidación de Saldos y Valores */}
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Concepto</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 text-slate-600">Saldo Anterior del Contrato</td>
                    <td className="p-3 text-right font-medium text-slate-700">
                      {formatearMoneda(recibo.saldoAnterior)}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-3 font-bold text-emerald-900 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      Monto Recibido / Abonado
                    </td>
                    <td className="p-3 text-right font-black text-sm text-emerald-700">
                      {formatearMoneda(recibo.monto)}
                    </td>
                  </tr>
                  {recibo.efectivoRecibido !== undefined && recibo.cambioEntregado !== undefined && recibo.cambioEntregado > 0 && (
                    <tr className="text-slate-500 text-[11px]">
                      <td className="p-2.5 pl-3">
                        Efectivo recibido: {formatearMoneda(recibo.efectivoRecibido)}
                      </td>
                      <td className="p-2.5 pr-3 text-right text-emerald-600 font-medium">
                        Cambio entregado: {formatearMoneda(recibo.cambioEntregado)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-semibold">
                    <td className="p-3 text-slate-700">Nuevo Saldo Pendiente</td>
                    <td className="p-3 text-right font-bold text-amber-600">
                      {formatearMoneda(recibo.nuevoSaldoPendiente)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trazabilidad de Asiento Ledger */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
              Asiento Ledger: Débito Caja/Bancos ↔ Crédito Cartera
            </span>
            <span>Ref: {recibo.transactionId ? recibo.transactionId.slice(0, 12) : 'LEDGER-AUTOPAIR'}</span>
          </div>

          {/* Zona de Firmas (Esencial en Recibos Físicos) */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-300 pt-2 font-semibold text-slate-800">
                {recibo.registradoPor || 'Cajero / Responsable'}
              </div>
              <div className="text-[10px] text-slate-400">Entregado / Caja Principal</div>
            </div>
            <div>
              <div className="border-t border-slate-300 pt-2 font-semibold text-slate-800">
                {recibo.clienteNombre}
              </div>
              <div className="text-[10px] text-slate-400">Firma de Recibido / Cliente</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
            Este documento constituye soporte oficial de recaudo para FerreOn ERP y su contabilidad de partida doble.
          </div>
        </div>

        {/* Pie de Modal en Pantalla (Oculto al imprimir) */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Aceptar y Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-salmon hover:bg-brand-salmonDark rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Recibo de Caja
          </button>
        </div>

      </div>
    </div>
  );
}
