"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { CrearAlquilerUseCase } from '../../core/application/use-cases/crear-alquiler.use-case';
import { ZustandAlquilerRepository } from '../../infrastructure/adapters/ZustandAlquilerRepository';
import { AlquilerEstado } from '../../core/domain/entities/alquiler';

const alquilerSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  fleteEntrega: z.number().min(0),
  fleteRecogida: z.number().min(0),
  deposito: z.number().min(0),
  garantiaMonto: z.number().min(0),
  garantiaTipo: z.string().min(1),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Seleccione un equipo'),
    cantidad: z.number().min(1, 'Mínimo 1'),
    diasContratados: z.number().min(1, 'Mínimo 1 día'),
    fechaInicio: z.string().min(1, 'Requerida')
  })).min(1, 'Agregue al menos un equipo')
});

type AlquilerFormValues = z.infer<typeof alquilerSchema>;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AlquilerForm({ onSuccess, onCancel }: Props) {
  const { clientes } = useClienteStore();
  const { equipos } = useBodegaStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<AlquilerFormValues>({
    resolver: zodResolver(alquilerSchema),
    defaultValues: {
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      deposito: 50000,
      garantiaMonto: 300000,
      garantiaTipo: 'Efectivo',
      items: [{ itemId: '', cantidad: 1, diasContratados: 3, fechaInicio: todayStr }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Eliminado el fetch de stores ya que la UI antigua usaba Zustand sincrono

  const onSubmit = async (data: AlquilerFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const repo = new ZustandAlquilerRepository();
      const useCase = new CrearAlquilerUseCase(repo);

      const cliente = clientes.find(c => c.id === data.clienteId);
      
      const itemsConDetalles = data.items.map(item => {
        const equipo = equipos.find(e => e.id === item.itemId);
        if (!equipo) throw new Error("Equipo no encontrado");
        return {
          itemId: item.itemId,
          nombreItem: equipo.nombre,
          cantidad: item.cantidad,
          tarifaAplicada: equipo.tarifaDiaria,
          pesoKilos: 0, // Ignoramos el peso como se solicitó
          diasContratados: item.diasContratados,
          fechaInicio: item.fechaInicio
        };
      });

      await useCase.execute({
        clienteId: data.clienteId,
        clienteNombre: cliente?.nombre,
        fleteEntrega: data.fleteEntrega,
        fleteRecogida: data.fleteRecogida,
        deposito: data.deposito,
        garantiaMonto: data.garantiaMonto,
        garantiaTipo: data.garantiaTipo,
        observaciones: data.observaciones,
        detallesLogistica: data.detallesLogistica,
        items: itemsConDetalles
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errorMsg && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Cliente</label>
          <select 
            {...register('clienteId')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="">Seleccione un cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errors.clienteId && <span className="text-xs text-red-500">{errors.clienteId.message}</span>}
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Garantía Tipo</label>
          <select 
            {...register('garantiaTipo')}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Pagaré">Pagaré</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Garantía Monto ($)</label>
          <input type="number" {...register('garantiaMonto', { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Depósito ($)</label>
          <input type="number" {...register('deposito', { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Flete Entrega ($)</label>
          <input type="number" {...register('fleteEntrega', { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Flete Recogida ($)</label>
          <input type="number" {...register('fleteRecogida', { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Equipos a Alquilar</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Equipo</label>
              <select {...register(`items.${index}.itemId` as const)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900">
                <option value="">Seleccione equipo...</option>
                {equipos.map(e => (
                  <option key={e.id} value={e.id}>{e.sku} - {e.nombre} (${e.tarifaDiaria}/día)</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Cantidad</label>
              <input type="number" {...register(`items.${index}.cantidad` as const, { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Días</label>
              <input type="number" {...register(`items.${index}.diasContratados` as const, { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
            </div>
            <div>
              <button type="button" onClick={() => remove(index)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium w-full hover:bg-red-200 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => append({ itemId: '', cantidad: 1, diasContratados: 3, fechaInicio: todayStr })} className="text-sm font-medium text-brand-salmon hover:text-brand-salmonDark">
          + Añadir otro equipo
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Observaciones</label>
        <textarea {...register('observaciones')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 h-20"></textarea>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-brand-salmon text-white rounded-lg hover:bg-brand-salmonDark transition-colors font-medium text-sm flex items-center justify-center min-w-[120px]">
          {isSubmitting ? "Guardando..." : "Crear Contrato"}
        </button>
      </div>
    </form>
  );
}
