"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SubcontratacionUI, SubcontratacionEstado } from '@/infrastructure/state/subcontratacionStore';
import { 
  Building2, Calendar, DollarSign, Printer, CheckCircle2, Clock, 
  RotateCcw, AlertTriangle, ShieldCheck, Truck, ArrowRight, User, Phone, Mail
} from 'lucide-react';

interface DetalleSubcontratacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontratacion: SubcontratacionUI | null;
  onImprimirPDF: (sub: SubcontratacionUI) => void;
  onCambiarEstado?: (sub: SubcontratacionUI, nuevoEstado: SubcontratacionEstado) => void;
  onRegistrarDevolucion?: (sub: SubcontratacionUI) => void;
}

export function DetalleSubcontratacionModal({
  isOpen,
  onClose,
  subcontratacion,
  onImprimirPDF,
  onCambiarEstado,
  onRegistrarDevolucion,
}: DetalleSubcontratacionModalProps) {
  if (!subcontratacion) return null;

  const getEstadoBadge = (estado: SubcontratacionEstado) => {
    switch (estado) {
      case 'BORRADOR':
        return { text: 'Borrador', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300' };
      case 'SOLICITADA':
        return { text: 'Solicitada al Aliado', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300' };
      case 'ACTIVA':
        return { text: 'Activa en Obra', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-300' };
      case 'DEVUELTA':
        return { text: 'Devuelta / Finalizada', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300' };
      case 'CANCELADA':
        return { text: 'Cancelada', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300' };
    }
  };

  const estadoBadge = getEstadoBadge(subcontratacion.estado);

  // Stepper logic
  const steps: { key: SubcontratacionEstado; label: string }[] = [
    { key: 'SOLICITADA', label: 'Solicitud Aliado' },
    { key: 'ACTIVA', label: 'Entrega en Obra' },
    { key: 'DEVUELTA', label: 'Devolución y Retorno' },
  ];

  const currentStepIndex = 
    subcontratacion.estado === 'BORRADOR' ? 0 :
    subcontratacion.estado === 'SOLICITADA' ? 1 :
    subcontratacion.estado === 'ACTIVA' ? 2 :
    subcontratacion.estado === 'DEVUELTA' ? 3 : -1;

  const margenPorcentaje = subcontratacion.ingresoTotalEstimado > 0 
    ? ((subcontratacion.margenBrutoEstimado / subcontratacion.ingresoTotalEstimado) * 100).toFixed(1)
    : '0.0';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Orden: ${subcontratacion.consecutivo}`} maxWidth="3xl">
      <div className="space-y-6 text-slate-800 dark:text-slate-100">
        
        {/* Cabecera de Estado y Consecutivo */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orden de Subcontratación</span>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {subcontratacion.consecutivo}
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${estadoBadge.bg}`}>
                {estadoBadge.text}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => onImprimirPDF(subcontratacion)}
              className="flex items-center gap-1.5 text-xs bg-white dark:bg-slate-800 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600" />
              <span>Ver / Imprimir PDF</span>
            </Button>
            {subcontratacion.estado === 'ACTIVA' && onRegistrarDevolucion && (
              <Button
                variant="primary"
                onClick={() => onRegistrarDevolucion(subcontratacion)}
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Registrar Devolución</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stepper de Ciclo de Vida */}
        {subcontratacion.estado !== 'CANCELADA' && (
          <div className="px-2 py-3 bg-white dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between relative">
              {steps.map((step, idx) => {
                const isDone = currentStepIndex > idx + 1;
                const isCurrent = currentStepIndex === idx + 1;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center text-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isDone 
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950' 
                        : isCurrent
                        ? 'bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950 shadow-md'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-semibold mt-1.5 ${isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grid de 2 Columnas: Datos del Aliado y Finanzas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tarjeta Proveedor */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              Datos del Aliado / Proveedor
            </h4>
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{subcontratacion.proveedorNombre}</p>
              <p className="text-slate-500 font-mono">NIT: {subcontratacion.proveedorNit || 'N/A'}</p>
              {subcontratacion.proveedorContacto && (
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> {subcontratacion.proveedorContacto}
                </p>
              )}
              {subcontratacion.proveedorTelefono && (
                <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {subcontratacion.proveedorTelefono}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Entrega Aliado:</span>
                <span className="font-semibold">{subcontratacion.fechaEntregaEstimada || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Devolución Pactada:</span>
                <span className="font-semibold">{subcontratacion.fechaDevolucionEstimada || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Rentabilidad */}
          <div className="p-4 bg-gradient-to-br from-amber-500/5 via-slate-50 to-emerald-500/5 dark:from-amber-950/20 dark:via-slate-900/40 dark:to-emerald-950/20 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Desglose Económico y Margen
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                <span className="text-slate-400 text-[10px] block font-semibold">Costo Proveedor:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                  ${subcontratacion.costoTotalEstimado.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                <span className="text-slate-400 text-[10px] block font-semibold">Cobro a Cliente:</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                  ${subcontratacion.ingresoTotalEstimado.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Margen Bruto Proyectado</span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  ${subcontratacion.margenBrutoEstimado.toLocaleString('es-CO')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg shadow-sm">
                  {margenPorcentaje}%
                </span>
              </div>
            </div>

            {subcontratacion.depositoGarantia > 0 && (
              <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Depósito en Garantía Entregado:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  ${subcontratacion.depositoGarantia.toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Maquinaria e Ítems Subcontratados */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-600" />
            Maquinaria y Equipos Contratados ({subcontratacion.detalles?.length || 0})
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Equipo / Descripción</th>
                  <th className="py-2.5 px-3">Serial Aliado</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-center">Días</th>
                  <th className="py-2.5 px-3 text-right">Tarifa Proveedor</th>
                  <th className="py-2.5 px-3 text-right">Tarifa Cliente</th>
                  <th className="py-2.5 px-3 text-right">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(subcontratacion.detalles || subcontratacion.subcontrataciones_detalles || []).map((det, index) => {
                  const dias = det.diasContratados || det.dias_contratados || 1;
                  const cant = det.cantidad || 1;
                  const tarifaProv = det.tarifaDiariaProveedor ?? det.tarifa_diaria_proveedor ?? 0;
                  const tarifaCli = det.tarifaDiariaCliente ?? det.tarifa_diaria_cliente ?? 0;
                  const margenItem = (tarifaCli - tarifaProv) * dias * cant;

                  return (
                    <tr key={det.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {det.equipoNombre || det.equipo_nombre || 'Equipo sin nombre'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {det.serialProveedor || det.serial_proveedor || <span className="italic text-slate-400">Sin serial</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">{cant}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400">{dias} d</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ${tarifaProv.toLocaleString('es-CO')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        ${tarifaCli.toLocaleString('es-CO')}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        margenItem >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        ${margenItem.toLocaleString('es-CO')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {subcontratacion.observaciones && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">Observaciones / Términos de entrega:</span>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{subcontratacion.observaciones}</p>
          </div>
        )}

        {/* Acciones de Transición de Estado */}
        {onCambiarEstado && subcontratacion.estado !== 'DEVUELTA' && subcontratacion.estado !== 'CANCELADA' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-300">
              ¿Deseas actualizar el estado de esta subcontratación?
            </span>
            <div className="flex items-center gap-2">
              {subcontratacion.estado === 'BORRADOR' && (
                <Button
                  onClick={() => onCambiarEstado(subcontratacion, 'SOLICITADA')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  Marcar como Solicitada
                </Button>
              )}
              {subcontratacion.estado === 'SOLICITADA' && (
                <Button
                  onClick={() => onCambiarEstado(subcontratacion, 'ACTIVA')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  Confirmar Salida a Obra (Activa)
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => onCambiarEstado(subcontratacion, 'CANCELADA')}
                className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
              >
                Cancelar Orden
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
