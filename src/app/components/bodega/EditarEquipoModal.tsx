'use client';

import React, { useState, useEffect } from 'react';
import * as z from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Equipo } from '../../../core/domain/entities/equipo';
import { useBodegaStore } from '../../../infrastructure/state/bodegaStore';
import { generateIdempotencyKey } from '../../../lib/utils/idempotency';

const editEquipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  tarifaDiaria: z.number().min(0, 'La tarifa debe ser mayor o igual a 0'),
  estado: z.enum(['Disponible', 'En Alquiler', 'Mantenimiento'])
});

interface EditarEquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo | null;
}

export function EditarEquipoModal({ isOpen, onClose, equipo }: EditarEquipoModalProps) {
  const { updateEquipo, ajustarStock } = useBodegaStore();
  
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
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (equipo) {
      setNombre(equipo.nombre || '');
      setCategoria(equipo.categoria || 'Construcción');
      setTarifaDiaria(equipo.tarifaDiaria || 0);
      setEstado(equipo.estado || 'Disponible');
      setNuevoStock(equipo.stockDisponible || 0);
      setStockDelta(0);
      setFormErrors({});
      setFeedbackMsg(null);
    }
  }, [equipo]);

  if (!equipo) return null;

  const handleApplyDelta = (delta: number) => {
    const calculated = Math.max(0, (nuevoStock || 0) + delta);
    setNuevoStock(calculated);
    setStockDelta(calculated - (equipo.stockDisponible || 0));
  };

  const handleManualStockChange = (val: number) => {
    const positiveVal = Math.max(0, isNaN(val) ? 0 : val);
    setNuevoStock(positiveVal);
    setStockDelta(positiveVal - (equipo.stockDisponible || 0));
  };

  const handleConfirmStockAdjustment = () => {
    setIsAdjustingStock(true);
    try {
      ajustarStock(equipo.id, nuevoStock, motivoAjuste);
      setFeedbackMsg(`✓ Stock ajustado con éxito a ${nuevoStock} unidades.`);
      setStockDelta(0);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const onSubmitGeneral = (e: React.FormEvent) => {
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
    try {
      const idempotencyKey = generateIdempotencyKey('edit_eq');
      const updated: Equipo = {
        ...equipo,
        nombre: validation.data.nombre,
        categoria: validation.data.categoria,
        tarifaDiaria: validation.data.tarifaDiaria,
        estado: validation.data.estado
      };
      updateEquipo(updated, idempotencyKey);
      onClose();
    } finally {
      setIsSubmitting(false);
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

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
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
        </form>
      </div>
    </Modal>
  );
}

