"use client";

import React, { useState, useMemo } from 'react';
import * as z from 'zod';
import { useClienteStore } from '../../infrastructure/state/clienteStore';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { CrearAlquilerUseCase } from '../../core/application/use-cases/crear-alquiler.use-case';
import { EditarAlquilerUseCase } from '../../core/application/use-cases/editar-alquiler.use-case';
import { ZustandAlquilerRepository } from '../../infrastructure/adapters/ZustandAlquilerRepository';
import { Button } from '../ui/Button';
import { idempotencyManager } from '../../lib/idempotency';

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
    precioDiario: z.number().min(0, 'El precio no puede ser negativo'),
    fechaInicio: z.string().min(1, 'Fecha inicio requerida'),
    fechaFinEstimada: z.string().min(1, 'Fecha fin estimada requerida'),
  })).min(1, 'Debe agregar al menos un equipo')
});

interface ItemRow {
  id: string;
  itemId: string;
  cantidad: number;
  precioDiario: number;
  fechaInicio: string;
  fechaFinEstimada: string;
}

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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [idempotencyKey] = useState(() => idempotencyManager.generateKey());

  const todayStr = new Date().toISOString().split("T")[0];

  // Form State
  const [clienteId, setClienteId] = useState<string>(initialData?.clienteId || '');
  const [fechaRegistro, setFechaRegistro] = useState<string>(
    initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : todayStr
  );
  const [fleteEntrega, setFleteEntrega] = useState<number>(initialData ? (initialData.fleteEntrega || 0) : 30000);
  const [fleteRecogida, setFleteRecogida] = useState<number>(initialData ? (initialData.fleteRecogida || 0) : 30000);
  const [deposito, setDeposito] = useState<number>(initialData ? (initialData.deposito || 0) : 50000);
  const [garantiaMonto, setGarantiaMonto] = useState<number>(initialData ? (initialData.garantiaMonto || 0) : 300000);
  const [garantiaTipo, setGarantiaTipo] = useState<string>(initialData?.garantiaTipo || 'Efectivo');
  const [observaciones, setObservaciones] = useState<string>(initialData?.observacionesGenerales || '');
  const [detallesLogistica, setDetallesLogistica] = useState<string>(initialData?.detallesLogistica || '');

  const [items, setItems] = useState<ItemRow[]>(() => {
    if (initialData?.detalles && initialData.detalles.length > 0) {
      return initialData.detalles.map((d: any, idx: number) => ({
        id: `init_${idx}_${Date.now()}`,
        itemId: d.itemId,
        cantidad: d.cantidad,
        precioDiario: d.valorUnitario || d.tarifaDiaria || 0,
        fechaInicio: d.fechaInicio ? new Date(d.fechaInicio).toISOString().split('T')[0] : todayStr,
        fechaFinEstimada: d.fechaFinEstimada ? new Date(d.fechaFinEstimada).toISOString().split('T')[0] : todayStr,
      }));
    }
    return [{ id: `row_0_${Date.now()}`, itemId: '', cantidad: 1, precioDiario: 0, fechaInicio: todayStr, fechaFinEstimada: todayStr }];
  });

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      { id: `row_${Date.now()}_${Math.random()}`, itemId: '', cantidad: 1, precioDiario: 0, fechaInicio: todayStr, fechaFinEstimada: todayStr }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => 
      c.estado === 'Activo' &&
      (c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) || 
      (c.nit || '').includes(clientSearchTerm))
    );
  }, [clientes, clientSearchTerm]);

  const equiposActivos = useMemo(() => {
    return equipos.filter(e => e.estado !== 'Inactivo');
  }, [equipos]);

  const selectedCliente = clientes.find(c => c.id === clienteId);

  // Subtotal de equipos
  const subtotalEquipos = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.itemId || !item.fechaInicio || !item.fechaFinEstimada) return acc;
      
      const start = new Date(item.fechaInicio);
      const end = new Date(item.fechaFinEstimada);
      let dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (dias <= 0) dias = 1;

      return acc + ((item.precioDiario || 0) * item.cantidad * dias);
    }, 0);
  }, [items]);

  const totalFletes = (fleteEntrega || 0) + (fleteRecogida || 0);
  const totalGeneral = subtotalEquipos + totalFletes;
  const totalEstimado = Math.max(0, totalGeneral - (deposito || 0));

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  const validateCurrentStep = (): boolean => {
    setFormErrors({});
    if (currentStep === 1) {
      if (!clienteId) {
        setFormErrors(prev => ({ ...prev, clienteId: 'Debe seleccionar un cliente' }));
        return false;
      }
      if (!fechaRegistro) {
        setFormErrors(prev => ({ ...prev, fechaRegistro: 'La fecha de registro es requerida' }));
        return false;
      }
    } else if (currentStep === 2) {
      const hasEmptyItem = items.some(it => !it.itemId);
      if (hasEmptyItem) {
        setFormErrors(prev => ({ ...prev, items: 'Seleccione un equipo para cada fila' }));
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFormErrors({});

    const validation = alquilerSchema.safeParse({
      clienteId,
      fechaRegistro,
      fleteEntrega: Number(fleteEntrega) || 0,
      fleteRecogida: Number(fleteRecogida) || 0,
      deposito: Number(deposito) || 0,
      garantiaMonto: Number(garantiaMonto) || 0,
      garantiaTipo,
      observaciones,
      detallesLogistica,
      items: items.map(it => ({
        itemId: it.itemId,
        cantidad: Number(it.cantidad) || 1,
        precioDiario: Number(it.precioDiario) || 0,
        fechaInicio: it.fechaInicio,
        fechaFinEstimada: it.fechaFinEstimada
      }))
    });

    if (!validation.success) {
      const errMap: { [key: string]: string } = {};
      validation.error.issues.forEach(iss => {
        const path = iss.path.join('.');
        errMap[path] = iss.message;
      });
      setFormErrors(errMap);
      setErrorMsg('Por favor verifique los campos requeridos en el formulario.');
      return;
    }

    if (!idempotencyManager.processKey(idempotencyKey)) {
      console.warn("Transacción bloqueada por IdempotencyManager (doble clic detectado)");
      return;
    }

    setIsSubmitting(true);
    try {
      const repo = new ZustandAlquilerRepository();
      const cliente = clientes.find(c => c.id === validation.data.clienteId);
      
      const itemsConDetalles = validation.data.items.map(item => {
        const equipo = equiposActivos.find(e => e.id === item.itemId);
        if (!equipo) throw new Error("Equipo no encontrado o inactivo");
        return {
          itemId: item.itemId,
          nombreItem: equipo.nombre,
          cantidad: item.cantidad,
          tarifaAplicada: item.precioDiario,
          fechaInicio: item.fechaInicio,
          fechaFinEstimada: item.fechaFinEstimada
        };
      });

      if (initialData) {
        const useCase = new EditarAlquilerUseCase(repo);
        await useCase.execute({
          alquilerId: initialData.id,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: validation.data.deposito,
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          items: itemsConDetalles
        });
      } else {
        const useCase = new CrearAlquilerUseCase(repo);
        await useCase.execute({
          clienteId: validation.data.clienteId,
          clienteNombre: cliente?.nombre,
          fechaRegistro: validation.data.fechaRegistro,
          fleteEntrega: validation.data.fleteEntrega,
          fleteRecogida: validation.data.fleteRecogida,
          deposito: validation.data.deposito,
          garantiaMonto: validation.data.garantiaMonto,
          garantiaTipo: validation.data.garantiaTipo,
          observaciones: validation.data.observaciones,
          detallesLogistica: validation.data.detallesLogistica,
          items: itemsConDetalles
        });
      }

      onSuccess();
    } catch (err: any) {
      idempotencyManager.removeKey(idempotencyKey);
      setErrorMsg(err.message || 'Error al guardar el contrato');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full space-y-6">
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
                            setClienteId(c.id);
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
                {formErrors.clienteId && <span className="text-[11px] text-red-500 font-semibold">{formErrors.clienteId}</span>}
              </div>

              {/* Fecha de Registro */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Fecha de Creación del Contrato *</label>
                <input 
                  type="date" 
                  value={fechaRegistro}
                  onChange={(e) => setFechaRegistro(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
                {formErrors.fechaRegistro && <span className="text-[11px] text-red-500 font-semibold">{formErrors.fechaRegistro}</span>}
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
                  value={garantiaTipo}
                  onChange={(e) => setGarantiaTipo(e.target.value)}
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
                  value={garantiaMonto}
                  onChange={(e) => setGarantiaMonto(parseFloat(e.target.value) || 0)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Depósito / Abono Inicial ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  value={deposito}
                  onChange={(e) => setDeposito(parseFloat(e.target.value) || 0)}
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
                onClick={addItemRow} 
                className="px-3 py-1.5 bg-brand-salmon/10 text-brand-salmon hover:bg-brand-salmon/20 font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
              >
                <span>+ Agregar Maquinaria</span>
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((field, index) => (
                <div key={field.id} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="flex-1 min-w-[180px] flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Equipo *</label>
                    <select 
                      value={field.itemId}
                      onChange={(e) => {
                        const eqId = e.target.value;
                        const equipo = equiposActivos.find(eq => eq.id === eqId);
                        const newItems = [...items];
                        newItems[index] = { 
                          ...newItems[index], 
                          itemId: eqId, 
                          precioDiario: equipo ? equipo.tarifaDiaria : 0 
                        };
                        setItems(newItems);
                      }}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none"
                    >
                      <option value="">Seleccione equipo...</option>
                      {equiposActivos.map(e => {
                        const isAvailable = e.stockDisponible > 0;
                        const stockText = isAvailable ? `(${e.stockDisponible} disp.)` : `(Sin stock)`;
                        return (
                          <option key={e.id} value={e.id} disabled={!isAvailable}>
                            {e.nombre} {stockText}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="w-28 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Valor Diario</label>
                    <input 
                      type="number" 
                      min={0} 
                      value={field.precioDiario}
                      onChange={(e) => updateItemRow(index, 'precioDiario', parseFloat(e.target.value) || 0)}
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none text-right font-semibold" 
                    />
                  </div>

                  <div className="w-20 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Cant.</label>
                    <input 
                      type="number" 
                      min={1} 
                      value={field.cantidad}
                      onChange={(e) => updateItemRow(index, 'cantidad', parseInt(e.target.value, 10) || 1)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none text-center" 
                    />
                  </div>

                  <div className="w-36 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Fecha Inicio</label>
                    <input 
                      type="date" 
                      value={field.fechaInicio}
                      onChange={(e) => updateItemRow(index, 'fechaInicio', e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none" 
                    />
                  </div>

                  <div className="w-36 flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-600">Fin Estimado</label>
                    <input 
                      type="date" 
                      value={field.fechaFinEstimada}
                      onChange={(e) => updateItemRow(index, 'fechaFinEstimada', e.target.value)}
                      className="px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none" 
                    />
                  </div>

                  {items.length > 1 && (
                    <div className="flex items-end pt-5 md:pt-0">
                      <button 
                        type="button" 
                        onClick={() => removeItemRow(index)} 
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
            {formErrors.items && <span className="text-[11px] text-red-500 font-semibold">{formErrors.items}</span>}
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
                  value={fleteEntrega}
                  onChange={(e) => setFleteEntrega(parseFloat(e.target.value) || 0)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Flete de Recogida / Retorno ($ COP)</label>
                <input 
                  type="number" 
                  min={0}
                  value={fleteRecogida}
                  onChange={(e) => setFleteRecogida(parseFloat(e.target.value) || 0)}
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
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon outline-none transition-all"
              />
              <textarea 
                rows={2}
                placeholder="Dirección exacta de obra y persona encargada de recibir..."
                value={detallesLogistica}
                onChange={(e) => setDetallesLogistica(e.target.value)}
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
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-md border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 z-20 mt-6 rounded-b-2xl sm:rounded-b-3xl">
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
