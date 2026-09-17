"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  TrendingUp, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  CheckCircle2, 
  Package, 
  Layers,
  ArrowRightLeft,
  AlertCircle,
  Printer,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  DollarSign,
  PackageCheck,
  Receipt,
  AlertTriangle,
  FileCheck2,
  ArrowDownToLine,
  CreditCard
} from 'lucide-react';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { obtenerComprasAction, CompraUI } from '../actions/compras';
import { obtenerProveedoresAction, ProveedorUI } from '../actions/proveedores';
import { 
  obtenerCuentasPorPagarAction, 
  CuentaPagarUI, 
  AbonoProveedorUI,
  obtenerHistorialAbonosAction
} from '../actions/cuentas-por-pagar';
import { useCurrencyFormatter } from '../../lib/hooks/useCurrencyFormatter';
import { useToastStore } from '../../infrastructure/state/toastStore';
import { ComprobanteEntradaPDFModal } from '../components/compras/ComprobanteEntradaPDFModal';
import { CrearProveedorModal } from '../components/proveedores/CrearProveedorModal';
import { RecibirMercanciaModal } from '../components/compras/RecibirMercanciaModal';
import { RegistrarAbonoProveedorModal } from '../components/compras/RegistrarAbonoProveedorModal';
import { ComprobanteEgresoPDFModal } from '../components/compras/ComprobanteEgresoPDFModal';

const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl animate-pulse space-y-4 shadow-xl">
      <div className="h-6 bg-slate-200 rounded w-1/3" />
      <div className="h-24 bg-slate-100 rounded" />
      <div className="h-10 bg-slate-200 rounded w-1/4 ml-auto" />
    </div>
  </div>
);

const RegistrarCompraModal = dynamic(
  () => import('../components/compras/RegistrarCompraModal').then((mod) => mod.RegistrarCompraModal),
  { ssr: false, loading: () => <ModalSkeleton /> }
);

