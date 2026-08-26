"use client";

import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { EmpresaConfig } from '../../../core/domain/entities/empresa-config';
import { AlquilerEntity } from '../../../core/domain/entities/alquiler';

interface TicketAlquilerModalProps {
  isOpen: boolean;
  alquiler: AlquilerEntity | any;
  empresa: EmpresaConfig;
  onClose: () => void;
  onNuevoAlquiler: () => void;
}

export function TicketAlquilerModal({ isOpen, alquiler, empresa, onClose, onNuevoAlquiler }: TicketAlquilerModalProps) {
  if (!alquiler || !empresa) return null;

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat(empresa.moneda.locale, {
      style: "currency",
      currency: empresa.moneda.codigo,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const handlePrint = () => {
    window.print();
  };

  // Lectura pasiva de datos (Single Source of Truth)
  const consecutivo = alquiler.consecutivo || alquiler.id;
  const fechaStr = alquiler.createdAt ? new Date(alquiler.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const fletes = (alquiler.fleteEntrega || 0) + (alquiler.fleteRecogida || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Documento Soporte de Alquiler" maxWidth="3xl">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-print-area, #ticket-print-area * {
            visibility: visible;
          }
          #ticket-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Botonera de acciones (No imprimible) */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6 no-print border-b border-slate-100 pb-4">
        <button 
          onClick={onNuevoAlquiler}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
        >
          Nuevo Alquiler
        </button>
        <button 
          onClick={handlePrint}
          className="px-5 py-2 bg-brand-salmon hover:bg-brand-salmonDark text-white shadow-lg shadow-brand-salmon/25 font-black text-sm rounded-xl flex items-center space-x-2 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>Imprimir Documento</span>
        </button>
      </div>

      {/* Zona de Impresión (Formato Carta) */}
      <div id="ticket-print-area" className="bg-white text-slate-900 p-2 sm:p-8 rounded-xl border border-slate-200 shadow-sm mx-auto w-full max-w-4xl">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-300 pb-6 mb-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{empresa.razonSocial}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">NIT: {empresa.nit}</p>
            <p className="text-sm text-slate-500">{empresa.direccion} - {empresa.ciudad}</p>
            <p className="text-sm text-slate-500">{empresa.telefono}</p>
            <p className="text-sm text-slate-500">{empresa.email}</p>
          </div>
          <div className="mt-4 sm:mt-0 text-left sm:text-right">
            <h2 className="text-3xl font-black text-slate-800">TICKET #{consecutivo}</h2>
            <p className="text-sm text-slate-500 mt-1 font-semibold">Fecha: {fechaStr}</p>
          </div>
        </div>

        {/* Info del Cliente */}
        <div className="mb-6 bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Datos del Cliente</h3>
          <p className="text-base font-bold text-slate-800">{alquiler.clienteNombre || "Cliente Mostrador"}</p>
          {alquiler.clienteId && <p className="text-sm text-slate-600 mt-1">ID Cliente: {alquiler.clienteId}</p>}
        </div>

        {/* Detalles de Equipos */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="py-2 text-sm font-bold text-slate-700">Equipo</th>
                <th className="py-2 text-sm font-bold text-slate-700 text-center">Cant.</th>
                <th className="py-2 text-sm font-bold text-slate-700 text-right">Días Est.</th>
                <th className="py-2 text-sm font-bold text-slate-700 text-right">Tarifa/Día</th>
                <th className="py-2 text-sm font-bold text-slate-700 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {alquiler.detalles?.map((item: any, i: number) => {
                const subtotalLinea = item.subtotalLineaEstimado || (item.cantidad * (item.tarifaAplicada || 0)); // Respaldo pasivo
                const start = item.fechaInicio ? new Date(item.fechaInicio) : new Date();
                const end = item.fechaFinEstimada ? new Date(item.fechaFinEstimada) : new Date();
                const dias = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                
                return (
                  <tr key={i}>
                    <td className="py-3 text-sm text-slate-800 font-semibold">{item.nombreItem || "Equipo"}</td>
                    <td className="py-3 text-sm text-slate-600 text-center">{item.cantidad}</td>
                    <td className="py-3 text-sm text-slate-600 text-right">{dias}</td>
                    <td className="py-3 text-sm text-slate-600 text-right">{formatearMoneda(item.tarifaAplicada || 0)}</td>
                    <td className="py-3 text-sm font-bold text-slate-800 text-right">{formatearMoneda(subtotalLinea)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales y Notas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
          {/* Notas Comerciales / Legales */}
          <div className="w-full sm:w-1/2 text-xs text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="font-bold mb-1 text-slate-700">Términos y Condiciones:</p>
            <p>{empresa.notasFacturaPDF}</p>
            {empresa.cuentaBancariaInfo && (
              <p className="mt-2 text-brand-salmon font-semibold">{empresa.cuentaBancariaInfo}</p>
            )}
            <p className="mt-3 italic font-semibold">¡Gracias por preferir a {empresa.razonSocial}!</p>
          </div>

          {/* Resumen Financiero */}
          <div className="w-full sm:w-1/3 space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal Equipos:</span>
              <span className="font-semibold">{formatearMoneda(alquiler.subtotalEquiposEstimado || 0)}</span>
            </div>
            {fletes > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Fletes Logística:</span>
                <span className="font-semibold">{formatearMoneda(fletes)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-amber-600">
              <span>Anticipo / Depósito:</span>
              <span className="font-bold">- {formatearMoneda(alquiler.deposito || 0)}</span>
            </div>
            <div className="flex justify-between text-lg font-black border-t-2 border-slate-300 pt-2 mt-2">
              <span className="text-slate-800">TOTAL A PAGAR:</span>
              <span className="text-brand-salmon">{formatearMoneda(alquiler.totalEstimado || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
