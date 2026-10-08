'use client';

import React, { useState, useTransition } from 'react';
import { User, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { updateRentalClientAction } from '@/app/actions/alquileres';
import { crearClienteAction } from '@/app/actions/clientes';

export interface ChangeClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  alquilerId: string | number;
  clienteActualId?: string | number;
  clienteActualNombre?: string;
  onSuccess?: () => void;
}

export function ChangeClientModal({
  isOpen,
  onClose,
  alquilerId,
  clienteActualId,
  clienteActualNombre,
  onSuccess,
}: ChangeClientModalProps) {
  const { clientes, agregarCliente } = useClienteStore();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado del combobox
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Estado del formulario "On-The-Fly"
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientNombre, setNewClientNombre] = useState('');
  const [newClientNit, setNewClientNit] = useState('');
  const [newClientTelefono, setNewClientTelefono] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  const resetForm = () => {
    setSelectedClientId('');
    setShowNewClientForm(false);
    setNewClientNombre('');
    setNewClientNit('');
    setNewClientTelefono('');
    setNewClientEmail('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    if (isPending || isCreatingClient) return;
    resetForm();
    onClose();
  };

  const handleCreateClientAndSelect = async () => {
    if (!newClientNombre.trim()) {
      setErrorMsg('El nombre o razón social es obligatorio.');
      return;
    }
    if (!newClientNit.trim()) {
      setErrorMsg('El NIT/Cédula es obligatorio.');
      return;
    }

    setErrorMsg(null);
    setIsCreatingClient(true);
    try {
      const res = await crearClienteAction({
        nombre: newClientNombre,
        nit_cedula: newClientNit,
        telefono: newClientTelefono,
        email: newClientEmail,
        idempotency_key: crypto.randomUUID()
      });

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Error al crear el nuevo cliente');
        return;
      }

      agregarCliente(res.data as any); // Add to Zustand store
      setSelectedClientId(String(res.data.id));
      setShowNewClientForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado creando el cliente');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (showNewClientForm) {
      // Si está en modo crear, primero crearlo
      handleCreateClientAndSelect();
      return;
    }

    if (!selectedClientId) {
      setErrorMsg('Debe seleccionar un cliente.');
      return;
    }

    if (String(selectedClientId) === String(clienteActualId)) {
      setErrorMsg('El cliente seleccionado ya es el titular actual del alquiler.');
      return;
    }

    // Zero-Latency / Optimistic Transition
    startTransition(async () => {
      try {
        const res = await updateRentalClientAction({
          alquilerId,
          clienteId: selectedClientId,
          idempotencyKey: crypto.randomUUID(),
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al actualizar el cliente');
          return;
        }

        if (onSuccess) onSuccess();
        handleClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Ocurrió un error inesperado al procesar la solicitud.');
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar Titular del Alquiler"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-sm text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Atención:</strong> {errorMsg}
            </div>
          </div>
        )}

        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Cliente Actual:</p>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-800">
              {clienteActualNombre || 'Desconocido'}
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Nuevo Titular / Cliente
            </label>
            {!showNewClientForm && (
              <button
                type="button"
                onClick={() => setShowNewClientForm(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nuevo Cliente</span>
              </button>
            )}
          </div>

          {!showNewClientForm ? (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              disabled={isPending}
              className="w-full text-sm rounded-xl border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Buscar y seleccionar cliente existente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.nit_cedula ? `(${c.nit_cedula})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-100 shadow-2xs relative">
              <button
                type="button"
                onClick={() => setShowNewClientForm(false)}
                className="absolute top-3 right-3 text-[10px] text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancelar y Buscar
              </button>
              <h5 className="text-xs font-bold text-blue-700 mb-2 border-b border-blue-50 pb-2">Creación On-The-Fly</h5>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre / Razón Social <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newClientNombre}
                    onChange={(e) => setNewClientNombre(e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
                    placeholder="Ej. Constructora Andina"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIT / Cédula <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newClientNit}
                    onChange={(e) => setNewClientNit(e.target.value)}
                    className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
                    placeholder="Ej. 901234567-8"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={newClientTelefono}
                      onChange={(e) => setNewClientTelefono(e.target.value)}
                      className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs flex gap-2 items-start">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <p>
            Al confirmar, el alquiler se reasignará al nuevo cliente y <strong>el PDF del contrato se regenerará en segundo plano</strong> para reflejar los nuevos datos.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending || isCreatingClient}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isPending || isCreatingClient}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[150px]"
          >
            {(isPending || isCreatingClient) ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : showNewClientForm ? (
              "Crear y Seleccionar"
            ) : (
              "Confirmar Cambio"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