export default function ComprasPage() {
  const { equipos, setEquipos } = useBodegaStore();
  const { formatearMoneda } = useCurrencyFormatter();
  const { showSuccessToast, showErrorToast } = useToastStore();

  // 4 Pestañas del módulo integral de compras
  const [pestañaActiva, setPestañaActiva] = useState<'ORDENES' | 'RECEPCION' | 'CXP' | 'PROVEEDORES'>('ORDENES');

  // Datos
  const [compras, setCompras] = useState<CompraUI[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [cuentasPagar, setCuentasPagar] = useState<CuentaPagarUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [isModalCompraOpen, setIsModalCompraOpen] = useState(false);
  const [isModalProveedorOpen, setIsModalProveedorOpen] = useState(false);
  const [compraSeleccionadaPDF, setCompraSeleccionadaPDF] = useState<CompraUI | null>(null);

  // Modales Fase 4 (Recepción en Bodega, Abonos CXP y Comprobante de Egreso)
  const [compraParaRecepcion, setCompraParaRecepcion] = useState<CompraUI | null>(null);
  const [cuentaPagarParaAbono, setCuentaPagarParaAbono] = useState<CuentaPagarUI | null>(null);
  const [comprobanteEgresoActivo, setComprobanteEgresoActivo] = useState<{
    abono: AbonoProveedorUI;
    cuentaPagar: CuentaPagarUI;
  } | null>(null);

  // Filtros de Compras & Recepción
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<'TODOS' | 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO'>('TODOS');
  const [compraExpandidaId, setCompraExpandidaId] = useState<string | null>(null);

  // Filtros de Proveedores
  const [searchProveedor, setSearchProveedor] = useState('');

  // Filtros de CXP
  const [searchCXP, setSearchCXP] = useState('');
  const [filtroSemaforoCXP, setFiltroSemaforoCXP] = useState<'TODOS' | 'VENCIDA' | 'POR_VENCER' | 'AL_DIA' | 'PAGADA'>('TODOS');
  const [cxpExpandidaId, setCxpExpandidaId] = useState<string | null>(null);
  const [historialAbonosMap, setHistorialAbonosMap] = useState<Record<string, AbonoProveedorUI[]>>({});

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resCompras, resProveedores, resCXP, resEquipos] = await Promise.all([
        obtenerComprasAction(100),
        obtenerProveedoresAction(),
        obtenerCuentasPorPagarAction(),
        fetch('/api/equipos', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (resCompras.success && resCompras.data) {
        setCompras(resCompras.data);
      }

      if (resProveedores.success && resProveedores.data) {
        setProveedores(resProveedores.data);
      }

      if (resCXP.success && resCXP.data) {
        setCuentasPagar(resCXP.data);
      }

      if (resEquipos.success && Array.isArray(resEquipos.data)) {
        setEquipos(resEquipos.data);
      }
    } catch (err: any) {
      console.error('Error al cargar datos del módulo de compras:', err);
      showErrorToast('No se pudieron sincronizar los datos de compras y cuentas por pagar.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [setEquipos, showErrorToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleRefrescar = () => {
    setIsRefreshing(true);
    cargarDatos();
  };

  const handleCompraExitosa = () => {
    showSuccessToast('Orden de compra registrada exitosamente.');
    cargarDatos();
  };

  const handleProveedorCreado = (nuevo: ProveedorUI) => {
    setProveedores(prev => [nuevo, ...prev]);
    showSuccessToast(`Proveedor "${nuevo.nombre}" guardado en el catálogo.`);
  };

  const handleRecepcionExitosa = () => {
    showSuccessToast('Mercancía recibida en bodega. Costo Promedio Ponderado (PMP) actualizado.');
    cargarDatos();
  };

  const handleAbonoExitoso = (nuevoAbono: AbonoProveedorUI, cxpActualizada: CuentaPagarUI) => {
    // Actualizar lista local de CXP
    setCuentasPagar(prev => prev.map(c => c.id === cxpActualizada.id ? cxpActualizada : c));
    // Guardar en historial local
    setHistorialAbonosMap(prev => ({
      ...prev,
      [cxpActualizada.id]: [nuevoAbono, ...(prev[cxpActualizada.id] || [])]
    }));
    // Ofrecer visualización de Comprobante de Egreso (CE)
    setComprobanteEgresoActivo({
      abono: nuevoAbono,
      cuentaPagar: cxpActualizada
    });
    cargarDatos();
  };

  const cargarHistorialAbonos = async (cxpId: string) => {
    if (historialAbonosMap[cxpId]) return;
    try {
      const res = await obtenerHistorialAbonosAction(cxpId);
      if (res.success && res.data) {
        setHistorialAbonosMap(prev => ({
          ...prev,
          [cxpId]: res.data!
        }));
      }
    } catch (err) {
      console.error('Error al cargar historial de abonos:', err);
    }
  };

  const toggleExpandirCXP = (id: string) => {
    if (cxpExpandidaId === id) {
      setCxpExpandidaId(null);
    } else {
      setCxpExpandidaId(id);
      cargarHistorialAbonos(id);
    }
  };

  // Filtrado de compras
  const comprasFiltradas = useMemo(() => {
    return compras.filter(c => {
      const coincideBusqueda = 
        c.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.proveedor_nit && c.proveedor_nit.includes(searchTerm));

      const coincideMetodo = filtroMetodo === 'TODOS' || c.metodo_pago === filtroMetodo;

      return coincideBusqueda && coincideMetodo;
    });
  }, [compras, searchTerm, filtroMetodo]);

  // Órdenes pendientes de recepción en bodega
  const comprasPendientesRecepcion = useMemo(() => {
    return compras.filter(c => c.estado === 'PENDIENTE_RECEPCION' || c.estado === 'PARCIAL' || c.estado === 'APROBADA');
  }, [compras]);

  // Filtrado de proveedores
  const proveedoresFiltrados = useMemo(() => {
    if (!searchProveedor.trim()) return proveedores;
    const term = searchProveedor.toLowerCase().trim();
    return proveedores.filter(p => 
      p.nombre.toLowerCase().includes(term) ||
      p.nit.toLowerCase().includes(term) ||
      (p.ciudad && p.ciudad.toLowerCase().includes(term)) ||
      (p.contacto && p.contacto.toLowerCase().includes(term)) ||
      (p.telefono && p.telefono.includes(term))
    );
  }, [proveedores, searchProveedor]);

  // Filtrado de Cuentas por Pagar (CXP)
  const cuentasPagarFiltradas = useMemo(() => {
    return cuentasPagar.filter(cxp => {
      const coincideBusqueda = 
        cxp.numero_orden.toLowerCase().includes(searchCXP.toLowerCase()) ||
        (cxp.proveedor_nombre && cxp.proveedor_nombre.toLowerCase().includes(searchCXP.toLowerCase())) ||
        (cxp.proveedor_nit && cxp.proveedor_nit.includes(searchCXP));

      const coincideSemaforo = filtroSemaforoCXP === 'TODOS' 
        ? true 
        : filtroSemaforoCXP === 'PAGADA' 
        ? cxp.estado === 'PAGADA' 
        : cxp.semaforo === filtroSemaforoCXP;

      return coincideBusqueda && coincideSemaforo;
    });
  }, [cuentasPagar, searchCXP, filtroSemaforoCXP]);

  // Métricas de Compras
  const metricasCompras = useMemo(() => {
    const totalInversion = compras.reduce((acc, c) => acc + c.total, 0);
    const totalNetoDesembolsado = compras.reduce((acc, c) => acc + (c.neto_pagar || c.total), 0);
    const totalEquiposAdquiridos = compras.reduce((acc, c) => {
      const sumItems = (c.detalles || []).reduce((subAcc, d) => subAcc + d.cantidad, 0);
      return acc + sumItems;
    }, 0);

    return {
      totalInversion,
      totalNetoDesembolsado,
      ordenesTotal: compras.length,
      pendientesRecepcion: comprasPendientesRecepcion.length,
      totalEquiposAdquiridos
    };
  }, [compras, comprasPendientesRecepcion]);

  // Métricas de Cuentas por Pagar (CXP)
  const metricasCXP = useMemo(() => {
    const totalCarteraPendiente = cuentasPagar.reduce((acc, c) => acc + c.saldo_pendiente, 0);
    const totalVencido = cuentasPagar
      .filter(c => c.semaforo === 'VENCIDA')
      .reduce((acc, c) => acc + c.saldo_pendiente, 0);
    const totalPorVencer = cuentasPagar
      .filter(c => c.semaforo === 'POR_VENCER')
      .reduce((acc, c) => acc + c.saldo_pendiente, 0);
    const totalAbonado = cuentasPagar.reduce((acc, c) => acc + (c.total_abonos || 0), 0);

    return {
      totalCarteraPendiente,
      totalVencido,
      totalPorVencer,
      totalAbonado,
      cuentasPendientesTotal: cuentasPagar.filter(c => c.saldo_pendiente > 0).length,
      cuentasVencidasTotal: cuentasPagar.filter(c => c.semaforo === 'VENCIDA').length
    };
  }, [cuentasPagar]);

  const toggleExpandirCompra = (id: string) => {
    setCompraExpandidaId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-fadeIn">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-brand-salmonLight/60 text-brand-salmonDark rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Compras, Bodega & Cartera CXP
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gestión integral de compras, recepción física en bodega, recálculo de Costo Promedio Ponderado (PMP) y Cuentas por Pagar a Proveedores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefrescar}
            disabled={isLoading || isRefreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-salmon' : ''}`} />
          </button>
          
          {pestañaActiva === 'PROVEEDORES' ? (
            <button
              onClick={() => setIsModalProveedorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuevo Proveedor
            </button>
          ) : (
            <button
              onClick={() => setIsModalCompraOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-salmon hover:bg-brand-salmonDark text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Registrar Compra
            </button>
          )}
        </div>
      </div>

      {/* Selector de las 4 Pestañas Principales */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setPestañaActiva('ORDENES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            pestañaActiva === 'ORDENES'
              ? 'border-brand-salmon text-brand-salmonDark'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Órdenes de Compra ({compras.length})</span>
        </button>

        <button
          onClick={() => setPestañaActiva('RECEPCION')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            pestañaActiva === 'RECEPCION'
              ? 'border-indigo-600 text-indigo-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Recepción en Bodega & PMP</span>
          {comprasPendientesRecepcion.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {comprasPendientesRecepcion.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setPestañaActiva('CXP')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            pestañaActiva === 'CXP'
              ? 'border-rose-600 text-rose-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Cuentas por Pagar ({cuentasPagar.filter(c => c.saldo_pendiente > 0).length})</span>
          {metricasCXP.cuentasVencidasTotal > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
              {metricasCXP.cuentasVencidasTotal} vencidas
            </span>
          )}
        </button>

        <button
          onClick={() => setPestañaActiva('PROVEEDORES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            pestañaActiva === 'PROVEEDORES'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Proveedores ({proveedores.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: ÓRDENES DE COMPRA                                               */}
      {/* ========================================================================= */}
      {pestañaActiva === 'ORDENES' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tarjetas de Métricas de Compras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Inversión Facturada</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatearMoneda(metricasCompras.totalInversion)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total facturado proveedores</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Neto Desembolsado</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatearMoneda(metricasCompras.totalNetoDesembolsado)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Deducidas retenciones tributarias</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pendientes de Recepción</span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <PackageCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {metricasCompras.pendientesRecepcion} órdenes
              </div>
              <p className="text-xs text-slate-500 mt-1">Por ingresar físicamente a bodega</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Equipos Ingresados</span>
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {metricasCompras.totalEquiposAdquiridos} un.
              </div>
              <p className="text-xs text-slate-500 mt-1">Incorporados al stock en Bodega</p>
            </div>
          </div>

          {/* Barra de Filtros & Búsqueda */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por orden, proveedor o NIT..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-salmon"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 overflow-x-auto w-full">
                {(['TODOS', 'EFECTIVO', 'TRANSFERENCIA', 'CREDITO'] as const).map(metodo => (
                  <button
                    key={metodo}
                    onClick={() => setFiltroMetodo(metodo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      filtroMetodo === metodo
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                    }`}
                  >
                    {metodo === 'TODOS' ? 'Todos' : metodo === 'EFECTIVO' ? 'Efectivo' : metodo === 'TRANSFERENCIA' ? 'Banco' : 'Crédito'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Órdenes de Compra */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-salmon" />
                <p className="text-sm">Cargando compras y asientos contables...</p>
              </div>
            ) : comprasFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No hay compras registradas</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Utiliza el botón superior &quot;Registrar Compra&quot; para registrar la adquisición de maquinaria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Orden / Fecha</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4 text-center">Estado / Recepción</th>
                      <th className="py-3 px-4 text-center">Método Pago</th>
                      <th className="py-3 px-4 text-center">Ítems</th>
                      <th className="py-3 px-4 text-right">Neto a Pagar</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comprasFiltradas.map(compra => {
                      const estaExpandida = compraExpandidaId === compra.id;
                      const cantidadItems = (compra.detalles || []).reduce((acc, d) => acc + d.cantidad, 0);
                      const requiereRecepcion = compra.estado === 'PENDIENTE_RECEPCION' || compra.estado === 'PARCIAL';

                      return (
                        <React.Fragment key={compra.id}>
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-sm">{compra.numero_orden}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {compra.fecha_compra}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{compra.proveedor_nombre}</div>
                              {compra.proveedor_nit && (
                                <div className="text-[11px] text-slate-400 font-mono">NIT: {compra.proveedor_nit}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {compra.estado === 'COMPLETADA' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Recibida / PMP
                                </span>
                              )}
                              {compra.estado === 'PENDIENTE_RECEPCION' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" /> En Tránsito
                                </span>
                              )}
                              {compra.estado === 'PARCIAL' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <AlertTriangle className="w-3 h-3" /> Recibida Parcial
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                compra.metodo_pago === 'EFECTIVO'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : compra.metodo_pago === 'TRANSFERENCIA'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {compra.metodo_pago}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold text-slate-700">{cantidadItems} un.</span>
                              <span className="text-[10px] text-slate-400 block">({compra.detalles?.length || 0} ref.)</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {formatearMoneda(compra.neto_pagar || compra.total)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {requiereRecepcion && (
                                  <button
                                    type="button"
                                    onClick={() => setCompraParaRecepcion(compra)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors border border-indigo-200"
                                    title="Recibir en Bodega y asentar PMP"
                                  >
                                    <ArrowDownToLine className="w-3.5 h-3.5" />
                                    Recibir
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setCompraSeleccionadaPDF(compra)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200/60"
                                  title="Ver e imprimir comprobante en PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  PDF
                                </button>
                                <button
                                  onClick={() => toggleExpandirCompra(compra.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                  {estaExpandida ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Desglose Expandible */}
                          {estaExpandida && (
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                              <td colSpan={7} className="p-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-brand-salmon" />
                                      Desglose de Equipos & Costeo Unitario
                                    </span>
                                    {compra.observaciones && (
                                      <span className="text-xs text-slate-500 italic">
                                        Nota: &quot;{compra.observaciones}&quot;
                                      </span>
                                    )}
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                      <thead>
                                        <tr className="text-slate-500 border-b border-slate-100">
                                          <th className="pb-1.5">Equipo / Maquinaria</th>
                                          <th className="pb-1.5 text-center">Cantidad</th>
                                          <th className="pb-1.5 text-right">Costo Unitario</th>
                                          <th className="pb-1.5 text-right">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {(compra.detalles || []).map(d => (
                                          <tr key={d.id}>
                                            <td className="py-2 font-medium text-slate-800">
                                              {d.equipo_nombre}
                                            </td>
                                            <td className="py-2 text-center font-bold text-emerald-600">
                                              +{d.cantidad} un.
                                            </td>
                                            <td className="py-2 text-right text-slate-600">
                                              {formatearMoneda(d.precio_unitario)}
                                            </td>
                                            <td className="py-2 text-right font-bold text-slate-900">
                                              {formatearMoneda(d.subtotal)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: RECEPCIÓN EN BODEGA & PMP                                        */}
      {/* ========================================================================= */}
      {pestañaActiva === 'RECEPCION' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Banner Informativo Poka-Yoke */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-indigo-950 space-y-1">
              <h3 className="text-sm font-bold text-indigo-900">
                Punto de Control de Recepción Física & Costeo PMP
              </h3>
              <p className="leading-relaxed">
                Este centro de recepción permite al bodeguero cotejar las cantidades físicas que llegan contra la remisión del transportador. 
                Al confirmar la entrada, el sistema ejecuta transaccionalmente el cálculo del <strong>Costo Promedio Ponderado (PMP)</strong> con bloqueo pesimista en base de datos, garantizando que el stock valorizado y las rentabilidades de alquiler se mantengan exactas.
              </p>
            </div>
          </div>

          {/* Tabla de Órdenes Pendientes de Recepción */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Órdenes en Espera de Llegada ({comprasPendientesRecepcion.length})
              </h3>
            </div>

            {comprasPendientesRecepcion.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Almacén al día</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No hay órdenes de compra pendientes de ingreso físico. Todo el inventario comprado ha sido recibido y valorizado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Orden / Emisión</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4 text-center">Equipos por Recibir</th>
                      <th className="py-3 px-4 text-right">Valor Orden</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Acción Poka-Yoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comprasPendientesRecepcion.map(c => {
                      const totalEquipos = (c.detalles || []).reduce((acc, d) => acc + d.cantidad, 0);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold font-mono text-sm text-slate-900">{c.numero_orden}</span>
                            <span className="block text-[11px] text-slate-400">{c.fecha_compra}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{c.proveedor_nombre}</div>
                            {c.proveedor_nit && <div className="text-[11px] text-slate-400 font-mono">NIT: {c.proveedor_nit}</div>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                              {totalEquipos} unidades ({c.detalles?.length || 0} ref.)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {formatearMoneda(c.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pendiente Recepción
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setCompraParaRecepcion(c)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
                            >
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                              Recibir & PMP
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: CUENTAS POR PAGAR (CXP) & SEMÁFORO DE VENCIMIENTO                */}
      {/* ========================================================================= */}
      {pestañaActiva === 'CXP' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Tarjetas de Métricas Financieras de Cartera CXP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pasivo Total Pendiente</span>
                <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-rose-600">
                {formatearMoneda(metricasCXP.totalCarteraPendiente)}
              </div>
              <p className="text-xs text-slate-500 mt-1">{metricasCXP.cuentasPendientesTotal} facturas por pagar</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-400 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Cartera Vencida</span>
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-rose-700">
                {formatearMoneda(metricasCXP.totalVencido)}
              </div>
              <p className="text-xs text-rose-600 font-medium mt-1">{metricasCXP.cuentasVencidasTotal} facturas en mora</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Próximo a Vencer (7 días)</span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {formatearMoneda(metricasCXP.totalPorVencer)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Requiere previsión de flujo de caja</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Abonos Desembolsados</span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatearMoneda(metricasCXP.totalAbonado)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Con Comprobantes de Egreso (CE)</p>
            </div>
          </div>

          {/* Filtros de CXP y Semáforo */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCXP}
                onChange={e => setSearchCXP(e.target.value)}
                placeholder="Buscar por orden, proveedor o NIT..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1 overflow-x-auto w-full">
                {(['TODOS', 'VENCIDA', 'POR_VENCER', 'AL_DIA', 'PAGADA'] as const).map(sem => (
                  <button
                    key={sem}
                    onClick={() => setFiltroSemaforoCXP(sem)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      filtroSemaforoCXP === sem
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 bg-slate-50'
                    }`}
                  >
                    {sem === 'TODOS' ? 'Todos' : sem === 'VENCIDA' ? 'Vencidos' : sem === 'POR_VENCER' ? 'Por Vencer' : sem === 'AL_DIA' ? 'Al Día' : 'Pagados'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de Cuentas por Pagar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {cuentasPagarFiltradas.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No hay cuentas por pagar registradas</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Las cuentas por pagar se generan automáticamente al asentar compras a crédito o con saldo pendiente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Orden / Vencimiento</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4 text-center">Semáforo</th>
                      <th className="py-3 px-4 text-right">Monto Factura</th>
                      <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                      <th className="py-3 px-4 text-center">Abonos</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cuentasPagarFiltradas.map(cxp => {
                      const estaExpandida = cxpExpandidaId === cxp.id;
                      const abonos = historialAbonosMap[cxp.id] || [];

                      return (
                        <React.Fragment key={cxp.id}>
                          <tr className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold font-mono text-sm text-slate-900">{cxp.numero_orden}</span>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                Vence: {cxp.fecha_vencimiento}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{cxp.proveedor_nombre}</div>
                              {cxp.proveedor_nit && <div className="text-[11px] text-slate-400 font-mono">NIT: {cxp.proveedor_nit}</div>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {cxp.semaforo === 'VENCIDA' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertCircle className="w-3 h-3" /> Vencido ({cxp.dias_mora}d)
                                </span>
                              )}
                              {cxp.semaforo === 'POR_VENCER' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" /> Próximo ({cxp.dias_restantes}d)
                                </span>
                              )}
                              {cxp.semaforo === 'AL_DIA' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Al día ({cxp.dias_restantes}d)
                                </span>
                              )}
                              {cxp.estado === 'PAGADA' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" /> Liquidada
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-700">
                              {formatearMoneda(cxp.monto_total)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-mono text-sm font-bold ${cxp.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatearMoneda(cxp.saldo_pendiente)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => toggleExpandirCXP(cxp.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                              >
                                {formatearMoneda(cxp.total_abonos || 0)}
                                {estaExpandida ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {cxp.saldo_pendiente > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setCuentaPagarParaAbono(cxp)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Abonar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Historial Expandible de Abonos */}
                          {estaExpandida && (
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                              <td colSpan={7} className="p-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                      Historial de Comprobantes de Egreso (Abonos)
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      Orden: {cxp.numero_orden}
                                    </span>
                                  </div>

                                  {abonos.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-2 italic text-center">
                                      No se registran abonos previos para esta cuenta por pagar.
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs text-left">
                                        <thead>
                                          <tr className="text-slate-500 border-b border-slate-100">
                                            <th className="pb-1.5">Comprobante</th>
                                            <th className="pb-1.5">Fecha</th>
                                            <th className="pb-1.5 text-center">Método</th>
                                            <th className="pb-1.5">Referencia</th>
                                            <th className="pb-1.5 text-right">Monto Abonado</th>
                                            <th className="pb-1.5 text-center">Acción</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {abonos.map(ab => (
                                            <tr key={ab.id}>
                                              <td className="py-2 font-mono font-bold text-slate-800">
                                                {ab.numero_comprobante}
                                              </td>
                                              <td className="py-2 text-slate-600">
                                                {ab.fecha_abono}
                                              </td>
                                              <td className="py-2 text-center font-semibold text-slate-700">
                                                {ab.metodo_pago}
                                              </td>
                                              <td className="py-2 text-slate-500">
                                                {ab.referencia_bancaria || 'N/A'}
                                              </td>
                                              <td className="py-2 text-right font-mono font-bold text-emerald-600">
                                                {formatearMoneda(ab.monto_abono)}
                                              </td>
                                              <td className="py-2 text-center">
                                                <button
                                                  type="button"
                                                  onClick={() => setComprobanteEgresoActivo({ abono: ab, cuentaPagar: cxp })}
                                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                                                >
                                                  <Printer className="w-3 h-3" /> Ver CE
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: DIRECTORIO MAESTRO DE PROVEEDORES                               */}
      {/* ========================================================================= */}
      {pestañaActiva === 'PROVEEDORES' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Barra de Filtros & Búsqueda Asistida */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchProveedor}
                onChange={e => setSearchProveedor(e.target.value)}
                placeholder="Búsqueda asistida por Razón Social, NIT, Contacto o Ciudad..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                {proveedoresFiltrados.length} proveedores encontrados
              </span>
            </div>
          </div>

          {/* Tabla de Proveedores */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-sm">Cargando catálogo de proveedores...</p>
              </div>
            ) : proveedoresFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No se encontraron proveedores</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Puedes registrar un proveedor nuevo utilizando el botón superior &quot;Nuevo Proveedor&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Proveedor / Razón Social</th>
                      <th className="py-3 px-4">NIT / Identificación</th>
                      <th className="py-3 px-4">Contacto & Teléfono</th>
                      <th className="py-3 px-4">Ubicación</th>
                      <th className="py-3 px-4 text-center">Días Crédito</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proveedoresFiltrados.map(prov => (
                      <tr key={prov.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{prov.nombre}</div>
                          {prov.observaciones && (
                            <div className="text-2xs text-slate-400 italic truncate max-w-xs">
                              {prov.observaciones}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {prov.nit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {prov.contacto && (
                            <div className="font-medium text-slate-800">{prov.contacto}</div>
                          )}
                          <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                            {prov.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> {prov.telefono}
                              </span>
                            )}
                            {prov.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" /> {prov.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {prov.ciudad ? (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400" /> {prov.ciudad}
                            </span>
                          ) : (
                            <span className="text-slate-400">Sin ciudad</span>
                          )}
                          {prov.direccion && (
                            <div className="text-2xs text-slate-400">{prov.direccion}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {prov.dias_credito > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3" />
                              {prov.dias_credito} días
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-600">
                              Contado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-2xs font-bold ${
                            prov.estado === 'ACTIVO'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {prov.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Compra */}
      <RegistrarCompraModal
        isOpen={isModalCompraOpen}
        onClose={() => setIsModalCompraOpen(false)}
        equiposDisponibles={equipos}
        onCompraExitosa={handleCompraExitosa}
      />

      {/* Modal de Creación de Proveedores */}
      <CrearProveedorModal
        isOpen={isModalProveedorOpen}
        onClose={() => setIsModalProveedorOpen(false)}
        onProveedorCreado={handleProveedorCreado}
      />

      {/* Modal Visor de Comprobante de Entrada (Compra) */}
      <ComprobanteEntradaPDFModal
        isOpen={Boolean(compraSeleccionadaPDF)}
        onClose={() => setCompraSeleccionadaPDF(null)}
        compra={compraSeleccionadaPDF}
      />

      {/* Modal Recepción Física en Bodega y Recálculo PMP */}
      <RecibirMercanciaModal
        isOpen={Boolean(compraParaRecepcion)}
        onClose={() => setCompraParaRecepcion(null)}
        compra={compraParaRecepcion}
        onRecepcionExitosa={handleRecepcionExitosa}
      />

      {/* Modal de Abono a Proveedor (CXP) */}
      <RegistrarAbonoProveedorModal
        isOpen={Boolean(cuentaPagarParaAbono)}
        onClose={() => setCuentaPagarParaAbono(null)}
        cuentaPagar={cuentaPagarParaAbono}
        onAbonoExitoso={handleAbonoExitoso}
      />

      {/* Modal Visor de Comprobante de Egreso (CE) */}
      <ComprobanteEgresoPDFModal
        isOpen={Boolean(comprobanteEgresoActivo)}
        onClose={() => setComprobanteEgresoActivo(null)}
        abono={comprobanteEgresoActivo?.abono || null}
        cuentaPagar={comprobanteEgresoActivo?.cuentaPagar || null}
      />
    </div>
  );
}
