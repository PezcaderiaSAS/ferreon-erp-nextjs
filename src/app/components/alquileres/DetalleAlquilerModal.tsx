'use client';

import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AlquilerEntity } from '../../../core/domain/entities/alquiler';

interface DetalleAlquilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  alquiler: AlquilerEntity | null;
  onEdit: (alquiler: AlquilerEntity) => void;
}

export function DetalleAlquilerModal({
  isOpen,
  onClose,
  alquiler,
  onEdit
}: DetalleAlquilerModalProps) {
  if (!alquiler) return null;

  const consecutivoFormatted = `#CTR-${String(alquiler.consecutivo || 1).padStart(4, '0')}`;
  const totalEquipos = (alquiler.detalles || []).reduce((acc, d) => acc + (d.cantidad || 0), 0);
  const totalFletes = (alquiler.fleteEntrega || 0) + (alquiler.fleteRecogida || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Contrato ${consecutivoFormatted}`}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-salmon/20 border border-brand-salmon/40 text-brand-salmon flex items-center justify-center font-mono font-bold text-lg">
              {String(alquiler.consecutivo || 1).padStart(3, '0')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{alquiler.clienteNombre || 'Cliente General'}</h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  alquiler.estado === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  alquiler.estado === 'FINALIZADO' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                  alquiler.estado === 'COTIZACION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {alquiler.estado}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Contrato registrado el {alquiler.createdAt ? new Date(alquiler.createdAt).toLocaleDateString('es-CO') : 'Reciente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Garantía ({alquiler.garantiaTipo || 'Depósito'})</span>
              <span className="text-sm font-bold text-emerald-400">
                ${(alquiler.garantiaMonto || 0).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Equipos en Alquiler ({totalEquipos} unidades)
            </h4>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-slate-600">Equipo</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 text-center">Cant.</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 text-right">Tarifa / Día</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 text-center">Período Estimado</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-600 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(alquiler.detalles || []).map((det, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {det.nombreItem || `Equipo ID: ${det.itemId}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {det.cantidad}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      ${(det.tarifaAplicada || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">
                      {det.fechaInicio ? new Date(det.fechaInicio).toLocaleDateString('es-CO') : 'Hoy'} → {det.fechaFinEstimada ? new Date(det.fechaFinEstimada).toLocaleDateString('es-CO') : 'Abierto'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      ${(det.subtotalLineaEstimado || 0).toLocaleString('es-CO')}
                    </td>
                  </tr>
                ))}
                {(!alquiler.detalles || alquiler.detalles.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No hay equipos asociados en este contrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown & Logistics Notes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: Notes and Logistics */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">local_shipping</span>
                Detalles Logísticos y Entrega
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {alquiler.detallesLogistica || 'Sin instrucciones de transporte especiales registradas.'}
              </p>
            </div>

            {alquiler.observacionesGenerales && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">notes</span>
                  Observaciones Generales
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {alquiler.observacionesGenerales}
                </p>
              </div>
            )}
          </div>

          {/* Right: Balance and Settlement */}
          <div className="md:col-span-6 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              Liquidación Financiera Proyectada
            </span>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal Equipos</span>
                <span className="font-semibold">${(alquiler.subtotalEquiposEstimado || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fletes (Entrega + Recogida)</span>
                <span className="font-semibold">${totalFletes.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Anticipo / Depósito Pagado</span>
                <span className="font-semibold">-${(alquiler.deposito || 0).toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-300">Saldo Estimado a Cobrar</span>
              <span className="text-2xl font-bold text-white tracking-tight">
                ${(alquiler.totalEstimado || 0).toLocaleString('es-CO')} <span className="text-xs font-normal text-slate-400">COP</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => {
                onClose();
                onEdit(alquiler);
              }}
              className="flex items-center gap-2 bg-brand-salmon hover:bg-brand-salmonDark text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              <span>✏️ Editar Contrato</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
