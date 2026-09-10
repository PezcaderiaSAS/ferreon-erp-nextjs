"use client";

import React, { useEffect, useState, useCallback } from "react";
import { History, Package, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { EquipoUI } from "../../../infrastructure/state/bodegaStore";
import { obtenerKardexEquipoAction, KardexItemUI } from "../../actions/kardex";

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
    label: "Ingreso Compra",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    isPositive: true,
  },
  RETORNO_DEVOLUCION: {
    label: "Devolución Obra",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
    isPositive: true,
  },
  SALIDA_ALQUILER: {
    label: "Salida Despacho",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    isPositive: false,
  },
  BAJA_DANO: {
    label: "Baja por Daño",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    isPositive: false,
  },
  AJUSTE_AUDITORIA: {
    label: "Ajuste Auditoría",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
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
      if (resp.success && resp.data) {
        setMovimientos(resp.data);
      } else {
        setError(resp.error || "No fue posible cargar los registros del Kardex.");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [equipo?.id]);

  useEffect(() => {
    if (isOpen && equipo?.id) {
      cargarKardex();
    } else {
      setMovimientos([]);
      setError(null);
    }
  }, [isOpen, equipo?.id, cargarKardex]);

  if (!equipo) return null;

  const stockDisponible = equipo.stock_disponible ?? equipo.stockDisponible ?? 0;
  const stockEnObra = equipo.stock_en_obra ?? equipo.stockEnObra ?? 0;
  const stockTotal = equipo.stock_total ?? equipo.stockTotal ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial de Kardex: ${equipo.nombre}`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Cabecera Resumen del Equipo */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-salmon/10 text-brand-salmonDark dark:text-brand-salmonLight">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {equipo.codigo || equipo.sku || "EQ-000"}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {equipo.categoria}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {equipo.nombre}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Disponibles
              </span>
              <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                {stockDisponible} Unid.
              </p>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                En Obra
              </span>
              <p className="font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                {stockEnObra} Unid.
              </p>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stock Total
              </span>
              <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
                {stockTotal} Unid.
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Movimientos */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-salmon" />
              Trazabilidad Inmutable de Entradas / Salidas
            </span>
            <button
              type="button"
              onClick={cargarKardex}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
              aria-label="Recargar registros de kardex"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>

          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-brand-salmon rounded-full animate-spin" />
              <p className="text-xs font-medium animate-pulse">Consultando historial en base de datos...</p>
            </div>
          ) : error ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
              <p className="text-xs font-medium text-center">{error}</p>
            </div>
          ) : movimientos.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Aún no existen movimientos registrados en el Kardex para este ítem.
              </p>
              <p className="text-[11px] text-slate-400">
                Los ajustes manuales, compras, despachos de alquiler y devoluciones se registrarán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Fecha y Hora</th>
                    <th className="py-2.5 px-3.5">Tipo Movimiento</th>
                    <th className="py-2.5 px-3.5 text-right">Variación (Delta)</th>
                    <th className="py-2.5 px-3.5 text-right">Stock Resultante</th>
                    <th className="py-2.5 px-3.5">Motivo de Auditoría</th>
                    <th className="py-2.5 px-3.5">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movimientos.map((item) => {
                    const cfg = TIPO_MOVIMIENTO_CONFIG[item.tipo_movimiento] || {
                      label: item.tipo_movimiento || "Movimiento",
                      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                      isPositive: item.cantidad_delta >= 0,
                    };
                    const isPositive = item.cantidad_delta > 0;
                    const isNegative = item.cantidad_delta < 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">
                          {new Date(item.created_at).toLocaleString("es-CO", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.badgeClass}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isNegative
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-slate-500"
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 inline" /> : null}
                            {isNegative ? <ArrowDownRight className="w-3.5 h-3.5 inline" /> : null}
                            {isPositive ? `+${item.cantidad_delta}` : item.cantidad_delta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {item.stock_resultante}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={item.motivo}>
                          {item.motivo || "—"}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono truncate max-w-[130px]" title={item.usuario_id}>
                          {item.usuario_id || "Sistema"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón de Cierre Accesible */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </Modal>
  );
}
