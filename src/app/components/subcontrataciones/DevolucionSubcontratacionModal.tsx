"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SubcontratacionUI } from '@/infrastructure/state/subcontratacionStore';
import { cambiarEstadoSubcontratacionAction } from '@/app/actions/subcontrataciones';
import { 
  RotateCcw, CheckCircle2, AlertTriangle, Calendar, ShieldCheck, 
  DollarSign, Truck, FileText, AlertCircle 
} from 'lucide-react';

interface DevolucionSubcontratacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontratacion: SubcontratacionUI | null;
  onSuccess?: () => void;
}

type EstadoEquipoRetorno = 'EXCELENTE' | 'BUENO' | 'CON_DANOS' | 'FALTANTE';

export function DevolucionSubcontratacionModal({
  isOpen,
  onClose,
  subcontratacion,
  onSuccess,
}: DevolucionSubcontratacionModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [fechaRetornoReal, setFechaRetornoReal] = useState(todayStr);
  const [fleteRetornoProveedor, setFleteRetornoProveedor] = useState(0);
  const [costoDanosReparacion, setCostoDanosReparacion] = useState(0);
  const [devolucionDepositoCompleto, setDevolucionDepositoCompleto] = useState(true);
  const [depositoReembolsado, setDepositoReembolsado] = useState(subcontratacion?.depositoGarantia || 0);
  const [observacionesCheckin, setObservacionesCheckin] = useState('');
  
  // Estado físico de cada ítem
  const [estadosItems, setEstadosItems] = useState<{ [itemId: string]: EstadoEquipoRetorno }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !subcontratacion) return null;

  const handleEstadoItemChange = (itemId: string, estado: EstadoEquipoRetorno) => {
    setEstadosItems(prev => ({ ...prev, [itemId]: estado }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Guardar la transición de estado a DEVUELTA con observaciones de la inspección
      const res = await cambiarEstadoSubcontratacionAction({
        subcontratacionId: subcontratacion.id, 
        nuevoEstado: 'DEVUELTA',
        observaciones: observacionesCheckin ? `Check-in de Retorno: ${observacionesCheckin}` : undefined
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'No fue posible registrar la devolución');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Retorno y Liquidación: ${subcontratacion.consecutivo}`} 
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-100">
        
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Resumen del Aliado */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Proveedor Aliado:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{subcontratacion.proveedorNombre}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Fecha Pactada Inicial:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{subcontratacion.fechaDevolucionEstimada}</span>
          </div>
        </div>

        {/* Check-in de Equipos */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-amber-600" />
            Inspección Física de Maquinaria a Devolver
          </label>

          <div className="space-y-2">
            {subcontratacion.detalles?.map((item) => {
              const currentEstado = estadosItems[item.id] || 'BUENO';
              return (
                <div 
                  key={item.id} 
                  className="p-3 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{item.equipoNombre}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Serial: {item.serialProveedor || 'S/N'} • Cant: {item.cantidad}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEstadoItemChange(item.id, 'BUENO')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        currentEstado === 'BUENO'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      En Buen Estado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEstadoItemChange(item.id, 'CON_DANOS')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        currentEstado === 'CON_DANOS'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Con Daños / Desgaste
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liquidación Financiera y Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Fecha Real de Devolución al Aliado *
            </label>
            <input
              type="date"
              required
              value={fechaRetornoReal}
              onChange={(e) => setFechaRetornoReal(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              Flete de Recogida / Transporte Aliado ($)
            </label>
            <input
              type="number"
              min="0"
              value={fleteRetornoProveedor}
              onChange={(e) => setFleteRetornoProveedor(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {subcontratacion.depositoGarantia > 0 && (
            <div className="sm:col-span-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Liquidación de Depósito en Garantía
                </span>
                <span className="font-bold font-mono text-amber-800 dark:text-amber-200">
                  Depósito Entregado: ${subcontratacion.depositoGarantia.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Costo por Daños/Deducciones ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={costoDanosReparacion}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setCostoDanosReparacion(val);
                      setDepositoReembolsado(Math.max(0, subcontratacion.depositoGarantia - val));
                    }}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">Monto a Reembolsar por el Aliado ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={depositoReembolsado}
                    onChange={(e) => setDepositoReembolsado(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-emerald-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observaciones del Retorno y Acta de Entrega
            </label>
            <textarea
              rows={2}
              value={observacionesCheckin}
              onChange={(e) => setObservacionesCheckin(e.target.value)}
              placeholder="Horómetro de devolución, nivel de combustible, reporte de firma del transportista..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl outline-none resize-none"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Liquidando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Retorno y Liquidar</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
