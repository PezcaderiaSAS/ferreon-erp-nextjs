'use client';

import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { CrearEquipoUseCase } from '../../core/application/use-cases/bodega/CrearEquipo';
import { SupabaseEquipoRepository } from '../../infrastructure/adapters/SupabaseEquipoRepository';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { Button } from '../ui/Button';
import { idempotencyManager } from '../../lib/idempotency';
import { Equipo } from '../../core/domain/entities/equipo';

const equipoSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  tarifaDiaria: z.number().min(0, 'La tarifa debe ser mayor o igual a 0'),
  stockInicial: z.number().int().min(1, 'El stock inicial debe ser al menos 1')
});

interface BodegaFormProps {
  onSuccess: (equipo?: Equipo) => void;
  onCancel: () => void;
}

export function BodegaForm({ onSuccess, onCancel }: BodegaFormProps) {
  const { generarSiguienteSKU, agregarEquipo } = useBodegaStore();
  
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Construcción');
  const [tarifaDiaria, setTarifaDiaria] = useState<number>(35000);
  const [stockInicial, setStockInicial] = useState<number>(1);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey] = useState(() => idempotencyManager.generateKey());

  useEffect(() => {
    const nextSku = generarSiguienteSKU();
    setSku(nextSku);
  }, [generarSiguienteSKU]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = equipoSchema.safeParse({
      sku,
      nombre,
      categoria,
      tarifaDiaria,
      stockInicial
    });

    if (!validation.success) {
      const formattedErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          formattedErrors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(formattedErrors);
      return;
    }

    if (!idempotencyManager.processKey(idempotencyKey)) {
      console.warn("Transacción bloqueada por IdempotencyManager (doble clic detectado)");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Optimistic local update in Zustand store with stock
      const newEquipo = {
        id: crypto.randomUUID ? crypto.randomUUID() : `temp_${Date.now()}`,
        codigo: validation.data.sku,
        sku: validation.data.sku,
        nombre: validation.data.nombre,
        categoria: validation.data.categoria,
        tarifa_diaria: validation.data.tarifaDiaria,
        tarifaDiaria: validation.data.tarifaDiaria,
        stock_total: validation.data.stockInicial,
        stockTotal: validation.data.stockInicial,
        stock_disponible: validation.data.stockInicial,
        stockDisponible: validation.data.stockInicial,
        stock_en_obra: 0,
        stockEnObra: 0,
        estado: 'Disponible' as const,
        created_at: new Date().toISOString(),
        creado_en: new Date(),
      };
      agregarEquipo(newEquipo, idempotencyKey);

      // 2. Persist to Supabase in background
      try {
        const repository = new SupabaseEquipoRepository();
        const useCase = new CrearEquipoUseCase(repository);
        await useCase.execute({
          sku: validation.data.sku,
          nombre: validation.data.nombre,
          categoria: validation.data.categoria
        });
      } catch (repoErr) {
        console.error("Error guardando en Supabase, pero el estado local se actualizó:", repoErr);
      }
      onSuccess(newEquipo as unknown as Equipo);
    } catch (error) {
      idempotencyManager.removeKey(idempotencyKey);
      console.error('Error al crear equipo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>Código / SKU</span>
            <span className="text-[10px] bg-brand-salmonLight text-brand-salmonDark px-1.5 py-0.5 rounded font-normal">Autogenerado</span>
          </label>
          <input 
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-mono bg-slate-50 font-bold"
            placeholder="Ej: EQ-001"
          />
          {formErrors.sku && <span className="text-xs text-red-500">{formErrors.sku}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</label>
          <select 
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 bg-white"
          >
            <option value="Construcción">Construcción</option>
            <option value="Herramientas Eléctricas">Herramientas Eléctricas</option>
            <option value="Maquinaria Pesada">Maquinaria Pesada</option>
            <option value="Andamios & Estructuras">Andamios & Estructuras</option>
            <option value="Equipos de Medición">Equipos de Medición</option>
          </select>
          {formErrors.categoria && <span className="text-xs text-red-500">{formErrors.categoria}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nombre del Equipo</label>
        <input 
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900"
          placeholder="Ej: Mezcladora de Concreto 2 Bultos"
        />
        {formErrors.nombre && <span className="text-xs text-red-500">{formErrors.nombre}</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tarifa Diaria ($ COP)</label>
          <input 
            type="number"
            min="0"
            value={tarifaDiaria}
            onChange={(e) => setTarifaDiaria(parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-semibold"
            placeholder="35000"
          />
          {formErrors.tarifaDiaria && <span className="text-xs text-red-500">{formErrors.tarifaDiaria}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <span>Stock Inicial en Bodega</span>
            <span className="text-slate-400 text-xs font-normal">(Unidades)</span>
          </label>
          <input 
            type="number"
            min="1"
            value={stockInicial}
            onChange={(e) => setStockInicial(parseInt(e.target.value, 10) || 1)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-salmon focus:border-brand-salmon text-sm text-slate-900 font-bold text-emerald-700 bg-emerald-50/30"
            placeholder="1"
          />
          {formErrors.stockInicial && <span className="text-xs text-red-500">{formErrors.stockInicial}</span>}
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

