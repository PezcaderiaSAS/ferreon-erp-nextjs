"use client";

import React from 'react';
import { 
  Printer, 
  X, 
  Building2, 
  FileText, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Package, 
  Clock 
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CompraUI } from '../../actions/compras';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';

interface ComprobanteEntradaPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  compra: CompraUI | null;
}

export function ComprobanteEntradaPDFModal({
  isOpen,
  onClose,
  compra
}: ComprobanteEntradaPDFModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();

  if (!compra) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comprobante de Entrada: ${compra.numero_orden}`} maxWidth="4xl">
      <div className="p-6 space-y-6">
        {/* Barra de Acciones Superior (Oculta al imprimir) */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Documento oficial de ingreso a inventario y soporte de pago</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Hoja de Impresión Estándar (Carta / A4) */}
        <div id="comprobante-compra-print" className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0">
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
                Orden de Compra / Entrada de Almacén
              </span>
              <h3 className="text-2xl font-black font-mono text-slate-900 mt-2">
                {compra.numero_orden}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Fecha de Emisión: <span className="font-semibold text-slate-700">{compra.fecha_compra}</span>
              </p>
              <p className="text-xs text-slate-500">
                Estado: <span className="font-semibold text-emerald-700">{compra.estado}</span>
              </p>
            </div>
          </div>

          {/* Datos del Proveedor y Términos Comerciales */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50/70 p-4.5 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Información del Proveedor
              </span>
              <p className="text-sm font-bold text-slate-900">{compra.proveedor_nombre}</p>
              {compra.proveedor_nit && (
                <p className="text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-500">NIT / Doc:</span> {compra.proveedor_nit}
                </p>
              )}
              {compra.proveedor_telefono && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-500">Teléfono:</span> {compra.proveedor_telefono}
                </p>
              )}
              {compra.proveedor_email && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-500">Email:</span> {compra.proveedor_email}
                </p>
              )}
            </div>

            <div className="border-l border-slate-200/80 pl-6">
              <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Condiciones de Pago & Asiento
              </span>
              <p className="text-slate-700">
                <span className="font-semibold">Método de Pago:</span>{' '}
                <span className="inline-block font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200">
                  {compra.metodo_pago}
                </span>
              </p>
              {compra.transaction_id && (
                <p className="text-slate-500 mt-1 font-mono text-2xs truncate">
                  <span className="font-semibold text-slate-600">Ref. Contable Ledger:</span> {compra.transaction_id}
                </p>
              )}
              {compra.observaciones && (
                <p className="text-slate-600 mt-1 italic">
                  <span className="font-semibold not-italic text-slate-500">Notas:</span> {compra.observaciones}
                </p>
              )}
            </div>
          </div>

          {/* Tabla de Equipos / Ítems Ingresados */}
          <div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2">Descripción del Equipo / Maquinaria</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                  <th className="py-2.5 px-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(compra.detalles && compra.detalles.length > 0) ? (
                  compra.detalles.map((d, index) => (
                    <tr key={d.id || index}>
                      <td className="py-2.5 px-2 text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-800">
                        {d.equipo_nombre || `Equipo ID #${d.equipo_id}`}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{d.cantidad}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {formatearMoneda(d.precio_unitario)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-800">
                        {formatearMoneda(d.subtotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                      Equipos ingresados a inventario general
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Liquidación Financiera y Tributaria */}
          <div className="flex justify-end pt-2">
            <div className="w-80 space-y-2 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Compra:</span>
                <span className="font-mono font-semibold">{formatearMoneda(compra.subtotal)}</span>
              </div>

              {compra.aplica_iva && (
                <div className="flex justify-between text-slate-700">
                  <span>(+) IVA Descontable (19%):</span>
                  <span className="font-mono font-semibold">{formatearMoneda(compra.valor_iva || 0)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-1">
                <span>(=) Total Factura Proveedor:</span>
                <span className="font-mono">{formatearMoneda(compra.total)}</span>
              </div>

              {compra.aplica_retefuente && (
                <div className="flex justify-between text-rose-600">
                  <span>(-) ReteFuente ({compra.porcentaje_retefuente || 2.5}%):</span>
                  <span className="font-mono">-{formatearMoneda(compra.valor_retefuente || 0)}</span>
                </div>
              )}

              {compra.aplica_reteica && (
                <div className="flex justify-between text-rose-600">
                  <span>(-) ReteICA ({compra.porcentaje_reteica || 9.66}‰):</span>
                  <span className="font-mono">-{formatearMoneda(compra.valor_reteica || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/80 mt-2">
                <span>Neto a Desembolsar:</span>
                <span className="font-mono text-base">{formatearMoneda(compra.neto_pagar || compra.total)}</span>
              </div>
            </div>
          </div>

          {/* Casillas de Firmas y Validación */}
          <div className="grid grid-cols-3 gap-6 pt-12 text-xs text-center border-t border-slate-200">
            <div>
              <div className="border-b border-slate-300 h-10 mb-2"></div>
              <p className="font-semibold text-slate-700">Entregado por (Proveedor)</p>
              <p className="text-2xs text-slate-400">Nombre, Cédula y Firma</p>
            </div>
            <div>
              <div className="border-b border-slate-300 h-10 mb-2"></div>
              <p className="font-semibold text-slate-700">Recibido en Bodega</p>
              <p className="text-2xs text-slate-400">Jefe de Almacén / Operador</p>
            </div>
            <div>
              <div className="border-b border-slate-300 h-10 mb-2"></div>
              <p className="font-semibold text-slate-700">Aprobación Contable</p>
              <p className="text-2xs text-slate-400">Auditoría / Tesorería FerreOn</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
