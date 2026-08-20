"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CrearEquipoUseCase } from '../../core/application/use-cases/bodega/CrearEquipo';
import { SupabaseEquipoRepository } from '../../infrastructure/adapters/SupabaseEquipoRepository';

const equipoSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida')
});

type EquipoFormValues = z.infer<typeof equipoSchema>;

interface BodegaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BodegaForm({ onSuccess, onCancel }: BodegaFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EquipoFormValues>({
    resolver: zodResolver(equipoSchema),
  });

  const onSubmit = async (data: EquipoFormValues) => {
    try {
      const repository = new SupabaseEquipoRepository();
      const useCase = new CrearEquipoUseCase(repository);
      
      await useCase.execute({
        sku: data.sku,
        nombre: data.nombre,
        categoria: data.categoria
      });

      onSuccess();
    } catch (error) {
      console.error('Error al crear equipo:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">SKU / Código</label>
        <input 
          {...register('sku')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: TAL-001"
        />
        {errors.sku && <span className="text-xs text-red-500">{errors.sku.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Nombre del Equipo</label>
        <input 
          {...register('nombre')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: Taladro Percutor Industrial"
        />
        {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Categoría</label>
        <select 
          {...register('categoria')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 bg-white"
        >
          <option value="">Seleccione una categoría</option>
          <option value="Herramientas Eléctricas">Herramientas Eléctricas</option>
          <option value="Construcción">Construcción</option>
          <option value="Maquinaria Pesada">Maquinaria Pesada</option>
        </select>
        {errors.categoria && <span className="text-xs text-red-500">{errors.categoria.message}</span>}
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
          {isSubmitting ? 'Guardando...' : 'Guardar Equipo'}
        </button>
      </div>
    </form>
  );
}
