import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { formatearMonedaConLetras } from '../../../core/utils/numero-a-letras';

interface AprobarCotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cotizacion: any;
  onConfirmarAprobacion: (
    alquilerId: string, 
    ajustes: { fleteEntrega: number; fleteRecogida: number; fechaInicioGlobal: string }
  ) => void;
}

export function AprobarCotizacionModal({ isOpen, onClose, cotizacion, onConfirmarAprobacion }: AprobarCotizacionModalProps) {
  const [fleteEntrega, setFleteEntrega] = useState<number>(0);
  const [fleteRecogida, setFleteRecogida] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cotizacion && isOpen) {
      setFleteEntrega(cotizacion.flete_entrega || cotizacion.fleteEntrega || 0);
      setFleteRecogida(cotizacion.flete_recogida || cotizacion.fleteRecogida || 0);
      
      // Intentar obtener la primera fecha de inicio como referencia
      let fInicio = new Date().toISOString().split('T')[0];
      if (cotizacion.detalles && cotizacion.detalles.length > 0) {
        const itemDate = cotizacion.detalles[0].fecha_inicio || cotizacion.detalles[0].fechaInicio;
        if (itemDate) {
          fInicio = new Date(itemDate).toISOString().split('T')[0];
        }
      }
      setFechaInicio(fInicio);
    }
  }, [cotizacion, isOpen]);

  if (!cotizacion) return null;

  const handleConfirmar = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmarAprobacion(cotizacion.id, {
        fleteEntrega,
        fleteRecogida,
        fechaInicioGlobal: fechaInicio
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aprobar Cotización a Contrato" maxWidth="lg">
      <div className="space-y-5 animate-fadeIn">
        
        {/* Resumen de Cliente y Equipos */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <h4 className="text-sm font-bold text-indigo-900 mb-2">Resumen de Cotización #{cotizacion.consecutivo || cotizacion.id}</h4>
          <p className="text-xs text-indigo-800 mb-1">
            <span className="font-semibold">Cliente:</span> {cotizacion.clienteNombre || 'Sin Nombre'}
          </p>
          <p className="text-xs text-indigo-800 mb-3">
            <span className="font-semibold">Equipos Solicitados:</span> {cotizacion.detalles?.length || 0}
          </p>
          
          <div className="space-y-1">
            {cotizacion.detalles?.map((det: any, idx: number) => (
              <div key={idx} className="flex justify-between text-[11px] bg-white/60 px-2 py-1.5 rounded">
                <span className="font-semibold text-slate-700">{det.cantidad}x {det.nombreItem || det.nombre || 'Equipo'}</span>
                <span className="text-slate-500">{formatearCOP(det.subtotalLineaReal || det.subtotal || 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Ajustes */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Ajustes Logísticos de Entrega</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Flete de Entrega ($)</label>
              <input 
                type="number" 
                min={0}
                value={fleteEntrega}
                onChange={(e) => setFleteEntrega(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Flete de Recogida ($)</label>
              <input 
                type="number" 
                min={0}
                value={fleteRecogida}
                onChange={(e) => setFleteRecogida(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Fecha de Inicio Efectiva</label>
            <input 
              type="date" 
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
            />
            <p className="text-[10px] text-slate-400">Actualizará la fecha de entrega de todos los equipos del contrato.</p>
          </div>
        </div>

        {/* Mensaje de Advertencia */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex gap-2 items-start">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <p>
            Al confirmar, se reservará el stock de los equipos de forma estricta y la cotización pasará a ser un <strong>Contrato Activo</strong>.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              "Aprobar y Reservar Stock"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
