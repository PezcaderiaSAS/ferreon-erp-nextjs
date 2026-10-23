'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  User,
  Plus,
  Trash2,
  Barcode,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  Printer,
  Calendar,
  DollarSign,
  ShieldCheck,
  Truck,
  RotateCcw,
  Wrench,
  PenTool,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Modal } from '@/components/ui/Modal';
import { useBodegaStore, EquipoUI } from '@/infrastructure/state/bodegaStore';
import { useClienteStore, ClienteUI } from '@/infrastructure/state/clienteStore';
import { crearAlquilerRapidoPosAction, CrearAlquilerRapidoPosInput } from '@/app/actions/alquileres';
import { guardarFirmaClienteAlquilerAction } from '@/app/actions/firma-cliente';
import { MantenimientoPreventivoService } from '@/core/services/mantenimiento-preventivo.service';

const FirmaTouchPadModal = dynamic(
  () => import('@/components/common/FirmaTouchPadModal').then((m) => m.FirmaTouchPadModal),
  { ssr: false }
);

interface CartItem {
  equipoId: number;
  codigo: string;
  nombre: string;
  tarifaDiaria: number;
  stockDisponible: number;
  cantidad: number;
  diasCobro: number;
  subtotal: number;
}

export interface MostradorPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDespachoExitoso?: (alquiler: any) => void;
}

