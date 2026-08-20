"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { Cliente } from '../../core/domain/entities/Cliente';

const clienteSchema = z.object({
  nit: z.string().min(1, 'El NIT es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  contacto: z.string().min(1, 'El contacto es requerido'),
  nivel_riesgo: z.enum(['Bajo', 'Medio', 'Alto'])
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ClienteForm({ onSuccess, onCancel }: ClienteFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nivel_riesgo: 'Bajo'
    }
  });

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      // Simulate use case / repository adapter
      const nuevoCliente: Cliente = {
        id: Math.random().toString(36).substr(2, 9),
        nit: data.nit,
        nombre: data.nombre,
        contacto: data.contacto,
        nivel_riesgo: data.nivel_riesgo,
        creado_en: new Date()
      };
      
      useClienteStore.getState().agregarCliente(nuevoCliente);
      onSuccess();
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">NIT / Documento</label>
        <input 
          {...register('nit')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: 900.123.456-1"
        />
        {errors.nit && <span className="text-xs text-red-500">{errors.nit.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nombre / Razón Social</label>
        <input 
          {...register('nombre')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: Constructora ABC"
        />
        {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Contacto</label>
        <input 
          {...register('contacto')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: 310-555-0199"
        />
        {errors.contacto && <span className="text-xs text-red-500">{errors.contacto.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nivel de Riesgo</label>
        <select 
          {...register('nivel_riesgo')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 bg-white"
        >
          <option value="Bajo">Bajo</option>
          <option value="Medio">Medio</option>
          <option value="Alto">Alto</option>
        </select>
        {errors.nivel_riesgo && <span className="text-xs text-red-500">{errors.nivel_riesgo.message}</span>}
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
