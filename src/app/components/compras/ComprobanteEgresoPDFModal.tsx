"use client";

import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  FileText, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Receipt,
  FileCheck2
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { AbonoProveedorUI, CuentaPagarUI } from '../../actions/cuentas-por-pagar';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';

interface ComprobanteEgresoPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  abono: AbonoProveedorUI | null;
  cuentaPagar: CuentaPagarUI | null;
}

export function ComprobanteEgresoPDFModal({
  isOpen,
  onClose,
  abono,
  cuentaPagar
}: ComprobanteEgresoPDFModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();
  const [formatoImpresion, setFormatoImpresion] = useState<'CARTA' | 'POS'>('CARTA');

  if (!abono || !cuentaPagar) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprobante de Egreso: ${abono.numero_comprobante}`}
      maxWidth={formatoImpresion === 'CARTA' ? '4xl' : 'lg'}
    >
      <div className="p-6 space-y-6">
        {/* Barra de Acciones Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Documento Oficial de Tesorería — Soporte de Egreso a Proveedor</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de formato Carta vs Térmico POS */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormatoImpresion('CARTA')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  formatoImpresion === 'CARTA'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Carta / A4
              </button>
              <button
                type="button"
                onClick={() => setFormatoImpresion('POS')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  formatoImpresion === 'POS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Térmica 80mm
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: FORMATO CARTA / A4                                              */}
        {/* ========================================================================= */}
        {formatoImpresion === 'CARTA' && (
          <div id="comprobante-egreso-carta" className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0">
            {/* Header Corporativo */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    F
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">FERREON S.A.S.</h2>
                    <p className="text-xs text-slate-500 font-mono">NIT: 901.884.215-9 | Régimen Común</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Especialistas en Alquiler y Venta de Maquinaria para Construcción<br />
                  PBX: (601) 745-9000 | Calle 80 # 68-45, Bogotá D.C.
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg uppercase tracking-wider">
                  Comprobante de Egreso (CXP)
                </span>
                <h3 className="text-2xl font-black font-mono text-slate-900 mt-2">
                  {abono.numero_comprobante}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Fecha del Egreso: <span className="font-semibold text-slate-700">{abono.fecha_abono}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Orden de Referencia: <span className="font-semibold text-slate-700 font-mono">{cuentaPagar.numero_orden}</span>
                </p>
              </div>
            </div>

            {/* Ficha Beneficiario y Tesorería */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Beneficiario del Pago
                </h4>
                <p className="text-sm font-bold text-slate-900">
                  {cuentaPagar.proveedor_nombre || 'Proveedor'}
                </p>
                <p className="text-slate-600 font-mono mt-0.5">
                  NIT: {cuentaPagar.proveedor_nit || 'No Registrado'}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> Forma de Desembolso
                </h4>
                <p className="text-sm font-bold text-slate-900">
                  {abono.metodo_pago === 'TRANSFERENCIA' ? 'Transferencia Electrónica / PSE' : abono.metodo_pago === 'EFECTIVO' ? 'Efectivo / Caja Menor' : 'Cheque de Gerencia'}
                </p>
                {abono.referencia_bancaria && (
                  <p className="text-slate-600 font-mono mt-0.5">
                    Soporte / Ref: {abono.referencia_bancaria}
                  </p>
                )}
              </div>
            </div>

            {/* Concepto del Pago */}
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Concepto Contable:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 italic">
                {abono.observaciones || `Abono a Cuenta por Pagar correspondiente a la Orden de Compra ${cuentaPagar.numero_orden} expedida a ${cuentaPagar.proveedor_nombre}.`}
              </p>
            </div>

            {/* Cuadro de Liquidación de Saldos */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-semibold text-slate-700 flex justify-between">
                <span>Detalle del Movimiento de Pasivo</span>
                <span>Valores en COP</span>
              </div>
              <div className="p-4 space-y-2 bg-white">
                <div className="flex justify-between text-slate-600">
                  <span>Monto Total de la Compra / Factura:</span>
                  <span className="font-mono">{formatearMoneda(cuentaPagar.monto_total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Saldo Previo a este Comprobante:</span>
                  <span className="font-mono">{formatearMoneda(cuentaPagar.saldo_pendiente + abono.monto_abono)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>VALOR DESEMBOLSADO (EGRESO):</span>
                  <span className="font-mono text-base font-black">{formatearMoneda(abono.monto_abono)}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-semibold pt-1">
                  <span>Nuevo Saldo Pendiente por Pagar:</span>
                  <span className="font-mono">{formatearMoneda(cuentaPagar.saldo_pendiente)}</span>
                </div>
              </div>
            </div>

            {/* Firmas de Auditoría Contable */}
            <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">Elaborado Por</p>
                <p className="text-[10px] text-slate-400">Tesorería / Compras</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">Aprobado Por</p>
                <p className="text-[10px] text-slate-400">Gerencia / Contabilidad</p>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <p className="font-bold text-slate-800">Recibido Conforme</p>
                <p className="text-[10px] text-slate-400">Firma y Sello Proveedor</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: FORMATO TIRILLA POS 80MM                                         */}
        {/* ========================================================================= */}
        {formatoImpresion === 'POS' && (
          <div id="comprobante-egreso-pos" className="bg-white p-6 border border-slate-200 rounded-xl max-w-xs mx-auto text-slate-900 font-mono text-[11px] space-y-3 shadow-sm print:border-none print:shadow-none print:p-0">
            <div className="text-center border-b border-dashed border-slate-400 pb-3">
              <h3 className="font-black text-sm">FERREON S.A.S.</h3>
              <p className="text-[10px]">NIT: 901.884.215-9</p>
              <p className="text-[10px]">PBX: (601) 745-9000</p>
              <p className="text-[10px]">Calle 80 # 68-45 Bogotá</p>
              <div className="mt-2 font-bold text-xs bg-slate-100 py-1">
                COMPROBANTE DE EGRESO
              </div>
              <p className="font-bold mt-1">{abono.numero_comprobante}</p>
            </div>

            <div className="space-y-1 text-[10px] border-b border-dashed border-slate-400 pb-2">
              <p><strong>Fecha:</strong> {abono.fecha_abono}</p>
              <p><strong>Orden Compra:</strong> {cuentaPagar.numero_orden}</p>
              <p><strong>Proveedor:</strong> {cuentaPagar.proveedor_nombre}</p>
              <p><strong>NIT:</strong> {cuentaPagar.proveedor_nit || 'N/A'}</p>
              <p><strong>Método:</strong> {abono.metodo_pago}</p>
              {abono.referencia_bancaria && (
                <p><strong>Ref Bancaria:</strong> {abono.referencia_bancaria}</p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL ABONO:</span>
                <span>{formatearMoneda(abono.monto_abono)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>Saldo Restante:</span>
                <span>{formatearMoneda(cuentaPagar.saldo_pendiente)}</span>
              </div>
            </div>

            <div className="pt-6 text-center text-[10px] border-t border-dashed border-slate-400">
              <div className="w-3/4 mx-auto border-b border-slate-400 mb-1"></div>
              <p>Firma Recibido / Proveedor</p>
              <p className="text-[9px] text-slate-400 mt-2">Copia Impresa Software FerreOn</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
