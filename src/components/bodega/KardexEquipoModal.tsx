'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { History, Package, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { EquipoUI } from '@/infrastructure/state/bodegaStore';
import { obtenerKardexEquipoAction, KardexItemUI } from '@/app/actions/kardex';

export interface KardexEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: EquipoUI | null;
}

const TIPO_MOVIMIENTO_CONFIG: Record<
  string,
  { label: string; badgeClass: string; isPositive: boolean }
> = {
  INGRESO_COMPRA: {
    label: 'Ingreso Compra',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    isPositive: true,
  },
  RETORNO_DEVOLUCION: {
    label: 'Devolución Obra',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    isPositive: true,
  },
  SALIDA_ALQUILER: {
    label: 'Salida Despacho',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    isPositive: false,
  },
  BAJA_DANO: {
    label: 'Baja por Daño',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    isPositive: false,
  },
  AJUSTE_AUDITORIA: {
    label: 'Ajuste Auditoría',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    isPositive: true,
  },
};

export function KardexEquipoModal({
  isOpen,
  onClose,
  equipo,
}: KardexEquipoModalProps) {
  const [movimientos, setMovimientos] = useState<KardexItemUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarKardex = useCallback(async () => {
    if (!equipo?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await obtenerKardexEquipoAction(equipo.id);
      if (!resp.success) {
        throw new Error(resp.error || 'Error al consultar Kardex');
      }
      setMovimientos(resp.data || []);
    } catch (err: any) {
      console.error('[KardexEquipoModal Error]:', err);
      setError(err.message || 'No fue posible cargar el historial de Kardex');
    } finally {
      setIsLoading(false);
    }
  }, [equipo?.id]);

  useEffect(() => {
    if (isOpen && equipo) {
      cargarKardex();
    } else {
      setMovimientos([]);
      setError(null);
    }
  }, [isOpen, equipo, cargarKardex]);

  if (!equipo) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kardex de Inventario: ${equipo.nombre}`}
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-5">
        {/* Cabecera del Equipo con Datos Resumen */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              {equipo.sku}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">SKU / Código</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{equipo.sku}</h4>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Actual en Bodega</span>
              <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {equipo.stock_disponible ?? equipo.stockDisponible ?? 0} unidades
              </p>
            </div>
            <button
              onClick={cargarKardex}
              disabled={isLoading}
              title="Actualizar movimientos de Kardex"
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-salmon' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notificación de Error */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabla / Lista de Transacciones de Kardex */}
        <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 z-10">
                <tr>
                  <th className="py-2.5 px-4">Fecha / Hora</th>
                  <th className="py-2.5 px-4">Tipo Movimiento</th>
                  <th className="py-2.5 px-4 text-center">Variación</th>
                  <th className="py-2.5 px-4 text-center">Stock Resultante</th>
                  <th className="py-2.5 px-4">Motivo / Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-salmon mb-2" />
                      Cargando historial inmutable de Kardex...
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      No hay movimientos registrados para este equipo aún.
                    </td>
                  </tr>
                ) : (
                  movimientos.map((item) => {
                    const config = TIPO_MOVIMIENTO_CONFIG[item.tipo_movimiento] || {
                      label: item.tipo_movimiento,
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      isPositive: item.cantidad_delta >= 0,
                    };
                    const isPos = item.cantidad_delta > 0;
                    const isZero = item.cantidad_delta === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config.badgeClass}`}
                          >
                            {isPos ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                            ) : !isZero ? (
                              <ArrowDownRight className="w-3 h-3 text-rose-600" />
                            ) : null}
                            {config.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              isPos
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isZero
                                ? 'text-slate-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isPos ? `+${item.cantidad_delta}` : item.cantidad_delta}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold whitespace-nowrap text-slate-900 dark:text-white">
                          {item.stock_resultante}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-[220px] truncate" title={item.motivo}>
                          {item.motivo || 'Sin detalle'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Informativo */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
          <span>Trazabilidad auditada con cumplimiento WMS inmutable.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Kardex
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default KardexEquipoModal;
