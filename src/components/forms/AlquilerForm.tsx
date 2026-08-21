"use client";

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { CrearAlquilerUseCase } from '../../core/application/use-cases/crear-alquiler.use-case';
import { EditarAlquilerUseCase } from '../../core/application/use-cases/editar-alquiler.use-case';
import { ZustandAlquilerRepository } from '../../infrastructure/adapters/ZustandAlquilerRepository';
import { AlquilerEntity } from '../../core/domain/entities/alquiler';
import { Button } from '../ui/Button';
import { generateIdempotencyKey } from '../../lib/utils/idempotency';

const alquilerSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  fechaRegistro: z.string().min(1, 'La fecha de registro es requerida'),
  fleteEntrega: z.number().min(0),
  fleteRecogida: z.number().min(0),
  deposito: z.number().min(0),
  garantiaMonto: z.number().min(0),
  garantiaTipo: z.string(),
  observaciones: z.string().optional(),
  detallesLogistica: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().min(1, 'Seleccione un equipo'),
    cantidad: z.number().min(1, 'Cantidad mnima 1'),
    fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
    fechaFinEstimada: z.string().min(1, 'Fecha fin estimada requerida'),
  })).min(1, 'Debe agregar al menos un equipo')
});

type AlquilerFormValues = z.infer<typeof alquilerSchema>;

interface Props {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AlquilerForm({ initialData, onSuccess, onCancel }: Props) {
  const { clientes } = useClienteStore();
  const { equipos } = useBodegaStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AlquilerFormValues>({
    resolver: zodResolver(alquilerSchema),
    defaultValues: initialData ? {
      clienteId: initialData.clienteId,
      fechaRegistro: initialData.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : todayStr,
      fleteEntrega: initialData.fleteEntrega || 0,
      fleteRecogida: initialData.fleteRecogida || 0,
      deposito: initialData.deposito || 0,
      garantiaMonto: initialData.garantiaMonto || 0,
      garantiaTipo: initialData.garantiaTipo || 'Efectivo',
      observaciones: initialData.observacionesGenerales || '',
      detallesLogistica: initialData.detallesLogistica || '',
      items: initialData.detalles?.map((d: any) => ({
        itemId: d.itemId,
        cantidad: d.cantidad,
        fechaInicio: d.fechaInicio ? new Date(d.fechaInicio).toISOString().split('T')[0] : todayStr,
        fechaFinEstimada: d.fechaFinEstimada ? new Date(d.fechaFinEstimada).toISOString().split('T')[0] : todayStr,
      })) || [{ itemId: '', cantidad: 1, fechaInicio: todayStr, fechaFinEstimada: todayStr }]
    } : {
      fechaRegistro: todayStr,
      fleteEntrega: 30000,
      fleteRecogida: 30000,
      deposito: 50000,
      garantiaMonto: 300000,
      garantiaTipo: 'Efectivo',
      items: [{ itemId: '', cantidad: 1, fechaInicio: todayStr, fechaFinEstimada: todayStr }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const selectedClienteId = watch('clienteId');
  const watchedItems = watch('items');

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) || c.nit.includes(clientSearchTerm));
  }, [clientes, clientSearchTerm]);

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  // Calcular el total estimado en tiempo real
  const totalEstimado = useMemo(() => {
    const fletes = (watch('fleteEntrega') || 0) + (watch('fleteRecogida') || 0);
    const deposito = watch('deposito') || 0;
    
    const subtotalItems = watchedItems.reduce((acc, item) => {
      if (!item.itemId || !item.fechaInicio || !item.fechaFinEstimada) return acc;
      const equipo = equipos.find(e => e.id === item.itemId);
      if (!equipo) return acc;
      
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 0) dias = 1;

      return acc + (equipo.tarifaDiaria * item.cantidad * dias);
    }, 0);

    return Math.max(0, subtotalItems + fletes - deposito);
  }, [watchedItems, equipos, watch]);

