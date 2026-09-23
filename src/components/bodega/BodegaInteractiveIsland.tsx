'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PlusSquare, Package, CheckCircle, Wrench, Warehouse, Pen, History, Search, X, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Modal } from '@/components/ui/Modal';
import { ModalSkeleton } from '@/components/ui/ModalSkeleton';
import { BodegaForm } from '@/components/forms/BodegaForm';
import { useBodegaStore, EquipoUI } from '@/infrastructure/state/bodegaStore';
import { equipoToEquipoUI } from '@/lib/mappers';
import { liberarMantenimientoAction, obtenerEquiposAction } from '@/app/actions/equipos';

const EditarEquipoModal = dynamic(
  () => import('@/components/bodega/EditarEquipoModal').then((m) => m.EditarEquipoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando editor de equipo..." /> }
);

const KardexEquipoModal = dynamic(
  () => import('@/components/bodega/KardexEquipoModal').then((m) => m.KardexEquipoModal),
  { ssr: false, loading: () => <ModalSkeleton message="Cargando historial de Kardex..." /> }
);

/**
 * Normaliza un texto eliminando diacríticos/tildes y espacios redundantes
 * para búsqueda insensible a acentos y mayúsculas.
 */
const normalizarTexto = (texto: string) =>
  (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

interface BodegaInteractiveIslandProps {
  initialEquipos: any[];
}

export function BodegaInteractiveIsland({ initialEquipos }: BodegaInteractiveIslandProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<EquipoUI | null>(null);
  const [equipoKardex, setEquipoKardex] = useState<EquipoUI | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liberandoId, setLiberandoId] = useState<string | number | null>(null);

  const { equipos, setEquipos } = useBodegaStore();

  // Estados reactivos de Búsqueda y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'DISPONIBLES' | 'EN_OBRA' | 'MANTENIMIENTO'>('TODOS');

  // Hidratación inicial desde Server Component
  useEffect(() => {
    if (initialEquipos && initialEquipos.length > 0) {
      setEquipos(initialEquipos.map(equipoToEquipoUI));
    }
  }, [initialEquipos, setEquipos]);

  // Sincronización fresca bajo demanda o reconciliación de pestaña
  const refrescarInventario = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await obtenerEquiposAction();
      if (res.success && Array.isArray(res.data)) {
        setEquipos(res.data.map(equipoToEquipoUI));
      }
    } catch (err) {
      console.warn('[BodegaIsland] Error al refrescar equipos:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [setEquipos]);

  useEffect(() => {
    const handleReconcile = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refrescarInventario();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleReconcile);
      window.addEventListener('focus', handleReconcile);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleReconcile);
        window.removeEventListener('focus', handleReconcile);
      }
    };
  }, [refrescarInventario]);

  // Filtrado reactivo Zero-Latency
  const equiposFiltrados = useMemo(() => {
    const query = normalizarTexto(searchQuery);

    return equipos.filter((eq) => {
      // 1. Filtro textual (Nombre, SKU/Código, Categoría)
      if (query) {
        const matchNombre = normalizarTexto(eq.nombre).includes(query);
        const matchSku = normalizarTexto(eq.sku).includes(query);
        const matchCategoria = normalizarTexto(eq.categoria).includes(query);
        if (!matchNombre && !matchSku && !matchCategoria) {
          return false;
        }
      }

      // 2. Filtro de disponibilidad
      if (filtroEstado === 'DISPONIBLES') {
        return (eq.stockDisponible ?? 0) > 0;
      }
      if (filtroEstado === 'EN_OBRA') {
        return (eq.stockEnObra ?? 0) > 0;
      }
      if (filtroEstado === 'MANTENIMIENTO') {
        return (eq.stockMantenimiento || (eq as any).stock_mantenimiento || 0) > 0;
      }

      return true;
    });
  }, [equipos, searchQuery, filtroEstado]);

  // Métricas y contadores de estado calculados en una sola pasada O(N)
  const {
    totalModelos,
    countDisponibles,
    countEnObra,
    countMantenimiento,
    totalStockFisico,
    totalDisponible,
    totalEnObra,
  } = useMemo(() => {
    let countDisponibles = 0;
    let countEnObra = 0;
    let countMantenimiento = 0;
    let totalStockFisico = 0;
    let totalDisponible = 0;
    let totalEnObra = 0;

    for (const eq of equipos) {
      const disp = eq.stockDisponible ?? 0;
      const obra = eq.stockEnObra ?? 0;
      const mant = eq.stockMantenimiento || (eq as any).stock_mantenimiento || 0;
      const total = eq.stockTotal ?? (disp + obra + mant);

      if (disp > 0) countDisponibles++;
      if (obra > 0) countEnObra++;
      if (mant > 0) countMantenimiento++;

      totalStockFisico += total;
      totalDisponible += disp;
      totalEnObra += obra;
    }

    return {
      totalModelos: equipos.length,
      countDisponibles,
      countEnObra,
      countMantenimiento,
      totalStockFisico,
      totalDisponible,
      totalEnObra,
    };
  }, [equipos]);

  const handleOpenEdit = (equipo: EquipoUI) => {
    setSelectedEquipo(equipo);
    setIsEditModalOpen(true);
  };

  const handleOpenKardex = (equipo: EquipoUI) => {
    setEquipoKardex(equipo);
    setIsKardexModalOpen(true);
  };

  const handleLiberarMantenimiento = async (equipo: EquipoUI) => {
    const cantidad = Number(equipo.stockMantenimiento || (equipo as any).stock_mantenimiento || 0);
    if (cantidad <= 0) return;

    if (!window.confirm(`¿Liberar ${cantidad} unidades de "${equipo.nombre}" a disponibles?`)) {
      return;
    }

    try {
      setLiberandoId(equipo.id);
      const res = await liberarMantenimientoAction(
        equipo.id,
        cantidad,
        `Liberación técnica desde panel de bodega (${cantidad} unids)`
      );

      if (res.success) {
        // Actualización optimista en store local
        useBodegaStore.getState().liberarDeMantenimiento(equipo.id, cantidad);
      } else {
        alert(res.error || 'Error al liberar mantenimiento en servidor.');
      }
    } catch (e: any) {
      alert('Error de conexión al liberar mantenimiento: ' + e.message);
    } finally {
      setLiberandoId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-1">Inventario y Bodega</h1>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">
            Alquileres System — Control de existencias físicas, disponibilidad para alquiler y ajustes de stock.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refrescarInventario}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all shadow-xs text-sm font-semibold cursor-pointer disabled:opacity-60"
            title="Refrescar existencias desde el servidor"
            aria-label="Refrescar datos de bodega"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-brand-salmon' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-brand-salmon hover:bg-brand-salmonDark text-white px-6 py-2.5 rounded-xl transition-colors shadow-sm w-full sm:w-auto text-sm font-semibold cursor-pointer"
            aria-label="Añadir nuevo equipo a bodega"
          >
            <PlusSquare className="w-5 h-5" />
            Añadir Nuevo Equipo
          </button>
        </div>
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Equipos</span>
            <Package className="text-slate-400 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalModelos} <span className="text-xs font-normal text-slate-500">modelos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Disponible</span>
            <CheckCircle className="text-emerald-500 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
            {totalDisponible} <span className="text-xs font-normal text-slate-500">unidades listas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock en Obra</span>
            <Wrench className="text-amber-500 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
            {totalEnObra} <span className="text-xs font-normal text-slate-500">alquiladas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Capacidad Total</span>
            <Warehouse className="text-slate-400 w-6 h-6" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {totalStockFisico} <span className="text-xs font-normal text-slate-500">unidades físicas</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos (Ergonomía & Zero-Latency) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-card border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Input de Búsqueda Reactivo */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por equipo, código (SKU) o categoría..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-salmon/20 focus:border-brand-salmon transition-all"
            aria-label="Buscar equipos en bodega"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pestañas de Filtro por Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFiltroEstado('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filtroEstado === 'TODOS'
                ? 'bg-slate-900 text-white shadow-xs dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Todos ({equipos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('DISPONIBLES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'DISPONIBLES'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Disponibles ({countDisponibles})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('EN_OBRA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'EN_OBRA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            En Obra ({countEnObra})
          </button>
          <button
            type="button"
            onClick={() => setFiltroEstado('MANTENIMIENTO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              filtroEstado === 'MANTENIMIENTO'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Mantenimiento ({countMantenimiento})
          </button>
        </div>
      </div>

      {/* Main Content (DataTable) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
              <tr>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Código (SKU)</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Nombre del Equipo</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Categoría</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-center">Disponible</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-center">En Obra</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-center">Mantenimiento</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">Total</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tarifa / Día</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estado</th>
                <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
              {equiposFiltrados.map((equipo) => {
                const stockMant = Number(equipo.stockMantenimiento || (equipo as any).stock_mantenimiento || 0);

                return (
                  <tr 
                    key={equipo.id} 
                    onClick={() => handleOpenEdit(equipo)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 group-hover:bg-slate-200 dark:bg-slate-800 dark:group-hover:bg-slate-700 px-2 py-1 rounded-md transition-colors">
                        {equipo.sku}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-salmon transition-colors">
                        {equipo.nombre}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {equipo.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 min-w-[32px]">
                        {equipo.stockDisponible ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 min-w-[32px]">
                        {equipo.stockEnObra ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {stockMant > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 min-w-[32px] animate-pulse">
                            {stockMant}
                          </span>
                          <button
                            type="button"
                            disabled={liberandoId === equipo.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLiberarMantenimiento(equipo);
                            }}
                            className="text-[10px] bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-300 px-2 py-0.5 rounded shadow-xs font-semibold cursor-pointer disabled:opacity-50"
                            title="Devolver unidades de mantenimiento al stock disponible"
                          >
                            {liberandoId === equipo.id ? 'Liberando...' : 'Liberar'}
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-full text-xs bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200/60 dark:border-slate-700 min-w-[32px]">
                          0
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {equipo.stockTotal ?? ((equipo.stockDisponible || 0) + (equipo.stockEnObra || 0))}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      ${(equipo.tarifaDiaria || 0).toLocaleString('es-CO')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                        equipo.estado === 'Disponible' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        equipo.estado === 'En Alquiler' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          equipo.estado === 'Disponible' ? 'bg-emerald-500' :
                          equipo.estado === 'En Alquiler' ? 'bg-amber-500' :
                          'bg-slate-400'
                        }`}></span>
                        {equipo.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenKardex(equipo);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                          title="Consultar historial inmutable de Kardex"
                          aria-label={`Ver historial de Kardex para ${equipo.nombre}`}
                        >
                          <History className="w-3.5 h-3.5 text-brand-salmon" />
                          <span>Kardex</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(equipo);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-brand-salmon hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer dark:bg-slate-800 dark:text-slate-200"
                          title="Editar datos y ajustar stock"
                          aria-label={`Editar equipo ${equipo.nombre}`}
                        >
                          <Pen className="w-3.5 h-3.5" />
                          <span>Ajustar / Editar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {equipos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 text-slate-300 mb-2 block mx-auto" />
                    No hay equipos registrados en bodega.
                  </td>
                </tr>
              )}
              {equipos.length > 0 && equiposFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Search className="w-10 h-10 text-slate-300 mb-2 block mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No se encontraron equipos coincidentes</p>
                    <p className="text-xs text-slate-500 mt-1">Intenta con otro término o limpia los filtros activos.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFiltroEstado('TODOS');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer dark:bg-slate-800 dark:text-slate-300"
                    >
                      Restablecer Filtros
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Nuevo Equipo */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Añadir Nuevo Equipo a Bodega"
        maxWidth="2xl"
      >
        <BodegaForm 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refrescarInventario();
          }}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Modal para Editar Equipo y Ajustar Stock */}
      <EditarEquipoModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEquipo(null);
          refrescarInventario();
        }}
        equipo={selectedEquipo}
      />

      {/* Modal para Consultar Historial Inmutable de Kardex */}
      <KardexEquipoModal
        isOpen={isKardexModalOpen}
        onClose={() => {
          setIsKardexModalOpen(false);
          setEquipoKardex(null);
        }}
        equipo={equipoKardex}
      />
    </div>
  );
}
