'use client';

import React, { useState, useMemo } from 'react';
import {
  X, Plus, Trash2, Calendar, User, Phone, MapPin, Truck,
  ShieldCheck, AlertCircle, FileText, Send, CheckCircle2, Sparkles, Building2
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { crearCotizacionAction } from '@/app/actions/cotizaciones';
import { crearClienteAction } from '@/app/actions/clientes';
import {
  calcularTotalesCotizacion,
  construirEnlaceWhatsAppCotizacion,
  type CotizacionItemCalculo,
  type ImpuestosCotizacionConfig
} from '@/core/services/cotizacion-rapida.service';

export interface CotizacionRapidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: any[];
  equipos: any[];
  onCotizacionCreada?: (nuevaCotizacion: any) => void;
}

interface FilaItem {
  equipoId: string | number;
  nombre: string;
  cantidad: number;
  dias: number;
  tarifaDiaria: number;
  stockDisponible: number;
}

export function CotizacionRapidaModal({
  isOpen,
  onClose,
  clientes,
  equipos,
  onCotizacionCreada,
}: CotizacionRapidaModalProps) {
  // 1. Modo de Cliente: 'EXISTENTE' vs 'EXPRESS'
  const [modoCliente, setModoCliente] = useState<'EXISTENTE' | 'EXPRESS'>('EXISTENTE');
  const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteDocumento, setClienteDocumento] = useState<string>('');
  const [clienteEmail, setClienteEmail] = useState<string>('');

  // 2. Parámetros de Obra y Vigencia
  const [obraNombre, setObraNombre] = useState<string>('');
  const [obraDireccion, setObraDireccion] = useState<string>('');
  const [diasVigencia, setDiasVigencia] = useState<number>(15);
  const [valorTransporte, setValorTransporte] = useState<number>(0);
  const [depositoGarantia, setDepositoGarantia] = useState<number>(0);
  const [observaciones, setObservaciones] = useState<string>('');

  // 3. Ítems de la Cotización
  const [items, setItems] = useState<FilaItem[]>([
    { equipoId: '', nombre: '', cantidad: 1, dias: 7, tarifaDiaria: 0, stockDisponible: 0 }
  ]);

  // 4. Configuración Tributaria
  const [aplicaIva, setAplicaIva] = useState<boolean>(true);
  const [aplicaRetenciones, setAplicaRetenciones] = useState<boolean>(false);
  const [tasaRetefuente, setTasaRetefuente] = useState<number>(2.5);
  const [tasaReteica, setTasaReteica] = useState<number>(0.966);

  // Estados de interfaz y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fecha de vencimiento calculada
  const fechaVencimientoCalculada = useMemo(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasVigencia);
    return fecha.toISOString().split('T')[0];
  }, [diasVigencia]);

  // Manejo de Selección de Cliente Existente
  const handleSelectClienteExistente = (idStr: string) => {
    setClienteIdSeleccionado(idStr);
    if (!idStr) {
      setClienteNombre('');
      setClienteTelefono('');
      setClienteDocumento('');
      setClienteEmail('');
      return;
    }
    const found = clientes.find((c) => String(c.id) === String(idStr));
    if (found) {
      setClienteNombre(found.nombre || '');
      setClienteTelefono(found.telefono || found.contacto || '');
      setClienteDocumento(found.nit_cedula || found.nit || '');
      setClienteEmail(found.email || '');
    }
  };

  // Manejo de Ítems
  const handleItemChange = (index: number, field: keyof FilaItem, value: any) => {
    const copia = [...items];
    const itemActual = { ...copia[index] };

    if (field === 'equipoId') {
      const eq = equipos.find((e) => String(e.id) === String(value));
      if (eq) {
        itemActual.equipoId = eq.id;
        itemActual.nombre = eq.nombre;
        itemActual.tarifaDiaria = Number(eq.tarifa_diaria ?? eq.tarifaDiaria ?? eq.precio_dia ?? 0);
        itemActual.stockDisponible = Number(eq.stock_disponible ?? eq.stockDisponible ?? 0);
      } else {
        itemActual.equipoId = '';
        itemActual.nombre = '';
        itemActual.tarifaDiaria = 0;
        itemActual.stockDisponible = 0;
      }
    } else {
      (itemActual as any)[field] = value;
    }

    copia[index] = itemActual;
    setItems(copia);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { equipoId: '', nombre: '', cantidad: 1, dias: 7, tarifaDiaria: 0, stockDisponible: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Cálculo en Vivo con el Servicio Puro
  const resumenFinanciero = useMemo(() => {
    const itemsCalculables: CotizacionItemCalculo[] = items.map((it) => ({
      cantidad: Math.max(1, Number(it.cantidad) || 1),
      dias: Math.max(1, Number(it.dias) || 1),
      tarifaDiaria: Math.max(0, Number(it.tarifaDiaria) || 0),
    }));

    const configImpuestos: ImpuestosCotizacionConfig = {
      aplicaIva,
      tasaIva: 19.0,
      aplicaRetefuente: aplicaRetenciones,
      tasaRetefuente,
      aplicaReteica: aplicaRetenciones,
      tasaReteica,
    };

    return calcularTotalesCotizacion(
      itemsCalculables,
      configImpuestos,
      valorTransporte,
      depositoGarantia
    );
  }, [items, aplicaIva, aplicaRetenciones, tasaRetefuente, tasaReteica, valorTransporte, depositoGarantia]);

  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  // Enviar y Procesar
  const handleGuardar = async (conWhatsApp = false) => {
    setErrorMsg(null);

    const nombreFinal = clienteNombre.trim();
    if (!nombreFinal) {
      setErrorMsg('Especifique el nombre o razón social del cliente.');
      return;
    }

    const itemsValidos = items.filter((it) => it.equipoId && it.cantidad > 0 && it.dias > 0);
    if (itemsValidos.length === 0) {
      setErrorMsg('Debe seleccionar al menos un equipo válido con cantidad y días.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalClienteId: number | null = clienteIdSeleccionado ? parseInt(clienteIdSeleccionado, 10) : null;

      // Si es un prospecto Express nuevo con datos, opcionalmente lo creamos en clientes
      if (modoCliente === 'EXPRESS' && !finalClienteId && nombreFinal) {
        try {
          const cliRes = await crearClienteAction({
            nombre: nombreFinal,
            nit_cedula: clienteDocumento.trim() || `PROSP-${Date.now().toString().slice(-6)}`,
            telefono: clienteTelefono.trim() || undefined,
            email: clienteEmail.trim() || undefined,
          });
          if (cliRes?.success && cliRes.data?.id) {
            finalClienteId = Number(cliRes.data.id);
          }
        } catch (cliErr) {
          console.warn('[CotizacionRapidaModal] Creación de cliente express tolerada:', cliErr);
        }
      }

      const res = await crearCotizacionAction({
        clienteId: finalClienteId,
        clienteNombre: nombreFinal,
        clienteDocumento: clienteDocumento.trim() || undefined,
        clienteTelefono: clienteTelefono.trim() || undefined,
        clienteEmail: clienteEmail.trim() || undefined,
        fechaVencimiento: fechaVencimientoCalculada,
        obraNombre: obraNombre.trim() || undefined,
        obraDireccion: obraDireccion.trim() || undefined,
        aplicaIva,
        tasaIva: 19.0,
        aplicaRetefuente: aplicaRetenciones,
        tasaRetefuente,
        aplicaReteica: aplicaRetenciones,
        tasaReteica,
        valorTransporte: Number(valorTransporte || 0),
        depositoGarantia: Number(depositoGarantia || 0),
        observaciones: observaciones.trim() || undefined,
        items: itemsValidos.map((it) => ({
          equipoId: it.equipoId,
          nombre: it.nombre,
          cantidad: Number(it.cantidad),
          dias: Number(it.dias),
          tarifaDiaria: Number(it.tarifaDiaria),
        })),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Error al registrar la cotización');
        setIsSubmitting(false);
        return;
      }

      const cotizacionCreada = res.data;

      // Si el asesor eligió "Guardar y Enviar por WhatsApp", construimos el link y abrimos
      if (conWhatsApp) {
        const { url } = construirEnlaceWhatsAppCotizacion({
          telefonoDestino: clienteTelefono,
          clienteNombre: nombreFinal,
          consecutivo: cotizacionCreada.consecutivo || 'COT',
          items: itemsValidos.map((it) => ({
            nombre: it.nombre,
            cantidad: it.cantidad,
            dias: it.dias,
          })),
          total: resumenFinanciero.total,
          fechaVencimiento: fechaVencimientoCalculada,
        });

        if (typeof window !== 'undefined') {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }

      if (onCotizacionCreada) {
        onCotizacionCreada(cotizacionCreada);
      }
      onClose();
    } catch (err: any) {
      console.error('Error en creación express de cotización:', err);
      setErrorMsg(err.message || 'Error inesperado al guardar la cotización');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Nueva Cotización Rápida Express (30s)"
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-800 dark:text-slate-100 text-sm">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 1. Selector de Cliente (Existente vs Prospecto Rápido) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <User className="w-4 h-4 text-brand-salmon" />
              <span>Cliente o Prospecto Comercial</span>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-xs font-medium">
              <button
                type="button"
                onClick={() => setModoCliente('EXISTENTE')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  modoCliente === 'EXISTENTE'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cliente Registrado
              </button>
              <button
                type="button"
                onClick={() => setModoCliente('EXPRESS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  modoCliente === 'EXPRESS'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                + Prospecto Express
              </button>
            </div>
          </div>

          {modoCliente === 'EXISTENTE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Buscar Cliente Registrado
                </label>
                <select
                  value={clienteIdSeleccionado}
                  onChange={(e) => handleSelectClienteExistente(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-salmon/20 outline-none"
                >
                  <option value="">-- Seleccionar de la lista ({clientes.length}) --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.nit_cedula ? `(${c.nit_cedula})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Teléfono / WhatsApp (para envío directo)
                </label>
                <input
                  type="text"
                  placeholder="3001234567"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums focus:ring-2 focus:ring-brand-salmon/20 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nombre o Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Constructora El Samán / Ing. Andrés Rojas"
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-salmon/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Teléfono / WhatsApp <span className="text-brand-salmon">*</span>
                </label>
                <input
                  type="text"
                  placeholder="3105551234"
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums focus:ring-2 focus:ring-brand-salmon/20 outline-none"
                />
              </div>
            </div>
          )}

          {/* Obra y Vigencia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Nombre de Obra / Proyecto
              </label>
              <input
                type="text"
                placeholder="Ej: Torre Titanium / Obra Norte"
                value={obraNombre}
                onChange={(e) => setObraNombre(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-brand-salmon outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Dirección / Municipio
              </label>
              <input
                type="text"
                placeholder="Ej: Chía, Cundinamarca"
                value={obraDireccion}
                onChange={(e) => setObraDireccion(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-brand-salmon outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                Vigencia de Oferta
              </label>
              <select
                value={diasVigencia}
                onChange={(e) => setDiasVigencia(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums focus:ring-1 focus:ring-brand-salmon outline-none"
              >
                <option value={7}>7 días (hasta {new Date(Date.now() + 7 * 864e5).toLocaleDateString('es-CO')})</option>
                <option value={15}>15 días (hasta {new Date(Date.now() + 15 * 864e5).toLocaleDateString('es-CO')})</option>
                <option value={30}>30 días (hasta {new Date(Date.now() + 30 * 864e5).toLocaleDateString('es-CO')})</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Selector de Maquinaria y Equipos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Equipos & Tarifas ({items.length})
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-salmon hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar otro equipo</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row gap-2.5 items-start sm:items-center"
              >
                {/* Equipo */}
                <div className="flex-1 w-full">
                  <select
                    value={it.equipoId}
                    onChange={(e) => handleItemChange(idx, 'equipoId', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                  >
                    <option value="">-- Seleccionar Equipo ({equipos.length}) --</option>
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nombre} — Stock: {eq.stock_disponible ?? eq.stockDisponible ?? 0} disp. (
                        {formatearCOP(eq.tarifa_diaria ?? eq.tarifaDiaria ?? eq.precio_dia ?? 0)}/día)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad y Días */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 block">Cant</label>
                    <input
                      type="number"
                      min={1}
                      value={it.cantidad}
                      onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums text-center"
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] text-slate-400 block">Días</label>
                    <input
                      type="number"
                      min={1}
                      value={it.dias}
                      onChange={(e) => handleItemChange(idx, 'dias', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums text-center"
                    />
                  </div>

                  <div className="w-28">
                    <label className="text-[10px] text-slate-400 block">Tarifa/Día</label>
                    <input
                      type="number"
                      min={0}
                      value={it.tarifaDiaria}
                      onChange={(e) => handleItemChange(idx, 'tarifaDiaria', e.target.value)}
                      className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums text-right"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="mt-3.5 p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                      title="Quitar equipo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Desglose Financiero y Parámetros Tributarios */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Opciones de Impuestos y Flete */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <span className="text-xs font-medium">Aplicar IVA (19%)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaIva}
                    onChange={(e) => setAplicaIva(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <span className="text-xs font-medium">Retenciones (RteFte 2.5% + RteICA)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicaRetenciones}
                    onChange={(e) => setAplicaRetenciones(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-salmon" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Transporte / Flete</label>
                  <input
                    type="number"
                    min={0}
                    value={valorTransporte}
                    onChange={(e) => setValorTransporte(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums text-right outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Depósito Garantía</label>
                  <input
                    type="number"
                    min={0}
                    value={depositoGarantia}
                    onChange={(e) => setDepositoGarantia(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums text-right outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Resumen de Totales */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal Equipos:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                  {formatearCOP(resumenFinanciero.subtotal)}
                </span>
              </div>

              {aplicaIva && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>IVA (19%):</span>
                  <span className="font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatearCOP(resumenFinanciero.valorIva)}
                  </span>
                </div>
              )}

              {valorTransporte > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Flete / Logística:</span>
                  <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                    +{formatearCOP(resumenFinanciero.valorTransporte)}
                  </span>
                </div>
              )}

              {aplicaRetenciones && (
                <>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Retefuente (2.5%):</span>
                    <span className="font-mono tabular-nums font-medium text-amber-600 dark:text-amber-400">
                      -{formatearCOP(resumenFinanciero.valorRetefuente)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>ReteICA:</span>
                    <span className="font-mono tabular-nums font-medium text-amber-600 dark:text-amber-400">
                      -{formatearCOP(resumenFinanciero.valorReteica)}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Total Cotizado:</span>
                <span className="text-lg font-bold font-mono tabular-nums text-brand-salmon">
                  {formatearCOP(resumenFinanciero.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Acciones Finales */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleGuardar(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-xs transition-all shadow-xs"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cotización'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleGuardar(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Procesando...' : 'Guardar y Enviar WhatsApp 💬'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
