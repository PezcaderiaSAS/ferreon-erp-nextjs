'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Calendar, User, MapPin, Truck, ShieldCheck, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useClienteStore } from '@/infrastructure/state/clienteStore';
import { useBodegaStore } from '@/infrastructure/state/bodegaStore';
import { SelectorImpuestos, ImpuestosConfig } from './SelectorImpuestos';
import { crearCotizacionAction } from '@/app/actions/cotizaciones';

export interface CrearCotizacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCotizacionCreada?: (cotizacion: any) => void;
}

interface ItemFormLine {
  equipoId: string | number;
  nombre: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  stockDisponible: number;
}

export function CrearCotizacionModal({
  isOpen,
  onClose,
  onCotizacionCreada,
}: CrearCotizacionModalProps) {
  const { clientes } = useClienteStore();
  const { equipos } = useBodegaStore();

  // Datos de cliente
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteDocumento, setClienteDocumento] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');

  // Parámetros de Obra y Fechas
  const [obraNombre, setObraNombre] = useState<string>('');
  const [obraDireccion, setObraDireccion] = useState<string>('');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [valorTransporte, setValorTransporte] = useState<number>(0);
  const [depositoGarantia, setDepositoGarantia] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>('');

  // Líneas de equipos
  const [items, setItems] = useState<ItemFormLine[]>([
    { equipoId: '', nombre: '', cantidad: 1, dias: 7, tarifaDiaria: 0, stockDisponible: 0 },
  ]);

  // Configuración de Impuestos
  const [impuestosConfig, setImpuestosConfig] = useState<ImpuestosConfig>({
    aplicaIva: true,
    tasaIva: 19.0,
    aplicaRetefuente: false,
    tasaRetefuente: 2.5,
    aplicaReteica: false,
    tasaReteica: 0.966,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Al seleccionar cliente existente
  const handleSelectCliente = (cliId: string) => {
    setClienteSeleccionadoId(cliId);
    if (!cliId) {
      setClienteNombre('');
      setClienteDocumento('');
      setClienteTelefono('');
      setClienteEmail('');
      return;
    }

    const cli = clientes.find((c) => String(c.id) === String(cliId));
    if (cli) {
      setClienteNombre(cli.nombre);
      setClienteDocumento(cli.nit_cedula || (cli as any).documento || '');
      setClienteTelefono(cli.telefono || '');
      setClienteEmail(cli.email || '');
    }
  };

  // Manejo de ítems
  const handleItemChange = (index: number, field: keyof ItemFormLine, value: any) => {
    const updated = [...items];
    const current = { ...updated[index] };

    if (field === 'equipoId') {
      const eq = equipos.find((e) => String(e.id) === String(value));
      if (eq) {
        current.equipoId = eq.id;
        current.nombre = eq.nombre;
        current.tarifaDiaria = (eq as any).tarifa_diaria ?? (eq as any).tarifaDiaria ?? (eq as any).precio_dia ?? (eq as any).tarifa_dia ?? 0;
        current.stockDisponible = (eq as any).stock_disponible !== undefined ? (eq as any).stock_disponible : ((eq as any).stockDisponible ?? 0);
      } else {
        current.equipoId = '';
        current.nombre = '';
        current.tarifaDiaria = 0;
        current.stockDisponible = 0;
      }
    } else {
      (current as any)[field] = value;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { equipoId: '', nombre: '', cantidad: 1, dias: 7, tarifaDiaria: 0, stockDisponible: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculos matemáticos en vivo
  const subtotalEquipos = useMemo(() => {
    return items.reduce((acc, it) => {
      const cant = Math.max(1, Number(it.cantidad) || 1);
      const dias = Math.max(1, Number(it.dias) || 1);
      const tarifa = Math.max(0, Number(it.tarifaDiaria) || 0);
      return acc + cant * dias * tarifa;
    }, 0);
  }, [items]);

  const valorIva = impuestosConfig.aplicaIva
    ? Math.round(subtotalEquipos * (impuestosConfig.tasaIva / 100))
    : 0;
  const valorRetefuente = impuestosConfig.aplicaRetefuente
    ? Math.round(subtotalEquipos * (impuestosConfig.tasaRetefuente / 100))
    : 0;
  const valorReteica = impuestosConfig.aplicaReteica
    ? Math.round(subtotalEquipos * (impuestosConfig.tasaReteica / 100))
    : 0;

  const totalFinal =
    subtotalEquipos +
    Number(valorTransporte || 0) +
    valorIva -
    valorRetefuente -
    valorReteica;

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(valor));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clienteNombre.trim()) {
      setErrorMsg('Debe especificar el nombre o razón social del cliente o prospecto.');
      return;
    }

    const itemsValidos = items.filter((it) => it.equipoId && it.cantidad > 0 && it.dias > 0);
    if (itemsValidos.length === 0) {
      setErrorMsg('Debe agregar al menos un equipo válido con cantidad y días.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await crearCotizacionAction({
        clienteId: clienteSeleccionadoId ? parseInt(clienteSeleccionadoId, 10) : null,
        clienteNombre,
        clienteDocumento,
        clienteTelefono,
        clienteEmail,
        fechaVencimiento,
        obraNombre,
        obraDireccion,
        aplicaIva: impuestosConfig.aplicaIva,
        tasaIva: impuestosConfig.tasaIva,
        aplicaRetefuente: impuestosConfig.aplicaRetefuente,
        tasaRetefuente: impuestosConfig.tasaRetefuente,
        aplicaReteica: impuestosConfig.aplicaReteica,
        tasaReteica: impuestosConfig.tasaReteica,
        valorTransporte: Number(valorTransporte || 0),
        depositoGarantia: Number(depositoGarantia || 0),
        observaciones,
        items: itemsValidos.map((it) => ({
          equipoId: it.equipoId,
          nombre: it.nombre,
          cantidad: Number(it.cantidad),
          dias: Number(it.dias),
          tarifaDiaria: Number(it.tarifaDiaria),
        })),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Error al guardar la cotización');
        return;
      }

      if (onCotizacionCreada) {
        onCotizacionCreada(res.data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inesperado al crear cotización');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Cotización de Obra / Proyecto"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-sm text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Atención:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* SECCIÓN 1: DATOS DEL CLIENTE / PROSPECTO */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-800">Cliente o Prospecto Comercial</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seleccionar Cliente Registrado
              </label>
              <select
                value={clienteSeleccionadoId}
                onChange={(e) => handleSelectCliente(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500 bg-white"
              >
                <option value="">-- O escribir cliente nuevo / prospecto --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.nit_cedula || 'Sin NIT'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre / Razón Social <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Ej. Constructora Andina S.A.S."
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIT o Cédula
              </label>
              <input
                type="text"
                value={clienteDocumento}
                onChange={(e) => setClienteDocumento(e.target.value)}
                placeholder="Ej. 901.234.567-8"
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="Ej. 310 123 4567"
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="ejemplo@constructora.com"
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Válida Hasta (Vencimiento)
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full text-xs rounded-lg border-slate-300 shadow-2xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: EQUIPOS Y LÍNEAS COTIZADAS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">Equipos y Maquinaria Cotizada</h4>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Equipo</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Equipo</th>
                  <th className="p-2.5 w-24 text-center">Stock Bodega</th>
                  <th className="p-2.5 w-24 text-center">Cant.</th>
                  <th className="p-2.5 w-24 text-center">Días</th>
                  <th className="p-2.5 w-32 text-right">Tarifa / Día</th>
                  <th className="p-2.5 w-32 text-right">Subtotal</th>
                  <th className="p-2.5 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => {
                  const subtotalLinea = (Number(it.cantidad) || 0) * (Number(it.dias) || 0) * (Number(it.tarifaDiaria) || 0);
                  const isStockWarning = it.stockDisponible > 0 && it.cantidad > it.stockDisponible;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <select
                          value={it.equipoId}
                          onChange={(e) => handleItemChange(idx, 'equipoId', e.target.value)}
                          className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">-- Seleccionar Equipo --</option>
                          {equipos.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                              {eq.nombre} (Stock: {(eq as any).stock_disponible ?? (eq as any).stockDisponible ?? 0})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          it.stockDisponible > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {it.stockDisponible}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.cantidad}
                          onChange={(e) => handleItemChange(idx, 'cantidad', parseInt(e.target.value, 10) || 1)}
                          className={`w-full text-xs text-center rounded-lg border-slate-300 focus:border-blue-500 ${
                            isStockWarning ? 'border-amber-500 bg-amber-50' : ''
                          }`}
                        />
                        {isStockWarning && (
                          <span className="block text-[10px] text-amber-700 font-medium text-center mt-0.5">
                            Excede bodega
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={it.dias}
                          onChange={(e) => handleItemChange(idx, 'dias', parseInt(e.target.value, 10) || 1)}
                          className="w-full text-xs text-center rounded-lg border-slate-300 focus:border-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={it.tarifaDiaria}
                          onChange={(e) => handleItemChange(idx, 'tarifaDiaria', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs text-right rounded-lg border-slate-300 focus:border-blue-500 font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-800">
                        {formatearCOP(subtotalLinea)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
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

        {/* SECCIÓN 3: IMPUESTOS SELECCIONABLES (IVA, RETEFUENTE, RETEICA) */}
        <SelectorImpuestos
          subtotal={subtotalEquipos}
          config={impuestosConfig}
          onChange={setImpuestosConfig}
        />

        {/* SECCIÓN 4: LOGÍSTICA, TRANSPORTE Y TOTAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-800">Destino de la Obra y Observaciones</h4>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Obra / Proyecto</label>
              <input
                type="text"
                value={obraNombre}
                onChange={(e) => setObraNombre(e.target.value)}
                placeholder="Ej. Torres del Parque - Etapa 2"
                className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección de Entrega</label>
              <input
                type="text"
                value={obraDireccion}
                onChange={(e) => setObraDireccion(e.target.value)}
                placeholder="Ej. Calle 123 # 45-67, Bogotá"
                className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones Comerciales</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Términos de pago, horarios de entrega o condiciones especiales..."
                className="w-full text-xs rounded-lg border-slate-300 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
              Liquidación Financiera
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Equipos:</span>
                <span className="font-mono font-medium">{formatearCOP(subtotalEquipos)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Flete / Transporte de Obra:</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={valorTransporte}
                  onChange={(e) => setValorTransporte(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right text-xs rounded-md border-slate-300 py-1 font-mono"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Depósito / Garantía Sugerida:</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={depositoGarantia}
                  onChange={(e) => setDepositoGarantia(parseFloat(e.target.value) || 0)}
                  className="w-32 text-right text-xs rounded-md border-slate-300 py-1 font-mono"
                />
              </div>

              {impuestosConfig.aplicaIva && (
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>(+) IVA ({impuestosConfig.tasaIva}%):</span>
                  <span className="font-mono">+{formatearCOP(valorIva)}</span>
                </div>
              )}

              {impuestosConfig.aplicaRetefuente && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>(-) ReteFuente ({impuestosConfig.tasaRetefuente}%):</span>
                  <span className="font-mono">-{formatearCOP(valorRetefuente)}</span>
                </div>
              )}

              {impuestosConfig.aplicaReteica && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>(-) ReteICA ({impuestosConfig.tasaReteica}%):</span>
                  <span className="font-mono">-{formatearCOP(valorReteica)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>TOTAL COTIZADO:</span>
                <span className="text-base font-black text-blue-700 font-mono">
                  {formatearCOP(totalFinal)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar Cotización</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
