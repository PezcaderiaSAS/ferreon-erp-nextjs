'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Cliente } from '../../../core/domain/entities/cliente';
import { useClienteStore } from '../../../infrastructure/state/clienteStore';
import { useAlquilerStore } from '../../../infrastructure/state/alquilerStore';

const clienteEditSchema = z.object({
  nombre: z.string().min(1, 'El nombre o razón social es requerido'),
  nit: z.string().min(1, 'El NIT o documento es requerido'),
  contacto: z.string().min(1, 'El teléfono de contacto es requerido'),
  email: z.string().email('Correo electrónico no válido').optional().or(z.literal('')),
  direccion: z.string().optional(),
  nivel_riesgo: z.enum(['Bajo', 'Medio', 'Alto'])
});

type ClienteEditFormValues = z.infer<typeof clienteEditSchema>;

interface DetalleClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export function DetalleClienteModal({
  isOpen,
  onClose,
  cliente
}: DetalleClienteModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'alquileres' | 'cartera'>('info');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const updateCliente = useClienteStore((state) => state.updateCliente);
  const alquileres = useAlquilerStore((state) => state.alquileres);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClienteEditFormValues>({
    resolver: zodResolver(clienteEditSchema)
  });

  useEffect(() => {
    if (cliente) {
      reset({
        nombre: cliente.nombre,
        nit: cliente.nit,
        contacto: cliente.contacto,
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        nivel_riesgo: cliente.nivel_riesgo || 'Bajo'
      });
      setActiveTab('info');
      setFeedbackSuccess(null);
    }
  }, [cliente, reset]);

  // Alquileres asociados al cliente
  const alquileresDelCliente = useMemo(() => {
    if (!cliente) return [];
    return alquileres.filter(
      (a) => a.clienteId === cliente.id || a.clienteNombre?.toLowerCase() === cliente.nombre.toLowerCase()
    );
  }, [alquileres, cliente]);

  // Resumen de Cartera Consolidada
  const resumenCartera = useMemo(() => {
    const totalContratado = alquileresDelCliente.reduce((acc, a) => acc + (a.subtotalGeneralEstimado || a.totalEstimado || 0), 0);
    const totalAnticipos = alquileresDelCliente.reduce((acc, a) => acc + (a.deposito || 0), 0);
    const saldoPendiente = alquileresDelCliente.reduce((acc, a) => acc + (a.totalEstimado || 0), 0);
    
    return {
      totalContratado,
      totalAnticipos,
      saldoPendiente,
      contratosActivosCount: alquileresDelCliente.filter(a => a.estado === 'ACTIVO').length
    };
  }, [alquileresDelCliente]);

  if (!cliente) return null;

  const onSubmitInfo = (data: ClienteEditFormValues) => {
    const updated: Cliente = {
      ...cliente,
      nombre: data.nombre,
      nit: data.nit,
      contacto: data.contacto,
      email: data.email || undefined,
      direccion: data.direccion || undefined,
      nivel_riesgo: data.nivel_riesgo
    };

    updateCliente(updated);
    setFeedbackSuccess('✓ Datos del cliente actualizados correctamente.');
    setTimeout(() => setFeedbackSuccess(null), 3500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ficha de Cliente: ${cliente.nombre}`}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-6">
        {/* Header Summary Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-salmon text-white flex items-center justify-center font-bold text-lg shadow-inner">
              {cliente.nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{cliente.nombre}</h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  cliente.nivel_riesgo === 'Bajo' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  cliente.nivel_riesgo === 'Medio' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  Riesgo {cliente.nivel_riesgo}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                NIT/Documento: <strong className="text-slate-200">{cliente.nit}</strong> | Contacto: <strong className="text-slate-200">{cliente.contacto}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Saldo en Cartera</span>
              <span className={`text-base font-bold ${resumenCartera.saldoPendiente > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${resumenCartera.saldoPendiente.toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-colors relative ${
              activeTab === 'info'
                ? 'text-brand-salmonDark border-b-2 border-brand-salmon'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>1. Información & Edición</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alquileres')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-colors relative ${
              activeTab === 'alquileres'
                ? 'text-brand-salmonDark border-b-2 border-brand-salmon'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history_edu</span>
            <span>2. Historial de Alquileres ({alquileresDelCliente.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cartera')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-colors relative ${
              activeTab === 'cartera'
                ? 'text-brand-salmonDark border-b-2 border-brand-salmon'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            <span>3. Cartera & Saldos</span>
          </button>
        </div>

        {/* Tab 1: Info and Editing */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit(onSubmitInfo)} className="flex flex-col gap-4">
            {feedbackSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>{feedbackSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Nombre / Razón Social</label>
                <input
                  {...register('nombre')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon font-semibold"
                />
                {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">NIT / Documento</label>
                <input
                  {...register('nit')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon font-mono font-medium"
                />
                {errors.nit && <span className="text-xs text-red-500">{errors.nit.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Teléfono / Celular de Contacto</label>
                <input
                  {...register('contacto')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                />
                {errors.contacto && <span className="text-xs text-red-500">{errors.contacto.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
                <input
                  type="email"
                  {...register('email')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  placeholder="ejemplo@empresa.com"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Dirección de Entrega / Despacho</label>
                <input
                  {...register('direccion')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                  placeholder="Calle 100 # 15-20, Bogotá"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600">Nivel de Riesgo Crediticio</label>
                <select
                  {...register('nivel_riesgo')}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon font-semibold"
                >
                  <option value="Bajo">Bajo (Cliente Confiable / Sin Mora)</option>
                  <option value="Medio">Medio (Retrasos ocasionales)</option>
                  <option value="Alto">Alto (Requiere 100% Garantía / Bloqueo)</option>
                </select>
                {errors.nivel_riesgo && <span className="text-xs text-red-500">{errors.nivel_riesgo.message}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="min-w-[170px]"
              >
                Guardar Información
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Rental History */}
        {activeTab === 'alquileres' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 font-semibold text-slate-600">ID Contrato</th>
                    <th className="py-3 px-3 font-semibold text-slate-600">Fecha Registro</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-center">Equipos</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-right">Monto Total</th>
                    <th className="py-3 px-3 font-semibold text-slate-600 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alquileresDelCliente.map((alq) => (
                    <tr key={alq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{alq.id || alq.consecutivo}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {alq.createdAt ? new Date(alq.createdAt).toLocaleDateString('es-CO') : 'Reciente'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {alq.detalles?.length || 0} máquina(s)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        ${(alq.totalEstimado || 0).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          alq.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' :
                          alq.estado === 'FINALIZADO' ? 'bg-blue-50 text-blue-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {alq.estado}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {alquileresDelCliente.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        <span className="material-symbols-outlined text-3xl text-slate-300 mb-1 block">receipt_long</span>
                        Este cliente no registra contratos de alquiler previos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Financials & Balance */}
        {activeTab === 'cartera' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Facturado</span>
                <p className="text-xl font-bold text-slate-900">${resumenCartera.totalContratado.toLocaleString('es-CO')}</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">Anticipos / Pagos Recibidos</span>
                <p className="text-xl font-bold text-emerald-800">${resumenCartera.totalAnticipos.toLocaleString('es-CO')}</p>
              </div>

              <div className={`rounded-2xl p-4 border ${
                resumenCartera.saldoPendiente > 0 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Saldo Consolidado Pendiente</span>
                <p className="text-xl font-bold">${resumenCartera.saldoPendiente.toLocaleString('es-CO')}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">info</span>
                <span>Contratos con equipos actualmente en posesión: <strong>{resumenCartera.contratosActivosCount}</strong></span>
              </div>
              <span className="font-bold text-slate-600">
                Estado Crediticio: {resumenCartera.saldoPendiente > 0 ? '⚠️ Saldo Pendiente' : '✅ Al Día'}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </Modal>
  );
}
