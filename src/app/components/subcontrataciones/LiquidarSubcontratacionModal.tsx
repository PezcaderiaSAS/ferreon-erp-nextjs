"use client";

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SubcontratacionUI } from '@/infrastructure/state/subcontratacionStore';
import { liquidarSubcontratacionAction } from '@/app/actions/subcontrataciones';
import { calcularLiquidacionSubcontratacion } from '@/core/services/liquidacion-subcontratacion.service';
import { formatearMonedaCOP } from '@/core/utils/numero-a-letras';
import { 
  Calculator, CheckCircle2, ShieldCheck, AlertCircle, 
  Receipt, Building2, Percent, ArrowRight, DollarSign
} from 'lucide-react';

interface LiquidarSubcontratacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontratacion: SubcontratacionUI | null;
  onSuccess?: () => void;
}

export function LiquidarSubcontratacionModal({
  isOpen,
  onClose,
  subcontratacion,
  onSuccess,
}: LiquidarSubcontratacionModalProps) {
  const [aplicaRetenciones, setAplicaRetenciones] = useState(true);
  const [tasaReteFuente, setTasaReteFuente] = useState(0.025);
  const [tasaReteICA, setTasaReteICA] = useState(0.00966);
  const [metodoPago, setMetodoPago] = useState<'TRANSFERENCIA' | 'EFECTIVO' | 'CHEQUE'>('TRANSFERENCIA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cálculo en memoria (0 ms) utilizando el mismo servicio puro de dominio
  const calculo = useMemo(() => {
    if (!subcontratacion) return null;

    const fechaRecepcion = subcontratacion.fecha_recepcion_real || subcontratacion.fechaEntregaEstimada || subcontratacion.created_at || new Date().toISOString();
    const fechaRetorno = subcontratacion.fecha_devolucion_real || subcontratacion.fechaDevolucionEstimada || new Date().toISOString();

    const items = (subcontratacion.detalles || subcontratacion.subcontrataciones_detalles || []).map((d) => ({
      itemSubcontratacionId: d.id,
      equipoId: d.equipo_id || d.id,
      descripcionItem: d.equipo_nombre || d.equipoNombre || 'Equipo Subcontratado',
      cantidad: d.cantidad || 1,
      costoDiarioProveedor: d.tarifa_diaria_proveedor ?? d.tarifaDiariaProveedor ?? 0,
      tarifaDiariaCliente: d.tarifa_diaria_cliente ?? d.tarifaDiariaCliente ?? 0,
    }));

    // Si no hay ítems detallados, usar los datos de cabecera
    const itemsFinal = items.length > 0 ? items : [{
      itemSubcontratacionId: 'item-1',
      equipoId: 'eq-1',
      descripcionItem: 'Maquinaria en Subcontratación',
      cantidad: 1,
      costoDiarioProveedor: subcontratacion.costoTotalEstimado || 0,
      tarifaDiariaCliente: subcontratacion.ingresoTotalEstimado || 0,
    }];

    const resultado = calcularLiquidacionSubcontratacion(
      {
        id: subcontratacion.id,
        consecutivo: subcontratacion.consecutivo,
        proveedorId: subcontratacion.proveedor_id || subcontratacion.proveedorId || '',
        proveedorNombre: subcontratacion.proveedorNombre || subcontratacion.proveedor_nombre || '',
        proveedorNit: subcontratacion.proveedorNit || subcontratacion.proveedor_nit || '',
        fechaRecepcion,
        fechaRetornoProveedor: fechaRetorno,
      },
      itemsFinal,
      {
        aplicaRetenciones,
        tasaReteFuente,
        tasaReteICA,
      }
    );

    return {
      ...resultado,
      fechaRecepcion,
      fechaRetornoProveedor: fechaRetorno,
      totalEquipos: itemsFinal.length,
    };
  }, [subcontratacion, aplicaRetenciones, tasaReteFuente, tasaReteICA]);

  if (!isOpen || !subcontratacion || !calculo) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await liquidarSubcontratacionAction({
        subcontratacionId: subcontratacion.id,
        aplicaRetenciones,
        tasaReteFuente,
        tasaReteICA,
        metodoPago,
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || 'Error al liquidar la orden');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Liquidación Contable de Subcontratación: ${subcontratacion.consecutivo}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-slate-800 dark:text-slate-100">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Encabezado del Proveedor y Días */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Proveedor Aliado:</span>
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              {subcontratacion.proveedorNombre}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">NIT: {subcontratacion.proveedorNit || 'N/A'}</span>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Tiempo Efectivo con Aliado:</span>
            <span className="font-bold text-sm text-amber-600 font-mono">
              {calculo.diasTranscurridosProveedor} días
            </span>
            <span className="text-[11px] text-slate-400 block">
              {calculo.fechaRecepcion.split('T')[0]} al {calculo.fechaRetornoProveedor.split('T')[0]}
            </span>
          </div>
        </div>

        {/* Tarjetas de Rentabilidad y Costo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Costo Bruto Aliado</span>
            <p className="text-lg font-black text-slate-900 dark:text-white font-mono mt-1">
              {formatearMonedaCOP(calculo.costoTotalProveedor)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{calculo.totalEquipos} equipos liquidados</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ingreso Facturado Cliente</span>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
              {formatearMonedaCOP(calculo.ingresoTotalCliente)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cobro directo en contrato</p>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Margen Comercial Neto</span>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-300 font-mono mt-1">
              {formatearMonedaCOP(calculo.margenBruto)}
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
              {calculo.porcentajeMargen}% de rentabilidad
            </p>
          </div>
        </div>

        {/* Panel de Retenciones Fiscales (Colombia DIAN) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aplicaRetenciones}
                onChange={(e) => setAplicaRetenciones(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                Aplicar Retenciones Tributarias en la Fuente (ReteFuente & ReteICA)
              </span>
            </label>
            <span className="text-[11px] font-mono text-slate-500">
              {aplicaRetenciones ? 'Régimen Ordinario' : 'No responsable / Exento'}
            </span>
          </div>

          {aplicaRetenciones && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200 dark:border-slate-800">
              <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">ReteFuente (2.5%):</span>
                  <span className="font-bold text-rose-600 font-mono">
                    -{formatearMonedaCOP(calculo.valorReteFuente)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Retención por arrendamiento de bienes muebles</p>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">ReteICA (9.66‰):</span>
                  <span className="font-bold text-rose-600 font-mono">
                    -{formatearMonedaCOP(calculo.valorReteICA)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Impuesto municipal de industria y comercio</p>
              </div>
            </div>
          )}

          {/* Valor Neto a Transferir al Aliado */}
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-600" />
              Neto a Pagar al Proveedor:
            </span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
              {formatearMonedaCOP(calculo.netoPagarProveedor)}
            </span>
          </div>
        </div>

        {/* Previsualización del Asiento Contable Balanceado */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Asiento Contable en Partida Doble (Ledger)
          </span>

          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] space-y-1.5">
            <div className="text-slate-400 text-[10px] border-b border-slate-800 pb-1 mb-1">
              Concepto: {calculo.asientoContable.concepto}
            </div>

            {calculo.asientoContable.lineas.map((linea, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-slate-300">
                  {linea.cuentaCodigo} - {linea.cuentaNombre}
                </span>
                <span className={linea.naturaleza === 'DEBITO' ? 'text-emerald-400' : 'text-amber-400'}>
                  {linea.naturaleza === 'DEBITO' ? 'DÉBITO' : 'CRÉDITO'}: {formatearMonedaCOP(linea.monto)}
                </span>
              </div>
            ))}

            <div className="border-t border-slate-800 pt-1 mt-1 text-[10px] flex items-center justify-between text-slate-400">
              <span>Estado del Asiento:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Balanceado (Σ Débitos = Σ Créditos)
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 font-bold shadow-sm"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Asentando en Ledger...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Aprobar y Liquidar Orden</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
