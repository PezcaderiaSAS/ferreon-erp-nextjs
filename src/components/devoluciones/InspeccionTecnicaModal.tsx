"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Wrench, 
  AlertOctagon, 
  Layers, 
  Calendar, 
  Package, 
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { 
  calcularLiquidacionDevolucion, 
  ItemDevolucionInput, 
  EstadoInspeccionTecnica 
} from '@/core/services/liquidacion-devolucion.service';
import { LiquidacionGarantiaCard } from './LiquidacionGarantiaCard';
import { DevolucionBlockingOverlay } from './DevolucionBlockingOverlay';
import { procesarDevolucionAvanzadaAction } from '@/app/actions/devoluciones';
import { ComprobanteDevolucionPDFModal } from './ComprobanteDevolucionPDFModal';

interface DetalleContratoInput {
  detalleId: string | number;
  equipoId: string | number;
  nombreEquipo: string;
  cantidadContratada: number;
  cantidadDevueltaPrevia: number;
  tarifaDiaria: number;
  fechaInicio: string;
  subcontratado?: boolean;
  esSubcontratado?: boolean;
}

export interface ContratoParaDevolucion {
  id: string | number;
  consecutivo: string | number;
  clienteNombre: string;
  clienteNit?: string;
  clienteDocumento?: string;
  clienteTelefono?: string;
  depositoGarantia: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  detalles: DetalleContratoInput[];
}

interface InspeccionTecnicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  contrato: ContratoParaDevolucion | null;
  sesionCajaActiva?: any | null;
  onSuccess?: () => void;
}

interface EstadoFilaInspeccion {
  cantidadDevolver: number;
  estadoInspeccion: EstadoInspeccionTecnica;
  costoReparacion: number;
  valorReposicion: number;
  descripcionDano: string;
}

