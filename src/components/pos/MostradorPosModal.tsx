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
  Briefcase,
  Building2,
  Info,
  Eye,
  Clock,
  Minus,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { Modal } from '@/components/ui/Modal';
import { useBodegaStore, EquipoUI } from '@/infrastructure/state/bodegaStore';
import { useClienteStore, ClienteUI } from '@/infrastructure/state/clienteStore';
import { useEmpresaStore } from '@/infrastructure/state/empresaStore';
import { AlquilerHorasService } from '@/core/services/alquiler-horas.service';
import { crearAlquilerRapidoPosAction, CrearAlquilerRapidoPosInput } from '@/app/actions/alquileres';
import { guardarFirmaClienteAlquilerAction } from '@/app/actions/firma-cliente';
import {
  CalendarioLaboralService,
  ModoCobroDias,
  DesgloseDiasAlquiler,
} from '@/core/services/calendario-laboral.service';
import { MantenimientoPreventivoService } from '@/core/services/mantenimiento-preventivo.service';
import { obtenerFechaHoyISO } from '@/core/utils/fechas';

const FirmaTouchPadModal = dynamic(
  () => import('@/components/common/FirmaTouchPadModal').then((m) => m.FirmaTouchPadModal),
  { ssr: false }
);

interface CartItem {
  equipoId: number;
  codigo: string;
  nombre: string;
  tarifaDiaria: number;
  tarifaHoraria?: number;
  stockDisponible: number;
  cantidad: number;
  diasCobro: number;
  horasCobro?: number;
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
  const { config } = useEmpresaStore();

  const alquilerHorasHabilitado = config?.alquilerHorasHabilitado ?? true;
  const maxEquiposExpress = config?.maxEquiposAlquilerHoras ?? 5;
  const recargoHorasPorcentaje = config?.recargoHorasPorcentaje ?? 20;

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

  // Modalidad de alquiler: 'DIAS' vs 'HORAS' (SPEC-015)
  const [unidadTiempo, setUnidadTiempo] = useState<'DIAS' | 'HORAS'>('DIAS');
  const [horasAlquiler, setHorasAlquiler] = useState<number>(4);
  const [horaSalida, setHoraSalida] = useState<string>(() => AlquilerHorasService.obtenerHoraActualHHMM());

  // Proyección reactiva de horarios en tiempo real
  const horaRetornoEstimada = useMemo(() => {
    return AlquilerHorasService.proyectarHoraRetorno(horaSalida, horasAlquiler, '12h');
  }, [horaSalida, horasAlquiler]);

  const horaRetorno24 = useMemo(() => {
    return AlquilerHorasService.proyectarHoraRetorno(horaSalida, horasAlquiler, '24h');
  }, [horaSalida, horasAlquiler]);

  const sobrepasaHorarioLaboral = useMemo(() => {
    return AlquilerHorasService.esSobrepasoHorarioLaboral(horaRetorno24);
  }, [horaRetorno24]);

