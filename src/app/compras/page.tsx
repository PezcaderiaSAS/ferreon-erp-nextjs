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
  DollarSign
} from 'lucide-react';
import { useBodegaStore } from '../../infrastructure/state/bodegaStore';
import { obtenerComprasAction, CompraUI } from '../actions/compras';
import { obtenerProveedoresAction, ProveedorUI } from '../actions/proveedores';
import { useCurrencyFormatter } from '../../lib/hooks/useCurrencyFormatter';
import { useToastStore } from '../../infrastructure/state/toastStore';
import { ComprobanteEntradaPDFModal } from '../components/compras/ComprobanteEntradaPDFModal';
import { CrearProveedorModal } from '../components/proveedores/CrearProveedorModal';

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

  // Pestañas del módulo
  const [pestañaActiva, setPestañaActiva] = useState<'ORDENES' | 'PROVEEDORES'>('ORDENES');

  // Datos
  const [compras, setCompras] = useState<CompraUI[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modales
  const [isModalCompraOpen, setIsModalCompraOpen] = useState(false);
  const [isModalProveedorOpen, setIsModalProveedorOpen] = useState(false);
  const [compraSeleccionadaPDF, setCompraSeleccionadaPDF] = useState<CompraUI | null>(null);

  // Filtros de Compras
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMetodo, setFiltroMetodo] = useState<'TODOS' | 'EFECTIVO' | 'TRANSFERENCIA' | 'CREDITO'>('TODOS');
  const [compraExpandidaId, setCompraExpandidaId] = useState<string | null>(null);

  // Filtros de Proveedores
  const [searchProveedor, setSearchProveedor] = useState('');

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resCompras, resProveedores, resEquipos] = await Promise.all([
        obtenerComprasAction(50),
        obtenerProveedoresAction(),
        fetch('/api/equipos', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (resCompras.success && resCompras.data) {
        setCompras(resCompras.data);
      }

      if (resProveedores.success && resProveedores.data) {
        setProveedores(resProveedores.data);
      }

      if (resEquipos.success && Array.isArray(resEquipos.data)) {
        setEquipos(resEquipos.data);
      }
    } catch (err: any) {
      console.error('Error al cargar datos del módulo de compras:', err);
      showErrorToast('No se pudieron sincronizar las compras y proveedores.');
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
    showSuccessToast('Compra asentada exitosamente. Stock de equipos y Kardex actualizados.');
    cargarDatos();
  };

  const handleProveedorCreado = (nuevo: ProveedorUI) => {
    setProveedores(prev => [nuevo, ...prev]);
    showSuccessToast(`Proveedor "${nuevo.nombre}" guardado en el catálogo.`);
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

  // Filtrado de proveedores con búsqueda asistida
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

  // Métricas de Compras
  const metricas = useMemo(() => {
    const totalInversion = compras.reduce((acc, c) => acc + c.total, 0);
    const totalNetoDesembolsado = compras.reduce((acc, c) => acc + (c.neto_pagar || c.total), 0);
    const totalRetenciones = compras.reduce((acc, c) => acc + ((c.valor_retefuente || 0) + (c.valor_reteica || 0)), 0);
    const totalEquiposAdquiridos = compras.reduce((acc, c) => {
      const sumItems = (c.detalles || []).reduce((subAcc, d) => subAcc + d.cantidad, 0);
      return acc + sumItems;
    }, 0);

    return {
      totalInversion,
      totalNetoDesembolsado,
      totalRetenciones,
      ordenesTotal: compras.length,
      proveedoresUnicos: proveedores.length,
      totalEquiposAdquiridos
    };
  }, [compras, proveedores]);

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
              Compras & Gestión de Proveedores
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Adquisición de maquinaria, catálogo maestro de proveedores, liquidación de retenciones tributarias y asientos en Ledger.
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
          
          {pestañaActiva === 'ORDENES' ? (
            <button
              onClick={() => setIsModalCompraOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-salmon hover:bg-brand-salmonDark text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Registrar Compra
            </button>
          ) : (
            <button
              onClick={() => setIsModalProveedorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuevo Proveedor
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas (Órdenes vs Proveedores) */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setPestañaActiva('ORDENES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            pestañaActiva === 'ORDENES'
              ? 'border-brand-salmon text-brand-salmonDark'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Órdenes de Compra ({compras.length})</span>
        </button>

        <button
          onClick={() => setPestañaActiva('PROVEEDORES')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
            pestañaActiva === 'PROVEEDORES'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Proveedores ({proveedores.length})</span>
        </button>
      </div>

      {/* VISTA 1: ÓRDENES DE COMPRA */}
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
                {formatearMoneda(metricas.totalInversion)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Total bruto facturas de proveedores</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Neto Desembolsado</span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatearMoneda(metricas.totalNetoDesembolsado)}
              </div>
              <p className="text-xs text-slate-500 mt-1">Deducidas retenciones tributarias</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Retenciones Practicadas</span>
                <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {formatearMoneda(metricas.totalRetenciones)}
              </div>
              <p className="text-xs text-slate-500 mt-1">ReteFuente + ReteICA por pagar</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-salmon/40 transition-all">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Equipos Ingresados</span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {metricas.totalEquiposAdquiridos} un.
              </div>
              <p className="text-xs text-slate-500 mt-1">Incorporados al stock físico en Bodega</p>
            </div>
          </div>

          {/* Barra de Filtros & Búsqueda de Compras */}
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
                      <th className="py-3 px-4 text-center">Método Pago</th>
                      <th className="py-3 px-4 text-center">Ítems</th>
                      <th className="py-3 px-4 text-right">Factura / Neto</th>
                      <th className="py-3 px-4 text-center">Asiento Ledger</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comprasFiltradas.map(compra => {
                      const estaExpandida = compraExpandidaId === compra.id;
                      const cantidadItems = (compra.detalles || []).reduce((acc, d) => acc + d.cantidad, 0);

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
                              {compra.neto_pagar !== compra.total && (
                                <div className="text-2xs text-slate-400 line-through">
                                  {formatearMoneda(compra.total)}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {compra.transaction_id ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title={`Txn ID: ${compra.transaction_id}`}>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Asentado
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin Asiento</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
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
                                  {estaExpandida ? (
                                    <>
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </>
                                  )}
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
                                      Desglose de Equipos Incorporados al Inventario
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
                                          <th className="pb-1.5 text-center">Cantidad Ingresada</th>
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

      {/* VISTA 2: DIRECTORIO MAESTRO DE PROVEEDORES */}
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

      {/* Modal Visor de Comprobante PDF */}
      <ComprobanteEntradaPDFModal
        isOpen={Boolean(compraSeleccionadaPDF)}
        onClose={() => setCompraSeleccionadaPDF(null)}
        compra={compraSeleccionadaPDF}
      />
    </div>
  );
}
