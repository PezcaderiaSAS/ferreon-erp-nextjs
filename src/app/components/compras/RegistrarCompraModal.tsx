"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRightLeft,
  Calendar,
  DollarSign,
  Receipt,
  Percent,
  Calculator,
  Loader2,
  Info
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { EquipoUI } from '../../../infrastructure/state/bodegaStore';
import { crearCompraAction, ItemCompraInput } from '../../actions/compras';
import { obtenerProveedoresAction, ProveedorUI } from '../../actions/proveedores';
import { useCurrencyFormatter } from '../../../lib/hooks/useCurrencyFormatter';
import { SelectorProveedorAsistido } from '../proveedores/SelectorProveedorAsistido';
import { calcularLiquidacionCompra } from '../../../core/services/calculo-compras-tributario';
import { useToastStore } from '../../../infrastructure/state/toastStore';

interface FilaItemCompra {
  id: string;
  equipoId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface RegistrarCompraModalProps {
  isOpen: boolean;
  onClose: () => void;
  equiposDisponibles: EquipoUI[];
  onCompraExitosa?: () => void;
}

export function RegistrarCompraModal({
  isOpen,
  onClose,
  equiposDisponibles,
  onCompraExitosa
}: RegistrarCompraModalProps) {
  const { formatearMoneda } = useCurrencyFormatter();
  const { showSuccessToast, showErrorToast } = useToastStore();

  // Estados de Proveedores
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorUI | null>(null);

  // Estados de Compra
  const [numeroOrden, setNumeroOrden] = useState('');
  const [fechaCompra, setFechaCompra] = useState(() => new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO'>('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');

  // Estados Tributarios
  const [aplicaIva, setAplicaIva] = useState(false);
  const [aplicaRetefuente, setAplicaRetefuente] = useState(false);
  const [porcentajeRetefuente, setPorcentajeRetefuente] = useState<number>(2.5); // 2.5% declarantes por defecto
  const [aplicaReteica, setAplicaReteica] = useState(false);
  const [porcentajeReteica, setPorcentajeReteica] = useState<number>(9.66);     // 9.66 por mil por defecto

  // Ítems de la compra
  const [items, setItems] = useState<FilaItemCompra[]>([
    { id: '1', equipoId: '', cantidad: 1, precioUnitario: 0 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar lista de proveedores al abrir el modal
  useEffect(() => {
    if (isOpen) {
      obtenerProveedoresAction().then((res) => {
        if (res.success && res.data) {
          setProveedores(res.data);
        }
      });
    }
  }, [isOpen]);

  // Si se selecciona un proveedor con días de crédito > 0, sugerir método CRÉDITO
  const handleSeleccionarProveedor = (p: ProveedorUI | null) => {
    setProveedorSeleccionado(p);
    if (p && p.dias_credito > 0) {
      setMetodoPago('CREDITO');
    }
  };

  const handleNuevoProveedor = (nuevo: ProveedorUI) => {
    setProveedores(prev => [nuevo, ...prev]);
    setProveedorSeleccionado(nuevo);
  };

  // Cálculos reactivos con el motor tributario
  const liquidacion = useMemo(() => {
    const itemsValidos = items
      .filter(it => it.equipoId && it.cantidad > 0)
      .map(it => ({
        equipoId: it.equipoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario || 0
      }));

    if (itemsValidos.length === 0) {
      return {
        subtotal: 0,
        valorIva: 0,
        valorRetefuente: 0,
        valorReteica: 0,
        totalFactura: 0,
        netoPagar: 0,
        estaBalanceado: true,
        desbalance: 0
      };
    }

    try {
      return calcularLiquidacionCompra(itemsValidos, {
        aplicaIva,
        aplicaRetefuente,
        porcentajeRetefuente,
        aplicaReteica,
        porcentajeReteica
      });
    } catch {
      return {
        subtotal: 0,
        valorIva: 0,
        valorRetefuente: 0,
        valorReteica: 0,
        totalFactura: 0,
        netoPagar: 0,
        estaBalanceado: true,
        desbalance: 0
      };
    }
  }, [items, aplicaIva, aplicaRetefuente, porcentajeRetefuente, aplicaReteica, porcentajeReteica]);

  const agregarFila = () => {
    setItems(prev => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, equipoId: '', cantidad: 1, precioUnitario: 0 }
    ]);
  };

  const eliminarFila = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const actualizarFila = (id: string, campo: keyof FilaItemCompra, valor: any) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      
      if (campo === 'equipoId') {
        const eq = equiposDisponibles.find(e => String(e.id) === String(valor));
        return {
          ...it,
          equipoId: valor,
          precioUnitario: it.precioUnitario > 0 ? it.precioUnitario : (eq?.valor_reposicion || 0)
        };
      }

      return { ...it, [campo]: valor };
    }));
  };

  const handleReset = () => {
    setProveedorSeleccionado(null);
    setNumeroOrden('');
    setFechaCompra(new Date().toISOString().split('T')[0]);
    setMetodoPago('EFECTIVO');
    setObservaciones('');
    setAplicaIva(false);
    setAplicaRetefuente(false);
    setAplicaReteica(false);
    setItems([{ id: '1', equipoId: '', cantidad: 1, precioUnitario: 0 }]);
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!proveedorSeleccionado) {
      setErrorMsg('Debe seleccionar o registrar un proveedor antes de continuar.');
      return;
    }

    const itemsValidos = items.filter(it => it.equipoId && it.cantidad > 0);
    if (itemsValidos.length === 0) {
      setErrorMsg('Debe agregar al menos un equipo con cantidad mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload: ItemCompraInput[] = itemsValidos.map(it => ({
        equipoId: it.equipoId,
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario) || 0
      }));

      const res = await crearCompraAction({
        numeroOrden: numeroOrden.trim() || undefined,
        proveedorId: proveedorSeleccionado.id,
        proveedorNombre: proveedorSeleccionado.nombre,
        proveedorNit: proveedorSeleccionado.nit,
        proveedorTelefono: proveedorSeleccionado.telefono,
        proveedorEmail: proveedorSeleccionado.email,
        fechaCompra,
        metodoPago,
        observaciones: observaciones.trim() || undefined,
        aplicaIva,
        aplicaRetefuente,
        porcentajeRetefuente,
        aplicaReteica,
        porcentajeReteica,
        items: itemsPayload
      });

      if (res.success && res.data) {
        showSuccessToast(`Compra ${res.data.numeroOrden} registrada exitosamente. Inventario y asientos asentados.`);
        if (onCompraExitosa) onCompraExitosa();
        handleClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al registrar la compra.');
        showErrorToast(res.error || 'Fallo al procesar compra');
      }
    } catch (err: any) {
      console.error('Error al registrar compra:', err);
      setErrorMsg('Error de red o procesamiento en el servidor.');
      showErrorToast('Error de comunicación con el servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Compra / Entrada de Almacén" maxWidth="4xl">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-3 p-3.5 bg-red-50/90 border border-red-200 rounded-xl text-red-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Proveedor Asistido y Datos de la Orden */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <SelectorProveedorAsistido
              proveedores={proveedores}
              proveedorSeleccionadoId={proveedorSeleccionado?.id}
              onSeleccionarProveedor={handleSeleccionarProveedor}
              onNuevoProveedorRegistrado={handleNuevoProveedor}
              error={!proveedorSeleccionado && errorMsg ? 'Seleccione un proveedor' : undefined}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Número de Factura / Orden
            </label>
            <input
              type="text"
              value={numeroOrden}
              onChange={(e) => setNumeroOrden(e.target.value)}
              placeholder="Ej. OC-1045 o FAC-998"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Fecha de Compra
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Método de Pago
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
              >
                <option value="EFECTIVO">Efectivo (Caja Principal)</option>
                <option value="TRANSFERENCIA">Transferencia (Bancolombia / Bancos)</option>
                <option value="CREDITO">Crédito (Cuentas por Pagar Proveedor)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Garantía, entrega, número de guía..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* 2. Tabla Dinámica de Ítems / Equipos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Equipos y Maquinaria Adquirida
            </h4>
            <button
              type="button"
              onClick={agregarFila}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Fila
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-1/2">Equipo / Maquinaria</th>
                  <th className="py-2.5 px-3 w-24 text-center">Cantidad</th>
                  <th className="py-2.5 px-3 w-36 text-right">Costo Unitario</th>
                  <th className="py-2.5 px-4 w-36 text-right">Subtotal</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((fila) => {
                  const subtotalFila = (fila.cantidad || 0) * (fila.precioUnitario || 0);
                  return (
                    <tr key={fila.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-4">
                        <select
                          required
                          value={fila.equipoId}
                          onChange={(e) => actualizarFila(fila.id, 'equipoId', e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        >
                          <option value="">-- Seleccionar Equipo --</option>
                          {equiposDisponibles.map(eq => (
                            <option key={eq.id} value={eq.id}>
                              {eq.nombre} (Stock Disp: {eq.stock_disponible})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          required
                          value={fila.cantidad}
                          onChange={(e) => actualizarFila(fila.id, 'cantidad', parseInt(e.target.value, 10) || 1)}
                          className="w-full py-1.5 px-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={fila.precioUnitario}
                          onChange={(e) => actualizarFila(fila.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="w-full py-1.5 px-2 text-right bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-semibold text-slate-700">
                        {formatearMoneda(subtotalFila)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarFila(fila.id)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors disabled:opacity-30"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Panel Tributario & Resumen de Liquidación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl">
          {/* Casillas de Retenciones e Impuestos */}
          <div className="space-y-3.5">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              Impuestos y Retenciones Tributarias
            </h5>

            {/* Casilla IVA 19% */}
            <label className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-300 transition-colors shadow-2xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={aplicaIva}
                  onChange={(e) => setAplicaIva(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-800">IVA Descontable (19%)</span>
                  <p className="text-2xs text-slate-400">Genera crédito fiscal y débito en Cuenta 2408</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold text-slate-700">
                {formatearMoneda(liquidacion.valorIva)}
              </span>
            </label>

            {/* Casilla ReteFuente */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaRetefuente}
                    onChange={(e) => setAplicaRetefuente(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">Retención en la Fuente</span>
                    <p className="text-2xs text-slate-400">Pasivo fiscal retenido al proveedor (Cuenta 2365)</p>
                  </div>
                </label>
                <span className="text-sm font-mono font-semibold text-rose-600">
                  -{formatearMoneda(liquidacion.valorRetefuente)}
                </span>
              </div>

              {aplicaRetefuente && (
                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 pl-6">
                  <span className="text-xs text-slate-500">Tarifa:</span>
                  <button
                    type="button"
                    onClick={() => setPorcentajeRetefuente(2.5)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      porcentajeRetefuente === 2.5 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    2.5% (Declarantes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPorcentajeRetefuente(3.5)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      porcentajeRetefuente === 3.5 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    3.5% (No Declarantes)
                  </button>
                </div>
              )}
            </div>

            {/* Casilla ReteICA */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaReteica}
                    onChange={(e) => setAplicaReteica(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-800">ReteICA Municipal</span>
                    <p className="text-2xs text-slate-400">Retención de industria y comercio (Cuenta 2368)</p>
                  </div>
                </label>
                <span className="text-sm font-mono font-semibold text-rose-600">
                  -{formatearMoneda(liquidacion.valorReteica)}
                </span>
              </div>

              {aplicaReteica && (
                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 pl-6">
                  <span className="text-xs text-slate-500">Tasa por mil:</span>
                  <button
                    type="button"
                    onClick={() => setPorcentajeReteica(9.66)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      porcentajeReteica === 9.66 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    9.66‰ (Comercio Gral)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPorcentajeReteica(4.14)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                      porcentajeReteica === 4.14 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    4.14‰ (Industrial)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de Liquidación & Partida Doble */}
          <div className="bg-white border border-slate-200 rounded-xl p-4.5 flex flex-col justify-between shadow-xs">
            <div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                Resumen de Liquidación Contable
              </h5>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Compra:</span>
                  <span className="font-mono font-medium">{formatearMoneda(liquidacion.subtotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>(+) IVA Descontable (19%):</span>
                  <span className="font-mono font-medium text-emerald-700">+{formatearMoneda(liquidacion.valorIva)}</span>
                </div>

                <div className="flex justify-between font-medium text-slate-800 pt-1.5 border-t border-slate-100">
                  <span>(=) Total Factura Proveedor:</span>
                  <span className="font-mono">{formatearMoneda(liquidacion.totalFactura)}</span>
                </div>

                <div className="flex justify-between text-rose-600 text-xs">
                  <span>(-) ReteFuente ({aplicaRetefuente ? `${porcentajeRetefuente}%` : '0%'}):</span>
                  <span className="font-mono">-{formatearMoneda(liquidacion.valorRetefuente)}</span>
                </div>

                <div className="flex justify-between text-rose-600 text-xs">
                  <span>(-) ReteICA ({aplicaReteica ? `${porcentajeReteica}‰` : '0‰'}):</span>
                  <span className="font-mono">-{formatearMoneda(liquidacion.valorReteica)}</span>
                </div>
              </div>
            </div>

            {/* Total Neto a Pagar */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-slate-200">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Neto a Desembolsar / Pagar
                  </span>
                  <p className="text-2xs text-slate-400">
                    Afecta {metodoPago === 'CREDITO' ? 'CxP Proveedores (2205)' : metodoPago === 'EFECTIVO' ? 'Caja Principal (1105)' : 'Bancos (1110)'}
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {formatearMoneda(liquidacion.netoPagar)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Footer con Botones */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            Al registrar la compra, el stock físico se incrementará automáticamente y se emitirá el asiento en el Ledger.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || liquidacion.subtotal === 0 || !proveedorSeleccionado}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 hover:shadow-lg active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Asentando Compra...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Asentar Compra e Ingresar a Bodega
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