  const totalUnidadesEnCarrito = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.cantidad, 0);
  }, [cart]);

  const topeEquiposAlcanzado = useMemo(() => {
    return unidadTiempo === 'HORAS' && totalUnidadesEnCarrito >= maxEquiposExpress;
  }, [unidadTiempo, totalUnidadesEnCarrito, maxEquiposExpress]);

  // Parámetros financieros
  const [deposito, setDeposito] = useState<number>(0);
  const [fleteEntrega, setFleteEntrega] = useState<number>(0);
  const [garantiaMonto, setGarantiaMonto] = useState<number>(0);
  const [garantiaTipo, setGarantiaTipo] = useState<string>('Efectivo');
  const [observaciones, setObservaciones] = useState<string>('');

  // Estados de calendario laboral y tarifas dinámicas (SPEC-014)
  const hoyISO = useMemo(() => obtenerFechaHoyISO(), []);
  const [fechaInicio, setFechaInicio] = useState<string>(hoyISO);
  const [fechaFin, setFechaFin] = useState<string>(() => {
    try {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      return d.toISOString().split('T')[0];
    } catch {
      return hoyISO;
    }
  });
  const [modoCobroDias, setModoCobroDias] = useState<ModoCobroDias>('CALENDARIO');
  const [mostrarModalDesglose, setMostrarModalDesglose] = useState(false);

  // Estados operativos y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [despachoExitoso, setDespachoExitoso] = useState<any | null>(null);
  const [isFirmaModalOpen, setIsFirmaModalOpen] = useState(false);
  const [firmaClienteBase64, setFirmaClienteBase64] = useState<string | null>(null);

  // Desglose reactivo de días hábiles y festivos bajo Ley Emiliani (SPEC-014)
  const desgloseDias: DesgloseDiasAlquiler = useMemo(() => {
    try {
      if (fechaFin >= fechaInicio) {
        return CalendarioLaboralService.desglosarDiasPeriodo(fechaInicio, fechaFin, modoCobroDias);
      }
    } catch (e) {
      console.warn('[MostradorPos] Error calculando desglose:', e);
    }
    return {
      totalDiasCalendario: 1,
      diasCobrables: 1,
      diasExcluidos: 0,
      modoCobro: modoCobroDias,
      detalles: [],
    };
  }, [fechaInicio, fechaFin, modoCobroDias]);

  // Actualizar días y subtotales en el carrito reactivamente en 0 ms
  useEffect(() => {
    if (unidadTiempo === 'HORAS') {
      setCart((prev) =>
        prev.map((it) => {
          const tarifaHora = AlquilerHorasService.calcularTarifaHora(it.tarifaDiaria, recargoHorasPorcentaje);
          return {
            ...it,
            tarifaHoraria: tarifaHora,
            horasCobro: horasAlquiler,
            subtotal: it.cantidad * tarifaHora * horasAlquiler,
          };
        })
      );
    } else {
      const diasCalculados = Math.max(1, desgloseDias.diasCobrables);
      setCart((prev) =>
        prev.map((it) => ({
          ...it,
          diasCobro: diasCalculados,
          subtotal: it.cantidad * it.tarifaDiaria * diasCalculados,
        }))
      );
    }
  }, [unidadTiempo, horasAlquiler, recargoHorasPorcentaje, desgloseDias.diasCobrables]);

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
    setModoCobroDias('CALENDARIO');
    setMostrarModalDesglose(false);
    setUnidadTiempo('DIAS');
    setHorasAlquiler(4);
    setHoraSalida(AlquilerHorasService.obtenerHoraActualHHMM());
  };

  // Agregar equipo al carrito (con validación Poka-Yoke de tope en horas express)
  const handleAddEquipo = (eq: EquipoUI) => {
    if (unidadTiempo === 'HORAS' && totalUnidadesEnCarrito >= maxEquiposExpress) {
      setErrorMsg(`Tope de equipos alcanzado para alquiler express (máx. ${maxEquiposExpress}). Pase a modalidad Por Días para mayor volumen.`);
      return;
    }

    const rawId = String(eq.id).replace(/\D/g, '');
    const eqId = parseInt(rawId, 10) || Number(eq.id);
    const stockMax = eq.stock_disponible ?? eq.stockDisponible ?? 0;
    const tarifa = eq.tarifa_diaria ?? eq.tarifaDiaria ?? 0;
    const diasIniciales = Math.max(1, desgloseDias.diasCobrables);
    const tarifaHora = AlquilerHorasService.calcularTarifaHora(tarifa, recargoHorasPorcentaje);

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.equipoId === eqId);
      if (idx >= 0) {
        const itemExistente = prev[idx];
        if (itemExistente.cantidad >= stockMax) {
          setErrorMsg(`Stock máximo alcanzado para ${eq.nombre} (${stockMax} disponibles).`);
          return prev;
        }
        if (unidadTiempo === 'HORAS' && totalUnidadesEnCarrito >= maxEquiposExpress) {
          setErrorMsg(`Tope de equipos alcanzado para alquiler express (máx. ${maxEquiposExpress}).`);
          return prev;
        }
        const nuevaCant = itemExistente.cantidad + 1;
        const nuevoSubtotal = unidadTiempo === 'HORAS'
          ? nuevaCant * tarifaHora * horasAlquiler
          : nuevaCant * itemExistente.tarifaDiaria * itemExistente.diasCobro;

        const copy = [...prev];
        copy[idx] = {
          ...itemExistente,
          cantidad: nuevaCant,
          tarifaHoraria: tarifaHora,
          horasCobro: horasAlquiler,
          subtotal: nuevoSubtotal,
        };
        return copy;
      } else {
        const subtotalInicial = unidadTiempo === 'HORAS'
          ? 1 * tarifaHora * horasAlquiler
          : tarifa * 1 * diasIniciales;

        const nuevoItem: CartItem = {
          equipoId: eqId,
          codigo: eq.codigo || eq.sku || `EQ-${eqId}`,
          nombre: eq.nombre,
          tarifaDiaria: tarifa,
          tarifaHoraria: tarifaHora,
          stockDisponible: stockMax,
          cantidad: 1,
          diasCobro: diasIniciales,
          horasCobro: horasAlquiler,
          subtotal: subtotalInicial,
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
          let validCant = Math.min(Math.max(1, cant), it.stockDisponible);
          if (unidadTiempo === 'HORAS') {
            const otrasCantidades = prev
              .filter((x) => x.equipoId !== equipoId)
              .reduce((acc, x) => acc + x.cantidad, 0);
            if (otrasCantidades + validCant > maxEquiposExpress) {
              validCant = Math.max(1, maxEquiposExpress - otrasCantidades);
              setErrorMsg(`Tope de ${maxEquiposExpress} equipos para alquiler express alcanzado.`);
            }
          }
          const tarifaHora = it.tarifaHoraria || AlquilerHorasService.calcularTarifaHora(it.tarifaDiaria, recargoHorasPorcentaje);
          const subtotalCalculado = unidadTiempo === 'HORAS'
            ? validCant * tarifaHora * horasAlquiler
            : validCant * it.tarifaDiaria * it.diasCobro;

          return {
            ...it,
            cantidad: validCant,
            subtotal: subtotalCalculado,
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
        unidadTiempo,
        horasContratadas: unidadTiempo === 'HORAS' ? horasAlquiler : undefined,
        horaEntrega: unidadTiempo === 'HORAS' ? horaSalida : undefined,
        horaDevolucionEstimada: unidadTiempo === 'HORAS' ? horaRetorno24 : undefined,
        items: cart.map((it) => ({
          equipoId: it.equipoId,
          cantidad: it.cantidad,
          tarifaAplicada: unidadTiempo === 'HORAS'
            ? (it.tarifaHoraria || AlquilerHorasService.calcularTarifaHora(it.tarifaDiaria, recargoHorasPorcentaje))
            : it.tarifaDiaria,
          unidadTiempo,
          duracion: unidadTiempo === 'HORAS' ? horasAlquiler : it.diasCobro,
          diasCobro: it.diasCobro,
          horaEntrega: unidadTiempo === 'HORAS' ? horaSalida : undefined,
          horaDevolucionEstimada: unidadTiempo === 'HORAS' ? horaRetorno24 : undefined,
          subtotalLinea: it.subtotal,
          fechaInicio,
          fechaFinEstimada: unidadTiempo === 'HORAS' ? fechaInicio : fechaFin,
        })),
        modoCobroDias,
        diasCobrables: unidadTiempo === 'HORAS' ? 1 : desgloseDias.diasCobrables,
        deposito: Number(deposito) || 0,
        fleteEntrega: Number(fleteEntrega) || 0,
        garantiaMonto: Number(garantiaMonto) || 0,
        garantiaTipo,
        observaciones: observaciones || (unidadTiempo === 'HORAS' ? 'Alquiler Express por Horas en Mostrador POS' : 'Despacho Rápido Mostrador POS (<30s)'),
        detallesLogistica: unidadTiempo === 'HORAS' ? `Entrega Express en Mostrador (${horasAlquiler}h)` : 'Entrega Inmediata en Mostrador',
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

      const enrichedDespacho = {
        ...res.data,
        unidadTiempo,
        horasAlquiler: unidadTiempo === 'HORAS' ? horasAlquiler : undefined,
        horaEntrega: unidadTiempo === 'HORAS' ? horaSalida : undefined,
        horaDevolucionEstimada: unidadTiempo === 'HORAS' ? horaRetornoEstimada : undefined,
      };

      setDespachoExitoso(enrichedDespacho);
      if (onDespachoExitoso) {
        onDespachoExitoso(enrichedDespacho);
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
              {despachoExitoso.unidadTiempo === 'HORAS' && (
                <div className="p-2.5 bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" /> Express ({despachoExitoso.horasAlquiler}h)
                  </span>
                  <span className="font-mono font-bold">
                    Salida: {despachoExitoso.horaEntrega} ➔ Retorno: {despachoExitoso.horaDevolucionEstimada}
                  </span>
                </div>
              )}
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

              {/* Sección 2: Modalidad de Alquiler y Tiempos (Por Días vs Por Horas Express - SPEC-015) */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                {/* Selector Segmentado de Nivel Superior: Días vs Horas */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    {unidadTiempo === 'HORAS' ? (
                      <Clock className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Calendar className="w-4 h-4 text-blue-500" />
                    )}
                    2. Modalidad de Alquiler y Tiempos
                  </label>

                  <div className="grid grid-cols-2 gap-1 p-1 bg-gray-200/80 dark:bg-gray-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setUnidadTiempo('DIAS')}
                      className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        unidadTiempo === 'DIAS'
                          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-gray-300 dark:ring-gray-600'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>📅 Por Días</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!alquilerHorasHabilitado) {
                          setErrorMsg('El alquiler por horas está inactivo en Configuración.');
                          return;
                        }
                        setUnidadTiempo('HORAS');
                        setHoraSalida(AlquilerHorasService.obtenerHoraActualHHMM());
                      }}
                      className={`py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        unidadTiempo === 'HORAS'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-100" />
                      <span>⏱️ Por Horas (Express)</span>
                    </button>
                  </div>
                </div>

                {/* Si estamos en MODO HORAS: Tarjeta de Reloj Táctil Ultra-Simple */}
                {unidadTiempo === 'HORAS' ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/30 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm space-y-3">
                    {/* Fila Horarios Salida / Retorno */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                          🟢
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                            Hora Salida (Despacho):
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={horaSalida}
                              onChange={(e) => setHoraSalida(e.target.value)}
                              className="font-mono font-bold text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                            />
                            <span className="text-xs text-gray-500 font-medium">
                              ({AlquilerHorasService.formatearHora12(horaSalida)})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-amber-500 font-bold hidden sm:block text-base">➔</div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">
                          🏁
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                            Hora Límite de Devolución:
                          </span>
                          <span className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                            {horaRetornoEstimada}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones Rápidos (1h, 2h, 4h, 8h) + Stepper Grande [-] [+] */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Duración pactada:
                      </span>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 4, 8].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHorasAlquiler(h)}
                            className={`min-w-[42px] min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              horasAlquiler === h
                                ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-300 scale-105'
                                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-950'
                            }`}
                          >
                            {h}h
                          </button>
                        ))}

                        {/* Stepper amigable para niño de 12 años */}
                        <div className="flex items-center gap-1 ml-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => setHorasAlquiler(prev => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold active:scale-95 text-sm cursor-pointer"
                            title="Menos 1 hora"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-xs text-gray-900 dark:text-white font-mono">
                            {horasAlquiler}h
                          </span>
                          <button
                            type="button"
                            onClick={() => setHorasAlquiler(prev => Math.min(12, prev + 1))}
                            className="w-8 h-8 rounded flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold active:scale-95 text-sm cursor-pointer"
                            title="Más 1 hora"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Cierre Laboral si sobrepasa 18:00 */}
                    {sobrepasaHorarioLaboral && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>
                          <strong>Atención:</strong> La devolución proyectada ({horaRetornoEstimada}) supera el horario de cierre (6:00 PM). Se recomienda pasar a <strong>Alquiler por Días</strong>.
                        </span>
                      </div>
                    )}

                    {/* Badge Poka-Yoke Contador de Equipos Express */}
                    <div className="flex items-center justify-between text-xs pt-1 px-1 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        Límite express: <strong>{maxEquiposExpress} equipos máx.</strong>
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        totalUnidadesEnCarrito >= maxEquiposExpress
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300'
                      }`}>
                        {totalUnidadesEnCarrito} / {maxEquiposExpress} unidades en mostrador
                      </span>
                    </div>
                  </div>
                ) : (
                  /* MODO DÍAS: Fechas y Selector Ley Emiliani */
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 block mb-1">Fecha Entrega / Inicio:</label>
                        <input
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFechaInicio(val);
                            if (fechaFin < val) setFechaFin(val);
                          }}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 block mb-1">Fecha Retorno Estimada:</label>
                        <input
                          type="date"
                          min={fechaInicio}
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Selector Segmentado de Modalidad de Cobro */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-200/70 dark:bg-gray-800/80 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setModoCobroDias('CALENDARIO')}
                        className={`px-2 py-1.5 rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                          modoCobroDias === 'CALENDARIO'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Calendario</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-75">Corridos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoCobroDias('HABILES_LUNES_VIERNES')}
                        className={`px-2 py-1.5 rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                          modoCobroDias === 'HABILES_LUNES_VIERNES'
                            ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Hábiles L-V</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-75">Excl. Festivos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoCobroDias('HABILES_LUNES_SABADO')}
                        className={`px-2 py-1.5 rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                          modoCobroDias === 'HABILES_LUNES_SABADO'
                            ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Hábiles L-S</span>
                        </div>
                        <span className="text-[10px] font-normal opacity-75">Obra Civil</span>
                      </button>
                    </div>

                    {/* Banner Informativo y Detalle de Festivos Excluidos */}
                    <div className="flex flex-wrap items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">
                        Total: <strong className="font-semibold text-gray-900 dark:text-white">{desgloseDias.totalDiasCalendario}</strong> d. cal. • A liquidar:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{desgloseDias.diasCobrables}</strong> día{desgloseDias.diasCobrables === 1 ? '' : 's'}
                      </span>
                      {desgloseDias.diasExcluidos > 0 ? (
                        <button
                          type="button"
                          onClick={() => setMostrarModalDesglose(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          -{desgloseDias.diasExcluidos} festivos/descansos excluidos
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-mono">Sin días descontados</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Sección 3: Búsqueda Rápida de Equipos por SKU/Código */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Barcode className="w-4 h-4 text-emerald-500" />
                    3. Búsqueda de Equipos / Lector Código de Barras
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

                {/* Banner Poka-Yoke si el carrito en modo horas alcanza el tope */}
                {topeEquiposAlcanzado && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      <strong>Tope de equipos alcanzado para alquiler express (máx. {maxEquiposExpress}):</strong> Cambie a modalidad <strong>Por Días</strong> si requiere despachar más de {maxEquiposExpress} herramientas simultáneas.
                    </span>
                  </div>
                )}

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

                      const tarifaMostrada = unidadTiempo === 'HORAS'
                        ? AlquilerHorasService.calcularTarifaHora(tarifa, recargoHorasPorcentaje)
                        : tarifa;

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
                              {formatearCOP(tarifaMostrada)}{unidadTiempo === 'HORAS' ? '/h' : '/día'}
                            </span>
                            <button
                              type="button"
                              disabled={topeEquiposAlcanzado}
                              onClick={() => handleAddEquipo(eq)}
                              className={`px-3 py-1 text-xs rounded-lg font-medium flex items-center gap-1 transition shadow-sm ${
                                topeEquiposAlcanzado
                                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-60'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5" /> {topeEquiposAlcanzado ? 'Tope' : 'Agregar'}
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
                            {unidadTiempo === 'HORAS'
                              ? `${formatearCOP(it.tarifaHoraria || AlquilerHorasService.calcularTarifaHora(it.tarifaDiaria, recargoHorasPorcentaje))} x hora (+20%)`
                              : `${formatearCOP(it.tarifaDiaria)} x día`}
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

                          {unidadTiempo === 'HORAS' ? (
                            <div className="flex items-center gap-1 bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/50 dark:border-amber-800 px-2 py-1 rounded" title="Horas express pactadas">
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">Horas:</span>
                              <span className="font-mono font-bold text-amber-900 dark:text-amber-100 text-xs">
                                {horasAlquiler}h
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded" title="Días cobrables según la modalidad de calendario seleccionada">
                              <span className="text-[10px] text-gray-500 font-mono">
                                Días ({modoCobroDias === 'CALENDARIO' ? 'Cal' : modoCobroDias === 'HABILES_LUNES_VIERNES' ? 'L-V' : 'L-S'}):
                              </span>
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
                          )}

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

      {/* Modal Desglose Calendario Laboral y Festivos Colombia (SPEC-014) */}
      <Modal
        isOpen={mostrarModalDesglose}
        onClose={() => setMostrarModalDesglose(false)}
        title="Auditoría de Calendario Laboral (Ley Emiliani)"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">
              Modalidad seleccionada:{' '}
              {modoCobroDias === 'CALENDARIO'
                ? 'Días Calendario Corridos'
                : modoCobroDias === 'HABILES_LUNES_VIERNES'
                ? 'Días Hábiles Lunes a Viernes'
                : 'Días Hábiles Lunes a Sábado (Estándar Obras)'}
            </p>
            <p className="text-[11px] opacity-90">
              Período del {fechaInicio} al {fechaFin}: {desgloseDias.totalDiasCalendario} días calendario,{' '}
              <strong className="font-bold">{desgloseDias.diasCobrables} cobrables</strong> y{' '}
              <strong className="font-bold">{desgloseDias.diasExcluidos} descontados</strong> de la tarifa.
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {desgloseDias.detalles.map((d) => (
              <div
                key={d.fecha}
                className={`p-2.5 flex items-center justify-between ${
                  d.esCobrable
                    ? 'bg-white dark:bg-gray-800/80'
                    : 'bg-gray-50/90 dark:bg-gray-900/60'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>{d.fecha}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 dark:text-gray-300 font-semibold">{d.nombreDia}</span>
                    {d.esFestivo && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold">
                        Festivo: {d.nombreFestivo}
                      </span>
                    )}
                  </div>
                  {d.motivoExclusion && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                      Motivo de no cobro: {d.motivoExclusion}
                    </div>
                  )}
                </div>

                <div>
                  {d.esCobrable ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Cobrable ✓
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Excluido ✕
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setMostrarModalDesglose(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition cursor-pointer"
            >
              Cerrar Auditoría
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}
