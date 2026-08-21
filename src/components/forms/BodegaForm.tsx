'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CrearEquipoUseCase } from '../../core/application/use-cases/bodega/CrearEquipo';
import { SupabaseEquipoRepository } from '../../infrastructure/adapters/SupabaseEquipoRepository';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { Button } from '../ui/Button';
import { generateIdempotencyKey } from '../../lib/utils/idempotency';

const equipoSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  tarifaDiaria: z.coerce.number().min(0, 'La tarifa debe ser mayor o igual a 0'),
  stockInicial: z.coerce.number().int().min(1, 'El stock inicial debe ser al menos 1')
});

type EquipoFormValues = z.infer<typeof equipoSchema>;

interface BodegaFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BodegaForm({ onSuccess, onCancel }: BodegaFormProps) {
  const { generarSiguienteSKU, agregarEquipo } = useBodegaStore();
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<EquipoFormValues>({
    resolver: zodResolver(equipoSchema),
    defaultValues: {
      sku: '',
      nombre: '',
      categoria: 'Construcción',
      tarifaDiaria: 35000,
      stockInicial: 1
    }
  });

  useEffect(() => {
    const nextSku = generarSiguienteSKU();
    setValue('sku', nextSku);
  }, [generarSiguienteSKU, setValue]);

  const onSubmit = async (data: EquipoFormValues) => {
    const idempotencyKey = generateIdempotencyKey('eq');
    try {
      // 1. Optimistic local update in Zustand store with stock
      const newEquipo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `temp_${Date.now()}`,
        sku: data.sku,
        nombre: data.nombre,
        categoria: data.categoria,
        tarifaDiaria: data.tarifaDiaria,
        stockTotal: data.stockInicial,
        stockDisponible: data.stockInicial,
        stockEnObra: 0,
        estado: 'Disponible' as const,
        creado_en: new Date()
      };
      agregarEquipo(newEquipo, idempotencyKey);

      // 2. Persist to Supabase in background
      try {
        const repository = new SupabaseEquipoRepository();
        const useCase = new CrearEquipoUseCase(repository);
        await useCase.execute({
          sku: data.sku,
          nombre: data.nombre,
          categoria: data.categoria
        });
      } catch (repoErr) {
        console.warn('[BodegaForm] Supabase fallback/offline mode active:', repoErr);
      }

      onSuccess();
    } catch (error) {
      console.error('Error al crear equipo:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>Código / SKU</span>
            <span className="text-[10px] bg-brand-salmonLight text-brand-salmonDark px-1.5 py-0.5 rounded font-normal">Autogenerado</span>
          </label>
          <input 
            {...register('sku')}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-mono bg-slate-50 font-bold"
            placeholder="Ej: EQ-001"
          />
          {errors.sku && <span className="text-xs text-red-500">{errors.sku.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</label>
          <select 
            {...register('categoria')}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 bg-white"
          >
            <option value="Construcción">Construcción</option>
            <option value="Herramientas Eléctricas">Herramientas Eléctricas</option>
            <option value="Maquinaria Pesada">Maquinaria Pesada</option>
            <option value="Andamios & Estructuras">Andamios & Estructuras</option>
            <option value="Equipos de Medición">Equipos de Medición</option>
          </select>
          {errors.categoria && <span className="text-xs text-red-500">{errors.categoria.message}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre del Equipo</label>
        <input 
          {...register('nombre')}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: Mezcladora de Concreto 2 Bultos"
        />
        {errors.nombre && <span className="text-xs text-red-500">{errors.nombre.message}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tarifa Diaria ($ COP)</label>
          <input 
            type="number"
            {...register('tarifaDiaria')}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-semibold"
            placeholder="35000"
          />
          {errors.tarifaDiaria && <span className="text-xs text-red-500">{errors.tarifaDiaria.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <span>Stock Inicial en Bodega</span>
            <span className="text-slate-400 text-xs font-normal">(Unidades)</span>
          </label>
          <input 
            type="number"
            {...register('stockInicial')}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-bold text-emerald-700 bg-emerald-50/30"
            placeholder="1"
          />
          {errors.stockInicial && <span className="text-xs text-red-500">{errors.stockInicial.message}</span>}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <Button 
          type="submit" 
          isLoading={isSubmitting}
          className="min-w-[150px]"
        >
          Guardar Equipo
        </Button>
      </div>
    </form>
  );
}
