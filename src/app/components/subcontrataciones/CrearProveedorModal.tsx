"use client";

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Building2, User, Phone, Mail, MapPin, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { crearProveedorAction, ProveedorUI } from '@/app/actions/proveedores';
import { useProveedorStore } from '@/infrastructure/state/proveedorStore';

interface CrearProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (nuevoProveedor: ProveedorUI) => void;
}

export function CrearProveedorModal({ isOpen, onClose, onSuccess }: CrearProveedorModalProps) {
  const { agregarProveedor } = useProveedorStore();

  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [diasCredito, setDiasCredito] = useState(0);
  const [observaciones, setObservaciones] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setNit('');
    setContacto('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setCiudad('');
    setDiasCredito(0);
    setObservaciones('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('La razón social o nombre comercial es obligatoria.');
      return;
    }
    if (!nit.trim()) {
      setErrorMsg('El NIT o documento fiscal es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await crearProveedorAction({
        nombre: nombre.trim(),
        nit: nit.trim(),
        contacto: contacto.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        direccion: direccion.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        diasCredito: Number(diasCredito) || 0,
        observaciones: observaciones.trim() || undefined,
      });

      if (res.success && res.data) {
        agregarProveedor(res.data);
        if (onSuccess) {
          onSuccess(res.data);
        }
        handleClose();
      } else {
        setErrorMsg(res.error || 'No fue posible guardar el proveedor');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al conectar con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Aliado / Proveedor" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-800 dark:text-slate-100">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              Razón Social / Nombre Comercial *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Maquinaria Andina S.A.S."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIT / Documento Fiscal *
            </label>
            <input
              type="text"
              required
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="900.123.456-7"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Contacto Comercial
            </label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej: Ing. Carlos Pérez"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="310 123 4567"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@proveedor.com"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Dirección
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle 10 # 20-30"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Días de Crédito
            </label>
            <input
              type="number"
              min="0"
              value={diasCredito}
              onChange={(e) => setDiasCredito(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0 (Contado)"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observaciones / Equipos que suministra
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Especialistas en minicargadores, plantas eléctricas de más de 50kVA..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Aliado</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
