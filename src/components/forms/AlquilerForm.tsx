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
    cantidad: z.number().min(1, 'Cantidad mínima 1'),
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

const STEPS = [
  { id: 1, title: 'Cliente y Garantías', desc: 'Datos del cliente y pólizas' },
  { id: 2, title: 'Equipos y Logística', desc: 'Selección de maquinaria y fletes' },
  { id: 3, title: 'Resumen y Confirmación', desc: 'Observaciones y cálculo final' },
];

export function AlquilerForm({ initialData, onSuccess, onCancel }: Props) {
  const { clientes } = useClienteStore();
  const { equipos } = useBodegaStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const { register, control, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<AlquilerFormValues>({
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
  const fleteEntrega = watch('fleteEntrega') || 0;
  const fleteRecogida = watch('fleteRecogida') || 0;
  const deposito = watch('deposito') || 0;
  const garantiaMonto = watch('garantiaMonto') || 0;
  const garantiaTipo = watch('garantiaTipo') || 'Efectivo';

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
      c.nit.includes(clientSearchTerm)
    );
  }, [clientes, clientSearchTerm]);

  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  // Subtotal de equipos
  const subtotalEquipos = useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      if (!item.itemId || !item.fechaInicio || !item.fechaFinEstimada) return acc;
      const equipo = equipos.find(e => e.id === item.itemId);
      if (!equipo) return acc;
      
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 0) dias = 1;

      return acc + (equipo.tarifaDiaria * item.cantidad * dias);
    }, 0);
  }, [watchedItems, equipos]);

  const totalFletes = fleteEntrega + fleteRecogida;
  const totalGeneral = subtotalEquipos + totalFletes;
  const totalEstimado = Math.max(0, totalGeneral - deposito);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  const handleNextStep = async () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      const isValid = await trigger(['clienteId', 'fechaRegistro', 'garantiaTipo', 'garantiaMonto', 'deposito']);
      if (!isValid) return;
    } else if (currentStep === 2) {
      const isValid = await trigger(['items', 'fleteEntrega', 'fleteRecogida']);
      if (!isValid) return;
    }
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full space-y-6">
      {/* Wizard Progress Stepper */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white shadow-sm border border-brand-salmon/30 text-brand-salmon'
                    : isCompleted
                    ? 'text-emerald-700 hover:bg-white/60'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isActive
                      ? 'bg-brand-salmon text-white shadow-md shadow-brand-salmon/20'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold truncate">{step.title}</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block truncate">{step.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium flex items-center space-x-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: CLIENTE Y GARANTÍAS */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Identificación del Cliente y Fechas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Buscador Asistido de Clientes */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-xs font-bold text-slate-700">Cliente / Razón Social *</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Escriba para buscar por nombre o NIT..."
                    value={isClientDropdownOpen ? clientSearchTerm : (selectedCliente?.nombre || '')}
                    onChange={(e) => {
                      setClientSearchTerm(e.target.value);
                      if(!isClientDropdownOpen) setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all"
                  />
                  {isClientDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredClientes.map(c => (
                        <div 
                          key={c.id} 
                          className="px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors"
                          onClick={() => {
                            setValue('clienteId', c.id);
                            setClientSearchTerm('');
                            setIsClientDropdownOpen(false);
                          }}
                        >
                          <span className="font-bold text-slate-800">{c.nombre}</span>
                          <span className="text-slate-400 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">NIT: {c.nit}</span>
                        </div>
                      ))}
                      {filteredClientes.length === 0 && (
                        <div className="px-4 py-3 text-xs text-slate-400 text-center">No se encontraron clientes registrados.</div>
                      )}
                    </div>
                  )}
                </div>
                <input type="hidden" {...register('clienteId')} />
                {errors.clienteId && <span className="text-[11px] text-red-500 font-semibold">{errors.clienteId.message}</span>}
              </div>

              {/* Fecha de Registro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Fecha de Creación del Contrato *</label>
                <input 
                  type="date" 
                  {...register('fechaRegistro')} 
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
                {errors.fechaRegistro && <span className="text-[11px] text-red-500 font-semibold">{errors.fechaRegistro.message}</span>}
              </div>
            </div>
          </div>

          {/* Garantías y Depósito */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Garantía y Anticipo de Seguridad</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Tipo de Respaldo</label>
                <select 
                  {...register('garantiaTipo')}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all"
                >
                  <option value="Efectivo">Efectivo en Custodia</option>
                  <option value="Pagaré">Pagaré Firmado</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque de Gerencia</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Monto de Garantía ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  {...register('garantiaMonto', { valueAsNumber: true })} 
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Depósito / Abono Inicial ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  {...register('deposito', { valueAsNumber: true })} 
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: EQUIPOS Y LOGÍSTICA */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Maquinaria y Equipos Solicitados</h3>
                <p className="text-[11px] text-slate-400">Asigne fechas de inicio y fin estimadas para cada máquina.</p>
              </div>
              <button 
                type="button" 
                onClick={() => append({ itemId: '', cantidad: 1, fechaInicio: todayStr, fechaFinEstimada: todayStr })} 
                className="px-3 py-1.5 bg-brand-salmon/10 text-brand-salmon hover:bg-brand-salmon/20 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
              >
                <span>+ Agregar Maquinaria</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="flex-1 min-w-[200px] flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Equipo *</label>
                    <select 
                      {...register(`items.${index}.itemId` as const)} 
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none"
                    >
                      <option value="">Seleccione equipo...</option>
                      {equipos.map(e => (
                        <option key={e.id} value={e.id}>{e.sku} — {e.nombre} ({formatearCOP(e.tarifaDiaria)}/día)</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Cant.</label>
                    <input 
                      type="number" 
                      min={1} 
                      {...register(`items.${index}.cantidad` as const, { valueAsNumber: true })} 
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none text-center" 
                    />
                  </div>

                  <div className="w-36 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Fecha Inicio</label>
                    <input 
                      type="date" 
                      {...register(`items.${index}.fechaInicio` as const)} 
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none" 
                    />
                  </div>

                  <div className="w-36 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Fin Estimado</label>
                    <input 
                      type="date" 
                      {...register(`items.${index}.fechaFinEstimada` as const)} 
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none" 
                    />
                  </div>

                  {fields.length > 1 && (
                    <div className="flex items-end pt-5 md:pt-0">
                      <button 
                        type="button" 
                        onClick={() => remove(index)} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl text-xs transition-colors"
                        title="Eliminar fila"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.items && <span className="text-[11px] text-red-500 font-semibold">{errors.items.message}</span>}
          </div>

          {/* Fletes y Logística */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Costos de Logística y Traslado</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Flete de Entrega a Obra ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  {...register('fleteEntrega', { valueAsNumber: true })} 
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Flete de Recogida / Retorno ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  {...register('fleteRecogida', { valueAsNumber: true })} 
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: RESUMEN Y CONFIRMACIÓN */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notas y Observaciones */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-slate-900">Observaciones y Condiciones Especiales</h3>
              <textarea 
                rows={3}
                placeholder="Ingrese detalles sobre el estado del equipo, sitio de obra o acuerdos especiales..."
                {...register('observaciones')} 
                className="w-full flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all"
              />
              <textarea 
                rows={2}
                placeholder="Dirección exacta de obra y persona encargada de recibir..."
                {...register('detallesLogistica')} 
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all"
              />
            </div>

            {/* Desglose Financiero */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-3 shadow-xl flex flex-col justify-between border border-slate-800">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Resumen de Liquidación</span>
                <h4 className="text-xl font-black text-white mt-1">Cálculo Proyectado</h4>
              </div>

              <div className="space-y-2 text-xs divide-y divide-slate-800">
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Subtotal Alquiler Equipos:</span>
                  <span className="font-bold text-white">{formatearCOP(subtotalEquipos)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Total Fletes (Entrega + Recogida):</span>
                  <span className="font-bold text-white">{formatearCOP(totalFletes)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Anticipo / Depósito Aplicado:</span>
                  <span className="font-bold text-amber-400">- {formatearCOP(deposito)}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm font-bold border-t border-slate-700">
                  <span className="text-brand-salmon">Saldo Inicial Estimado:</span>
                  <span className="text-xl font-black text-emerald-400">{formatearCOP(totalEstimado)}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-800/80 rounded-xl text-[11px] text-slate-400 flex justify-between items-center">
                <span>Garantía de Respaldo:</span>
                <span className="font-bold text-white">{garantiaTipo} ({formatearCOP(garantiaMonto)})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STICKY RESPONSIVE ACTION FOOTER (Siempre visible, con botón Guardar prominente) */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-4 pb-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 z-10">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all"
        >
          Cancelar
        </button>

        <div className="flex items-center space-x-2">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              ← Anterior
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <span>Continuar</span>
              <span>→</span>
            </button>
          ) : (
            <Button 
              type="submit" 
              isLoading={isSubmitting}
              className="px-6 py-2.5 min-w-[160px] bg-brand-salmon hover:bg-brand-salmonDark text-white shadow-lg shadow-brand-salmon/25 font-black text-xs sm:text-sm rounded-xl flex items-center space-x-2"
            >
              <span>💾</span>
              <span>{initialData ? "Guardar Cambios" : "Guardar y Crear Contrato"}</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
