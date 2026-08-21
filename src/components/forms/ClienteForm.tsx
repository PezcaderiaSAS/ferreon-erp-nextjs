"use client";

import React, { useState } from 'react';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { Cliente } from '../../core/domain/entities/cliente';

const clienteSchema = z.object({
  nit: z.string().min(1, 'El NIT es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  contacto: z.string().min(1, 'El contacto es requerido'),
  nivel_riesgo: z.enum(['Bajo', 'Medio', 'Alto'])
});

interface ClienteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const [nit, setNit] = useState('');
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [nivelRiesgo, setNivelRiesgo] = useState<'Bajo' | 'Medio' | 'Alto'>('Bajo');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = clienteSchema.safeParse({
      nit,
      nombre,
      contacto,
      nivel_riesgo: nivelRiesgo
    });

    if (!validation.success) {
      const errMap: { [key: string]: string } = {};
      validation.error.issues.forEach(iss => {
        if (iss.path[0]) {
          errMap[iss.path[0].toString()] = iss.message;
        }
      });
      setErrors(errMap);
      return;
    }

    setIsSubmitting(true);
    try {
      const nuevoCliente: Cliente = {
        id: Math.random().toString(36).substr(2, 9),
        nit: validation.data.nit,
        nombre: validation.data.nombre,
        contacto: validation.data.contacto,
        nivel_riesgo: validation.data.nivel_riesgo,
        creado_en: new Date()
      };
      
      useClienteStore.getState().agregarCliente(nuevoCliente);
      onSuccess();
    } catch (error) {
      console.error('Error al crear cliente:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">NIT / Documento</label>
        <input 
          type="text"
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: 900.123.456-1"
        />
        {errors.nit && <span className="text-xs text-red-500">{errors.nit}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nombre / Razón Social</label>
        <input 
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: Constructora ABC"
        />
        {errors.nombre && <span className="text-xs text-red-500">{errors.nombre}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Contacto</label>
        <input 
          type="text"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: 310-555-0199"
        />
        {errors.contacto && <span className="text-xs text-red-500">{errors.contacto}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nivel de Riesgo</label>
        <select 
          value={nivelRiesgo}
          onChange={(e) => setNivelRiesgo(e.target.value as any)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 bg-white"
        >
          <option value="Bajo">Bajo</option>
          <option value="Medio">Medio</option>
          <option value="Alto">Alto</option>
        </select>
        {errors.nivel_riesgo && <span className="text-xs text-red-500">{errors.nivel_riesgo}</span>}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold bg-brand-salmon hover:bg-brand-salmonDark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
        </button>
      </div>
    </form>
  );
}