  const onSubmit = async (data: AlquilerFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    const idempotencyKey = generateIdempotencyKey('alq');
    try {
      const repo = new ZustandAlquilerRepository();
      const cliente = clientes.find(c => c.id === data.clienteId);
      
      const itemsConDetalles = data.items.map(item => {
        const equipo = equipos.find(e => e.id === item.itemId);
        if (!equipo) throw new Error("Equipo no encontrado");
        return {
          itemId: item.itemId,
          nombreItem: equipo.nombre,
          cantidad: item.cantidad,
          tarifaAplicada: equipo.tarifaDiaria,
          fechaInicio: item.fechaInicio,
          fechaFinEstimada: item.fechaFinEstimada
        };
      });

      if (initialData) {
        const useCase = new EditarAlquilerUseCase(repo);
        await useCase.execute({
          alquilerId: initialData.id,
          fleteEntrega: data.fleteEntrega,
          fleteRecogida: data.fleteRecogida,
          deposito: data.deposito,
          garantiaMonto: data.garantiaMonto,
          garantiaTipo: data.garantiaTipo,
          observaciones: data.observaciones,
          detallesLogistica: data.detallesLogistica,
          items: itemsConDetalles
        });
      } else {
        const useCase = new CrearAlquilerUseCase(repo);
        await useCase.execute({
          clienteId: data.clienteId,
          clienteNombre: cliente?.nombre,
          fechaRegistro: data.fechaRegistro,
          fleteEntrega: data.fleteEntrega,
          fleteRecogida: data.fleteRecogida,
          deposito: data.deposito,
          garantiaMonto: data.garantiaMonto,
          garantiaTipo: data.garantiaTipo,
          observaciones: data.observaciones,
          detallesLogistica: data.detallesLogistica,
          items: itemsConDetalles
        });
      }

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
        {/* Buscador Asistido de Clientes */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-sm font-medium text-slate-700">Cliente (Buscador)</label>
          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={isClientDropdownOpen ? clientSearchTerm : (selectedCliente?.nombre || '')}
              onChange={(e) => {
                setClientSearchTerm(e.target.value);
                if(!isClientDropdownOpen) setIsClientDropdownOpen(true);
              }}
              onFocus={() => setIsClientDropdownOpen(true)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 w-full"
            />
            {isClientDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredClientes.map(c => (
                  <div 
                    key={c.id} 
                    className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                    onClick={() => {
                      setValue('clienteId', c.id);
                      setClientSearchTerm('');
                      setIsClientDropdownOpen(false);
                    }}
                  >
                    <span className="font-semibold">{c.nombre}</span> <span className="text-slate-400 text-xs">({c.nit})</span>
                  </div>
                ))}
                {filteredClientes.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-500">No se encontraron clientes.</div>
                )}
              </div>
            )}
          </div>
          <input type="hidden" {...register('clienteId')} />
          {errors.clienteId && <span className="text-xs text-red-500">{errors.clienteId.message}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Fecha de Registro</label>
          <input type="date" {...register('fechaRegistro')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900" />
          {errors.fechaRegistro && <span className="text-xs text-red-500">{errors.fechaRegistro.message}</span>}
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
        <h3 className="text-sm font-bold text-slate-800 mb-3">Equipos a Alquilar (Fechas Independientes)</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row flex-wrap gap-3 items-end mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex-1 min-w-[200px] flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Equipo</label>
              <select {...register(`items.${index}.itemId` as const)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 w-full">
                <option value="">Seleccione equipo...</option>
                {equipos.map(e => (
                  <option key={e.id} value={e.id}>{e.sku} - {e.nombre} (${e.tarifaDiaria}/día)</option>
                ))}
              </select>
            </div>
            <div className="w-[80px] flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Cant.</label>
              <input type="number" {...register(`items.${index}.cantidad` as const, { valueAsNumber: true })} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 w-full" />
            </div>
            <div className="w-[140px] flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Inicio</label>
              <input type="date" {...register(`items.${index}.fechaInicio` as const)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 w-full" />
            </div>
            <div className="w-[140px] flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Fin Estimado</label>
              <input type="date" {...register(`items.${index}.fechaFinEstimada` as const)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 w-full" />
            </div>
            <div className="w-full sm:w-auto">
              <button type="button" onClick={() => remove(index)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium w-full hover:bg-red-200 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mt-2">
          <button type="button" onClick={() => append({ itemId: '', cantidad: 1, fechaInicio: todayStr, fechaFinEstimada: todayStr })} className="text-sm font-medium text-brand-salmon hover:text-brand-salmonDark">
            + Añadir otro equipo
          </button>
          
          <div className="text-right">
            <span className="text-xs text-slate-500 mr-2">Total Estimado Inicial:</span>
            <span className="text-lg font-bold text-slate-800">${totalEstimado.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">Observaciones</label>
        <textarea {...register('observaciones')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 h-20"></textarea>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium text-sm">
          Cancelar
        </button>
        <Button type="submit" isLoading={isSubmitting} className="min-w-[140px]">
          {initialData ? "Guardar Cambios" : "Crear Contrato"}
        </Button>
      </div>
    </form>
  );
}
