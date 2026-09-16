'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Truck, 
  Building2, 
  ExternalLink,
  Info,
  X,
  ShieldCheck
} from 'lucide-react';
import { useBodegaStore } from '../../../infrastructure/state/bodegaStore';
import { useAlquilerStore } from '../../../infrastructure/state/alquilerStore';
import { convertirCotizacionAContratoAction } from '../../../app/actions/cotizaciones';
import { CotizacionBlockingOverlay, EtapaConversion } from './CotizacionBlockingOverlay';
import Link from 'next/link';

interface ConvertirCotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: any;
  onSuccess?: (nuevoContrato: any) => void;
}

export function ConvertirCotizacionModal({
  isOpen,
  onClose,
  cotizacion,
  onSuccess
}: ConvertirCotizacionModalProps) {
  const { equipos } = useBodegaStore();
  const { addAlquiler } = useAlquilerStore();

  const [detallesLogistica, setDetallesLogistica] = useState('');
  const [isPending, startTransition] = useTransition();
  const [overlayEtapa, setOverlayEtapa] = useState<EtapaConversion>('VERIFICANDO_STOCK');
  const [showOverlay, setShowOverlay] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Normalizar ítems de la cotización
  const itemsCotizacion = useMemo(() => {
    if (!cotizacion) return [];
    if (Array.isArray(cotizacion.detalles) && cotizacion.detalles.length > 0) {
      return cotizacion.detalles;
    }
    if (Array.isArray(cotizacion.cotizacion_detalles) && cotizacion.cotizacion_detalles.length > 0) {
      return cotizacion.cotizacion_detalles;
    }
    if (Array.isArray(cotizacion.equipos) && cotizacion.equipos.length > 0) {
      return cotizacion.equipos;
    }
    return [];
  }, [cotizacion]);

  // Validación de Stock en Vivo (Poka-Yoke)
  const analisisStock = useMemo(() => {
    let tieneFaltante = false;
    let totalItems = itemsCotizacion.length;

    const itemsConStock = itemsCotizacion.map((it: any) => {
      const equipoId = it.equipo_id || it.equipoId || it.id;
      const equipoEnBodega = equipos.find(
        (e) => String(e.id) === String(equipoId) || e.codigo === it.codigo
      );

      const cantidadRequerida = Number(it.cantidad || 1);
      const stockDisponible = equipoEnBodega 
        ? Number(equipoEnBodega.stock_disponible ?? equipoEnBodega.stockDisponible ?? 0)
        : 0;

      const disponibleSuficiente = stockDisponible >= cantidadRequerida;
      if (!disponibleSuficiente) {
        tieneFaltante = true;
      }

      const faltante = Math.max(0, cantidadRequerida - stockDisponible);

      return {
        id: equipoId,
        nombre: it.nombre || it.descripcion || equipoEnBodega?.nombre || 'Equipo General',
        codigo: it.codigo || equipoEnBodega?.codigo || 'SKU',
        cantidadRequerida,
        stockDisponible,
        disponibleSuficiente,
        faltante,
        tarifaDiaria: Number(it.tarifa_diaria || it.tarifaDiaria || it.precio_unitario || 0)
      };
    });

    return {
      tieneFaltante,
      totalItems,
      items: itemsConStock
    };
  }, [itemsCotizacion, equipos]);

  if (!isOpen || !cotizacion) return null;

  const handleFormalizar = () => {
    if (analisisStock.tieneFaltante) {
      setErrorMsg('No es posible formalizar el contrato debido a existencias insuficientes en bodega.');
      return;
    }

    setErrorMsg(null);
    setShowOverlay(true);
    setOverlayEtapa('BLOQUEANDO_INVENTARIO');

    startTransition(async () => {
      try {
        setOverlayEtapa('GENERANDO_CONTRATO');
        
        const res = await convertirCotizacionAContratoAction({
          cotizacionId: cotizacion.id,
          detallesLogistica: detallesLogistica.trim(),
          idempotencyKey: `conv_modal_${cotizacion.id}_${Date.now()}`
        });

        if (!res.success) {
          setOverlayEtapa('ERROR');
          setTimeout(() => {
            setShowOverlay(false);
            setErrorMsg(res.error || 'Error al formalizar el contrato de alquiler.');
          }, 1200);
          return;
        }

        setOverlayEtapa('COMPLETADO');

        setTimeout(() => {
          setShowOverlay(false);
          if (onSuccess) onSuccess(res.data);
          onClose();
        }, 1000);

      } catch (err: any) {
        setOverlayEtapa('ERROR');
        setTimeout(() => {
          setShowOverlay(false);
          setErrorMsg(err.message || 'Error inesperado durante la transacción.');
        }, 1200);
      }
    });
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-conversion-title"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
          
          {/* Encabezado Institucional */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-conversion-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Conversión 1-Clic a Contrato
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cotización {cotizacion.consecutivo || `#${cotizacion.id}`} • Cliente: {cotizacion.cliente_nombre || cotizacion.clientes?.nombre || 'Cliente General'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo del Modal */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            
            {/* Mensaje de Error si aplica */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Imposible formalizar contrato</p>
                  <p className="text-xs mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Verificación Poka-Yoke de Stock en Bodega */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verificación de Disponibilidad en Bodega (Poka-Yoke)
                </h3>
                <span className="text-xs text-slate-400">
                  {analisisStock.items.length} {analisisStock.items.length === 1 ? 'equipo' : 'equipos'}
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {analisisStock.items.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    No se encontraron detalles de equipos en esta cotización.
                  </div>
                ) : (
                  analisisStock.items.map((it) => (
                    <div 
                      key={it.id} 
                      className={`p-3.5 flex items-center justify-between text-sm ${
                        it.disponibleSuficiente 
                          ? 'bg-white dark:bg-slate-900' 
                          : 'bg-rose-50/40 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {it.nombre}
                          </span>
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {it.codigo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Requerido: <strong className="font-mono text-slate-700 dark:text-slate-300">{it.cantidadRequerida}</strong> • Tarifa: <span className="font-mono">${it.tarifaDiaria.toLocaleString('es-CO')}/día</span>
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div className="text-xs">
                          <div className="text-slate-400">Bodega</div>
                          <div className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {it.stockDisponible} disp.
                          </div>
                        </div>

                        {it.disponibleSuficiente ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            OK
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Faltan {it.faltante}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alerta si falta inventario con opción de Subcontratación (Decisión /grill-me) */}
            {analisisStock.tieneFaltante && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>Alerta de Reserva Pesimista:</strong> Uno o más equipos cotizados no tienen existencias libres en bodega. Para proteger la integridad operativa, la conversión 1-clic se encuentra bloqueada.
                  </div>
                </div>
                
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    ¿Desea abastecerse con un proveedor aliado?
                  </span>
                  <Link
                    href={`/subcontrataciones?cotizacionId=${cotizacion.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Subcontratar con Proveedor
                  </Link>
                </div>
              </div>
            )}

            {/* Campo Opcional de Logística */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-slate-400" />
                Notas de Logística o Entrega en Obra (Opcional)
              </label>
              <textarea
                value={detallesLogistica}
                onChange={(e) => setDetallesLogistica(e.target.value)}
                placeholder="Dirección exacta de la obra, horario preferente de recepción o contacto del maestro a cargo..."
                rows={2}
                disabled={isPending}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
              />
            </div>

            {/* Resumen Financiero Rápido */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Valor Total Cotizado:</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                ${Number(cotizacion.total || cotizacion.monto_total || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          {/* Pie de Acciones */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleFormalizar}
              disabled={isPending || analisisStock.tieneFaltante}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all ${
                analisisStock.tieneFaltante
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-emerald-500/20'
              }`}
            >
              <span>Formalizar Contrato (1-Clic)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overlay Poka-Yoke Transaccional */}
      <CotizacionBlockingOverlay
        isVisible={showOverlay}
        consecutivo={cotizacion.consecutivo}
        etapa={overlayEtapa}
      />
    </>
  );
}
