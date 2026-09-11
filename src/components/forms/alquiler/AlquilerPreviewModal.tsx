import React from 'react';
import { Printer, FileText, Building2, ShieldCheck } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';
import { ItemRow } from './types';

interface AlquilerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoDocumento?: 'COTIZACION' | 'CONTRATO';
  consecutivo?: string;
  previewPaperSize: 'LETTER' | 'A5';
  setPreviewPaperSize: (size: 'LETTER' | 'A5') => void;
  onPrint: (size: 'LETTER' | 'A5') => void;
  fechaRegistro: string;
  selectedCliente: any;
  detallesLogistica: string;
  garantiaTipo: string;
  garantiaMonto: number;
  observaciones: string;
  items: ItemRow[];
  equiposActivos: any[];
  subtotalEquipos: number;
  totalFletes: number;
  deposito: number;
  depositoExoneradoCredito?: boolean;
  totalEstimado: number;
  aplicaImpuesto?: boolean;
  tasaImpuesto?: number;
  valorImpuesto?: number;
  nombreImpuesto?: string;
  costoTotalSubcontratacion?: number;
  margenTotalSubcontratacion?: number;
  formatearCOP: (val: number) => string;
}

export const AlquilerPreviewModal: React.FC<AlquilerPreviewModalProps> = ({
  isOpen,
  onClose,
  tipoDocumento = 'CONTRATO',
  consecutivo,
  previewPaperSize,
  setPreviewPaperSize,
  onPrint,
  fechaRegistro,
  selectedCliente,
  detallesLogistica,
  garantiaTipo,
  garantiaMonto,
  observaciones,
  items,
  equiposActivos,
  subtotalEquipos,
  totalFletes,
  deposito,
  depositoExoneradoCredito = false,
  totalEstimado,
  aplicaImpuesto = false,
  tasaImpuesto = 0,
  valorImpuesto = 0,
  nombreImpuesto = 'IVA',
  costoTotalSubcontratacion = 0,
  margenTotalSubcontratacion = 0,
  formatearCOP,
}) => {
  const esCotizacion = tipoDocumento === 'COTIZACION';
  const totalCotizado = subtotalEquipos + totalFletes + (aplicaImpuesto ? valorImpuesto : 0);
  const consecutivoVisible = consecutivo || (esCotizacion ? 'COT-BORRADOR' : 'ALQ-BORRADOR');

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={esCotizacion ? "Vista Previa de la Cotización Comercial" : "Vista Previa del Contrato de Alquiler"} 
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Barra de opciones de formato e impresión */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-100 p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Formato de Hoja:</span>
            <button
              type="button"
              onClick={() => setPreviewPaperSize('LETTER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                previewPaperSize === 'LETTER' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📄 Tamaño Carta
            </button>
            <button
              type="button"
              onClick={() => setPreviewPaperSize('A5')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                previewPaperSize === 'A5' ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              📑 Media Carta (A5)
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => onPrint(previewPaperSize)}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Documento</span>
          </button>
        </div>

        {/* Visualizador del Documento */}
        <div className="max-h-[65vh] overflow-y-auto border border-slate-200 rounded-xl p-4 bg-slate-50">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-xs space-y-4">
            {/* Encabezado */}
            <div className={`flex justify-between items-start border-b-2 pb-3 ${
              esCotizacion ? 'border-blue-600' : 'border-teal-700'
            }`}>
              <div>
                <h2 className="text-lg font-black text-slate-900">FerreOn ERP • Alquileres</h2>
                <p className="text-[11px] text-slate-500">Gestión y Alquiler de Maquinaria y Equipos para la Construcción</p>
                <p className="text-[10px] text-slate-400">NIT: 900.854.123-9 • Tel: (+57) 310 987 6543 • Bogotá D.C.</p>
              </div>
              <div className={`text-right p-2.5 rounded-xl border ${
                esCotizacion 
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900' 
                  : 'bg-emerald-50/80 border-emerald-300 text-teal-900'
              }`}>
                <span className="text-[10px] font-extrabold uppercase block tracking-wider">
                  {esCotizacion ? 'Cotización Comercial' : 'Contrato de Alquiler'}
                </span>
                <span className="text-sm font-black font-mono">
                  #{consecutivoVisible}
                </span>
                <span className="text-[10px] text-slate-500 block">Fecha: {fechaRegistro}</span>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-teal-800 block text-[11px]">DATOS DEL CLIENTE</span>
                <p><strong>Cliente:</strong> {selectedCliente?.nombre || 'Consumidor Final'}</p>
                <p><strong>NIT/C.C.:</strong> {selectedCliente?.nit_cedula || selectedCliente?.nit || 'Sin Registrar'}</p>
                <p><strong>Teléfono:</strong> {selectedCliente?.telefono || selectedCliente?.contacto || 'No especificado'}</p>
              </div>
              <div>
                <span className="font-bold text-teal-800 block text-[11px]">LOGÍSTICA Y RESPALDO</span>
                <p><strong>Lugar de Entrega:</strong> {detallesLogistica || 'Entrega en bodega'}</p>
                <p>
                  <strong>Garantía ({garantiaTipo}):</strong> {formatearCOP(garantiaMonto)}
                  {esCotizacion && <span className="text-slate-500 text-[10px] ml-1">(Referencial)</span>}
                </p>
                {observaciones && <p><strong>Obs:</strong> {observaciones}</p>}
              </div>
            </div>

            {/* Tabla de Equipos */}
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className={`${esCotizacion ? 'bg-blue-700' : 'bg-teal-700'} text-white text-[10px] uppercase`}>
                  <th className="p-2">Equipo / Origen</th>
                  <th className="p-2 text-center">Cant.</th>
                  <th className="p-2 text-center">Desde</th>
                  <th className="p-2 text-center">Hasta</th>
                  <th className="p-2 text-center">Días</th>
                  <th className="p-2 text-right">Tarifa/Día</th>
                  <th className="p-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => {
                  const eq = equiposActivos.find(e => String(e.id) === String(it.itemId));
                  const start = new Date(it.fechaInicio);
                  const end = new Date(it.fechaFinEstimada);
                  const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                  const sub = (it.precioDiario || 0) * (it.cantidad || 1) * dias;

                  return (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                      <td className="p-2">
                        <span className="font-bold text-slate-800 block">{eq?.nombre || 'Equipo'}</span>
                        {it.esSubcontratado ? (
                          <span className="inline-flex items-center gap-1 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-amber-700" />
                            <span>Aliado: {it.proveedorAliadoNombre || 'Re-Renting'}</span>
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-slate-400 block font-mono">
                            Stock Bodega Propia
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold">{it.cantidad}</td>
                      <td className="p-2 text-center">{it.fechaInicio}</td>
                      <td className="p-2 text-center">{it.fechaFinEstimada}</td>
                      <td className="p-2 text-center font-bold">{dias}</td>
                      <td className="p-2 text-right font-mono">{formatearCOP(it.precioDiario)}</td>
                      <td className="p-2 text-right font-bold text-teal-900 font-mono">{formatearCOP(sub)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totales y Letras */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10.5px] space-y-2">
                <div>
                  <span className="font-bold text-teal-800 block">VALOR EN LETRAS:</span>
                  <span className="font-bold text-slate-700">
                    {formatearMonedaConLetras(esCotizacion ? totalCotizado : totalEstimado)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 italic">
                  {esCotizacion 
                    ? 'Esta cotización tiene una validez comercial de 15 días calendario. Precios y disponibilidad de maquinaria propia y aliada están sujetos a confirmación al formalizar el contrato.'
                    : 'El arrendatario declara recibir los equipos en perfecto estado técnico y operativo, comprometiéndose a su uso diligente y entrega oportuna en la fecha pactada.'}
                </div>
              </div>

              <div className="w-full sm:w-60 border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                <div className="flex justify-between p-1.5 border-b border-slate-100">
                  <span>Subtotal Equipos:</span>
                  <span className="font-bold font-mono">{formatearCOP(subtotalEquipos)}</span>
                </div>
                <div className="flex justify-between p-1.5 border-b border-slate-100">
                  <span>Fletes (Entrega + Retorno):</span>
                  <span className="font-mono">{formatearCOP(totalFletes)}</span>
                </div>

                {aplicaImpuesto && (
                  <div className="flex justify-between p-1.5 border-b border-slate-100 bg-teal-50/70 text-teal-900 font-semibold">
                    <span>(+) {nombreImpuesto} ({tasaImpuesto}%):</span>
                    <span className="font-bold font-mono">+ {formatearCOP(valorImpuesto)}</span>
                  </div>
                )}

                {esCotizacion ? (
                  <>
                    <div className="flex justify-between p-1.5 border-b border-slate-100 text-slate-500 italic">
                      <span>Depósito Proyectado:</span>
                      <span className="font-mono">{formatearCOP(deposito)}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-700 text-white font-bold text-xs">
                      <span>VALOR TOTAL COTIZADO:</span>
                      <span className="font-mono">{formatearCOP(totalCotizado)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between p-1.5 border-b border-slate-100 text-rose-600 font-bold">
                      <span>Anticipo / Depósito:</span>
                      <span className="font-mono">
                        {depositoExoneradoCredito ? '$0 (Crédito)' : `- ${formatearCOP(deposito)}`}
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-teal-700 text-white font-bold text-xs">
                      <span>SALDO PENDIENTE:</span>
                      <span className="font-mono">{formatearCOP(totalEstimado)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </Modal>
  );
};

