"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Wallet, 
  Lock, 
  ChevronDown, 
  PlusCircle, 
  MinusCircle, 
  CheckSquare, 
  Clock, 
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useCajaStore } from '../../infrastructure/state/cajaStore';
import { AbrirCajaModal } from './AbrirCajaModal';
import { MovimientoCajaModal } from './MovimientoCajaModal';
import { ArqueoCierreModal } from './ArqueoCierreModal';

export function CajaStatusBadge() {
  const { isCajaAbierta, resumenTurno, cargarSesionActiva } = useCajaStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalAbrirOpen, setModalAbrirOpen] = useState(false);
  const [modalMovOpen, setModalMovOpen] = useState(false);
  const [tipoMov, setTipoMov] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [modalCierreOpen, setModalCierreOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarSesionActiva();

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [cargarSesionActiva]);

  const saldo = resumenTurno?.saldoEsperado ?? 0;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isCajaAbierta
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          }`}
          title={isCajaAbierta ? `Caja abierta con saldo de $${saldo.toLocaleString('es-CO')}` : 'Caja cerrada'}
        >
          {isCajaAbierta ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline font-bold">
                ${saldo.toLocaleString('es-CO')}
              </span>
              <span className="sm:hidden font-bold">Caja</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">Caja Cerrada</span>
            </>
          )}
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>

        {/* Dropdown flotante */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2.5 px-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header del dropdown */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Control de Efectivo POS
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isCajaAbierta
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isCajaAbierta ? 'Abierta' : 'Cerrada'}
              </span>
            </div>

            {/* Información si está abierta */}
            {isCajaAbierta ? (
              <div className="space-y-2 mb-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">En Gaveta:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${saldo.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Ventas en efectivo:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      +{resumenTurno?.cantidadPagos || 0} recibos
                    </span>
                  </div>
                </div>

                {/* Acciones para caja abierta */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoMov('EGRESO');
                      setModalMovOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <MinusCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Registrar Gasto Menor (Egreso)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTipoMov('INGRESO');
                      setModalMovOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Inyección de Sencillo (Ingreso)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalCierreOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span>Hacer Arqueo y Cerrar Caja</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Abre la caja ingresando el monto base para poder cobrar en mostrador con método efectivo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModalAbrirOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Abrir Caja Ahora</span>
                </button>
              </div>
            )}

            {/* Link al módulo general */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/caja"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium transition-colors"
              >
                <span>Ver Módulo Completo de Caja</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modales integrados */}
      <AbrirCajaModal
        isOpen={modalAbrirOpen}
        onClose={() => setModalAbrirOpen(false)}
      />

      <MovimientoCajaModal
        isOpen={modalMovOpen}
        onClose={() => setModalMovOpen(false)}
        tipoInicial={tipoMov}
      />

      <ArqueoCierreModal
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
      />
    </>
  );
}