export function MostradorPosModal({ isOpen, onClose, onDespachoExitoso }: MostradorPosModalProps) {
  const { equipos } = useBodegaStore();
  const { clientes, agregarCliente } = useClienteStore();

  // Referencias a inputs para atajos de teclado
  const searchEquipoInputRef = useRef<HTMLInputElement>(null);
  const searchClienteInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Estados de búsqueda
  const [equipoQuery, setEquipoQuery] = useState('');
  const [clienteQuery, setClienteQuery] = useState('');
  const [clienteModoNuevo, setClienteModoNuevo] = useState(false);

  // Datos de cliente seleccionado o nuevo
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null);
  const [nuevoClienteDoc, setNuevoClienteDoc] = useState('');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');
  const [nuevoClienteTelefono, setNuevoClienteTelefono] = useState('');

  // Carrito de mostrador
  const [cart, setCart] = useState<CartItem[]>([]);

  // Parámetros financieros
  const [deposito, setDeposito] = useState<number>(0);
  const [fleteEntrega, setFleteEntrega] = useState<number>(0);
  const [garantiaMonto, setGarantiaMonto] = useState<number>(0);
  const [garantiaTipo, setGarantiaTipo] = useState<string>('Efectivo');
  const [observaciones, setObservaciones] = useState<string>('');

  // Estados operativos y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [despachoExitoso, setDespachoExitoso] = useState<any | null>(null);
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [firmaClienteBase64, setFirmaClienteBase64] = useState<string | null>(null);

  // Formateador de moneda en pesos colombianos (COP)
  const formatearCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.round(val || 0));
  };

  // Filtrado de equipos disponibles en bodega
  const filteredEquipos = useMemo(() => {
    if (!equipoQuery.trim()) return [];
    const q = equipoQuery.toLowerCase().trim();
    return (equipos || [])
      .filter((eq) => {
        const codigo = (eq.codigo || eq.sku || '').toLowerCase();
        const nombre = (eq.nombre || '').toLowerCase();
        return (codigo.includes(q) || nombre.includes(q)) && (eq.stock_disponible ?? eq.stockDisponible ?? 0) > 0;
      })
      .slice(0, 6);
  }, [equipos, equipoQuery]);

  // Filtrado de clientes
  const filteredClientes = useMemo(() => {
    if (!clienteQuery.trim()) return [];
    const q = clienteQuery.toLowerCase().trim();
    return (clientes || [])
      .filter((c) => {
        const doc = (c.nit_cedula || '').toLowerCase();
        const nom = (c.nombre || '').toLowerCase();
        return doc.includes(q) || nom.includes(q);
      })
      .slice(0, 5);
  }, [clientes, clienteQuery]);

  // Cálculos reactivos de subtotales
  const subtotalEquipos = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.subtotal, 0);
  }, [cart]);

  const totalGeneral = useMemo(() => {
    return subtotalEquipos + (Number(fleteEntrega) || 0);
  }, [subtotalEquipos, fleteEntrega]);

  const saldoPendiente = useMemo(() => {
    return Math.max(0, totalGeneral - (Number(deposito) || 0));
  }, [totalGeneral, deposito]);

  // Manejo de atajos de teclado (F2: Cliente, F4: Equipos, F9: Cobrar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchClienteInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        searchEquipoInputRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !isSubmitting && !despachoExitoso) {
          handleProcesarDespacho();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cart, isSubmitting, despachoExitoso, selectedCliente, clienteModoNuevo, nuevoClienteNombre]);

  // Autoenfoque en buscador de equipos al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchEquipoInputRef.current?.focus();
      }, 150);
    } else {
      // Limpiar estado al cerrar
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCart([]);
    setEquipoQuery('');
    setClienteQuery('');
    setSelectedCliente(null);
    setClienteModoNuevo(false);
    setNuevoClienteDoc('');
    setNuevoClienteNombre('');
    setNuevoClienteTelefono('');
    setDeposito(0);
    setFleteEntrega(0);
    setGarantiaMonto(0);
    setObservaciones('');
    setErrorMsg(null);
    setDespachoExitoso(null);
  };

  // Agregar equipo al carrito (si ya existe, incrementa cantidad hasta el stock disponible)
  const handleAddEquipo = (eq: EquipoUI) => {
    const rawId = String(eq.id).replace(/\D/g, '');
    const eqId = parseInt(rawId, 10) || Number(eq.id);
    const stockMax = eq.stock_disponible ?? eq.stockDisponible ?? 0;
    const tarifa = eq.tarifa_diaria ?? eq.tarifaDiaria ?? 0;

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.equipoId === eqId);
      if (idx >= 0) {
        const itemExistente = prev[idx];
        if (itemExistente.cantidad >= stockMax) {
          setErrorMsg(`Stock máximo alcanzado para ${eq.nombre} (${stockMax} disponibles).`);
          return prev;
        }
        const nuevaCant = itemExistente.cantidad + 1;
        const nuevoSubtotal = nuevaCant * itemExistente.tarifaDiaria * itemExistente.diasCobro;
        const copy = [...prev];
        copy[idx] = { ...itemExistente, cantidad: nuevaCant, subtotal: nuevoSubtotal };
        return copy;
      } else {
        const nuevoItem: CartItem = {
          equipoId: eqId,
          codigo: eq.codigo || eq.sku || `EQ-${eqId}`,
          nombre: eq.nombre,
          tarifaDiaria: tarifa,
          stockDisponible: stockMax,
          cantidad: 1,
          diasCobro: 1,
          subtotal: tarifa * 1 * 1,
        };
        return [...prev, nuevoItem];
      }
    });

    setEquipoQuery('');
    setErrorMsg(null);
  };

  const handleUpdateItemCantidad = (equipoId: number, cant: number) => {
    setCart((prev) =>
      prev.map((it) => {
        if (it.equipoId === equipoId) {
          const validCant = Math.min(Math.max(1, cant), it.stockDisponible);
          return {
            ...it,
            cantidad: validCant,
            subtotal: validCant * it.tarifaDiaria * it.diasCobro,
          };
        }
        return it;
      })
    );
  };

  const handleUpdateItemDias = (equipoId: number, dias: number) => {
    setCart((prev) =>
      prev.map((it) => {
        if (it.equipoId === equipoId) {
          const validDias = Math.max(1, dias);
          return {
            ...it,
            diasCobro: validDias,
            subtotal: it.cantidad * it.tarifaDiaria * validDias,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (equipoId: number) => {
    setCart((prev) => prev.filter((it) => it.equipoId !== equipoId));
  };

  // Procesar despacho POS ultra-rápido (<30s)
  const handleProcesarDespacho = async () => {
    setErrorMsg(null);

    if (cart.length === 0) {
      setErrorMsg('Debe agregar al menos un equipo al mostrador.');
      return;
    }

    if (!selectedCliente && !clienteModoNuevo) {
      setErrorMsg('Debe seleccionar un cliente existente o activar el registro On-The-Fly.');
      return;
    }

    if (clienteModoNuevo && !nuevoClienteNombre.trim()) {
      setErrorMsg('El nombre del nuevo cliente es obligatorio.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CrearAlquilerRapidoPosInput = {
        clienteId: selectedCliente ? selectedCliente.id : null,
        clienteNuevo: clienteModoNuevo
          ? {
              nit_cedula: nuevoClienteDoc.trim() || undefined,
              nombre: nuevoClienteNombre.trim(),
              telefono: nuevoClienteTelefono.trim() || undefined,
            }
          : null,
        items: cart.map((it) => ({
          equipoId: it.equipoId,
          cantidad: it.cantidad,
          tarifaAplicada: it.tarifaDiaria,
          diasCobro: it.diasCobro,
          subtotalLinea: it.subtotal,
        })),
        deposito: Number(deposito) || 0,
        fleteEntrega: Number(fleteEntrega) || 0,
        garantiaMonto: Number(garantiaMonto) || 0,
        garantiaTipo,
        observaciones: observaciones || 'Despacho Rápido Mostrador POS (<30s)',
        detallesLogistica: 'Entrega Inmediata en Mostrador',
      };

      const res = await crearAlquilerRapidoPosAction(payload);

      if (!res.success || !res.data) {
        setErrorMsg(res.error || 'Ocurrió un error al despachar en mostrador.');
        setIsSubmitting(false);
        return;
      }

      // Si se capturó firma touch del cliente en mostrador, persistirla de inmediato
      const nuevoAlquilerId = res.data.alquiler_id || res.data.id;
      if (firmaClienteBase64 && nuevoAlquilerId) {
        try {
          await guardarFirmaClienteAlquilerAction({
            alquilerId: nuevoAlquilerId,
            firmaBase64: firmaClienteBase64,
            clienteNombre: selectedCliente?.nombre || nuevoClienteNombre || 'Cliente',
            clienteNit: selectedCliente?.nit_cedula || nuevoClienteDoc || '',
          });
        } catch (fErr) {
          console.warn('[MostradorPos] Error guardando firma cliente:', fErr);
        }
      }

      setDespachoExitoso(res.data);
      if (onDespachoExitoso) {
        onDespachoExitoso(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red o comunicación con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="6xl">
      <div className="relative -mt-4">
        {/* Cabecera Corporativa Alquileres System */}
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Alquileres System POS
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Modo Mostrador &lt;30s
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Despacho Rápido en Punto de Venta
              </h2>
            </div>
          </div>

          {/* Atajos Rápidos Informativos */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-gray-700 dark:text-gray-300">F2</span> Cliente
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-gray-700 dark:text-gray-300 ml-2">F4</span> Equipos
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-gray-700 dark:text-gray-300 ml-2">F9</span> Cobrar
          </div>
        </div>

        {/* Vista de Éxito / Comprobante */}
        {despachoExitoso ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                ¡Alquiler Despachado con Éxito!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                Contrato #{despachoExitoso.consecutivo || despachoExitoso.id} • Cliente:{' '}
                {despachoExitoso.cliente_nombre || 'Mostrador POS'}
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Liquidado:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {formatearCOP(despachoExitoso.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Anticipo / Depósito Cobrado:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatearCOP(despachoExitoso.deposito)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500">Saldo Pendiente en Obra:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatearCOP(despachoExitoso.saldo_pendiente)}
                </span>
              </div>
              {despachoExitoso.movimiento_caja_id && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono pt-1">
                  ✓ Ingreso registrado en sesión activa de caja
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" /> Nuevo Despacho POS
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        ) : (
          /* Cuerpo Operativo de 2 Columnas */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            {/* Columna Izquierda: Búsqueda y Selección (7 Columnas) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Sección 1: Selección de Cliente */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-500" />
                    1. Cliente Mostrador
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteModoNuevo(!clienteModoNuevo);
                      setSelectedCliente(null);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    {clienteModoNuevo ? 'Buscar Existente' : '+ Nuevo On-The-Fly'}
                  </button>
                </div>

                {clienteModoNuevo ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Cédula / NIT"
                      value={nuevoClienteDoc}
                      onChange={(e) => setNuevoClienteDoc(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Nombre Completo *"
                      value={nuevoClienteNombre}
                      onChange={(e) => setNuevoClienteNombre(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="text"
                      placeholder="Teléfono / WhatsApp"
                      value={nuevoClienteTelefono}
                      onChange={(e) => setNuevoClienteTelefono(e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center relative">
                      <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                      <input
                        ref={searchClienteInputRef}
                        type="text"
                        placeholder="Buscar cliente por Cédula o Nombre... (F2)"
                        value={selectedCliente ? `${selectedCliente.nombre} (${selectedCliente.nit_cedula || ''})` : clienteQuery}
                        onChange={(e) => {
                          setSelectedCliente(null);
                          setClienteQuery(e.target.value);
                        }}
                        className="w-full pl-9 pr-16 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      {selectedCliente && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCliente(null);
                            setClienteQuery('');
                          }}
                          className="absolute right-2 px-2 py-1 text-xs text-gray-500 hover:text-red-500"
                        >
                          Cambiar
                        </button>
                      )}
                    </div>

                    {/* Resultados de clientes */}
                    {!selectedCliente && filteredClientes.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredClientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCliente(c);
                              setClienteQuery('');
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center"
                          >
                            <span className="font-medium text-gray-900 dark:text-white">{c.nombre}</span>
                            <span className="text-xs text-gray-500 font-mono">
                              {c.nit_cedula || ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección 2: Búsqueda Rápida de Equipos por SKU/Código */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-emerald-500" />
                    2. Búsqueda de Equipos / Lector Código de Barras
                  </span>
                  <span className="text-xs text-gray-400 font-mono font-normal">Atajo: F4</span>
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    ref={searchEquipoInputRef}
                    type="text"
                    placeholder="Escanear código de barras o escribir SKU/Nombre... (F4)"
                    value={equipoQuery}
                    onChange={(e) => setEquipoQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredEquipos.length > 0) {
                        e.preventDefault();
                        handleAddEquipo(filteredEquipos[0]);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                {/* Lista de equipos coincidentes */}
                {filteredEquipos.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredEquipos.map((eq) => {
                      const stock = eq.stock_disponible ?? eq.stockDisponible ?? 0;
                      const tarifa = eq.tarifa_diaria ?? eq.tarifaDiaria ?? 0;
                      const semaforo = MantenimientoPreventivoService.evaluarSemaforoMantenimiento({
                        tieneHorometro: Number((eq as any).horas_limite_mantenimiento || 0) > 0,
                        horasUsoAcumuladas: Number((eq as any).horas_uso_acumuladas || 0),
                        horasLimiteMantenimiento: Number((eq as any).horas_limite_mantenimiento || 0),
                        diasUsoAcumulados: Number((eq as any).dias_uso_acumulados || 0),
                        diasLimiteMantenimiento: Number((eq as any).dias_limite_mantenimiento || 0),
                        stockMantenimiento: Number((eq as any).stock_mantenimiento ?? eq.stockMantenimiento ?? 0),
                        ultimoMantenimientoAt: (eq as any).ultimo_mantenimiento_at || null,
                        ultimoMantenimientoObs: null,
                      });

                      return (
                        <div
                          key={eq.id}
                          className="px-3 py-2 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition"
                        >
                          <div>
                            <div className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                              <span>{eq.nombre}</span>
                              {semaforo === 'VENCIDO' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60">
                                  <Wrench className="w-2.5 h-2.5" /> Service Vencido
                                </span>
                              )}
                              {semaforo === 'PROXIMO' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60">
                                  <Wrench className="w-2.5 h-2.5" /> Service Próximo
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              SKU: {eq.codigo || eq.sku} • Disp: <span className="text-emerald-600 font-bold">{stock}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {formatearCOP(tarifa)}/día
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddEquipo(eq)}
                              className="px-3 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 transition shadow-sm cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mensajes de Error / Advertencia */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Columna Derecha: Carrito Mostrador y Liquidación (5 Columnas) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-gray-50/80 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-blue-500" />
                    Equipos en Mostrador ({cart.length})
                  </span>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Vaciar
                    </button>
                  )}
                </div>

                {/* Items en el Carrito */}
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    No hay equipos agregados al mostrador.
                    <br />
                    <span className="text-xs text-gray-500 font-mono">Presione F4 para buscar por SKU.</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {cart.map((it) => (
                      <div
                        key={it.equipoId}
                        className="p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 flex-1 pr-2">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {it.nombre}
                          </div>
                          <div className="text-gray-500 font-mono text-[11px]">
                            {formatearCOP(it.tarifaDiaria)} x día
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            <span className="text-[10px] text-gray-500">Cant:</span>
                            <input
                              type="number"
                              min="1"
                              max={it.stockDisponible}
                              value={it.cantidad}
                              onChange={(e) =>
                                handleUpdateItemCantidad(it.equipoId, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-10 bg-transparent text-center font-bold text-gray-900 dark:text-white outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            <span className="text-[10px] text-gray-500">Días:</span>
                            <input
                              type="number"
                              min="1"
                              value={it.diasCobro}
                              onChange={(e) =>
                                handleUpdateItemDias(it.equipoId, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-10 bg-transparent text-center font-bold text-gray-900 dark:text-white outline-none"
                            />
                          </div>

                          <span className="font-bold text-gray-900 dark:text-white w-20 text-right">
                            {formatearCOP(it.subtotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.equipoId)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parámetros Adicionales: Flete, Garantía, Depósito */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-xs">
                  <div>
                    <label className="text-gray-500 block mb-1">Flete Entrega:</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={fleteEntrega || ''}
                      placeholder="$0"
                      onChange={(e) => setFleteEntrega(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-right font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Depósito / Cobro Caja:</label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={deposito || ''}
                      placeholder="$0"
                      onChange={(e) => setDeposito(Number(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-right font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen Total y Botón de Cobro F9 */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal Equipos:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {formatearCOP(subtotalEquipos)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Total Contrato:</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {formatearCOP(totalGeneral)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Anticipo Mostrador:</span>
                    <span>{formatearCOP(deposito)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold border-t border-dashed border-gray-200 dark:border-gray-700 pt-1">
                    <span>Saldo Pendiente:</span>
                    <span>{formatearCOP(saldoPendiente)}</span>
                  </div>
                </div>

                {/* Botón de Firma Touch del Cliente */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-brand-salmon" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {firmaClienteBase64 ? 'Firma del Cliente: Capturada ✓' : 'Firma Touch del Cliente:'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFirmaModalOpen(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      firmaClienteBase64
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {firmaClienteBase64 ? 'Modificar' : 'Firmar Touch'}
                  </button>
                </div>

                <button
                  ref={submitButtonRef}
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleProcesarDespacho}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Despachando...
                    </span>
                  ) : (
                    <>
                      <span>Cobrar y Despachar (F9)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pad de Firma Digital Touch del Cliente */}
      <FirmaTouchPadModal
        isOpen={isFirmaModalOpen}
        onClose={() => setIsFirmaModalOpen(false)}
        clienteNombre={selectedCliente?.nombre || nuevoClienteNombre || 'Cliente'}
        clienteNit={selectedCliente?.nit_cedula || nuevoClienteDoc || ''}
        onFirmaConfirmada={(b64) => setFirmaClienteBase64(b64)}
      />
    </Modal>
  );
}
