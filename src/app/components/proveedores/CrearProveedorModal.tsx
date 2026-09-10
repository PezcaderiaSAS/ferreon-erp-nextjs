"use client";

import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { crearProveedorAction, ProveedorUI } from '../../actions/proveedores';
import { useToastStore } from '../../../infrastructure/state/toastStore';

interface CrearProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProveedorCreado?: (proveedor: ProveedorUI) => void;
}

export function CrearProveedorModal({
  isOpen,
  onClose,
  onProveedorCreado
}: CrearProveedorModalProps) {
  const { showSuccessToast, showErrorToast } = useToastStore();

  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [diasCredito, setDiasCredito] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = () => {
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
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('La razón social o nombre del proveedor es obligatorio.');
      return;
    }
    if (!nit.trim()) {
      setErrorMsg('El NIT o documento del proveedor es obligatorio.');
      return;
    }

    setIsSubmitting(true);
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
        observaciones: observaciones.trim() || undefined
      });

      if (res.success && res.data) {
        showSuccessToast(`Proveedor "${res.data.nombre}" registrado exitosamente.`);
        if (onProveedorCreado) {
          onProveedorCreado(res.data);
        }
        handleClose();
      } else {
        setErrorMsg(res.error || 'No se pudo registrar el proveedor');
        showErrorToast(res.error || 'Error al guardar el proveedor');
      }
    } catch (err: any) {
      console.error('Error en CrearProveedorModal:', err);
      setErrorMsg('Error de comunicación con el servidor.');
      showErrorToast('Error de red al registrar proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Nuevo Proveedor" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-3 p-3.5 bg-red-50/90 border border-red-200 rounded-xl text-red-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre / Razón Social */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Razón Social / Proveedor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Maquinaria & Equipos Colombia S.A.S."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* NIT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              NIT / Identificación <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="900.123.456-1"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Persona de Contacto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Persona de Contacto / Asesor
            </label>
            <input
              type="text"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="Ej. Carlos Mendoza"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Teléfono / Celular
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="310 123 4567"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ventas@proveedor.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Dirección
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle 13 # 68-20"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ciudad
            </label>
            <input
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Bogotá, Medellín, etc."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>

          {/* Días de Crédito */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Días de Crédito Pactados
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={diasCredito}
                onChange={(e) => setDiasCredito(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              >
                <option value={0}>0 días (Contado inmediato)</option>
                <option value={15}>15 días</option>
                <option value={30}>30 días (Mes comercial)</option>
                <option value={45}>45 días</option>
                <option value={60}>60 días</option>
                <option value={90}>90 días</option>
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Línea de productos, condiciones de despacho o descuentos comerciales..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 hover:shadow-lg active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando Proveedor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardar Proveedor
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
