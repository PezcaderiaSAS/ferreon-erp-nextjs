"use client";

import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Printer, FileText, X } from 'lucide-react';
import { useEmpresaStore } from '../../../infrastructure/state/empresaStore';
import { DEFAULT_EMPRESA_CONFIG } from '../../../core/domain/entities/empresa-config';
import { formatearMonedaCOP, numeroALetras } from '../../../core/utils/numero-a-letras';

interface DetalleSubPDF {
  cantidad: number;
  descripcion_item: string;
  dias_pactados: number;
  costo_diario_unitario: number;
  subtotal_costo: number;
}

interface OrdenSubcontratacionPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontratacion: any;
}

export function OrdenSubcontratacionPDFModal({
  isOpen,
  onClose,
  subcontratacion
}: OrdenSubcontratacionPDFModalProps) {
  const { config: empresaConfig } = useEmpresaStore();
  const [formatoPapel, setFormatoPapel] = useState<'LETTER' | 'A5'>('LETTER');

  if (!subcontratacion) return null;

  const emp = empresaConfig || DEFAULT_EMPRESA_CONFIG;
  const isA5 = formatoPapel === 'A5';

  const consecutivo = subcontratacion.consecutivo || 'SUB-0000';
  const fechaEmision = subcontratacion.fecha_emision 
    ? new Date(subcontratacion.fecha_emision).toLocaleDateString('es-CO') 
    : new Date().toLocaleDateString('es-CO');
  const fechaRecepcion = subcontratacion.fecha_recepcion_estimada 
    ? new Date(subcontratacion.fecha_recepcion_estimada).toLocaleDateString('es-CO') 
    : 'Inmediata';
  const fechaDevolucion = subcontratacion.fecha_devolucion_estimada 
    ? new Date(subcontratacion.fecha_devolucion_estimada).toLocaleDateString('es-CO') 
    : 'Por definir';

  const detalles: DetalleSubPDF[] = subcontratacion.subcontrataciones_detalles || subcontratacion.detalles || [];
  const costoTotal = Number(subcontratacion.costo_total_estimado || 0);
  const depositoGarantia = Number(subcontratacion.deposito_garantia_proveedor || 0);
  const totalEnLetras = numeroALetras(costoTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Orden de Subcontratación ${consecutivo}`} maxWidth="4xl">
      <div className="flex flex-col space-y-4">
        {/* Barra de herramientas no imprimible */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Formato:</span>
            <button
              type="button"
              onClick={() => setFormatoPapel('LETTER')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                formatoPapel === 'LETTER' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              📄 Carta
            </button>
            <button
              type="button"
              onClick={() => setFormatoPapel('A5')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                formatoPapel === 'A5' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              📑 Media Carta (A5)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zona de Documento Imprimible */}
        <div 
          id="orden-subcontratacion-print"
          className={`bg-white text-slate-900 mx-auto w-full border border-slate-200 rounded-xl shadow-sm ${
            isA5 ? 'p-4 max-w-[600px] text-xs' : 'p-8 max-w-[800px] text-sm'
          }`}
        >
          {/* Encabezado */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {emp.razonSocial}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                NIT: {emp.nit} • Tel: {emp.telefono}
              </p>
              <p className="text-xs text-slate-500">
                {emp.direccion} - {emp.ciudad}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-md uppercase tracking-wider mb-1">
                ORDEN DE SUBCONTRATACIÓN
              </span>
              <h2 className="text-2xl font-black text-slate-800">#{consecutivo}</h2>
              <p className="text-xs text-slate-500">Fecha: {fechaEmision}</p>
            </div>
          </div>

          {/* Información del Proveedor y Logística */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proveedor Aliado</h3>
              <p className="font-bold text-slate-900">{subcontratacion.proveedor_nombre}</p>
              <p className="text-xs text-slate-600">NIT: {subcontratacion.proveedor_nit}</p>
              <p className="text-xs text-slate-600">Teléfono: {subcontratacion.proveedor_telefono || 'No registrado'}</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Términos Logísticos</h3>
              <p className="text-xs text-slate-700"><strong>Fecha Recepción:</strong> {fechaRecepcion}</p>
              <p className="text-xs text-slate-700"><strong>Fecha Devolución Estimada:</strong> {fechaDevolucion}</p>
              {subcontratacion.alquiler_id && (
                <p className="text-xs text-slate-700"><strong>Contrato Vinculado:</strong> ALQ-{subcontratacion.alquiler_id}</p>
              )}
            </div>
          </div>

          {/* Tabla de Equipos Subcontratados */}
          <table className="w-full border-collapse mb-6 text-left">
            <thead>
              <tr className="bg-slate-800 text-white text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3 rounded-l-lg">Descripción Maquinaria / Ítem</th>
                <th className="py-2 px-3 text-center">Cant.</th>
                <th className="py-2 px-3 text-center">Días</th>
                <th className="py-2 px-3 text-right">Costo / Día</th>
                <th className="py-2 px-3 text-right rounded-r-lg">Subtotal Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {detalles.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{d.descripcion_item}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{d.cantidad}</td>
                  <td className="py-2.5 px-3 text-center">{d.dias_pactados}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatearMonedaCOP(d.costo_diario_unitario)}</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{formatearMonedaCOP(d.subtotal_costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales y Depósito */}
          <div className="flex justify-between items-start gap-4 mb-6">
            <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700">Valor en Letras:</p>
              <p className="italic text-slate-500 font-medium">{totalEnLetras}</p>
              {subcontratacion.observaciones && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600">
                  <strong>Observaciones:</strong> {subcontratacion.observaciones}
                </div>
              )}
            </div>

            <div className="w-64 space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between py-1 px-2 text-slate-600">
                <span>Depósito en Garantía:</span>
                <span className="font-mono">{formatearMonedaCOP(depositoGarantia)}</span>
              </div>
              <div className="flex justify-between py-2 px-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 font-bold text-sm">
                <span>Total a Pagar Proveedor:</span>
                <span className="font-mono">{formatearMonedaCOP(costoTotal)}</span>
              </div>
            </div>
          </div>

          {/* Firmas de Custodia */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 mt-6 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">{emp.razonSocial}</p>
              <p className="text-slate-400 text-[10px]">Firma Autorizada / Recepción</p>
            </div>
            <div>
              <div className="border-t border-slate-400 w-44 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">{subcontratacion.proveedor_nombre}</p>
              <p className="text-slate-400 text-[10px]">Firma Proveedor / Despacho</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
