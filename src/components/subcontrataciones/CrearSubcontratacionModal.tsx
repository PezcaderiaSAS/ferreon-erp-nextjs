"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, AlertTriangle, TrendingUp, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useProveedorStore } from '@/infrastructure/state/proveedorStore';
import { useAlquilerStore } from '@/infrastructure/state/alquilerStore';
import { CalculoSubcontratacionService } from '@/core/services/calculo-subcontratacion.service';
import { CrearProveedorModal } from './CrearProveedorModal';
import { crearSubcontratacionAction } from '@/app/actions/subcontrataciones';
import { formatearMonedaCOP } from '@/core/utils/numero-a-letras';

export interface ItemFormRow {
  descripcionItem: string;
  cantidad: number;
  diasPactados: number;
  costoDiarioUnitario: number;
  tarifaDiariaCliente: number;
  equipoId?: string | number;
  serialTercero?: string;
  marca?: string;
}

export interface CrearSubcontratacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subcontratacion: any) => void;
  alquilerIdPreseleccionado?: string | number;
  cotizacionIdPreseleccionada?: string | number;
  initialItems?: ItemFormRow[];
  initialFechaRecepcion?: string;
  initialFechaDevolucion?: string;
  observacionesPredefinidas?: string;
}

/**
 * Helpers de formateo monetario COP para inputs visuales (TICKET SUB-004)
 */
