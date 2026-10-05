'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar, Scissors, FileText, CheckCircle2, Clock, AlertCircle,
  Building2, User, Send, ArrowRight, DollarSign, Download, RefreshCw
} from 'lucide-react';
import {
  previsualizarLoteCortesPeriodicos,
  LiquidacionCorteAlquiler,
  PeriodoCorteFechas,
  construirMensajeWhatsAppCuentaCobro
} from '@/core/services/facturacion-recurrente.service';
import { obtenerHistorialCuentasCobroAction } from '@/app/actions/facturacion-recurrente';
import { EmitirCuentaCobroModal } from './EmitirCuentaCobroModal';

export interface CortesPeriodicosPanelProps {
  contratos: any[];
}

export function CortesPeriodicosPanel({ contratos }: CortesPeriodicosPanelProps) {
  // 1. Configuración de Fechas de Periodo
  const [tipoPeriodoPreset, setTipoPeriodoPreset] = useState<'Q1' | 'Q2' | 'MES' | 'MES_ANT' | 'CUSTOM'>('Q1');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');

  // 2. Modales y Estado
  const [liquidacionParaEmitir, setLiquidacionParaEmitir] = useState<LiquidacionCorteAlquiler | null>(null);
  const [isModalEmitirOpen, setIsModalEmitirOpen] = useState(false);
  const [historialCuentas, setHistorialCuentas] = useState<any[]>([]);
  const [vistaActiva, setVistaActiva] = useState<'GENERAR' | 'HISTORIAL'>('GENERAR');
  const [alertaExito, setAlertaExito] = useState<string | null>(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Inicializar fechas con Quincena 1 del mes actual
  useEffect(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    const mesStr = String(mes + 1).padStart(2, '0');

    if (tipoPeriodoPreset === 'Q1') {
      setFechaInicio(`${año}-${mesStr}-01`);
      setFechaFin(`${año}-${mesStr}-15`);
    } else if (tipoPeriodoPreset === 'Q2') {
      const ultimoDia = new Date(año, mes + 1, 0).getDate();
      setFechaInicio(`${año}-${mesStr}-16`);
      setFechaFin(`${año}-${mesStr}-${ultimoDia}`);
    } else if (tipoPeriodoPreset === 'MES') {
      const ultimoDia = new Date(año, mes + 1, 0).getDate();
      setFechaInicio(`${año}-${mesStr}-01`);
      setFechaFin(`${año}-${mesStr}-${ultimoDia}`);
    } else if (tipoPeriodoPreset === 'MES_ANT') {
      const mesAntDate = new Date(año, mes - 1, 1);
      const añoAnt = mesAntDate.getFullYear();
      const mesAntStr = String(mesAntDate.getMonth() + 1).padStart(2, '0');
      const ultimoDiaAnt = new Date(añoAnt, mesAntDate.getMonth() + 1, 0).getDate();
      setFechaInicio(`${añoAnt}-${mesAntStr}-01`);
      setFechaFin(`${añoAnt}-${mesAntStr}-${ultimoDiaAnt}`);
    }
  }, [tipoPeriodoPreset]);

  // Cargar historial de cuentas de cobro emitidas
  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await obtenerHistorialCuentasCobroAction();
      if (res?.success && Array.isArray(res.data)) {
        setHistorialCuentas(res.data);
      }
    } catch (e) {
      console.warn('Error cargando historial de cuentas de cobro:', e);
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (vistaActiva === 'HISTORIAL') {
      cargarHistorial();
    }
  }, [vistaActiva]);

  // 3. Previsualización del Lote en Tiempo Real
  const resumenLote = useMemo(() => {
    if (!fechaInicio || !fechaFin) {
      return {
        periodo: { fechaInicio: '', fechaFin: '' },
        liquidaciones: [],
        totalContratosFacturables: 0,
        totalMontoFacturable: 0,
        totalDiasMaquinariaEnObra: 0,
      };
    }

    return previsualizarLoteCortesPeriodicos(
      contratos,
      { fechaInicio, fechaFin },
      { aplicaIva: false }
    );
  }, [contratos, fechaInicio, fechaFin]);

  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  const handleAbrirEmision = (liq: LiquidacionCorteAlquiler) => {
    setLiquidacionParaEmitir(liq);
    setIsModalEmitirOpen(true);
  };

  const handleEmitidoExitoso = (doc: any) => {
    setAlertaExito(`Cuenta de Cobro #${doc.consecutivoTexto || doc.id} emitida con éxito.`);
    cargarHistorial();
    setTimeout(() => setAlertaExito(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback */}
      {alertaExito && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{alertaExito}</span>
        </div>
      )}

      {/* Sub-navegación entre Generar Corte e Historial */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setVistaActiva('GENERAR')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              vistaActiva === 'GENERAR'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ✂️ Generador de Cortes Periódicos
          </button>
          <button
            type="button"
            onClick={() => setVistaActiva('HISTORIAL')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              vistaActiva === 'HISTORIAL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📋 Historial Emitido ({historialCuentas.length})
          </button>
        </div>

        {vistaActiva === 'GENERAR' && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {contratos.filter((c) => c.estado === 'ACTIVO' || c.estado === 'ACTIVO_EN_OBRA').length} contratos en obra
          </span>
        )}
      </div>

      {vistaActiva === 'GENERAR' ? (
        <>
          {/* 1. Selector de Periodo de Corte */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-brand-salmon/10 text-brand-salmon dark:bg-brand-salmon/20">
                  <Scissors className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Definir Ventana de Corte en Obra
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calcula los días exactos de maquinaria según permanencia real pro-rata.
                  </p>
                </div>
              </div>

              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'Q1', label: '1ra Quincena (1-15)' },
                  { id: 'Q2', label: '2da Quincena (16-Fin)' },
                  { id: 'MES', label: 'Mes Completo' },
                  { id: 'MES_ANT', label: 'Mes Anterior' },
                  { id: 'CUSTOM', label: 'Rango Libre' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTipoPeriodoPreset(p.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      tipoPeriodoPreset === p.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs de Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fecha Inicial del Corte
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setTipoPeriodoPreset('CUSTOM');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums outline-none focus:ring-2 focus:ring-brand-salmon/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Fecha Final del Corte
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setTipoPeriodoPreset('CUSTOM');
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums outline-none focus:ring-2 focus:ring-brand-salmon/20"
                />
              </div>
            </div>
          </div>

          {/* 2. KPIs del Lote de Corte (Radios Anidados & Tabular Nums) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Total Facturable en el Corte</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {formatearCOP(resumenLote.totalMontoFacturable)}
              </div>
              <span className="text-[11px] text-slate-400">
                Del {fechaInicio} al {fechaFin}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Contratos Listos para Corte</span>
                <Building2 className="w-4 h-4 text-brand-salmon" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-brand-salmon">
                {resumenLote.totalContratosFacturables}
              </div>
              <span className="text-[11px] text-slate-400">
                Con días activos en la ventana
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Días Devengados de Maquinaria</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                {resumenLote.totalDiasMaquinariaEnObra} días
              </div>
              <span className="text-[11px] text-slate-400">
                Uso efectivo en obra
              </span>
            </div>
          </div>

          {/* 3. Tabla de Liquidación Pro-Rata */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Previsualización de Cortes por Contrato ({resumenLote.liquidaciones.length})
                </h4>
                <p className="text-xs text-slate-400">
                  Haga clic en &quot;Emitir Cuenta de Cobro&quot; para generar el documento oficial.
                </p>
              </div>
            </div>

            {resumenLote.liquidaciones.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
                <p className="text-sm font-medium">
                  No hay contratos con días facturables en la ventana seleccionada.
                </p>
                <p className="text-xs">
                  Modifique las fechas de corte o verifique que existan contratos en estado ACTIVO.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Contrato</th>
                      <th className="py-3 px-4">Cliente / Obra</th>
                      <th className="py-3 px-4">Ventana Efectiva</th>
                      <th className="py-3 px-4 text-center">Días en Corte</th>
                      <th className="py-3 px-4 text-right">Monto del Periodo</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {resumenLote.liquidaciones.map((liq) => (
                      <tr
                        key={liq.alquilerId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{liq.numeroContrato}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {liq.clienteNombre}
                          </div>
                          {liq.obraNombre && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              {liq.obraNombre}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                          {liq.fechaDesdeEfectiva} al {liq.fechaHastaEfectiva}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {liq.diasFacturablesPeriodo} d
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white text-sm">
                          {formatearCOP(liq.totalNeto)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleAbrirEmision(liq)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs inline-flex items-center gap-1 shadow-xs transition-all active:scale-95"
                          >
                            <span>Emitir Cobro</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* 4. Historial de Cuentas de Cobro y Facturas Emitidas */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Historial de Cuentas de Cobro Periódicas
            </h4>
            <button
              type="button"
              onClick={cargarHistorial}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Refrescar historial"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistorial ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {historialCuentas.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-1">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 stroke-1" />
              <p className="text-sm font-medium">Aún no se han emitido cuentas de cobro periódicas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Contrato</th>
                    <th className="py-3 px-4">Fecha Emisión</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {historialCuentas.map((fac) => {
                    let meta: any = {};
                    try {
                      meta = JSON.parse(fac.observaciones || '{}');
                    } catch (e) {
                      meta = {};
                    }

                    const consecutivo = meta.consecutivoTexto || `FAC-${fac.numero_consecutivo || fac.id}`;

                    return (
                      <tr key={fac.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          #{consecutivo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                            {fac.tipo_documento === 'FACTURA_VENTA' ? 'Factura IVA' : 'Cuenta de Cobro'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          ALQ-{fac.alquiler_id}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-400">
                          {fac.created_at ? fac.created_at.slice(0, 10) : 'Hoy'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                          {formatearCOP(Number(fac.total_pagar) || 0)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              fac.estado_pago === 'PAGADO'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {fac.estado_pago || 'PENDIENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Emisión */}
      {isModalEmitirOpen && liquidacionParaEmitir && (
        <EmitirCuentaCobroModal
          isOpen={isModalEmitirOpen}
          onClose={() => setIsModalEmitirOpen(false)}
          liquidacion={liquidacionParaEmitir}
          onEmitidoExitoso={handleEmitidoExitoso}
        />
      )}
    </div>
  );
}
