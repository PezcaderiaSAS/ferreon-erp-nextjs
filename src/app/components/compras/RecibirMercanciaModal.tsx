"use client";

import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Building2, 
  Calendar, 
  ArrowDownToLine, 
  ShieldCheck, 
  Loader2, 
  X,
  Info
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { CompraUI, recibirMercanciaEnBodegaAction } from '../../actions/compras';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';
import { useToastStore } from '../../../infrastructure/state/toastStore';

interface RecibirMercanciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  compra: CompraUI | null;
  onRecepcionExitosa: () => void;
}

interface ItemRecepcionForm {
  itemId: string;
  equipoId: number;
  equipoNombre: string;
  cantidadComprada: number;
  cantidadRecibida: number;
  precioUnitario: number;
  subtotal: number;
}

export function RecibirMercanciaModal({
  isOpen,
  onClose,
  compra,
  onRecepcionExitosa
}: RecibirMercanciaModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [items, setItems] = useState<ItemRecepcionForm[]>([]);
  const [numeroRemision, setNumeroRemision] = useState('');
  const [bodegaDestino, setBodegaDestino] = useState('BODEGA_CENTRAL');
  const [observaciones, setObservaciones] = useState('');
  const [completarOrden, setCompletarOrden] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar items cuando se abre el modal con una compra
  useEffect(() => {
    if (compra && compra.detalles) {
      const itemsMapeados: ItemRecepcionForm[] = compra.detalles.map(d => ({
        itemId: d.id,
        equipoId: d.equipo_id,
        equipoNombre: d.equipo_nombre,
        cantidadComprada: d.cantidad,
        cantidadRecibida: d.cantidad, // Por defecto recibir cantidad completa
        precioUnitario: d.precio_unitario,
        subtotal: d.subtotal
      }));
      setItems(itemsMapeados);
      setNumeroRemision('');
      setBodegaDestino('BODEGA_CENTRAL');
      setObservaciones('');
      setCompletarOrden(true);
    }
  }, [compra]);

  if (!compra) return null;

  const handleCantidadChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10);
    const nuevaCantidad = isNaN(val) ? 0 : Math.max(0, val);
    
    setItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        cantidadRecibida: nuevaCantidad
      };
      return next;
    });
  };

  const totalUnidadesRecibir = items.reduce((acc, it) => acc + it.cantidadRecibida, 0);
  const totalUnidadesEsperadas = items.reduce((acc, it) => acc + it.cantidadComprada, 0);
  const hayDiscrepancia = totalUnidadesRecibir !== totalUnidadesEsperadas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalUnidadesRecibir <= 0) {
      showErrorToast('Debe ingresar al menos una unidad para recibir en bodega.');
      return;
    }

    // Validar que no se reciba más de lo comprado (Poka-Yoke)
    for (const it of items) {
      if (it.cantidadRecibida > it.cantidadComprada) {
        showErrorToast(`La cantidad recibida de "${it.equipoNombre}" (${it.cantidadRecibida}) supera la ordenada (${it.cantidadComprada}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const obsTexto = [
        `Bodega: ${bodegaDestino}`,
        observaciones.trim() ? `Nota: ${observaciones.trim()}` : null,
        hayDiscrepancia ? `Cotejo físico: ${totalUnidadesRecibir}/${totalUnidadesEsperadas} un.` : null
      ].filter(Boolean).join(' | ');

      const res = await recibirMercanciaEnBodegaAction({
        compraId: compra.id,
        remisionFactura: numeroRemision.trim() || undefined,
        observacionesBodega: obsTexto || undefined
      });

      if (res.success) {
        showSuccessToast('Mercancía recibida en bodega y Costo Promedio Ponderado (PMP) actualizado con éxito.');
        onRecepcionExitosa();
        onClose();
      } else {
        showErrorToast(res.error || 'Error al procesar la recepción de mercancía.');
      }
    } catch (err: any) {
      console.error('[RecibirMercanciaModal] Error:', err);
      showErrorToast(err.message || 'Ocurrió un error inesperado al recibir la mercancía.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Recepción en Bodega — ${compra.numero_orden}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Cabecera Informativa con Proveedor y Orden */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs">
          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Proveedor:
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
              {compra.proveedor_nombre}
            </p>
            <p className="text-slate-500 font-mono">NIT: {compra.proveedor_nit || 'N/A'}</p>
          </div>

          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Fecha Orden:
            </span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
              {compra.fecha_compra}
            </p>
            <p className="text-slate-500 font-medium">Estado actual: <span className="font-semibold text-amber-600">{compra.estado}</span></p>
          </div>

          <div>
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Valuación Contable:
            </span>
            <p className="font-bold text-emerald-600 text-sm mt-0.5">
              {formatearMoneda(compra.total)}
            </p>
            <p className="text-slate-500 text-[11px]">Actualiza Costo Promedio (PMP)</p>
          </div>
        </div>

        {/* Notificación Poka-Yoke de impacto en Kardex y PMP */}
        <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div>
            <span className="font-bold">Mecanismo Poka-Yoke & PMP Automático:</span>
            <p className="mt-0.5 leading-relaxed">
              Al confirmar la recepción física, el sistema recalculará en tiempo real el <strong>Costo Promedio Ponderado (PMP)</strong> de cada equipo según la fórmula oficial de inventarios, asentará los movimientos en el Kardex y aumentará el stock disponible en bodega.
            </p>
          </div>
        </div>

        {/* Tabla de Verificación Física de Items */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Cotejo Físico de Mercancía
            </h4>
            <span className="text-xs text-slate-500">
              Unidades a recibir: <strong>{totalUnidadesRecibir}</strong> / {totalUnidadesEsperadas}
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Equipo / Material</th>
                  <th className="p-3 text-center">Cant. Comprada</th>
                  <th className="p-3 text-right">Costo Unitario</th>
                  <th className="p-3 text-center w-36">Cant. Física Recibida</th>
                  <th className="p-3 text-center w-24">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {items.map((it, idx) => {
                  const coincide = it.cantidadRecibida === it.cantidadComprada;
                  const menor = it.cantidadRecibida < it.cantidadComprada;
                  const mayor = it.cantidadRecibida > it.cantidadComprada;

                  return (
                    <tr key={it.itemId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        {it.equipoNombre}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-600 dark:text-slate-400">
                        {it.cantidadComprada}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatearMoneda(it.precioUnitario)}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={it.cantidadComprada}
                          value={it.cantidadRecibida}
                          onChange={(e) => handleCantidadChange(idx, e.target.value)}
                          className={`w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                            mayor 
                              ? 'border-rose-500 bg-rose-50 text-rose-700 ring-rose-200' 
                              : menor 
                              ? 'border-amber-500 bg-amber-50 text-amber-800 ring-amber-200' 
                              : 'border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-emerald-200'
                          }`}
                        />
                      </td>
                      <td className="p-3 text-center">
                        {coincide && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" /> Completo
                          </span>
                        )}
                        {menor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" /> Parcial
                          </span>
                        )}
                        {mayor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            Excede
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hayDiscrepancia && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-medium mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Atención: La cantidad recibida ({totalUnidadesRecibir}) difiere de la cantidad comprada ({totalUnidadesEsperadas}). La orden se registrará con recepción parcial.
            </p>
          )}
        </div>

        {/* Metadatos de la Entrada (Remisión y Bodega) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Número de Guía / Remisión de Entrega
            </label>
            <input
              type="text"
              placeholder="Ej. REM-2026-90412"
              value={numeroRemision}
              onChange={(e) => setNumeroRemision(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">Documento físico del transportador o proveedor</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bodega o Destino de Ingreso
            </label>
            <select
              value={bodegaDestino}
              onChange={(e) => setBodegaDestino(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="BODEGA_CENTRAL">Bodega Central (Bogotá)</option>
              <option value="BODEGA_NORTE">Bodega Norte / Taller</option>
              <option value="EN_TRANSITO">En Tránsito / Patio de Maniobras</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Ubicación donde se almacenarán las unidades</p>
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Observaciones de Recepción
          </label>
          <textarea
            rows={2}
            placeholder="Detalles sobre el estado del embalaje, sellos de seguridad o novedades..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Checkbox de completitud */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={completarOrden}
            onChange={(e) => setCompletarOrden(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Marcar la Orden de Compra como <strong>COMPLETADA</strong> tras esta recepción física
          </span>
        </label>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting || totalUnidadesRecibir <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Asentando en Kardex y Recalculando PMP...
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4" />
                Confirmar Ingreso a Bodega
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
