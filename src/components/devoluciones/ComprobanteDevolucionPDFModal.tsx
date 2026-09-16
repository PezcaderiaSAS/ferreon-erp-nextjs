"use client";

import React, { useRef } from 'react';
import { Printer, X, ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface DetalleItemImpresion {
  nombreEquipo: string;
  codigo?: string;
  cantidadDevuelta: number;
  diasEfectivos: number;
  tarifaDiaria: number;
  subtotalAlquiler: number;
  estadoInspeccion: 'BUENO' | 'MANTENIMIENTO' | 'PERDIDA_TOTAL';
  costoReparacion: number;
  valorReposicion: number;
  descripcionDano?: string;
}

interface ComprobanteDevolucionData {
  consecutivo: string;
  fechaDevolucion: string;
  contratoConsecutivo: string | number;
  clienteNombre: string;
  clienteNit: string;
  clienteTelefono?: string;
  recibidoPor: string;
  depositoAplicado: number;
  totalAlquilerLiquidado: number;
  totalDanos: number;
  totalReposiciones: number;
  saldoNeto: number;
  tipoResolucion: string;
  metodoPago: string;
  observaciones?: string;
  items: DetalleItemImpresion[];
}

interface ComprobanteDevolucionPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ComprobanteDevolucionData | null;
}

export const ComprobanteDevolucionPDFModal: React.FC<ComprobanteDevolucionPDFModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const esReembolso = data.saldoNeto > 0;
  const esCobro = data.saldoNeto < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      {/* Estilos especiales para impresión limpia en papel Carta/A4 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-acta-devolucion, #print-acta-devolucion * {
            visibility: visible;
          }
          #print-acta-devolucion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Barra Superior con Acciones (No Imprimible) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Acta Oficial de Devolución & Inspección
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Documento</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor Imprimible */}
        <div id="print-acta-devolucion" ref={printRef} className="p-8 overflow-y-auto space-y-6 text-slate-900">
          {/* Cabecera del Documento */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">FERREON S.A.S.</h1>
              <p className="text-xs text-slate-500 font-medium">NIT: 901.458.789-3 | Régimen Responsable de IVA</p>
              <p className="text-xs text-slate-500">PBX: (601) 745-8900 | Bogotá D.C. - Colombia</p>
              <p className="text-xs text-slate-500">Servicio de Alquiler de Maquinaria y Equipos de Construcción</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-black bg-slate-900 text-white tracking-widest uppercase">
                ACTA DE RECEPCIÓN
              </span>
              <p className="text-lg font-black text-slate-900 mt-1">{data.consecutivo}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Fecha: {new Date(data.fechaDevolucion).toLocaleString('es-CO')}
              </p>
              <p className="text-xs font-bold text-slate-700">Contrato Ref: #{data.contratoConsecutivo}</p>
            </div>
          </div>

          {/* Información del Cliente y Recepción */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Cliente / Contratista</span>
              <p className="font-bold text-sm text-slate-900">{data.clienteNombre}</p>
              <p className="text-slate-600">NIT/CC: {data.clienteNit}</p>
              {data.clienteTelefono && <p className="text-slate-600">Teléfono: {data.clienteTelefono}</p>}
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Detalles de Operación</span>
              <p className="text-slate-700"><strong>Recibido por:</strong> {data.recibidoPor}</p>
              <p className="text-slate-700"><strong>Método Liquidación:</strong> {data.metodoPago}</p>
              <p className="text-slate-700"><strong>Estado:</strong> Certificado e Inspeccionado</p>
            </div>
          </div>

          {/* Tabla de Equipos e Inspección Técnica */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Detalle de Equipos Recibidos e Inspección Física
            </h3>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-3 font-bold">Equipo / Maquinaria</th>
                  <th className="py-2.5 px-2 font-bold text-center">Cant.</th>
                  <th className="py-2.5 px-2 font-bold text-center">Días</th>
                  <th className="py-2.5 px-3 font-bold text-center">Estado Físico</th>
                  <th className="py-2.5 px-3 font-bold text-right">Alquiler</th>
                  <th className="py-2.5 px-3 font-bold text-right">Cargos Daño</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map((item, idx) => {
                  const esBueno = item.estadoInspeccion === 'BUENO';
                  const esMant = item.estadoInspeccion === 'MANTENIMIENTO';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900 block">{item.nombreEquipo}</span>
                        {item.descripcionDano && (
                          <span className="text-[10px] text-amber-700 font-medium block">
                            Nota: {item.descripcionDano}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center font-bold">{item.cantidadDevuelta}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{item.diasEfectivos}d</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          esBueno ? 'bg-emerald-100 text-emerald-800' : esMant ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {esBueno ? 'Bueno (Apto)' : esMant ? 'Mantenimiento' : 'Pérdida Total'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">${item.subtotalAlquiler.toLocaleString('es-CO')}</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-700">
                        ${(item.costoReparacion + item.valorReposicion).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Liquidación Económica del Depósito */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-1.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Depósito en Garantía:</span>
                <span className="font-bold text-emerald-700">+${data.depositoAplicado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Alquiler Causado:</span>
                <span className="font-medium text-slate-800">-${data.totalAlquilerLiquidado.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cargos por Reparación:</span>
                <span className="font-medium text-amber-700">-${data.totalDanos.toLocaleString('es-CO')}</span>
              </div>
              {data.totalReposiciones > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Valores de Reposición:</span>
                  <span className="font-medium text-rose-700">-${data.totalReposiciones.toLocaleString('es-CO')}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-center text-sm font-black">
                <span>{esReembolso ? 'Reembolso al Cliente:' : esCobro ? 'Saldo por Cobrar:' : 'Saldo Final:'}</span>
                <span className={esReembolso ? 'text-emerald-700' : esCobro ? 'text-rose-700' : 'text-slate-900'}>
                  ${Math.abs(data.saldoNeto).toLocaleString('es-CO')} COP
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {data.observaciones && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Observaciones Generales:</strong> {data.observaciones}
            </div>
          )}

          {/* Sección de Firmas de Conformidad */}
          <div className="grid grid-cols-2 gap-10 pt-10 border-t border-slate-200 text-xs">
            <div className="text-center space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto h-12" />
              <p className="font-bold text-slate-900">Entregado Conforme (Cliente)</p>
              <p className="text-[11px] text-slate-500">C.C. / NIT: ____________________</p>
            </div>
            <div className="text-center space-y-1">
              <div className="border-b border-slate-400 w-3/4 mx-auto h-12" />
              <p className="font-bold text-slate-900">Recibido a Conformidad (FerreOn Bodega)</p>
              <p className="text-[11px] text-slate-500">Responsable: {data.recibidoPor}</p>
            </div>
          </div>

          {/* Pie de Página */}
          <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Documento generado con firma electrónica y trazabilidad inmutable en FerreOn ERP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
