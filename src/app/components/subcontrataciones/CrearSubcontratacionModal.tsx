"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, AlertTriangle, CheckCircle2, TrendingUp, Building2 } from 'lucide-react';
import { useProveedorStore } from '../../../infrastructure/state/proveedorStore';
import { useAlquilerStore } from '../../../infrastructure/state/alquilerStore';
import { CrearProveedorModal } from '../proveedores/CrearProveedorModal';
import { CalculoSubcontratacionService } from '../../../core/services/calculo-subcontratacion.service';
import { crearSubcontratacionAction } from '../../actions/subcontrataciones';
import { formatearMonedaCOP } from '../../../core/utils/numero-a-letras';

interface ItemFormRow {
  descripcionItem: string;
  cantidad: number;
  diasPactados: number;
  costoDiarioUnitario: number;
  tarifaDiariaCliente: number;
}

interface CrearSubcontratacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (subcontratacion: any) => void;
  alquilerIdPreseleccionado?: string | number;
}

export function CrearSubcontratacionModal({
  isOpen,
  onClose,
  onSuccess,
  alquilerIdPreseleccionado
}: CrearSubcontratacionModalProps) {
  const { proveedores } = useProveedorStore();
  const { alquileres } = useAlquilerStore();

  const [proveedorId, setProveedorId] = useState('');
  const [alquilerId, setAlquilerId] = useState<string>(alquilerIdPreseleccionado ? String(alquilerIdPreseleccionado) : '');
  const [fechaRecepcion, setFechaRecepcion] = useState(new Date().toISOString().split('T')[0]);
  const [fechaDevolucion, setFechaDevolucion] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [depositoGarantia, setDepositoGarantia] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  const [items, setItems] = useState<ItemFormRow[]>([
    {
      descripcionItem: '',
      cantidad: 1,
      diasPactados: 7,
      costoDiarioUnitario: 0,
      tarifaDiariaCliente: 0
    }
  ]);

  const [showCrearProveedor, setShowCrearProveedor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Análisis de rentabilidad en tiempo real
  const analisisRentabilidad = CalculoSubcontratacionService.calcularRentabilidadGlobal(
    items.map(it => ({
      cantidad: it.cantidad,
      dias: it.diasPactados,
      costoDiarioProveedor: it.costoDiarioUnitario,
      tarifaDiariaCliente: it.tarifaDiariaCliente
    }))
  );

  const handleAddItem = () => {
    const diffDias = Math.max(1, Math.ceil((new Date(fechaDevolucion).getTime() - new Date(fechaRecepcion).getTime()) / (1000 * 60 * 60 * 24)));
    setItems(prev => [
      ...prev,
      { descripcionItem: '', cantidad: 1, diasPactados: diffDias, costoDiarioUnitario: 0, tarifaDiariaCliente: 0 }
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

    if (!proveedorId || !proveedorSeleccionado) {
      setErrorMsg('Debe seleccionar un proveedor aliado.');
      return;
    }

    const itemsInvalidos = items.some(it => !it.descripcionItem.trim() || it.costoDiarioUnitario <= 0);
    if (itemsInvalidos) {
      setErrorMsg('Todos los ítems deben tener descripción y costo diario mayor a cero.');
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
          descripcionItem: it.descripcionItem,
          cantidad: Number(it.cantidad) || 1,
          diasPactados: Number(it.diasPactados) || 1,
          costoDiarioUnitario: Number(it.costoDiarioUnitario) || 0,
          tarifaDiariaCliente: Number(it.tarifaDiariaCliente) || 0
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
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Orden de Subcontratación de Maquinaria" maxWidth="4xl">
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
              <label className="font-bold text-slate-700">Proveedor Aliado / Tercero *</label>
              <button
                type="button"
                onClick={() => setShowCrearProveedor(true)}
                className="text-teal-700 hover:text-teal-800 text-xs font-semibold inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Nuevo Proveedor</span>
              </button>
            </div>
            <select
              value={proveedorId}
              onChange={(e) => setProveedorId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs sm:text-sm"
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
            <label className="font-bold text-slate-700">Vincular a Contrato de Alquiler (Opcional)</label>
            <select
              value={alquilerId}
              onChange={(e) => setAlquilerId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs sm:text-sm"
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
            <label className="font-bold text-slate-700">Fecha Recepción Estimada *</label>
            <input
              type="date"
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Fecha Devolución Estimada *</label>
            <input
              type="date"
              value={fechaDevolucion}
              onChange={(e) => setFechaDevolucion(e.target.value)}
              required
              min={fechaRecepcion}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Depósito de Garantía Proveedor</label>
            <input
              type="number"
              value={depositoGarantia}
              onChange={(e) => setDepositoGarantia(Math.max(0, Number(e.target.value)))}
              min={0}
              placeholder="$0"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono"
            />
          </div>
        </div>

        {/* Desglose de Maquinaria / Ítems */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-bold text-slate-800">Equipos e Ítems a Subcontratar *</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Ítem</span>
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-12 sm:col-span-4">
                  <input
                    type="text"
                    value={it.descripcionItem}
                    onChange={(e) => handleItemChange(idx, 'descripcionItem', e.target.value)}
                    placeholder="Descripción (ej. Cortadora de Concreto)"
                    required
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <input
                    type="number"
                    value={it.cantidad}
                    onChange={(e) => handleItemChange(idx, 'cantidad', Math.max(1, Number(e.target.value)))}
                    min={1}
                    placeholder="Cant."
                    title="Cantidad"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center"
                  />
                </div>

                <div className="col-span-4 sm:col-span-3">
                  <input
                    type="number"
                    value={it.costoDiarioUnitario || ''}
                    onChange={(e) => handleItemChange(idx, 'costoDiarioUnitario', Math.max(0, Number(e.target.value)))}
                    min={0}
                    placeholder="Costo/Día Proveedor"
                    title="Costo Diario Proveedor"
                    required
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-right"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <input
                    type="number"
                    value={it.tarifaDiariaCliente || ''}
                    onChange={(e) => handleItemChange(idx, 'tarifaDiariaCliente', Math.max(0, Number(e.target.value)))}
                    min={0}
                    placeholder="Tarifa/Día Cliente"
                    title="Tarifa Cobrada al Cliente"
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-right"
                  />
                </div>

                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semáforo de Rentabilidad Comercial */}
        <div className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
          analisisRentabilidad.esMargenNegativo 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Cálculo de Rentabilidad de la Operación</span>
            </div>
            <p className="text-[11px] opacity-90">
              {analisisRentabilidad.alertaRentabilidad || 'Operación comercial rentable con margen positivo.'}
            </p>
          </div>

          <div className="flex gap-4 font-mono font-bold text-right self-end sm:self-center">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-sans">Costo Proveedor</span>
              <span>{formatearMonedaCOP(analisisRentabilidad.subtotalCostoProveedor)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-sans">Margen Bruto</span>
              <span className={analisisRentabilidad.esMargenNegativo ? 'text-red-600' : 'text-emerald-700'}>
                {formatearMonedaCOP(analisisRentabilidad.margenBrutoNominal)} ({analisisRentabilidad.margenBrutoPorcentual}%)
              </span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700">Observaciones y Condiciones Especiales</label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Detalles de entrega, transporte, inspección física o combustible..."
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm"
          />
        </div>

        {/* Botonera */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-sm"
          >
            Generar Orden de Subcontratación
          </Button>
        </div>
      </form>

      {/* Modal On-The-Fly de Creación de Proveedor */}
      <CrearProveedorModal
        isOpen={showCrearProveedor}
        onClose={() => setShowCrearProveedor(false)}
        onProveedorCreado={(nuevoProv) => {
          if (nuevoProv?.id) {
            setProveedorId(nuevoProv.id);
          }
          setShowCrearProveedor(false);
        }}
      />
    </Modal>
  );
}