function parseCOPInput(val: string): number {
  const digits = val.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function formatCOPInput(val: number): string {
  if (!val || val === 0) return '';
  return `$ ${val.toLocaleString('es-CO')}`;
}

export function CrearSubcontratacionModal({
  isOpen,
  onClose,
  onSuccess,
  alquilerIdPreseleccionado,
  cotizacionIdPreseleccionada,
  initialItems,
  initialFechaRecepcion,
  initialFechaDevolucion,
  observacionesPredefinidas
}: CrearSubcontratacionModalProps) {
  const { proveedores } = useProveedorStore();
  const { alquileres } = useAlquilerStore();

  const [proveedorId, setProveedorId] = useState('');
  const [alquilerId, setAlquilerId] = useState<string>(alquilerIdPreseleccionado ? String(alquilerIdPreseleccionado) : '');
  const [fechaRecepcion, setFechaRecepcion] = useState(initialFechaRecepcion || new Date().toISOString().split('T')[0]);
  const [fechaDevolucion, setFechaDevolucion] = useState(
    initialFechaDevolucion || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [depositoGarantia, setDepositoGarantia] = useState<number>(0);
  const [observaciones, setObservaciones] = useState(observacionesPredefinidas || '');

  const [items, setItems] = useState<ItemFormRow[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    return [
      {
        descripcionItem: '',
        cantidad: 1,
        diasPactados: 7,
        costoDiarioUnitario: 0,
        tarifaDiariaCliente: 0,
        serialTercero: '',
        marca: '',
      }
    ];
  });

  const [showCrearProveedor, setShowCrearProveedor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar props cuando el modal se abre con datos pre-cargados
  useEffect(() => {
    if (isOpen) {
      if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
      }
      if (initialFechaRecepcion) {
        setFechaRecepcion(initialFechaRecepcion);
      }
      if (initialFechaDevolucion) {
        setFechaDevolucion(initialFechaDevolucion);
      }
      if (observacionesPredefinidas) {
        setObservaciones(observacionesPredefinidas);
      }
      if (alquilerIdPreseleccionado) {
        setAlquilerId(String(alquilerIdPreseleccionado));
      }
    }
  }, [isOpen, initialItems, initialFechaRecepcion, initialFechaDevolucion, observacionesPredefinidas, alquilerIdPreseleccionado]);

  // Auto-llenar días cuando cambian fechas
  useEffect(() => {
    if (fechaRecepcion && fechaDevolucion) {
      const start = new Date(fechaRecepcion).getTime();
      const end = new Date(fechaDevolucion).getTime();
      const diffDias = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      setItems(prev => prev.map(it => ({ ...it, diasPactados: diffDias })));
    }
  }, [fechaRecepcion, fechaDevolucion]);

  const proveedorSeleccionado = proveedores.find(p => p.id === proveedorId);

  // Análisis de rentabilidad en tiempo real (TICKET SUB-001)
  const analisisRentabilidad = useMemo(() => {
    return CalculoSubcontratacionService.calcularRentabilidadGlobal(
      items.map(it => ({
        cantidad: it.cantidad,
        dias: it.diasPactados,
        costoDiarioProveedor: it.costoDiarioUnitario,
        tarifaDiariaCliente: it.tarifaDiariaCliente
      }))
    );
  }, [items]);

  // Estados semánticos estrictos del semáforo de rentabilidad (SUB-001):
  // 1. PENDIENTE (Gris): si no se han ingresado valores de costo y tarifa
  // 2. PERDIDA / RIESGO (Rojo): si tarifa <= costo o margen <= 0 con montos > 0
  // 3. RENTABLE (Verde): si tarifa > costo con montos > 0
  const tieneValoresIngresados = analisisRentabilidad.subtotalCostoProveedor > 0 && analisisRentabilidad.subtotalTarifaCliente > 0;
  const esRentable = tieneValoresIngresados && analisisRentabilidad.margenBrutoNominal > 0;
  const esPerdidaOSinMargen = tieneValoresIngresados && analisisRentabilidad.margenBrutoNominal <= 0;
  const esPendiente = !tieneValoresIngresados;

  const validacionItems = useMemo(() => {
    if (!items || items.length === 0) return { valido: false, motivo: 'Debe incluir al menos un ítem.' };
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.descripcionItem.trim()) {
        return { valido: false, motivo: `El ítem #${i + 1} no tiene descripción.` };
      }
      if (it.cantidad <= 0) {
        return { valido: false, motivo: `La cantidad del ítem #${i + 1} debe ser mayor a 0.` };
      }
      if (it.costoDiarioUnitario <= 0) {
        return { valido: false, motivo: `El costo diario del proveedor para #${i + 1} debe ser mayor a $0.` };
      }
      if (it.tarifaDiariaCliente <= 0) {
        return { valido: false, motivo: `La tarifa diaria del cliente para #${i + 1} debe ser mayor a $0.` };
      }
    }
    if (!proveedorId) {
      return { valido: false, motivo: 'Debe seleccionar un proveedor aliado.' };
    }
    if (analisisRentabilidad.margenBrutoNominal <= 0) {
      return { valido: false, motivo: 'No se permite generar órdenes a pérdida o con margen en $0 COP.' };
    }
    return { valido: true, motivo: '' };
  }, [items, proveedorId, analisisRentabilidad]);

  const handleAddItem = () => {
    const diffDias = Math.max(1, Math.ceil((new Date(fechaDevolucion).getTime() - new Date(fechaRecepcion).getTime()) / (1000 * 60 * 60 * 24)));
    setItems(prev => [
      ...prev,
      { descripcionItem: '', cantidad: 1, diasPactados: diffDias, costoDiarioUnitario: 0, tarifaDiariaCliente: 0, serialTercero: '', marca: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemFormRow, value: any) => {
    setItems(prev => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validacionItems.valido) {
      setErrorMsg(validacionItems.motivo);
      return;
    }

    if (!proveedorId || !proveedorSeleccionado) {
      setErrorMsg('Debe seleccionar un proveedor aliado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await crearSubcontratacionAction({
        proveedorId: proveedorSeleccionado.id,
        proveedorNombre: proveedorSeleccionado.nombre,
        proveedorNit: proveedorSeleccionado.nit,
        proveedorTelefono: proveedorSeleccionado.telefono,
        fechaRecepcionEstimada: fechaRecepcion,
        fechaDevolucionEstimada: fechaDevolucion,
        alquilerId: alquilerId ? alquilerId : undefined,
        depositoGarantiaProveedor: Number(depositoGarantia) || 0,
        observaciones,
        items: items.map(it => ({
          equipoId: it.equipoId,
          descripcionItem: it.descripcionItem.trim(),
          cantidad: Number(it.cantidad) || 1,
          diasPactados: Number(it.diasPactados) || 1,
          costoDiarioUnitario: Number(it.costoDiarioUnitario) || 0,
          tarifaDiariaCliente: Number(it.tarifaDiariaCliente) || 0,
          serialTercero: it.serialTercero?.trim() || null,
          marca: it.marca?.trim() || null
        }))
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Error al crear subcontratación:', err);
      setErrorMsg(err.message || 'Error inesperado al guardar la orden de subcontratación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      isBlocked={isSubmitting}
      title="Registrar Orden de Subcontratación de Maquinaria" 
      maxWidth="5xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col space-y-5 text-xs sm:text-sm">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Proveedor y Contrato */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700 dark:text-slate-300">Proveedor Aliado / Tercero *</label>
              <button
                type="button"
                onClick={() => setShowCrearProveedor(true)}
                className="text-teal-700 dark:text-teal-400 hover:underline text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Nuevo Proveedor</span>
              </button>
            </div>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs sm:text-sm"
            >
              <option value="">-- Seleccione Proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (NIT: {p.nit})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Vincular a Contrato de Alquiler (Opcional)</label>
            <select
              value={alquilerId}
              onChange={(e) => setAlquilerId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs sm:text-sm"
            >
              <option value="">-- Ninguno (Orden independiente) --</option>
              {alquileres.map((a: any) => (
                <option key={a.id} value={a.id}>
                  Contrato #{a.consecutivo || a.id} - {a.clienteNombre || 'Cliente'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fechas de Subcontratación y Garantía */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Fecha Recepción Estimada *</label>
            <input
              type="date"
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Fecha Devolución Estimada *</label>
            <input
              type="date"
              value={fechaDevolucion}
              onChange={(e) => setFechaDevolucion(e.target.value)}
              required
              min={fechaRecepcion}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 dark:text-slate-300">Depósito de Garantía Proveedor</label>
            <input
              type="text"
              value={formatCOPInput(depositoGarantia)}
              onChange={(e) => setDepositoGarantia(parseCOPInput(e.target.value))}
              placeholder="$0 COP"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm font-mono text-right"
            />
          </div>
        </div>

        {/* Desglose de Maquinaria / Ítems con Encabezados Fijos (TICKET FE-002, SUB-002, SUB-004) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-800 dark:text-slate-200">
              Equipos e Ítems a Subcontratar *
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Ítem</span>
            </button>
          </div>

          {/* Encabezados de Columna Fijos Visibles (TICKET FE-002) */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Descripción del Equipo *</div>
            <div className="col-span-2">Serial / Placa (Tercero)</div>
            <div className="col-span-1">Marca</div>
            <div className="col-span-1 text-center">Cant.</div>
            <div className="col-span-2 text-right">Costo/Día Prov. *</div>
            <div className="col-span-1 text-right">Tarifa Cliente *</div>
            <div className="col-span-1 text-center">Acción</div>
          </div>

          {/* Filas Dinámicas */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                {/* 1. Descripción */}
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Descripción *</label>
                  <input
                    type="text"
                    value={it.descripcionItem}
                    onChange={(e) => handleItemChange(idx, 'descripcionItem', e.target.value)}
                    placeholder="Ej. Cortadora de Concreto 14''"
                    required
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                {/* 2. Serial / Placa (Tercero - SUB-002) */}
                <div className="col-span-6 sm:col-span-2 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Serial / Placa</label>
                  <input
                    type="text"
                    value={it.serialTercero || ''}
                    onChange={(e) => handleItemChange(idx, 'serialTercero', e.target.value)}
                    placeholder="Serial / Placa"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                {/* 3. Marca (SUB-002) */}
                <div className="col-span-6 sm:col-span-1 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Marca</label>
                  <input
                    type="text"
                    value={it.marca || ''}
                    onChange={(e) => handleItemChange(idx, 'marca', e.target.value)}
                    placeholder="Marca"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] focus:ring-1 focus:ring-teal-600 outline-none"
                  />
                </div>

                {/* 4. Cantidad */}
                <div className="col-span-4 sm:col-span-1 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Cant.</label>
                  <input
                    type="number"
                    value={it.cantidad}
                    onChange={(e) => handleItemChange(idx, 'cantidad', Math.max(1, Number(e.target.value)))}
                    min={1}
                    placeholder="1"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-mono"
                  />
                </div>

                {/* 5. Costo Diario Proveedor (SUB-004) */}
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Costo/Día Prov. *</label>
                  <input
                    type="text"
                    value={formatCOPInput(it.costoDiarioUnitario)}
                    onChange={(e) => handleItemChange(idx, 'costoDiarioUnitario', parseCOPInput(e.target.value))}
                    placeholder="$0"
                    required
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-right text-xs"
                  />
                </div>

                {/* 6. Tarifa Diaria Cliente (SUB-004) */}
                <div className="col-span-3 sm:col-span-1 space-y-1">
                  <label className="sm:hidden text-[10px] font-bold text-slate-500 uppercase">Tarifa Cliente *</label>
                  <input
                    type="text"
                    value={formatCOPInput(it.tarifaDiariaCliente)}
                    onChange={(e) => handleItemChange(idx, 'tarifaDiariaCliente', parseCOPInput(e.target.value))}
                    placeholder="$0"
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-right text-xs"
                  />
                </div>

                {/* 7. Eliminar */}
                <div className="col-span-1 text-center pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1 cursor-pointer"
                    title="Eliminar fila"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semáforo de Rentabilidad Comercial Estricto (3 Estados - TICKET SUB-001) */}
        <div className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
          esPendiente
            ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            : esPerdidaOSinMargen
            ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-800 dark:text-red-200'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Cálculo de Rentabilidad de la Operación</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
                esPendiente
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  : esPerdidaOSinMargen
                  ? 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100'
                  : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
              }`}>
                {esPendiente ? 'PENDIENTE' : esPerdidaOSinMargen ? 'OPERACIÓN EN RIESGO' : 'RENTABLE'}
              </span>
            </div>
            <p className="text-[11px] font-medium opacity-90">
              {esPendiente && 'Ingrese valores válidos de Costo Proveedor y Tarifa Cliente para proyectar el margen comercial.'}
              {esPerdidaOSinMargen && (analisisRentabilidad.margenBrutoNominal < 0 
                ? `Alerta Crítica: La subcontratación genera una pérdida operativa de -$${Math.abs(analisisRentabilidad.margenBrutoNominal).toLocaleString('es-CO')} COP. El costo del proveedor supera la tarifa del cliente.`
                : 'Aviso: Operación sin margen comercial ($0 COP / 0%). No se permite generar la orden a pérdida.')
              }
              {esRentable && (analisisRentabilidad.alertaRentabilidad || 'Operación comercial rentable con margen positivo proyectado.')}
            </p>
          </div>

          <div className="flex gap-4 font-mono font-bold text-right self-end sm:self-center shrink-0">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-sans">Costo Aliado</span>
              <span>{formatearMonedaCOP(analisisRentabilidad.subtotalCostoProveedor)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-sans">Margen Bruto</span>
              <span className={
                esPendiente 
                  ? 'text-slate-600 dark:text-slate-400' 
                  : esPerdidaOSinMargen 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-emerald-700 dark:text-emerald-400'
              }>
                {formatearMonedaCOP(analisisRentabilidad.margenBrutoNominal)} ({analisisRentabilidad.margenBrutoPorcentual}%)
              </span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 dark:text-slate-300">Observaciones y Condiciones Especiales</label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Detalles de entrega, seriales adicionales, combustible o inspección..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-xs sm:text-sm resize-none"
          />
        </div>

        {/* Botonera con Bloqueo Estricto de Seguridad (TICKET SUB-001) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {!validacionItems.valido && (
              <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {validacionItems.motivo}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!validacionItems.valido || isSubmitting}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
            >
              Generar Orden de Subcontratación
            </Button>
          </div>
        </div>
      </form>

      {/* Modal On-The-Fly de Creación de Proveedor */}
      <CrearProveedorModal
        isOpen={showCrearProveedor}
        onClose={() => setShowCrearProveedor(false)}
        onSuccess={(nuevoProv) => {
          if (nuevoProv?.id) {
            setProveedorId(nuevoProv.id);
          }
          setShowCrearProveedor(false);
        }}
      />
    </Modal>
  );
}

export default CrearSubcontratacionModal;
