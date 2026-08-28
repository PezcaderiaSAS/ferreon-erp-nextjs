'use client';

import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { EquipoUI } from '../../../infrastructure/state/bodegaStore';
import { useBodegaStore } from '../../../infrastructure/state/bodegaStore';
import { generateIdempotencyKey } from '../../../lib/utils/idempotency';
import { editarEquipoAction, ajustarStockEquipoAction } from '../../actions/equipos';
import { useRouter } from 'next/navigation';

const editEquipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  tarifaDiaria: z.number().min(0, 'La tarifa debe ser mayor o igual a 0'),
  estado: z.enum(['Disponible', 'En Alquiler', 'Mantenimiento'])
});

interface EditarEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: EquipoUI | null;
}

export function EditarEquipoModal({ isOpen, onClose, equipo }: EditarEquipoModalProps) {
  const { updateEquipo, ajustarStock, inactivarEquipo } = useBodegaStore();
  const router = useRouter();
  
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Construcción');
  const [tarifaDiaria, setTarifaDiaria] = useState<number>(0);
  const [estado, setEstado] = useState<'Disponible' | 'En Alquiler' | 'Mantenimiento'>('Disponible');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stockDelta, setStockDelta] = useState<number>(0);
  const [nuevoStock, setNuevoStock] = useState<number>(0);
  const [motivoAjuste, setMotivoAjuste] = useState<string>('Entrada por Compra / Adquisición');
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isInactivating, setIsInactivating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (equipo) {
      setNombre(equipo.nombre || '');
      setCategoria(equipo.categoria || 'Construcción');
      setTarifaDiaria(equipo.tarifa_diaria || 0);
      const safeEstado = ['Disponible', 'En Alquiler', 'Mantenimiento'].includes(equipo.estado) ? equipo.estado : 'Disponible';
      setEstado(safeEstado as 'Disponible' | 'En Alquiler' | 'Mantenimiento');
      setNuevoStock(equipo.stock_disponible || 0);
      setStockDelta(0);
      setFormErrors({});
      setFeedbackMsg(null);
    }
  }, [equipo]);

  if (!equipo) return null;

  const handleApplyDelta = (delta: number) => {
    const calculated = Math.max(0, (nuevoStock || 0) + delta);
    setNuevoStock(calculated);
    setStockDelta(calculated - (equipo.stock_disponible || 0));
  };

  const handleManualStockChange = (val: number) => {
    const positiveVal = Math.max(0, isNaN(val) ? 0 : val);
    setNuevoStock(positiveVal);
    setStockDelta(positiveVal - (equipo.stock_disponible || 0));
  };

  const handleConfirmStockAdjustment = async () => {
    setIsAdjustingStock(true);
    const equipoOriginal = { ...equipo };
    try {
      // 1. Optimistic UI (0 Latency)
      ajustarStock(equipo.id, nuevoStock, motivoAjuste);
      
      // 2. Base de datos
      const result = await ajustarStockEquipoAction(equipo.id.toString(), stockDelta);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setFeedbackMsg(`✓ Stock ajustado con éxito a ${nuevoStock} unidades.`);
      setStockDelta(0);
      router.refresh();
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (e: any) {
      console.error(e);
      // 3. Rollback
      updateEquipo(equipoOriginal);
      alert(`Error al guardar en base de datos: ${e.message}`);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const onSubmitGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = editEquipoSchema.safeParse({
      nombre,
      categoria,
      tarifaDiaria,
      estado
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

    setIsSubmitting(true);
    const equipoOriginal = { ...equipo };
    try {
      const idempotencyKey = generateIdempotencyKey('edit_eq');
      const updated: EquipoUI = {
        ...equipo,
        nombre: validation.data.nombre,
        categoria: validation.data.categoria,
        tarifa_diaria: validation.data.tarifaDiaria,
        tarifaDiaria: validation.data.tarifaDiaria,
        estado: validation.data.estado
      };
      
      // 1. Optimistic update
      updateEquipo(updated, idempotencyKey);
      
      // 2. Base de datos
      const result = await editarEquipoAction({
        id: equipo.id.toString(),
        nombre: validation.data.nombre,
        categoria: validation.data.categoria,
        tarifaDiaria: validation.data.tarifaDiaria,
        estado: validation.data.estado,
        idempotency_key: idempotencyKey,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Si el usuario cambió el stock pero olvidó darle al botón negro, lo guardamos automáticamente aquí
      if (stockDelta !== 0) {
        // Optimistic UI
        ajustarStock(equipo.id, nuevoStock, motivoAjuste);
        // Base de datos
        const stockResult = await ajustarStockEquipoAction(equipo.id.toString(), stockDelta);
        if (!stockResult.success) {
           throw new Error(stockResult.error);
        }
        setStockDelta(0);
      }
      
      router.refresh();
      onClose();
    } catch (e: any) {
      console.error(e);
      // 3. Rollback
      updateEquipo(equipoOriginal);
      alert(`Error al guardar en base de datos: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInactivar = async () => {
    if (!equipo) return;
    if (!window.confirm(`¿Estás seguro de que deseas inactivar el equipo ${equipo.nombre}? Esta acción lo ocultará de las listas activas.`)) {
      return;
    }
    
    setIsInactivating(true);
    try {
      await inactivarEquipo(equipo.id);
      router.refresh();
      onClose();
    } catch (error: any) {
      alert("Error al inactivar el equipo. " + (error.message || "Se aplicó rollback."));
    } finally {
      setIsInactivating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Equipo: ${equipo.nombre}`}
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-6">
        {/* Header Summary Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm">
              {equipo.sku}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Código Único (SKU)</p>
              <h4 className="text-sm font-bold text-slate-900">{equipo.sku}</h4>
            </div>
          </div>

          {/* Current Stock Metrics */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-center px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Disponible</span>
              <p className="text-base font-bold text-emerald-800">{equipo.stockDisponible || 0}</p>
            </div>
            <div className="text-center px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">En Obra</span>
              <p className="text-base font-bold text-amber-800">{equipo.stockEnObra || 0}</p>
            </div>
            <div className="text-center px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Total Físico</span>
              <p className="text-base font-bold text-slate-900">{equipo.stockTotal || 0}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Stock Adjustment Panel */}
        <div className="bg-gradient-to-br from-brand-salmonLight/30 to-amber-50/40 border border-brand-salmon/20 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-salmon text-[22px]">swap_vertical_circle</span>
              <h3 className="text-sm font-bold text-slate-900">Ajuste Rápido de Stock Disponible</h3>
            </div>
            {stockDelta !== 0 && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stockDelta > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {stockDelta > 0 ? `+${stockDelta}` : stockDelta} unid. de diferencia
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600">
            Ajusta las existencias en bodega por nuevas compras, mantenimientos concluidos o bajas. El stock en obra se conserva automáticamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Direct Input & Quick Steppers */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Nuevo Stock en Bodega</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={nuevoStock}
                  onChange={(e) => handleManualStockChange(parseInt(e.target.value, 10))}
                  className="w-24 px-3 py-2 text-center text-lg font-bold text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-salmon focus:outline-none bg-white shadow-inner"
                />
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(-5)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(-1)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(1)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDelta(5)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700">Motivo del Ajuste</label>
              <select
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              >
                <option value="Entrada por Compra / Adquisición">Entrada por Compra / Adquisición</option>
                <option value="Retorno de Mantenimiento">Retorno de Mantenimiento</option>
                <option value="Baja por Avería o Pérdida">Baja por Avería o Pérdida</option>
                <option value="Ajuste Periódico de Inventario">Ajuste Periódico de Inventario</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            {feedbackMsg ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg animate-pulse">
                {feedbackMsg}
              </span>
            ) : <span />}

            <Button
              type="button"
              onClick={handleConfirmStockAdjustment}
              isLoading={isAdjustingStock}
              className="!py-1.5 !px-4 !text-xs bg-slate-900 hover:bg-slate-800 text-white"
            >
              Aplicar Ajuste de Stock
            </Button>
          </div>
        </div>

        {/* Section 2: General Information Form */}
        <form onSubmit={onSubmitGeneral} className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Información General</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Nombre del Equipo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon"
                placeholder="Nombre del equipo"
              />
              {formErrors.nombre && <span className="text-xs text-red-500">{formErrors.nombre}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              >
                <option value="Construcción">Construcción</option>
                <option value="Herramientas Eléctricas">Herramientas Eléctricas</option>
                <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                <option value="Andamios & Estructuras">Andamios & Estructuras</option>
                <option value="Equipos de Medición">Equipos de Medición</option>
              </select>
              {formErrors.categoria && <span className="text-xs text-red-500">{formErrors.categoria}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Tarifa Diaria ($ COP)</label>
              <input
                type="number"
                min="0"
                value={tarifaDiaria}
                onChange={(e) => setTarifaDiaria(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              />
              {formErrors.tarifaDiaria && <span className="text-xs text-red-500">{formErrors.tarifaDiaria}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Estado Operativo</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              >
                <option value="Disponible">Disponible</option>
                <option value="En Alquiler">En Alquiler</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
              {formErrors.estado && <span className="text-xs text-red-500">{formErrors.estado}</span>}
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-4 bg-white/95 backdrop-blur-md flex justify-between gap-2 mt-4 pt-3 border-t border-slate-200 z-20 rounded-b-2xl sm:rounded-b-3xl shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <div>
              <button
                type="button"
                onClick={handleInactivar}
                disabled={isInactivating}
                className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                {isInactivating ? 'Inactivando...' : 'Inactivar Equipo'}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cerrar
              </button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="min-w-[150px]"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