export const InspeccionTecnicaModal: React.FC<InspeccionTecnicaModalProps> = ({
  isOpen,
  onClose,
  contrato,
  sesionCajaActiva,
  onSuccess,
}) => {
  // Estado local por ítem - Hooks llamados incondicionalmente
  const [filas, setFilas] = useState<Record<string, EstadoFilaInspeccion>>({});
  const [fechaDevolucion, setFechaDevolucion] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado para comprobante PDF
  const [comprobanteData, setComprobanteData] = useState<any | null>(null);
  const [showPDFModal, setShowPDFModal] = useState<boolean>(false);

  // Sincronizar estado de filas cuando cambia el contrato seleccionado
  useEffect(() => {
    if (!contrato) {
      setFilas({});
      return;
    }
    const inicial: Record<string, EstadoFilaInspeccion> = {};
    for (const d of contrato.detalles) {
      const pendiente = Math.max(0, d.cantidadContratada - (d.cantidadDevueltaPrevia || 0));
      inicial[String(d.detalleId)] = {
        cantidadDevolver: pendiente,
        estadoInspeccion: 'BUENO',
        costoReparacion: 0,
        valorReposicion: 0,
        descripcionDano: '',
      };
    }
    setFilas(inicial);
  }, [contrato]);

  // Actualizar un campo de un ítem
  const updateFila = (detalleId: string, updates: Partial<EstadoFilaInspeccion>) => {
    setFilas(prev => ({
      ...prev,
      [detalleId]: {
        ...prev[detalleId],
        ...updates,
      }
    }));
  };

  // Cálculo en tiempo real de la liquidación con el servicio puro (0 ms)
  const liquidacion = useMemo(() => {
    if (!contrato) return null;

    const itemsInput: ItemDevolucionInput[] = contrato.detalles
      .filter(d => (filas[String(d.detalleId)]?.cantidadDevolver || 0) > 0)
      .map(d => {
        const fila = filas[String(d.detalleId)];
        return {
          detalleId: d.detalleId,
          equipoId: d.equipoId,
          nombreEquipo: d.nombreEquipo,
          cantidadTotalOriginal: d.cantidadContratada,
          cantidadDevuelta: fila.cantidadDevolver,
          tarifaDiariaPactada: d.tarifaDiaria,
          fechaInicio: d.fechaInicio,
          fechaDevolucion: new Date(fechaDevolucion).toISOString(),
          estadoInspeccion: fila.estadoInspeccion,
          costoReparacion: fila.costoReparacion,
          valorReposicion: fila.valorReposicion,
          descripcionDano: fila.descripcionDano,
        };
      });

    return calcularLiquidacionDevolucion(
      {
        id: contrato.id,
        consecutivo: String(contrato.consecutivo),
        clienteNombre: contrato.clienteNombre,
        depositoGarantia: contrato.depositoGarantia,
        fechaInicio: contrato.fechaInicio,
      },
      itemsInput
    );
  }, [contrato, filas, fechaDevolucion]);

  // Early return condicional estricto después de declarar todos los hooks
  if (!isOpen || !contrato || !liquidacion) return null;

  // Manejador del guardado con Idempotencia y Poka-Yoke
  const handleConfirmarDevolucion = async () => {
    setErrorMsg(null);
    const itemsADevolver = contrato.detalles
      .map(d => {
        const fila = filas[String(d.detalleId)];
        return {
          detalleId: d.detalleId,
          cantidadDevuelta: fila.cantidadDevolver,
          estadoInspeccion: fila.estadoInspeccion,
          costoReparacion: fila.costoReparacion,
          valorReposicion: fila.valorReposicion,
          descripcionDano: fila.descripcionDano,
        };
      })
      .filter(i => i.cantidadDevuelta > 0);

    if (itemsADevolver.length === 0) {
      setErrorMsg('Debe seleccionar al menos 1 unidad para devolver.');
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await procesarDevolucionAvanzadaAction({
        alquilerId: contrato.id,
        items: itemsADevolver,
        metodoPago,
        sesionCajaId: sesionCajaActiva?.id || null,
        observaciones: observaciones || undefined,
        idempotencyKey,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error al procesar la devolución');
      }

      // Preparar datos para el modal de Comprobante Oficial
      const itemsImpresion = liquidacion.itemsLiquidacion.map(il => ({
        nombreEquipo: il.nombreEquipo,
        cantidadDevuelta: il.cantidadDevuelta,
        diasEfectivos: il.diasCausados,
        tarifaDiaria: il.tarifaDiaria,
        subtotalAlquiler: il.subtotalAlquilerItem,
        estadoInspeccion: il.estadoInspeccion,
        costoReparacion: il.costoReparacion,
        valorReposicion: il.valorReposicion,
        descripcionDano: il.descripcionDano,
      }));

      setComprobanteData({
        consecutivo: response.data.consecutivo,
        fechaDevolucion: new Date().toISOString(),
        contratoConsecutivo: contrato.consecutivo,
        clienteNombre: contrato.clienteNombre,
        clienteNit: contrato.clienteNit || contrato.clienteDocumento || 'N/A',
        clienteTelefono: contrato.clienteTelefono,
        recibidoPor: 'OPERADOR_BODEGA',
        depositoAplicado: liquidacion.depositoAplicado,
        totalAlquilerLiquidado: liquidacion.totalAlquilerLiquidado,
        totalDanos: liquidacion.totalDanos,
        totalReposiciones: liquidacion.totalReposiciones,
        saldoNeto: liquidacion.saldoNeto,
        tipoResolucion: liquidacion.tipoResolucion,
        metodoPago,
        observaciones,
        items: itemsImpresion,
      });

      setShowPDFModal(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error al procesar devolución:', err);
      setErrorMsg(err.message || 'Error inesperado al registrar la devolución');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DevolucionBlockingOverlay 
        isOpen={isSubmitting} 
        mensajePersonalizado="Registrando Inspección Técnica y Devolución..." 
      />

      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wider">
                  Inspección Técnica & Split-Line
                </span>
                <span className="text-xs text-slate-400 font-bold">Contrato #{contrato.consecutivo}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Devolución de Equipos - {contrato.clienteNombre}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo scrollable */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Selector de fecha de retorno real */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="font-bold">Fecha y Hora de Recepción en Bodega:</span>
              </div>
              <input
                type="datetime-local"
                value={fechaDevolucion}
                onChange={(e) => setFechaDevolucion(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Listado de Equipos del Contrato */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span>Maquinaria Contratada e Inspección por Ítem</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Modifica la cantidad si es una devolución parcial (Split-Line)
                </span>
              </div>

              <div className="space-y-3">
                {contrato.detalles.map(d => {
                  const idStr = String(d.detalleId);
                  const fila = filas[idStr] || {
                    cantidadDevolver: 0,
                    estadoInspeccion: 'BUENO',
                    costoReparacion: 0,
                    valorReposicion: 0,
                    descripcionDano: '',
                  };
                  const pendiente = Math.max(0, d.cantidadContratada - (d.cantidadDevueltaPrevia || 0));
                  const esSplit = fila.cantidadDevolver > 0 && fila.cantidadDevolver < pendiente;

                  return (
                    <div 
                      key={idStr} 
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        fila.cantidadDevolver > 0 
                          ? 'bg-slate-50/90 border-slate-300 shadow-sm' 
                          : 'bg-white border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Cabecera del ítem */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{d.nombreEquipo}</span>
                            {d.esSubcontratado && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                Subcontratado
                              </span>
                            )}
                            {esSplit && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                <span>Split-Line ({fila.cantidadDevolver} de {pendiente})</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 block">
                            En obra: <strong>{pendiente} unidad(es)</strong> | Tarifa: ${d.tarifaDiaria.toLocaleString('es-CO')}/día
                          </span>
                        </div>

                        {/* Input de cantidad a devolver */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-700">Cant. a Devolver:</label>
                          <input
                            type="number"
                            min="0"
                            max={pendiente}
                            value={fila.cantidadDevolver}
                            onChange={(e) => {
                              const val = Math.min(pendiente, Math.max(0, parseInt(e.target.value, 10) || 0));
                              updateFila(idStr, { cantidadDevolver: val });
                            }}
                            className="w-20 px-2.5 py-1.5 text-center font-black text-sm bg-white border border-slate-300 rounded-xl shadow-inner focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Selector de Estado de Inspección Física (Solo si cantidad > 0) */}
                      {fila.cantidadDevolver > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => updateFila(idStr, { estadoInspeccion: 'BUENO', costoReparacion: 0, valorReposicion: 0 })}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              fila.estadoInspeccion === 'BUENO'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Buen Estado</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateFila(idStr, { estadoInspeccion: 'MANTENIMIENTO', valorReposicion: 0 })}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              fila.estadoInspeccion === 'MANTENIMIENTO'
                                ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Wrench className="w-4 h-4" />
                            <span>Daño / Mantenimiento</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateFila(idStr, { estadoInspeccion: 'PERDIDA_TOTAL', costoReparacion: 0 })}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                              fila.estadoInspeccion === 'PERDIDA_TOTAL'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <AlertOctagon className="w-4 h-4" />
                            <span>Pérdida / Extraviado</span>
                          </button>
                        </div>
                      )}

                      {/* Campos de Costo y Observaciones de Daño */}
                      {fila.cantidadDevolver > 0 && fila.estadoInspeccion === 'MANTENIMIENTO' && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-amber-900 block mb-1">Costo de Reparación (COP):</label>
                            <input
                              type="number"
                              min="0"
                              value={fila.costoReparacion}
                              onChange={(e) => updateFila(idStr, { costoReparacion: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              placeholder="Ej: 150000"
                              className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-amber-900 block mb-1">Detalle del Daño:</label>
                            <input
                              type="text"
                              value={fila.descripcionDano}
                              onChange={(e) => updateFila(idStr, { descripcionDano: e.target.value })}
                              placeholder="Ej: Cable roto, carcasa fracturada"
                              className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-800"
                            />
                          </div>
                        </div>
                      )}

                      {fila.cantidadDevolver > 0 && fila.estadoInspeccion === 'PERDIDA_TOTAL' && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-rose-900 block mb-1">Valor de Reposición a Cobrar (COP):</label>
                            <input
                              type="number"
                              min="0"
                              value={fila.valorReposicion}
                              onChange={(e) => updateFila(idStr, { valorReposicion: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                              placeholder="Ej: 650000"
                              className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg font-bold text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-rose-900 block mb-1">Motivo / Acta de Pérdida:</label>
                            <input
                              type="text"
                              value={fila.descripcionDano}
                              onChange={(e) => updateFila(idStr, { descripcionDano: e.target.value })}
                              placeholder="Ej: Extraviado en obra"
                              className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tarjeta de Liquidación de Garantía en Tiempo Real */}
            <LiquidacionGarantiaCard
              liquidacion={liquidacion}
              metodoPago={metodoPago}
              setMetodoPago={setMetodoPago}
              sesionCajaActiva={sesionCajaActiva}
            />

            {/* Observaciones generales */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Observaciones del Acta:</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Anotaciones para el acta de recepción y firma del cliente..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer con Botón de Confirmación Poka-Yoke */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmarDevolucion}
              disabled={isSubmitting || liquidacion.itemsLiquidacion.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Confirmar Devolución e Inspección</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Comprobante PDF Imprimible */}
      <ComprobanteDevolucionPDFModal
        isOpen={showPDFModal}
        onClose={() => {
          setShowPDFModal(false);
          onClose();
        }}
        data={comprobanteData}
      />
    </>
  );
};
