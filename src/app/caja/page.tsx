"use client";

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Lock, 
  Unlock, 
  DollarSign, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Clock, 
  Calendar, 
  FileText, 
  Receipt, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  PlusCircle, 
  MinusCircle, 
  Coins,
  History,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { useCajaStore, SesionCajaItem } from '../../infrastructure/state/cajaStore';
import { AbrirCajaModal } from '../../components/caja/AbrirCajaModal';
import { MovimientoCajaModal } from '../../components/caja/MovimientoCajaModal';
import { ArqueoCierreModal } from '../../components/caja/ArqueoCierreModal';
import { ComprobanteArqueoModal } from '../../components/caja/ComprobanteArqueoModal';
import { SupabaseConnectionBadge } from '../../components/caja/SupabaseConnectionBadge';

export default function CajaPage() {
  const { 
    sesionActiva, 
    isCajaAbierta, 
    resumenTurno, 
    movimientos, 
    pagosEfectivo, 
    historialSesiones, 
    cargarSesionActiva, 
    cargarHistorial, 
    isLoading 
  } = useCajaStore();

  const [tabActiva, setTabActiva] = useState<'TURNO_ACTIVO' | 'HISTORIAL'>('TURNO_ACTIVO');

  // Modales
  const [isAbrirModalOpen, setIsAbrirModalOpen] = useState(false);
  const [isMovModalOpen, setIsMovModalOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<SesionCajaItem | null>(null);

  useEffect(() => {
    cargarSesionActiva();
    cargarHistorial();
  }, [cargarSesionActiva, cargarHistorial]);

  const saldoActual = resumenTurno?.saldoEsperado ?? 0;
  const baseInicial = resumenTurno?.montoApertura ?? 0;
  const ventasEfectivo = resumenTurno?.totalCobrosEfectivo ?? 0;
  const totalIngresos = resumenTurno?.totalIngresos ?? 0;
  const totalEgresos = resumenTurno?.totalEgresos ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* 1. HEADER & ACCIONES PRINCIPALES */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Caja y Punto de Venta (POS)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Apertura, control de efectivo en vivo, gastos menores y arqueo ciego con actas oficiales.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SupabaseConnectionBadge />

          <button
            type="button"
            onClick={() => { cargarSesionActiva(); cargarHistorial(); }}
            disabled={isLoading}
            className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="Refrescar datos en vivo"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {isCajaAbierta ? (
            <>
              <button
                type="button"
                onClick={() => { setTipoMov('EGRESO'); setIsMovModalOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <MinusCircle className="w-4 h-4 text-rose-500" />
                <span>Registrar Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => { setTipoMov('INGRESO'); setIsMovModalOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>Ingreso Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsArqueoModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20 active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Arqueo y Cierre</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsAbrirModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-900/20 active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caja de Turno</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. TARJETAS DE MÉTRICAS EN VIVO (KPIS) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Efectivo en Gaveta */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Efectivo Teórico en Gaveta
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isCajaAbierta 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {isCajaAbierta ? 'En Vivo' : 'Caja Cerrada'}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
            ${saldoActual.toLocaleString('es-CO')}
            <span className="text-xs text-slate-400 font-normal ml-1">COP</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Base + Ventas + Ingresos - Egresos</span>
          </div>
        </div>

        {/* Base Inicial */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Base Inicial de Efectivo
            </span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
            ${baseInicial.toLocaleString('es-CO')}
            <span className="text-xs text-slate-400 font-normal ml-1">COP</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Monto de flotante de apertura</span>
          </div>
        </div>

        {/* Cobros Alquileres Efectivo */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ventas en Efectivo (Turno)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            +${ventasEfectivo.toLocaleString('es-CO')}
            <span className="text-xs text-slate-400 font-normal ml-1">COP</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Receipt className="w-3.5 h-3.5 text-emerald-500" />
            <span>{resumenTurno?.cantidadPagos || 0} recibos recaudados</span>
          </div>
        </div>

        {/* Egresos de Caja Menor */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Gastos Menores (Egresos)
            </span>
            <ArrowDownCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
            -${totalEgresos.toLocaleString('es-CO')}
            <span className="text-xs text-slate-400 font-normal ml-1">COP</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Inyecciones: +${totalIngresos.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. TABS DE NAVEGACIÓN */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTabActiva('TURNO_ACTIVO')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            tabActiva === 'TURNO_ACTIVO'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Turno Activo en Vivo</span>
          {isCajaAbierta && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('HISTORIAL')}
          className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            tabActiva === 'HISTORIAL'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Cierres & Actas</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
            {historialSesiones.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 4. CONTENIDO DE PESTAÑA: TURNO ACTIVO */}
      {/* ===================================================================== */}
      {tabActiva === 'TURNO_ACTIVO' && (
        <>
          {!isCajaAbierta ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Lock className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No hay ninguna sesión de caja abierta
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Para registrar cobros de alquileres o facturas en efectivo, la regla Poka-Yoke exige abrir formalmente el turno indicando la base física inicial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAbrirModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-950/20 transition-all active:scale-95"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Sesión de Caja Ahora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tabla de Pagos de Alquiler en Efectivo */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Cobros Recaudados en Efectivo
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {pagosEfectivo.length} transacciones
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {pagosEfectivo.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                      <p>Aún no se han registrado cobros en efectivo en este turno.</p>
                      <p className="text-[11px] text-slate-500">Al registrar un pago con método EFECTIVO se vinculará aquí.</p>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Recibo</th>
                          <th className="px-4 py-2.5 text-left">Cliente</th>
                          <th className="px-4 py-2.5 text-right">Monto</th>
                          <th className="px-4 py-2.5 text-right">Recibido / Cambio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {pagosEfectivo.map((pago) => (
                          <tr key={pago.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                              #{pago.consecutivo}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                              {pago.clientes?.nombre || 'Cliente mostrador'}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ${Math.round(pago.monto).toLocaleString('es-CO')}
                            </td>
                            <td className="px-4 py-3 text-right text-[11px] text-slate-500 tabular-nums">
                              {pago.efectivo_recibido ? `$${Math.round(pago.efectivo_recibido).toLocaleString('es-CO')}` : '-'} / {' '}
                              {pago.cambio_entregado ? `$${Math.round(pago.cambio_entregado).toLocaleString('es-CO')}` : '$0'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Tabla de Movimientos Menores (Gastos e Inyecciones) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Movimientos de Caja Menor
                    </h3>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setTipoMov('EGRESO'); setIsMovModalOpen(true); }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition-colors"
                    >
                      + Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTipoMov('INGRESO'); setIsMovModalOpen(true); }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg transition-colors"
                    >
                      + Ingreso
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {movimientos.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                      <p>No se han registrado salidas ni entradas menores de caja en este turno.</p>
                      <p className="text-[11px] text-slate-500">Usa los botones superiores para registrar compras menores o fletes.</p>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="px-4 py-2.5 text-left">Tipo</th>
                          <th className="px-4 py-2.5 text-left">Concepto</th>
                          <th className="px-4 py-2.5 text-left">Beneficiario / Soporte</th>
                          <th className="px-4 py-2.5 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {movimientos.map((mov) => (
                          <tr key={mov.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                mov.tipo === 'EGRESO'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}>
                                {mov.tipo === 'EGRESO' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                                {mov.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                              {mov.concepto}
                            </td>
                            <td className="px-4 py-3 text-slate-500 truncate max-w-[120px]">
                              {mov.beneficiario || 'N/A'} {mov.comprobante ? `(${mov.comprobante})` : ''}
                            </td>
                            <td className={`px-4 py-3 text-right font-black tabular-nums ${
                              mov.tipo === 'EGRESO' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {mov.tipo === 'EGRESO' ? '-' : '+'}${Math.round(mov.monto).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================================================================== */}
      {/* 5. CONTENIDO DE PESTAÑA: HISTORIAL DE CIERRES */}
      {/* ===================================================================== */}
      {tabActiva === 'HISTORIAL' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Auditoría Histórica de Turnos y Actas de Arqueo
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Registros inmutables con trazabilidad forense
            </span>
          </div>

          <div className="overflow-x-auto">
            {historialSesiones.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-1">
                <p>Aún no hay turnos de caja registrados en el historial.</p>
                <p className="text-[11px] text-slate-500">Al cerrar una sesión se archivará aquí automáticamente.</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Sesión</th>
                    <th className="px-4 py-3 text-left">Apertura</th>
                    <th className="px-4 py-3 text-left">Cierre</th>
                    <th className="px-4 py-3 text-right">Base</th>
                    <th className="px-4 py-3 text-right">Esperado</th>
                    <th className="px-4 py-3 text-right">Físico Contado</th>
                    <th className="px-4 py-3 text-center">Descuadre</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historialSesiones.map((sesion) => {
                    const diff = Number(sesion.diferencia) || 0;
                    const esCerrada = sesion.estado === 'CERRADA';
                    return (
                      <tr key={sesion.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {sesion.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {sesion.fecha_apertura ? new Date(sesion.fecha_apertura).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {sesion.fecha_cierre ? new Date(sesion.fecha_cierre).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : (
                            <span className="text-emerald-500 font-bold">En curso</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          ${Number(sesion.monto_apertura || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                          {sesion.monto_esperado ? `$${Number(sesion.monto_esperado).toLocaleString('es-CO')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-black tabular-nums text-slate-900 dark:text-white">
                          {sesion.monto_cierre ? `$${Number(sesion.monto_cierre).toLocaleString('es-CO')}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!esCerrada ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ABIERTA
                            </span>
                          ) : diff === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              CUADRADO
                            </span>
                          ) : diff > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                              +${diff.toLocaleString('es-CO')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              -${Math.abs(diff).toLocaleString('es-CO')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setComprobanteSeleccionado(sesion)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Acta</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODALES CONECTADOS */}
      {/* ===================================================================== */}
      <AbrirCajaModal
        isOpen={isAbrirModalOpen}
        onClose={() => setIsAbrirModalOpen(false)}
        onCajaAbierta={() => { cargarSesionActiva(); cargarHistorial(); }}
      />

      <MovimientoCajaModal
        isOpen={isMovModalOpen}
        onClose={() => setIsMovModalOpen(false)}
        tipoInicial={tipoMov}
        onMovimientoRegistrado={() => cargarSesionActiva()}
      />

      <ArqueoCierreModal
        isOpen={isArqueoModalOpen}
        onClose={() => setIsArqueoModalOpen(false)}
        onCajaCerrada={(res) => {
          cargarSesionActiva();
          cargarHistorial();
          if (res?.sesion) {
            setComprobanteSeleccionado(res.sesion);
          }
        }}
      />

      <ComprobanteArqueoModal
        isOpen={!!comprobanteSeleccionado}
        onClose={() => setComprobanteSeleccionado(null)}
        sesion={comprobanteSeleccionado}
        movimientos={movimientos}
        cobrosEfectivo={pagosEfectivo}
      />
    </div>
  );
}
